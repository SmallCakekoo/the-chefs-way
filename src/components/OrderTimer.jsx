import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext.jsx";
import { ORDER_INTERVALS } from "../game/orders.js";
import styles from "./OrderTimer.module.css";

function mmss(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Barra del timer de pedidos en la pantalla de turno.
 *  Muestra cuánto falta para el próximo pedido y los que están pendientes. */
export default function OrderTimer() {
  const { nextOrderAt, pendingOrders, orders, coins, settings } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!nextOrderAt) return null;

  const left = nextOrderAt - now;
  const cadence = (ORDER_INTERVALS[settings.orderInterval] || ORDER_INTERVALS.normal)
    .label;
  const pending = pendingOrders.length;
  // el reloj de "proximo pedido" se pausa mientras alguien arma el memory
  const paused = orders.some(
    (o) => o.status === "pending" && !o.finale && o.prepUntil > now
  );
  const lowFunds = coins <= 30;

  return (
    <div className={styles.bar}>
      <span className={styles.clock}>
        <svg className={styles.bell} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 20a2 2 0 0 0 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.label}>Próximo pedido</span>
        <span className={styles.time}>
          {paused ? "en pausa" : left <= 0 ? "¡ya!" : mmss(left)}
        </span>
        <span className={styles.cadence}>· {cadence}</span>
      </span>

      <span className={styles.right}>
        {pending > 0 && (
          <span className={styles.action}>
            {pending === 1 ? "1 pedido" : `${pending} pedidos`}
          </span>
        )}
        <span
          className={`${styles.coins} ${lowFunds ? styles.coinsLow : ""}`}
          title="Moneditas del restaurante"
        >
          <svg className={styles.coin} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 8.3v7.4M9.9 15c.3.7 1.1 1.1 2.1 1.1 1.4 0 2.3-.7 2.3-1.7 0-1.1-1-1.4-2.3-1.7-1.3-.3-2.3-.7-2.3-1.7 0-1 .9-1.7 2.3-1.7 1 0 1.8.4 2.1 1.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {coins}
        </span>
      </span>
    </div>
  );
}
