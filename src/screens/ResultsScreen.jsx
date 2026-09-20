import { useEffect } from "react";
import { useGame } from "../game/GameContext.jsx";
import { characterById, faceStyle } from "../game/board.js";
import Confetti from "../components/Confetti.jsx";
import ChefHat from "../components/ChefHat.jsx";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./ResultsScreen.module.css";

const FINAL = "/scenary/final/";
const COMMON = "/scenary/common/";
// Un color de pastilla por orden de registro (el rojo es el "orange" de los aros).
const BANNERS = ["red", "blue", "green", "yellow"];
const PLAYER_COLORS = ["#e2381a", "#1d8fd6", "#1aa97f", "#d19a00"];
const SPARKS = [
  [150, 187, 46],
  [768, 201, 40],
  [756, 370, 30],
  [135, 365, 30],
];

/** Pantalla final (final/finalidea.svg): balance del restaurante a la izquierda, insignias de la mesa a la derecha. */
export default function ResultsScreen() {
  const { players, finishOrder, badges, bankrupt, coins, chefResult, dispatch, navigate } = useGame();
  const scale = useStageScale();
  const winner = finishOrder[0];
  const list = badges || [];

  useEffect(() => {
    if (!bankrupt) sfx.win();
  }, [bankrupt]);

  // el Chef Maestro se resume primero; después el veredicto del restaurante
  const chefLeft = chefResult?.left;
  const chefStars = chefResult?.stars ?? 0;

  const message = bankrupt
    ? "Se acabaron las moneditas: demasiados pedidos se vencieron antes de entregarse."
    : chefLeft
      ? "El Chef se fue sin probar el plato y el restaurante perdió reputación. Aun así, la cocina sigue abierta."
      : winner
      ? `¡Cerraron el servicio! ${winner} fue el primero en llegar a FIN.`
      : "¡Cerraron el servicio entre todos!";

  return (
    <main className={styles.root} style={{ "--s": scale }}>
      {!bankrupt && <Confetti />}

      {/* izquierda: balance */}
      <section className={styles.left}>
        <div className={styles.leftStage}>
          <div className={styles.ribbon}>
            <img src="/scenary/tablero/liston.svg" alt="" draggable="false" />
            <span>{bankrupt ? "Restaurante en quiebra" : chefLeft ? "Servicio cerrado" : "Restaurante triunfador"}</span>
          </div>

          <div className={styles.card}>
            <img className={styles.frame} src={FINAL + "endframe.svg"} alt="" aria-hidden="true" draggable="false" />
            <img
              className={bankrupt ? styles.badCoins : styles.goodCoins}
              src={FINAL + (bankrupt ? "badcoins.svg" : "goodcoins.svg")}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
            {chefResult && (
              <div className={styles.chefRow}>
                <ChefHat className={styles.chefHat} />
                {chefLeft ? (
                  <span className={styles.chefLeft}>El Chef se fue</span>
                ) : (
                  <>
                    <span>Chef Maestro</span>
                    <span className={styles.chefStars} aria-label={`${chefStars} de 5 estrellas`}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <img
                          key={i}
                          className={i < chefStars ? styles.sOn : styles.sOff}
                          style={{ animationDelay: `${0.5 + i * 0.18}s` }}
                          src="/scenary/player register/star.svg"
                          alt=""
                          draggable="false"
                        />
                      ))}
                    </span>
                  </>
                )}
              </div>
            )}
            <p className={styles.amount}>{coins} moneditas</p>
            <p className={styles.balance}>Balance final del restaurante</p>
            <p className={styles.note}>{message}</p>
          </div>

          <button
            className={`${styles.btn} ${styles.again}`}
            onClick={() => {
              sfx.press();
              dispatch({ type: "resetGame" });
              navigate("register");
            }}
          >
            <img src={COMMON + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
            <span>Jugar otra vez</span>
          </button>
          <button
            className={`${styles.btn} ${styles.menu}`}
            onClick={() => {
              sfx.tap();
              dispatch({ type: "resetGame", intro: true });
            }}
          >
            <img src={COMMON + "btn.svg"} alt="" aria-hidden="true" draggable="false" />
            <span>Ir al menu</span>
          </button>
        </div>
      </section>

      {/* derecha: pilar y panel de insignias */}
      <aside className={styles.side}>
        <div className={styles.sideStage}>
          <div className={styles.pillar} />
          <div className={styles.plaque}>
            <i className={styles.pole} style={{ left: 70 }} />
            <i className={styles.pole} style={{ left: 330 }} />
            <span>Insignias</span>
          </div>
          <img className={styles.medal} src={FINAL + "badge.svg"} alt="" aria-hidden="true" draggable="false" />
          {SPARKS.map(([x, y, w], i) => (
            <img
              key={i}
              className={styles.spark}
              src="/scenary/player register/starnoshadow.svg"
              alt=""
              aria-hidden="true"
              draggable="false"
              style={{ left: x, top: y, width: w, animationDelay: `${i * 0.5}s` }}
            />
          ))}

          {list.map(({ name, badge }, i) => {
            const pi = Math.max(0, players.findIndex((p) => p.name === name));
            const c = characterById(players[pi]?.characterId);
            return (
              <div
                key={name}
                className={styles.row}
                style={{ top: 215 + (4 - list.length) * 104.5 + i * 209, animationDelay: `${0.25 + i * 0.15}s` }}
              >
                <img className={styles.pill} src={FINAL + BANNERS[pi % 4] + "banner.svg"} alt="" aria-hidden="true" draggable="false" />
                <span className={styles.face}>
                  <img
                    className={c.face ? styles.faceZoom : styles.faceFit}
                    src={c.src}
                    alt={c.name}
                    draggable="false"
                    style={faceStyle(c)}
                  />
                </span>
                <span className={styles.text}>
                  <u style={{ color: PLAYER_COLORS[pi % 4] }}>{name}</u>
                  <b>{badge?.name}</b>
                  <em>{badge?.desc}</em>
                </span>
                <span className={styles.slot}>
                  {badge?.img ? (
                    <img src={badge.img} alt={`Insignia ${badge.name}: ${badge.desc}`} draggable="false" />
                  ) : (
                    <b title="Falta la imagen de esta insignia">?</b>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    </main>
  );
}
