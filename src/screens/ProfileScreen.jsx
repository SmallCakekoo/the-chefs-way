import { useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { INGREDIENTS, CHEFS, CLIENTS, ingredientById } from "../game/board.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { evaluate, LOCKED_IMG } from "../game/achievements.js";
import { sfx } from "../lib/sfx.js";
import { useStageScale } from "./menuAssets.js";
import styles from "./ProfileScreen.module.css";

const P = "/scenary/profile/";

// El avatar puede ser un chef (los personajes jugables) o un ingrediente.
const PAGES = [
  { title: "Chefs", items: CHEFS },
  { title: "Ingredientes", items: INGREDIENTS },
];
// (los clientes quedan por si venía guardado un avatar de antes)
const avatarOf = (id) => CHEFS.find((c) => c.id === id) || CLIENTS.find((c) => c.id === id) || ingredientById(id);

/** Perfil (profile/finalidea.svg): libro abierto con pestañas.
 *  Ficha: izquierda personajes (ingredientes / clientes), derecha tu chef.
 *  Logros: izquierda las medallas, derecha el detalle de la elegida. */
export default function ProfileScreen() {
  const { profile, stats, dispatch, navigate } = useGame();
  const scale = useStageScale();
  const [tab, setTab] = useState("perfil");
  const [confirmOut, setConfirmOut] = useState(false);
  const [page, setPage] = useState(() => (INGREDIENTS.some((c) => c.id === profile.characterId) ? 1 : 0));
  const [pick, setPick] = useState(0); // logro elegido (índice)
  const achievements = evaluate(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const patch = (p) => dispatch({ type: "setProfile", patch: p });
  const me = avatarOf(profile.characterId);
  const cur = PAGES[page];
  const ach = achievements[pick];

  const STATS = [
    { k: "Partidas jugadas", v: stats.gamesPlayed },
    { k: "Veces empleado del mes", v: stats.wins },
    { k: "Partidas organizadas", v: stats.gamesHosted },
  ];

  const go = (next) => {
    if (next === tab) return;
    sfx.select();
    setTab(next);
  };
  const flip = (dir) => {
    sfx.select();
    setPage((p) => (p + dir + PAGES.length) % PAGES.length);
  };

  return (
    <main className={styles.root} style={{ "--s": scale }}>
      {/* decoración anclada a las esquinas de la pantalla */}
      <img className={styles.knife} src={P + "bigknife.svg"} alt="" aria-hidden="true" draggable="false" />
      <img className={styles.leaf} src={P + "hoja.svg"} alt="" aria-hidden="true" draggable="false" />
      <button className={styles.back} aria-label="Volver al menú" onClick={() => navigate("menu")}>
        <img src="/scenary/common/backbtn.svg" alt="" draggable="false" />
      </button>

      <div className={styles.stage}>
        <img className={styles.base} src={P + "basebook.svg"} alt="" aria-hidden="true" draggable="false" />
        <img className={styles.pages} src={P + "pages.svg"} alt="" aria-hidden="true" draggable="false" />

        {/* pestañas del libro */}
        <button
          className={`${styles.tab} ${styles.tabProfile} ${tab === "perfil" ? styles.tabOn : ""}`}
          aria-label="Ficha del chef"
          aria-pressed={tab === "perfil"}
          onClick={() => go("perfil")}
        >
          <img src={P + "profile.svg"} alt="" draggable="false" />
        </button>
        <button
          className={`${styles.tab} ${styles.tabBadges} ${tab === "logros" ? styles.tabOn : ""}`}
          aria-label="Logros"
          aria-pressed={tab === "logros"}
          onClick={() => go("logros")}
        >
          <img src={P + "badges.svg"} alt="" draggable="false" />
        </button>
        <button
          className={`${styles.tab} ${styles.tabExit}`}
          aria-label="Cerrar sesión"
          onClick={() => {
            sfx.tap();
            setConfirmOut(true);
          }}
        >
          <img src={P + "exit.svg"} alt="" draggable="false" />
        </button>

        {tab === "perfil" ? (
          <>
            {/* izquierda: personajes */}
            <div key={"l" + page} className={styles.leftPage}>
              <div className={`${styles.label} ${styles.labelL}`}>
                <img src={P + "tab.svg"} alt="" aria-hidden="true" draggable="false" />
                <span>Perfil</span>
              </div>
              <button className={`${styles.flip} ${styles.flipL}`} aria-label="Anterior" onClick={() => flip(-1)}>
                <img src="/scenary/player register/arrow.svg" alt="" draggable="false" />
              </button>
              <button className={`${styles.flip} ${styles.flipR}`} aria-label="Siguiente" onClick={() => flip(1)}>
                <img src="/scenary/player register/arrow.svg" alt="" draggable="false" />
              </button>
              <div className={styles.grid} role="radiogroup" aria-label={`Elige tu personaje: ${cur.title}`}>
                {cur.items.map((c) => {
                  const sel = c.id === profile.characterId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      aria-label={c.name}
                      className={`${styles.slot} ${sel ? styles.sel : ""}`}
                      onClick={() => {
                        if (sel) return;
                        sfx.select();
                        patch({ characterId: c.id });
                      }}
                    >
                      <span className={styles.face} style={{ background: c.tint }}>
                        <img src={c.src} alt="" draggable="false" loading="lazy" />
                      </span>
                      <span className={styles.name}>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* derecha: ficha del chef */}
            <div key="perfil" className={styles.right}>
              <div className={styles.ring}>
                <span className={styles.avatar}>
                  <img key={me.id} src={me.src} alt={me.name} draggable="false" />
                </span>
              </div>
              <input
                className={styles.nameInput}
                value={profile.name}
                maxLength={16}
                aria-label="Tu nombre"
                placeholder="Tu nombre"
                onChange={(e) => patch({ name: e.target.value })}
              />
              <textarea
                className={styles.desc}
                value={profile.description || ""}
                maxLength={90}
                aria-label="Tu descripción"
                placeholder="Aquí una pequeña descripción..."
                onChange={(e) => patch({ description: e.target.value })}
              />
              {STATS.map((s, i) => (
                <div key={s.k} className={styles.stat} style={{ left: [1107, 1245, 1397][i] }}>
                  <b>{s.v}</b>
                  <span>{s.k}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* izquierda: medallas (los cuadros grises son el lugar de las ilustraciones) */}
            <div key="lg" className={styles.leftPage}>
              <div className={`${styles.label} ${styles.labelL}`}>
                <img src={P + "tab.svg"} alt="" aria-hidden="true" draggable="false" />
                <span>Logros</span>
              </div>
              <ul className={styles.medals}>
                {achievements.map((a, i) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={`${styles.medalBtn} ${a.unlocked ? "" : styles.off} ${i === pick ? styles.picked : ""}`}
                      aria-label={a.unlocked ? a.name : `${a.name} (bloqueado)`}
                      aria-pressed={i === pick}
                      onClick={() => {
                        sfx.select();
                        setPick(i);
                      }}
                    >
                      {a.img ? (
                        <img
                          className={styles.pic}
                          src={a.unlocked ? a.img : LOCKED_IMG}
                          alt={`Logro ${a.name}: ${a.desc}${a.unlocked ? "" : " (bloqueado)"}`}
                          draggable="false"
                        />
                      ) : (
                        <span className={styles.ph} title="Falta la imagen de este logro">
                          <b>?</b>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <span className={styles.count} aria-label={`${unlocked} de ${achievements.length} logros`}>
                {unlocked}/{achievements.length}
              </span>
            </div>

            {/* derecha: detalle del logro elegido */}
            <div key={"d" + pick} className={styles.right}>
              <span className={`${styles.big} ${ach.unlocked ? "" : styles.off}`}>
                {ach.img ? (
                  <img
                    className={styles.pic}
                    src={ach.unlocked ? ach.img : LOCKED_IMG}
                    alt={`Logro ${ach.name}: ${ach.desc}${ach.unlocked ? "" : " (bloqueado)"}`}
                    draggable="false"
                  />
                ) : (
                  <span className={styles.ph} title="Falta la imagen de este logro">
                    <b>?</b>
                  </span>
                )}
              </span>
              <p className={styles.aTitle}>{ach.name}</p>
              <p className={styles.aDesc}>
                {ach.desc}
                {ach.scope === "host" && <em>Logro de anfitrión</em>}
              </p>
              <p className={`${styles.aProgress} ${ach.unlocked ? styles.aDone : ""}`}>
                {ach.unlocked ? "¡Desbloqueado!" : `Progreso: ${ach.have} de ${ach.goal}`}
              </p>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOut}
        title="Hasta luego"
        body="Tu perfil, tus ajustes y tus logros quedan guardados en este dispositivo. Volverás a la pantalla de inicio."
        confirmLabel="Salir"
        cancelLabel="Quedarme"
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          dispatch({ type: "logout" });
        }}
      />
    </main>
  );
}
