import { useEffect } from "react";
import { useGame } from "../game/GameContext.jsx";
import Screen, { Pane } from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import Ribbon from "../components/Ribbon.jsx";
import Confetti from "../components/Confetti.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import { BodyText } from "../components/Text.jsx";
import { sfx } from "../lib/sfx.js";
import styles from "./ResultsScreen.module.css";

export default function ResultsScreen() {
  const { players, finishOrder, badges, bankrupt, coins, dispatch, navigate } =
    useGame();
  const byName = (n) => players.find((p) => p.name === n) || { name: n };
  const winner = finishOrder[0] ? byName(finishOrder[0]) : null;
  const list = badges || [];

  useEffect(() => {
    if (!bankrupt) sfx.win();
  }, [bankrupt]);

  return (
    <Screen layout="panes">
      {!bankrupt && <Confetti />}
      <Pane>
        {bankrupt ? (
          <Ribbon tone="ink">El restaurante quebró</Ribbon>
        ) : (
          <Ribbon tone="yellow">Empleado del mes</Ribbon>
        )}
        {bankrupt ? (
          <div className={styles.finalCoins}>
            <svg className={styles.coinIcon} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 8.3v7.4M9.9 15c.3.7 1.1 1.1 2.1 1.1 1.4 0 2.3-.7 2.3-1.7 0-1.1-1-1.4-2.3-1.7-1.3-.3-2.3-.7-2.3-1.7 0-1 .9-1.7 2.3-1.7 1 0 1.8.4 2.1 1.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <p className={styles.winnerName}>{coins} moneditas</p>
              <BodyText align="left">Balance final del restaurante</BodyText>
            </div>
          </div>
        ) : (
          winner && (
            <div className={styles.winner}>
              <CharacterAvatar id={winner.characterId} size="lg" />
              <div>
                <p className={styles.winnerName}>{winner.name}</p>
                <BodyText align="left">Primero en llegar a FIN</BodyText>
              </div>
            </div>
          )
        )}
        <BodyText align="left" className={styles.note}>
          {bankrupt
            ? "Se acabaron las moneditas: demasiados pedidos se vencieron antes de entregarse. Así cerró el servicio cada quien:"
            : "Todos cierran el servicio con una insignia, como en un partido: no solo gana quien llega primero."}
        </BodyText>
        <div className={styles.actions}>
          <Button
            variant="primary"
            wide
            sound="press"
            onClick={() => {
              dispatch({ type: "resetGame" });
              navigate("register");
            }}
          >
            Jugar otra vez
          </Button>
          <Button wide onClick={() => dispatch({ type: "resetGame", intro: true })}>
            Al menú
          </Button>
        </div>
      </Pane>

      <Pane divider>
        <SectionLabel>Insignias de la mesa</SectionLabel>
        <ul className={styles.badges}>
          {list.map(({ name, badge }) => (
            <li key={name} className={styles.badge}>
              <CharacterAvatar id={badge?.icon || "queso"} size="sm" />
              <span className={styles.badgeText}>
                <span className={styles.badgeName}>{badge?.name}</span>
                <span className={styles.badgeDesc}>{badge?.desc}</span>
              </span>
              <span className={styles.who}>{name}</span>
            </li>
          ))}
        </ul>
      </Pane>
    </Screen>
  );
}
