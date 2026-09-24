/* Pedido del Chef Maestro (el pedido estrella). Es el clímax de la partida.
   - Cuando un jugador llega a la meta, el Chef visita la mesa: TODOS arman el memory, el Chef dicta la receta
     completa durante unos segundos, la oculta, y la mesa elige de memoria los ingredientes.
   - Califica de 0 a 5 estrellas según ingredientes correctos y tiempo.
   - 1..5 estrellas = pedido completado (suma monedas y termina la partida). 0 = fallo: cuesta monedas y
     se reintenta cuando llegue el siguiente jugador a la meta (hay un intento por jugador que llega).
   - En cada reintento el Chef dicta 1 segundo menos (mínimo 3), cambia un ingrediente y tiene menos paciencia.
   - Si el último jugador llega y falla, el Chef se va: el pedido cuenta como fallado y el restaurante pierde reputación. */

import { INGREDIENTS } from "./board.js";
import { DISHES } from "./orders.js";

export const CHEF = {
  name: "Chef Maestro",
  prepSec: 20, // la mesa arma el memory
  baseDictSec: 10, // segundos que dicta la receta (intento 1)
  minDictSec: 3,
  basePatienceSec: 100, // paciencia del Chef para elegir y entregar (intento 1)
  minPatienceSec: 45,
  patienceStepSec: 15, // menos paciencia por cada intento
  starCoins: 250, // monedas por estrella
  failCost: 300, // cuesta cada fallo
  leavePenalty: 400, // reputación perdida si el Chef se va
};

// Ingredientes que existen (ids de INGREDIENTS). El checklist ofrece TODOS para que la mesa elija de memoria.
export const CHEF_FOODS = INGREDIENTS.map((i) => i.id);
const BASES = INGREDIENTS.filter((i) => i.base).map((i) => i.id);

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const chefDictSec = (attempt) => Math.max(CHEF.minDictSec, CHEF.baseDictSec - (attempt - 1));
export const chefPatienceSec = (attempt) =>
  Math.max(CHEF.minPatienceSec, CHEF.basePatienceSec - CHEF.patienceStepSec * (attempt - 1));

/** Plato firma: un combo de 2 platos, o un solo plato con muchos ingredientes (7 a 9 distintos; un pedido común lleva 3 a 5).
 *  Devuelve { title, recipe }. */
export function makeChefRecipe() {
  const combo = Math.random() < 0.6;
  let title;
  let must;
  let pool;
  let want;
  if (combo) {
    const [a, b] = shuffle(DISHES).slice(0, 2);
    title = `Combo ${a.name} + ${b.name}`;
    must = [...new Set([...a.base, ...b.base, pick(a.protein), pick(b.protein)])];
    pool = [...new Set([...a.extras, ...b.extras])];
    want = 8 + Math.floor(Math.random() * 2); // 8..9
  } else {
    const d = pick(DISHES);
    title = `${d.name} del Chef`;
    must = [...d.base, pick(d.protein)];
    pool = [...d.extras];
    want = Math.min(7 + Math.floor(Math.random() * 2), must.length + pool.length); // 7..8
  }
  const recipe = [...must];
  for (const id of shuffle(pool)) {
    if (recipe.length >= want) break;
    if (!recipe.includes(id)) recipe.push(id);
  }
  return { title, recipe: shuffle(recipe) };
}

/** Reintento: el Chef cambia UN ingrediente de la receta. Devuelve { recipe, changed: { out, in } }. */
export function mutateRecipe(recipe) {
  // se cambia un ingrediente (no el pan ni la tortilla) por otro que no esté en la receta
  const swappable = recipe.filter((id) => !BASES.includes(id));
  const out = pick(swappable.length ? swappable : recipe);
  const candidates = CHEF_FOODS.filter((id) => !recipe.includes(id) && !BASES.includes(id));
  const inn = pick(candidates.length ? candidates : CHEF_FOODS.filter((id) => id !== out));
  return { recipe: recipe.map((id) => (id === out ? inn : id)), changed: { out, in: inn } };
}

/** Califica de 0 a 5 estrellas. `selected` = ids que eligió la mesa; `timeLeft` = fracción de paciencia que sobraba (0..1). */
export function scoreChef({ recipe, selected, timeLeft }) {
  const correct = selected.filter((id) => recipe.includes(id)).length;
  const wrong = selected.filter((id) => !recipe.includes(id)).length;
  const missing = recipe.length - correct;
  // cada ingrediente de más cuenta como uno de menos
  const accuracy = Math.max(0, (correct - wrong) / recipe.length);
  let stars = accuracy >= 1 ? 5 : accuracy >= 0.8 ? 4 : accuracy >= 0.6 ? 3 : accuracy >= 0.4 ? 2 : accuracy >= 0.2 ? 1 : 0;
  // muy justo de tiempo: pierde una estrella, pero nunca baja del mínimo de "completado"
  if (stars > 1 && timeLeft < 0.2) stars -= 1;
  return { stars, correct, wrong, missing, accuracy };
}

export const chefCoinsFor = (stars) => stars * CHEF.starCoins;
