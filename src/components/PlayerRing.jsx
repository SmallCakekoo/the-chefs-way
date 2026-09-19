import { characterById, faceStyle } from "../game/board.js";
import styles from "./PlayerRing.module.css";

const ART = "/scenary/tablero/";
// Color de aro por orden de registro (el rojo es "orangecircle.svg").
const RINGS = ["orange", "blue", "green", "yellow"];

/** Aro de color con la cara del jugador dentro. `index` = orden de registro (0..3). */
export default function PlayerRing({ index, characterId, className = "" }) {
  const c = characterById(characterId);
  return (
    <div className={`${styles.ring} ${className}`}>
      <img
        className={styles.ringArt}
        src={`${ART}${RINGS[index % 4]}circle.svg`}
        alt=""
        draggable="false"
      />
      <span className={styles.face}>
        <img
          className={c.face ? styles.faceZoom : styles.faceFit}
          src={c.src}
          alt={c.name}
          draggable="false"
          style={faceStyle(c)}
        />
      </span>
    </div>
  );
}
