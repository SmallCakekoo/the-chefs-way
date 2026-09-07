import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import Ribbon from "../components/Ribbon.jsx";
import RulesBook from "../components/RulesBook.jsx";
import CharacterAvatar from "../components/CharacterAvatar.jsx";
import styles from "./RulesScreen.module.css";

const CASILLAS = [
  { tint: "teal", label: "Objeto positivo", text: "Roba de la pila de AYUDA y tira el dado de color." },
  { tint: "ink", label: "Objeto negativo", text: "Crédito negativo: roba de SABOTAJE y tira el dado de color." },
  { tint: "yellow", label: "Evento", text: "La app lanza un evento para toda la mesa." },
  { tint: "orange", label: "Casilla libre", text: "Las casillas naranja no hacen nada. Pasa el dispositivo." },
];

export default function RulesScreen() {
  const { navigate } = useGame();
  return (
    <Screen onBack={() => navigate("menu")} layout="flow">
      <Ribbon tone="yellow">Cómo se juega</Ribbon>

      <div className={styles.cols}>
        <section className={styles.col}>
          <h2 className={styles.colTitle}>Cómo funciona</h2>
          <RulesBook />
        </section>

        <section className={styles.col}>
          <h2 className={styles.colTitle}>En el tablero</h2>
          <div className={styles.casillas}>
            {CASILLAS.map((c) => (
              <div key={c.label} className={`${styles.cas} ${styles["t_" + c.tint]}`}>
                <span className={styles.dot} />
                <span className={styles.casText}>
                  <span className={styles.casLabel}>{c.label}</span>
                  <span className={styles.casBody}>{c.text}</span>
                </span>
              </div>
            ))}
          </div>

          <div className={styles.pedidos}>
            <span className={styles.pedidosArt}>
              <CharacterAvatar id="taco" size="md" shape="round" />
            </span>
            <span className={styles.pedidosText}>
              <span className={styles.pedidosLabel}>Pedidos</span>
              <span className={styles.pedidosBody}>
                Cada cierto tiempo un gato pide un plato. A quien le toque lo arma
                con el memory de la mesa y los demás revisan el checklist. La
                cadencia se ajusta en Ajustes.
              </span>
            </span>
          </div>

          <button className={styles.devLink} onClick={() => navigate("devref")}>
            Referencia (dev): eventos, logros, insignias…
          </button>
        </section>
      </div>
    </Screen>
  );
}
