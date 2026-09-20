import { useGame } from "../game/GameContext.jsx";
import { ORDER_INTERVALS } from "../game/orders.js";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./SettingsScreen.module.css";

const S = "/scenary/settings/";
const art = (file) => S + encodeURIComponent(file);

/* Al tocar un objeto se mueve un momento (cada uno a su manera). Se anima con la Web Animations API para poder repetirlo al vuelo. */
const MOVES = {
  swing: [
    { transform: "rotate(0)" },
    { transform: "rotate(-16deg)" },
    { transform: "rotate(10deg)" },
    { transform: "rotate(-5deg)" },
    { transform: "rotate(0)" },
  ],
  hop: [
    { transform: "translateY(0) rotate(0)" },
    { transform: "translateY(-34px) rotate(-8deg)", offset: 0.4 },
    { transform: "translateY(0) rotate(4deg)", offset: 0.75 },
    { transform: "translateY(0) rotate(0)" },
  ],
  slide: [
    { transform: "translate(0, 0)" },
    { transform: "translate(26px, -14px)", offset: 0.4 },
    { transform: "translate(-6px, 3px)", offset: 0.75 },
    { transform: "translate(0, 0)" },
  ],
  paper: [
    { transform: "rotate(0)" },
    { transform: "rotate(-5deg) translateY(-6px)" },
    { transform: "rotate(3deg)" },
    { transform: "rotate(-1deg)" },
    { transform: "rotate(0)" },
  ],
};
function bump(e, move) {
  sfx.tap();
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  e.currentTarget.animate(MOVES[move], { duration: 600, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" });
}

/** Objeto decorativo de la mesa: se mueve al tocarlo. */
function Deco({ file, className, move }) {
  return (
    <img
      className={`${styles.deco} ${className}`}
      src={art(file)}
      alt=""
      aria-hidden="true"
      draggable="false"
      onClick={(e) => bump(e, move)}
    />
  );
}

const SWITCHES = [
  { key: "sound", label: "Efectos de sonido" },
  { key: "music", label: "Música" },
  { key: "haptics", label: "Vibración" },
];

/** Interruptor con ON / OFF (ajustes/finalidea): la perilla se corre y el texto queda al otro lado. */
function Switch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
      onClick={() => {
        sfx.select();
        onChange(!checked);
      }}
    >
      <span className={styles.switchText}>{checked ? "ON" : "OFF"}</span>
      <span className={styles.knob} />
    </button>
  );
}

/** Ajustes: tabla de cortar con el panel de sonido y el ritmo de los pedidos, rodeada de utensilios. */
export default function SettingsScreen() {
  const { settings, dispatch, navigate } = useGame();
  const scale = useStageScale();
  const set = (key, value) => dispatch({ type: "setSetting", key, value });
  const pct = Math.round(Math.max(0, Math.min(1, settings.musicVolume)) * 100);

  return (
    <main className={styles.root} style={{ "--s": scale }}>
      {/* utensilios anclados a las esquinas de la pantalla */}
      <Deco file="espatula.svg" className={styles.spatula} move="swing" />
      <Deco file="mantel.svg" className={styles.cloth} move="slide" />
      <Deco file="cuchara.svg" className={styles.spoon} move="swing" />
      <Deco file="pimenton.svg" className={styles.pepper} move="hop" />
      <Deco file="ajíverde.svg" className={styles.greenChili} move="hop" />
      <Deco file="ajírojo.svg" className={styles.redChili} move="hop" />
      <Deco file="oil.svg" className={styles.oil} move="swing" />
      <button className={styles.back} aria-label="Volver al menú" onClick={() => navigate("menu")}>
        <img src="/scenary/common/backbtn.svg" alt="" draggable="false" />
      </button>

      <div className={styles.stage}>
        <img className={styles.board} src={art("mesa de cortar.svg")} alt="" aria-hidden="true" draggable="false" />

        <div className={styles.ribbon}>
          <img src={art("ajustes.svg")} alt="" aria-hidden="true" draggable="false" />
          <h1>Ajustes</h1>
        </div>
        <p className={styles.note}>Los cambios se guardan solos en este dispositivo.</p>

        {/* sonido */}
        <section className={styles.panel} aria-labelledby="ajustes-sonido">
          {SWITCHES.map((s) => (
            <div key={s.key} className={styles.row}>
              <span className={styles.rowLabel}>{s.label}</span>
              <Switch checked={settings[s.key]} label={s.label} onChange={(v) => set(s.key, v)} />
            </div>
          ))}
          <div className={`${styles.row} ${!settings.music ? styles.rowOff : ""}`}>
            <span className={styles.rowLabel}>Volumen música</span>
            <input
              className={styles.range}
              type="range"
              min="0"
              max="100"
              value={pct}
              aria-label="Volumen de la música"
              style={{ "--pct": `${pct}%` }}
              onChange={(e) => set("musicVolume", Number(e.target.value) / 100)}
            />
            <span className={styles.pct}>{pct}%</span>
          </div>
        </section>
        <div className={`${styles.sign} ${styles.signSound}`} onClick={(e) => bump(e, "paper")}>
          <img src={art("cartelito.svg")} alt="" aria-hidden="true" draggable="false" />
          <img className={styles.pin} src={art("pin.svg")} alt="" aria-hidden="true" draggable="false" />
          <h2 id="ajustes-sonido">Sonido</h2>
        </div>

        {/* ritmo de los pedidos */}
        <div className={`${styles.sign} ${styles.signOrders}`} onClick={(e) => bump(e, "paper")}>
          <img src={art("cartelito.svg")} alt="" aria-hidden="true" draggable="false" />
          <img className={styles.pin} src={art("pin.svg")} alt="" aria-hidden="true" draggable="false" />
          <h2 id="ajustes-pedidos">Pedidos</h2>
        </div>
        <div className={styles.seg} role="radiogroup" aria-labelledby="ajustes-pedidos">
          {Object.entries(ORDER_INTERVALS).map(([key, v]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={settings.orderInterval === key}
              className={`${styles.segBtn} ${settings.orderInterval === key ? styles.segOn : ""}`}
              onClick={() => {
                sfx.select();
                set("orderInterval", key);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
