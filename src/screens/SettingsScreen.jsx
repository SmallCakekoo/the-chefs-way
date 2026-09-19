import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import Card from "../components/Card.jsx";
import Toggle from "../components/Toggle.jsx";
import Slider from "../components/Slider.jsx";
import Ribbon from "../components/Ribbon.jsx";
import SectionLabel from "../components/SectionLabel.jsx";
import { BodyText } from "../components/Text.jsx";
import { ORDER_INTERVALS, humanInterval } from "../game/orders.js";
import { sfx } from "../lib/sfx.js";
import styles from "./SettingsScreen.module.css";

const SWITCHES = [
  { key: "sound", label: "Efectos de sonido" },
  { key: "music", label: "Música" },
  { key: "haptics", label: "Vibración" },
];

export default function SettingsScreen() {
  const { settings, dispatch, navigate } = useGame();

  return (
    <Screen onBack={() => navigate("menu")} layout="flow">
      <Ribbon tone="secondary">Ajustes</Ribbon>
      <BodyText align="left" className={styles.autosave}>
        Los cambios se guardan solos en este dispositivo.
      </BodyText>

      <Card flat tint="paper">
        <SectionLabel>Sonido</SectionLabel>
        <div className={styles.rows}>
          {SWITCHES.map((s) => (
            <div key={s.key} className={styles.row}>
              <span className={styles.rowLabel}>{s.label}</span>
              <Toggle
                label={s.label}
                checked={settings[s.key]}
                onChange={(v) =>
                  dispatch({ type: "setSetting", key: s.key, value: v })
                }
              />
            </div>
          ))}
          <div
            className={`${styles.row} ${!settings.music ? styles.rowOff : ""}`}
          >
            <Slider
              label="Volumen música"
              ariaLabel="Volumen de la música"
              value={settings.musicVolume}
              onChange={(v) =>
                dispatch({ type: "setSetting", key: "musicVolume", value: v })
              }
            />
          </div>
        </div>
      </Card>

      <Card flat tint="paper">
        <SectionLabel>Pedidos</SectionLabel>
        <div className={styles.segmented}>
          {Object.entries(ORDER_INTERVALS).map(([key, v]) => (
            <button
              key={key}
              className={`${styles.seg} ${
                settings.orderInterval === key ? styles.segOn : ""
              }`}
              onClick={() => {
                sfx.select();
                dispatch({ type: "setSetting", key: "orderInterval", value: key });
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <BodyText align="left" className={styles.cardNote}>
          Sale un pedido cada ~{humanInterval(settings.orderInterval)} (con algo de
          azar). El timer se ve en la pantalla de turno.
        </BodyText>
      </Card>

      <Card flat tint="paper">
        <SectionLabel>Tema</SectionLabel>
        <div className={styles.segmented}>
          {[
            ["light", "Claro"],
            ["dark", "Oscuro"],
          ].map(([t, label]) => (
            <button
              key={t}
              className={`${styles.seg} ${settings.theme === t ? styles.segOn : ""}`}
              onClick={() => {
                sfx.select();
                dispatch({ type: "setSetting", key: "theme", value: t });
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <BodyText align="left" className={styles.version}>
        The Chef&apos;s Way · prototipo v0.2
      </BodyText>
    </Screen>
  );
}
