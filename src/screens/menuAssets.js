// Montaje del menú (lienzo de diseño 1920x1080).
export const STAGE_W = 1920;
export const STAGE_H = 1080;
export const BASE = "/scenary/menu/";

export const MENU_FILES = [
  "logo.svg",
  "btn.svg",
  "pointer.svg",
  "table.svg",
  "salt1.svg",
  "salt2.svg",
  "cuttingtable.svg",
  "knife.svg",
  "plant1.svg",
  "spoon.svg",
];

/** Descarga y decodifica todas las imágenes del menú. `onProgress(hechas, total)`. */
export function preloadMenu(onProgress) {
  let done = 0;
  return Promise.all(
    MENU_FILES.map((f) => {
      const img = new Image();
      img.src = BASE + f;
      return img
        .decode()
        .catch(() => {})
        .then(() => onProgress?.(++done, MENU_FILES.length));
    })
  );
}

/** Escala el lienzo para que quepa entero. */
export function fitScale() {
  return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
}
