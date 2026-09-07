import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { MAX_PLAYERS, MIN_PLAYERS, CHARACTERS } from "../game/board.js";
import Screen, { Pane } from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import Field from "../components/Field.jsx";
import CharacterPicker from "../components/CharacterPicker.jsx";
import Roster from "../components/Roster.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import { characterById } from "../game/board.js";
import styles from "./RegisterScreen.module.css";

function firstFree(taken) {
  return (CHARACTERS.find((c) => !taken.includes(c.id)) || CHARACTERS[0]).id;
}

export default function RegisterScreen() {
  const { players, dispatch, navigate } = useGame();
  const taken = players.map((p) => p.characterId);
  const [name, setName] = useState("");
  const [charId, setCharId] = useState(firstFree(taken));

  const full = players.length >= MAX_PLAYERS;
  const canStart = players.length >= MIN_PLAYERS;
  const missing = Math.max(0, MIN_PLAYERS - players.length);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed || full || taken.includes(charId)) return;
    dispatch({ type: "addPlayer", player: { name: trimmed, characterId: charId } });
    setName("");
    setCharId(firstFree([...taken, charId]));
  };

  return (
    <Screen onBack={() => navigate("menu")} layout="panes">
      <Pane>
        <SectionLabel>Nuevo jugador</SectionLabel>
        <Field
          placeholder="Nombre del jugador"
          maxLength={14}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <SectionLabel>Elige personaje</SectionLabel>
        <CharacterPicker value={charId} taken={taken} onPick={setCharId} />
        <Button
          variant="secondary"
          wide
          onClick={add}
          disabled={full || !name.trim()}
        >
          Agregar jugador
        </Button>
      </Pane>

      <Pane divider>
        <SectionLabel>Jugadores en la partida</SectionLabel>
        {players.length === 0 ? (
          <div className={styles.empty}>
            <img
              className={styles.emptyArt}
              src={characterById("huevo").src}
              alt=""
            />
            <p className={styles.emptyText}>
              Aún no hay nadie en la cocina. Se necesitan al menos {MIN_PLAYERS}{" "}
              chefs para jugar.
            </p>
          </div>
        ) : (
          <Roster
            players={players}
            onRemove={(i) => dispatch({ type: "removePlayer", index: i })}
          />
        )}

        <p className={styles.note}>
          {full
            ? `Ya tienes ${MAX_PLAYERS} jugadores, el máximo por partida.`
            : `De ${MIN_PLAYERS} a ${MAX_PLAYERS} jugadores.`}
        </p>

        <Button
          variant="primary"
          wide
          disabled={!canStart}
          onClick={() => dispatch({ type: "startGame" })}
          className={styles.start}
          sound="press"
        >
          {canStart
            ? "Empezar partida"
            : `Faltan ${missing} jugador${missing === 1 ? "" : "es"}`}
        </Button>
      </Pane>
    </Screen>
  );
}
