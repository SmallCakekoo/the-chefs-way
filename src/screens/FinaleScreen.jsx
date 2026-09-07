import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import Ribbon from "../components/Ribbon.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { BodyText } from "../components/Text.jsx";
import styles from "./FinaleScreen.module.css";

export default function FinaleScreen() {
  const { orders, finishOrder } = useGame();
  const finaleOrder = orders.find((o) => o.id === "finale");
  const first = finishOrder[0];

  return (
    <Screen layout="flow">
      <Ribbon tone="primary">Súper pedido final</Ribbon>

      <BodyText align="left" className={styles.intro}>
        {first ? <><strong>{first}</strong> llegó a FIN. </> : null}
        Ahora la mesa entera cocina un último plato juntos. Repártanse los
        ingredientes, ármenlo y marquen el checklist para cerrar el servicio.
      </BodyText>

      {finaleOrder ? (
        <OrderCard order={finaleOrder} defaultOpen />
      ) : (
        <BodyText align="left">Preparando el súper pedido…</BodyText>
      )}
    </Screen>
  );
}
