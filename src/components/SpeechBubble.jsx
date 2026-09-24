import { useLayoutEffect, useRef, useState } from "react";
import useTypewriter from "../lib/useTypewriter.js";
import styles from "../screens/OrderScene.module.css";

/* Globos de diálogo (order/dialogues/esquina-*.svg): de menor a mayor. `w`/`h` = tamaño del archivo; se muestran a
   escala K. La cola queda abajo a la derecha, apuntando a quien habla. Se usa el más chico donde quepa el texto.
   Lo usan los clientes (OrderScene) y el Chef Maestro (ChefScene): el mismo globo para todos. */
const DLG = "/scenary/order/dialogues/";
const DLG_K = 0.24;
const DLG_INSET = { l: 34, r: 48, t: 20, b: 34 }; // margen del texto dentro del globo (px de lienzo)
const DIALOGUES = [
  { id: "mini", w: 1534, h: 276 },
  { id: "xs", w: 2276, h: 276 },
  { id: "s", w: 2014, h: 520 },
  { id: "m", w: 2304, h: 521 },
  { id: "l", w: 2304, h: 727 },
  { id: "xl", w: 2304, h: 895 },
].map((d) => ({ ...d, W: Math.round(d.w * DLG_K), H: Math.round(d.h * DLG_K) }));

/** Globo con el texto que se "escribe" (`line`) y lo que vaya debajo (`children`: ingredientes, botones…).
 *  `right` = borde derecho del globo y `base` = línea de la que cuelga (su base), en px del lienzo de la izquierda.
 *  `fitKey` = cambia cuando cambia lo de abajo (se vuelve a medir). Los hijos con `chipIn` aparecen al terminar de escribir. */
export default function SpeechBubble({ line, children, right = 750, base = 376, fitKey }) {
  const { shown, done } = useTypewriter(line);
  const measure = useRef(null);
  // d = globo elegido · k = escala del contenido (1 = tamaño normal) · textH = alto del texto completo
  const [fit, setFit] = useState({ d: DIALOGUES[DIALOGUES.length - 1], k: 1, textH: 0 });
  const innerW = (d) => d.W - DLG_INSET.l - DLG_INSET.r;
  const innerH = (d) => d.H - DLG_INSET.t - DLG_INSET.b;

  // elige el globo más chico donde cabe el texto completo + lo de abajo. Si ni el más grande alcanza, se achica
  // TODO el contenido parejo (texto, chips y sus dibujos) en vez de encimarlo.
  useLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const textEl = el.firstChild;
    const pick = () => {
      // ¿cabe en el globo `d` con el contenido a escala `k`? (se mide a tamaño normal en un ancho de innerW / k)
      const fits = (d, k = 1) => {
        el.style.width = `${innerW(d) / k}px`;
        return el.scrollHeight * k <= innerH(d);
      };
      for (const d of DIALOGUES) {
        if (fits(d)) return setFit({ d, k: 1, textH: textEl.offsetHeight });
      }
      const d = DIALOGUES[DIALOGUES.length - 1];
      let k = 1;
      while (k > 0.5 && !fits(d, k)) k -= 0.02;
      setFit({ d, k, textH: textEl.offsetHeight });
    };
    pick();
    document.fonts?.ready.then(pick);
  }, [line, fitKey]);

  const { d, k, textH } = fit;
  return (
    <div className={styles.bubble} style={{ left: right - d.W, top: base, width: d.W, height: d.H }}>
      <img className={styles.bubbleArt} src={`${DLG}esquina-${d.id}.svg`} alt="" aria-hidden="true" draggable="false" />
      <div
        className={styles.bubbleIn}
        style={{
          left: DLG_INSET.l,
          top: DLG_INSET.t,
          width: innerW(d) / k,
          height: innerH(d) / k,
          transform: k < 1 ? `scale(${k})` : undefined,
          transformOrigin: "0 0",
          "--typed-ms": `${line.length * 32 + 120}ms`,
        }}
      >
        <p className={styles.bubbleText} style={textH ? { minHeight: textH } : undefined}>
          {shown}
          {!done && <span className={styles.caret} aria-hidden="true" />}
        </p>
        {children}
      </div>
      {/* copia invisible con el texto completo, solo para medir qué globo hace falta */}
      <div ref={measure} className={styles.bubbleMeasure} aria-hidden="true">
        <p className={styles.bubbleText}>{line}</p>
        {children}
      </div>
    </div>
  );
}
