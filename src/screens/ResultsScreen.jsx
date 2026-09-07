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
  const { players, finishOrder, badges, dispatch, navigate } = useGame();
  const byName = (n) => players.find((p) => p.name === n) || { name: n };
  const winner = finishOrder[0] ? byName(finishOrder[0]) : null;
  const list = badges || [];

  useEffect(() => {
    sfx.win();
  }, []);

  return (
    <Screen layout="panes">
      <Confetti />
      <Pane>
        <Ribbon tone="yellow">Empleado del mes</Ribbon>
        {winner && (
          <div className={styles.winner}>
            <CharacterAvatar id={winner.characterId} size="lg" />
            <div>
              <p className={styles.winnerName}>{winner.name}</p>
              <BodyText align="left">Primero en llegar a FIN</BodyText>
            </div>
          </div>
        )}
        <BodyText align="left" className={styles.note}>
          Todos cierran el servicio con una insignia, como en un partido: no solo
          gana quien llega primero.
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
          <Button wide onClick={() => dispatch({ type: "resetGame" })}>
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
