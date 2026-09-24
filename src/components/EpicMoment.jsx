import { useEffect } from "react";
import { POWER_CARD_INFO } from "../game/board.js";
import { useStageScale } from "../screens/menuAssets.js";
import styles from "./EpicMoment.module.css";

const SPARK = "/scenary/player register/starnoshadow.svg";

/** Momento épico a pantalla completa: la MISMA animación para evento positivo, evento negativo y carta ganada.
 *  kind: "card" · "good" · "bad". `card` = id de la carta; `title/sub/text` = textos; `color` = borde (color del jugador).
 *  Capas, de atrás hacia adelante: velo → rayos → destellos de atrás → carta/medalla → destellos de adelante → texto. */
export default function EpicMoment({ kind = "good", card, title, sub, text, color = "#ffdb2a", onDone }) {
  const scale = useStageScale();

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  const info = card ? POWER_CARD_INFO[card] : null;
  const spark = (i, layer) => (
    <img
      key={`${layer}${i}`}
      className={`${styles.spark} ${styles[layer]}`}
      src={SPARK}
      alt=""
      draggable="false"
      style={{ "--a": `${i * 45 + 20}deg`, "--d": `${0.15 + (i % 3) * 0.08}s` }}
    />
  );

  return (
    <div className={`${styles.root} ${styles[kind]}`} style={{ "--s": scale, "--pj": color }} aria-live="assertive">
      <div className={styles.veil} />
      <div className={styles.rays} />
      {[0, 2, 4, 6].map((i) => spark(i, "back"))}
      {card ? (
        <img className={styles.card} src={"/powercards/" + encodeURI(card) + ".svg"} alt="" draggable="false" />
      ) : (
        // ícono del evento: confeti (positivo) o nube de tormenta (negativo)
        <img className={styles.icon} src={`/events/${kind === "bad" ? "bad" : "good"}.svg`} alt="" draggable="false" />
      )}
      {[1, 3, 5, 7].map((i) => spark(i, "front"))}
      <div className={styles.text}>
        <b>{title || info?.name}</b>
        {sub && <span>{sub}</span>}
        {(text || info?.text) && <em>{text || info?.text}</em>}
      </div>
    </div>
  );
}
