import { useGame } from "../game/GameContext.jsx";

/** Marca "The Chef's Way". Sartén negra en claro, sartén blanca en oscuro. */
export default function Logo({ className = "" }) {
  const { settings } = useGame();
  const src = settings.theme === "dark" ? "/white%20logo.png" : "/logo.png";
  return <img className={className} src={src} alt="The Chef's Way" />;
}
