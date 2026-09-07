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
  const { nextOrderAt, pendingOrders, settings } = useGame();
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
        <span className={styles.time}>{left <= 0 ? "¡ya!" : mmss(left)}</span>
        <span className={styles.cadence}>· {cadence}</span>
      </span>

      {pending > 0 && (
        <span className={styles.action}>
          {pending === 1 ? "1 pedido" : `${pending} en cola`}
        </span>
      )}
    </div>
  );
}
