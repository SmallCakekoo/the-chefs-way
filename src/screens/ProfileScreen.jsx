import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import Screen, { Pane } from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import CharacterPicker from "../components/CharacterPicker.jsx";
import AchievementList from "../components/AchievementList.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import Ribbon from "../components/Ribbon.jsx";
import { evaluate } from "../game/achievements.js";
import styles from "./ProfileScreen.module.css";

export default function ProfileScreen() {
  const { profile, stats, dispatch, navigate } = useGame();
  const [confirmOut, setConfirmOut] = useState(false);
  const achievements = evaluate(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const patch = (p) => dispatch({ type: "setProfile", patch: p });

  const STATS = [
    { k: "Partidas jugadas", v: stats.gamesPlayed },
    { k: "Veces empleado del mes", v: stats.wins },
    { k: "Partidas organizadas", v: stats.gamesHosted },
  ];

  return (
    <Screen onBack={() => navigate("menu")} layout="panes">
      <Pane>
        <Ribbon tone="secondary">Tu chef</Ribbon>

        <div className={styles.hero}>
          <CharacterAvatar id={profile.characterId} size="xl" />
          <div className={styles.heroFields}>
            <input
              className={styles.nameInput}
              value={profile.name}
              maxLength={16}
              aria-label="Tu nombre"
              placeholder="Tu nombre"
              onChange={(e) => patch({ name: e.target.value })}
            />
            <textarea
              className={styles.descInput}
              value={profile.description || ""}
              maxLength={90}
              rows={2}
              aria-label="Tu descripción"
              placeholder="Cómo te ven en la mesa: tu estilo, tu manía, tu frase…"
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
        </div>

        <SectionLabel>Personaje</SectionLabel>
        <CharacterPicker
          value={profile.characterId}
          onPick={(id) => patch({ characterId: id })}
        />

        <Button
          wide
          className={styles.logout}
          onClick={() => setConfirmOut(true)}
        >
          Cerrar sesión
        </Button>
      </Pane>

      <Pane divider>
        <div className={styles.statRow}>
          {STATS.map((s) => (
            <Card key={s.k} tint="paper" flat className={styles.stat}>
              <span className={styles.statValue}>{s.v}</span>
              <span className={styles.statKey}>{s.k}</span>
            </Card>
          ))}
        </div>

        <div className={styles.logrosHead}>
          <SectionLabel>Logros</SectionLabel>
          <span className={styles.count}>
            {unlocked}/{achievements.length}
          </span>
        </div>
        <AchievementList items={achievements} />
      </Pane>

      <ConfirmDialog
        open={confirmOut}
        title="¿Cerrar sesión?"
        body="Tu perfil, tus ajustes y tus logros quedan guardados en este dispositivo. Volverás a la pantalla de inicio."
        confirmLabel="Cerrar sesión"
        cancelLabel="Quedarme"
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          dispatch({ type: "logout" });
        }}
      />
    </Screen>
  );
}
