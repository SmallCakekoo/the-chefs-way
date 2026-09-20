import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { characterById, ingredientById, faceStyle } from "../game/board.js";
import { CHEF, CHEF_FOODS, chefDictSec, chefPatienceSec, scoreChef, chefCoinsFor } from "../game/chef.js";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import PlayerRing from "../components/PlayerRing.jsx";
import ChefHat from "../components/ChefHat.jsx";
import VacationIcon from "../components/VacationIcon.jsx";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import base from "./OrderScene.module.css";
import styles from "./ChefScene.module.css";

const ORDER = "/scenary/order/";
const SEATS = ["tl", "tr", "bl", "br"];

/* Fases: enter (entra el Chef) → tension (silencio, latidos) → reveal (dice qué plato pide) → prep (la mesa arma el memory)
   → dictate (dicta la receta y la oculta) → answer (la mesa elige de memoria) → verdict (estrellas). */

function useTick(active, ms = 200) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

/** Pedido del Chef Maestro: el clímax de la partida. Mismo escenario de los pedidos, con el Chef en el mostrador. */
export default function ChefScene() {
  const { chef, players, coins, finishedOf, dispatch } = useGame();
  const scale = useStageScale();
  const [phase, setPhase] = useState("enter");
  const [phaseAt, setPhaseAt] = useState(Date.now());
  const [selected, setSelected] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const now = useTick(["prep", "dictate", "answer"].includes(phase));
  const doneRef = useRef(false);

  const attempt = chef.attempt;
  const total = players.length;
  const dictSec = chefDictSec(attempt);
  const patienceSec = chefPatienceSec(attempt);
  const panda = characterById("panda");
  const go = (p) => {
    setPhase(p);
    setPhaseAt(Date.now());
  };

  // secuencia automática hasta la fase de memoria
  useEffect(() => {
    let t;
    if (phase === "enter") {
      sfx.roll();
      t = setTimeout(() => go("tension"), 2600);
    } else if (phase === "tension") {
      // latidos: el momento de tensión antes de revelar el pedido
      const beat = setInterval(() => sfx.tap(), 650);
      t = setTimeout(() => {
        clearInterval(beat);
        sfx.orderAlert();
        go("reveal");
      }, 3000);
      return () => {
        clearInterval(beat);
        clearTimeout(t);
      };
    } else if (phase === "reveal") {
      t = setTimeout(() => go("prep"), 3800);
    }
    return () => clearTimeout(t);
  }, [phase]);

  // cuenta regresiva de las fases con tiempo
  const elapsed = (now - phaseAt) / 1000;
  const prepLeft = Math.max(0, CHEF.prepSec - elapsed);
  const dictLeft = Math.max(0, dictSec - elapsed);
  const patienceLeft = Math.max(0, patienceSec - elapsed);
  useEffect(() => {
    if (phase === "prep" && prepLeft <= 0) go("dictate");
    if (phase === "dictate" && dictLeft <= 0) {
      sfx.press();
      go("answer");
    }
    if (phase === "answer" && patienceLeft <= 0) deliver();
  });

  const deliver = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const res = scoreChef({ recipe: chef.recipe, selected, timeLeft: patienceLeft / patienceSec });
    setVerdict(res);
    go("verdict");
    if (res.stars >= 4) sfx.win();
    else if (res.stars === 0) sfx.expire();
    else sfx.order();
  };

  const toggle = (id) => {
    if (phase !== "answer") return;
    sfx.select();
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const last = attempt >= total;
  const helpers = useMemo(() => players.filter((p) => finishedOf[p.name]).map((p) => p.name), [players, finishedOf]);
  const nameOf = (id) => ingredientById(id).name;
  const dark = phase === "tension" || phase === "enter";

  return (
    <div className={base.root} style={{ "--s": scale }}>
      <div className={base.wall} />

      {/* izquierda: mostrador con el Chef */}
      <section className={base.left}>
        <div className={`${base.ext} ${base.extTop}`} />
        <div className={`${base.ext} ${base.extEdge}`} />
        <div className={`${base.ext} ${base.extFront}`} />
        <div className={base.leftStage}>
          {/* el Chef: más grande que un cliente y con gorro */}
          <div className={`${styles.chef} ${phase === "enter" ? styles.chefEnter : ""}`}>
            <img
              className={styles.chefImg}
              src={panda.src}
              alt={CHEF.name}
              draggable="false"
              style={faceStyle(panda)}
            />
            <ChefHat className={styles.hat} />
          </div>
          <img className={base.counter} src={ORDER + encodeURI("estanteríafrontal.svg")} alt="" aria-hidden="true" draggable="false" />
          <span className={styles.nameplate}>{CHEF.name}</span>

          {/* globo del Chef */}
          {phase !== "enter" && phase !== "tension" && phase !== "verdict" && (
            <div className={styles.bubble} key={phase}>
              {phase === "reveal" && (
                <>
                  <small>Hoy pido…</small>
                  <b>{chef.title}</b>
                  <span>{chef.recipe.length} ingredientes. Sin margen de error.</span>
                  {chef.changed && (
                    <em>
                      Cambié un ingrediente: sale <u>{nameOf(chef.changed.out)}</u>, entra <u>{nameOf(chef.changed.in)}</u>.
                    </em>
                  )}
                </>
              )}
              {phase === "prep" && (
                <>
                  <small>Todos a la mesa</small>
                  <b>Armen el memory</b>
                  <span>Cuando esté listo, les dicto la receta.</span>
                  <button type="button" className={styles.skip} onClick={() => go("dictate")}>
                    Listos, dicte ya
                  </button>
                </>
              )}
              {phase === "dictate" && (
                <>
                  <small>Memoricen, la borro en {Math.ceil(dictLeft)} s</small>
                  <div className={styles.recipe}>
                    {chef.recipe.map((id) => (
                      <span key={id} className={styles.rchip}>
                        <CharacterAvatar id={id} size="md" ingredient />
                        {nameOf(id)}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {phase === "answer" && (
                <>
                  <small>La receta ya no existe</small>
                  <b>¿Qué les pedí?</b>
                  <span>Elijan en la comanda los ingredientes que recuerden.</span>
                </>
              )}
            </div>
          )}

          {/* moneditas */}
          <div className={base.coins}>
            <img src="/scenary/common/coins.svg" alt="" draggable="false" />
            <span>{coins}</span>
          </div>
        </div>
      </section>

      {/* derecha: la comanda del Chef */}
      <aside className={base.side}>
        <div className={base.sideStage}>
          <img className={base.sideArt} src={ORDER + "sidetable.svg"} alt="" aria-hidden="true" draggable="false" />
          <div className={base.tickets}>
            <article className={`${base.ticket} ${base.ticketOn} ${styles.comanda}`} style={{ left: (653 - 417) / 2 }}>
              <img className={base.ticketArt} src={ORDER + "ticket.svg"} alt="" aria-hidden="true" draggable="false" />
              <div className={base.ticketIn}>
                <h3 className={styles.ctitle}>
                  <ChefHat className={styles.ctitleHat} />
                  {CHEF.name}
                </h3>
                <p className={styles.cmeta}>
                  Intento {attempt} de {total} · dicta {dictSec} s
                </p>

                {phase === "answer" || phase === "verdict" ? (
                  <>
                    <div className={styles.grid}>
                      {CHEF_FOODS.map((id) => {
                        const on = selected.includes(id);
                        const right = phase === "verdict" ? chef.recipe.includes(id) : null;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={phase !== "answer"}
                            className={`${styles.food} ${on ? styles.foodOn : ""} ${
                              phase === "verdict" ? (right ? styles.foodRight : on ? styles.foodWrong : styles.foodDim) : ""
                            }`}
                            onClick={() => toggle(id)}
                            aria-pressed={on}
                          >
                            <CharacterAvatar id={id} size="sm" ingredient />
                            <span>{nameOf(id)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {phase === "answer" && (
                      <>
                        <div className={styles.patience} role="progressbar" aria-label="Paciencia del Chef" aria-valuenow={Math.round((patienceLeft / patienceSec) * 100)}>
                          <i
                            style={{
                              width: `${(patienceLeft / patienceSec) * 100}%`,
                              background: patienceLeft / patienceSec > 0.5 ? "var(--secondary)" : patienceLeft / patienceSec > 0.25 ? "var(--yellow)" : "var(--coral)",
                            }}
                          />
                        </div>
                        <button type="button" className={styles.deliver} onClick={deliver}>
                          Entregar al Chef · {selected.length}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className={styles.locked}>
                    <div className={styles.qgrid} aria-hidden="true">
                      {Array.from({ length: CHEF_FOODS.length }, (_, i) => (
                        <span key={i}>?</span>
                      ))}
                    </div>
                    <p>
                      {phase === "prep"
                        ? `Memory en la mesa: ${Math.ceil(prepLeft)} s`
                        : phase === "dictate"
                          ? "Mirando la receta…"
                          : "La comanda se abre pronto"}
                    </p>
                  </div>
                )}
              </div>
            </article>
          </div>
          <img className={base.rail} src={ORDER + "tickettrail.svg"} alt="" aria-hidden="true" draggable="false" />
        </div>
      </aside>

      <div className={base.table} />

      {/* asientos: los ayudantes se ven apagados con su etiqueta */}
      {SEATS.map((corner, i) => {
        const p = players[i];
        return (
          p && (
            <div key={corner} className={`${base.corner} ${base[corner]}`}>
              <div className={`${base.seat} ${base["seat_" + corner]} ${base.seatOn}`}>
                <PlayerRing index={i} characterId={p.characterId} />
                <span className={base.seatName}>{p.name}</span>
                {helpers.includes(p.name) && (
                  <span className={base.helperTag}>
                    <VacationIcon className={base.helperHat} />
                    De vacaciones
                  </span>
                )}
              </div>
            </div>
          )
        );
      })}

      {/* tensión: la pantalla se oscurece y late */}
      {dark && (
        <div className={`${styles.dim} ${phase === "tension" ? styles.tense : ""}`}>
          {phase === "enter" && (
            <div className={styles.arrive}>
              <ChefHat className={styles.arriveHat} />
              <b>{CHEF.name}</b>
              <span>ha llegado al restaurante</span>
            </div>
          )}
          {phase === "tension" && (
            <div className={styles.thinking}>
              <span>Shhh…</span>
              <b>el Chef está pensando su pedido</b>
              <i>
                <u /> <u /> <u />
              </i>
            </div>
          )}
        </div>
      )}

      {/* veredicto */}
      {phase === "verdict" && verdict && (
        <div className={styles.verdict}>
          <div className={styles.verdictBox}>
            <small>Veredicto del Chef</small>
            <div className={styles.stars} aria-label={`${verdict.stars} de 5 estrellas`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  className={i < verdict.stars ? styles.starOn : styles.starOff}
                  style={{ animationDelay: `${0.3 + i * 0.35}s` }}
                  src="/scenary/player register/star.svg"
                  alt=""
                  draggable="false"
                />
              ))}
            </div>
            <b className={styles.verdictTitle}>
              {verdict.stars === 5
                ? "¡Perfecto!"
                : verdict.stars >= 3
                  ? "Buen plato"
                  : verdict.stars >= 1
                    ? "Pasable"
                    : "Inaceptable"}
            </b>
            <p className={styles.verdictLine}>
              {verdict.correct} de {chef.recipe.length} ingredientes correctos
              {verdict.wrong ? ` · ${verdict.wrong} de más` : ""}
            </p>
            <p className={verdict.stars ? styles.gain : styles.loss}>
              {verdict.stars
                ? `+${chefCoinsFor(verdict.stars)} monedas para el restaurante`
                : `-${CHEF.failCost} monedas${last ? ` y -${CHEF.leavePenalty} de reputación` : ""}`}
            </p>
            {verdict.stars === 0 && (
              <p className={styles.verdictNote}>
                {last
                  ? "El Chef se va indignado. Ya no hay más intentos."
                  : "El Chef se retira, pero volverá cuando llegue otro jugador a la meta. Su receta cambiará."}
              </p>
            )}
            <button
              type="button"
              className={styles.next}
              onClick={() => {
                sfx.press();
                dispatch({ type: "chefVerdict", stars: verdict.stars });
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
