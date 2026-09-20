import { useGame } from "../game/GameContext.jsx";
import ChefScene from "./ChefScene.jsx";

/** Pedido del Chef Maestro (el pedido estrella): el clímax de la partida. Ver ChefScene y game/chef.js. */
export default function FinaleScreen() {
  const { chef, chefStartedAt } = useGame();
  return (
    <main style={{ position: "fixed", inset: 0, background: "#fff2ec" }}>
      {chef && <ChefScene key={`${chef.attempt}-${chefStartedAt}`} />}
    </main>
  );
}
