/* Convierte a WebP las ilustraciones que NO son vectores: los .svg exportados de Figma que por dentro solo traen
 * una imagen rasterizada (PNG en base64) y los .png sueltos. Los vectores de verdad (botones, mesón, marcos…)
 * se quedan en SVG.
 *
 *   node scripts/convertir-webp.mjs
 *
 * Cada archivo se dibuja tal cual en Chromium (Playwright) —con sus recortes, marcos y transparencias— y se
 * guarda como .webp junto al original, que se borra. El tamaño de salida sigue la resolución de la imagen que
 * traía adentro, con un tope por carpeta según lo grande que se ve en el juego (así no pesa de más).
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const CALIDAD = 0.9;

// [archivo relativo a public/, lado mayor máximo en px]
const TRABAJOS = [
  ...[8, 9, 10, 11, 12].map((n) => [`chef character/Animalito ${n}.svg`, 1200]),
  ...[1, 2, 5, 6, 7, 8, 9].map((n) => [`clients/Animalito ${n}.svg`, 1200]),
  ["events/good.svg", 800],
  ["events/bad.svg", 800],
  ["events/good end.svg", 2048],
  ["events/bad end.svg", 2048],
  ...["avocado", "breadburger", "breadsandwich", "cheese", "chicken", "egg", "lettuce", "meat", "onion", "tomato", "toritillataco"].map(
    (f) => [`ingredients/${f}.svg`, 512]
  ),
  ...["Corazón de cocina", "El atajero", "El fiel", "Empleado del mes", "Imán de eventos", "La tortuga", "Manos rápidas", "¿Con suerte_"].map(
    (f) => [`insignias/${f}.svg`, 800]
  ),
  ...["Cocina curtida", "Doble turno", "Dueño del local", "Empleado del mes", "Por Descubrir", "Primer servicio", "Servicio completo"].map(
    (f) => [`logros/${f}.svg`, 900]
  ),
  ...["15 segundos en memory", "demandar jugador", "devolver demanda", "dolb turno memoria", "robar dee ingrediente a otro jugador"].map(
    (f) => [`powercards/${f}.svg`, 1000]
  ),
  ["scenary/menu/logo.svg", 1800],
  ["scenary/menu/logonoeyes.svg", 1800],
  ["logo.png", 1800],
  ["white logo.png", 1800],
];

/** Tamaño del SVG (width/height o viewBox) y el lado mayor de la imagen rasterizada que trae adentro. */
function medir(texto) {
  const num = (re) => {
    const m = texto.match(re);
    return m ? parseFloat(m[1]) : null;
  };
  let w = num(/<svg[^>]*\swidth="([\d.]+)/);
  let h = num(/<svg[^>]*\sheight="([\d.]+)/);
  if (!w || !h) {
    const vb = texto.match(/viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/);
    if (vb) [w, h] = [parseFloat(vb[1]), parseFloat(vb[2])];
  }
  let nativo = 0;
  for (const m of texto.matchAll(/<image[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/g)) {
    nativo = Math.max(nativo, parseFloat(m[1]), parseFloat(m[2]));
  }
  return { w, h, nativo };
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<canvas></canvas>");

let antes = 0;
let despues = 0;
for (const [rel, tope] of TRABAJOS) {
  const origen = join(PUBLIC, rel);
  if (!existsSync(origen)) {
    console.log(`  (no está) ${rel}`);
    continue;
  }
  const destino = origen.replace(/\.(svg|png)$/i, ".webp");
  const buf = readFileSync(origen);
  const esSvg = rel.endsWith(".svg");
  const dataUrl = `data:${esSvg ? "image/svg+xml" : "image/png"};base64,${buf.toString("base64")}`;
  const med = esSvg ? medir(buf.toString("utf8")) : { w: 0, h: 0, nativo: 0 };

  const b64 = await page.evaluate(
    async ({ dataUrl, med, tope, calidad }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const w0 = med.w || img.naturalWidth;
      const h0 = med.h || img.naturalHeight;
      const mayor = Math.max(w0, h0);
      // resolución: la de la imagen interna (o la natural del PNG), sin pasar del tope ni bajar del tamaño del SVG
      const objetivo = Math.min(tope, Math.max(mayor, med.nativo || img.naturalWidth || mayor));
      const k = objetivo / mayor;
      const c = document.querySelector("canvas");
      c.width = Math.round(w0 * k);
      c.height = Math.round(h0 * k);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/webp", calidad).split(",")[1];
    },
    { dataUrl, med, tope, calidad: CALIDAD }
  );
  const out = Buffer.from(b64, "base64");
  writeFileSync(destino, out);
  rmSync(origen);
  antes += buf.length;
  despues += out.length;
  console.log(`  ✓ ${rel} → .webp  ${(buf.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB`);
}
await browser.close();
console.log(`\nTotal: ${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(1)} MB`);
