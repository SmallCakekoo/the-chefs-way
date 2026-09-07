import { useGame } from "../game/GameContext.jsx";
import Screen from "../components/Screen.jsx";
import Button from "../components/Button.jsx";
import Logo from "../components/Logo.jsx";
import { BodyText } from "../components/Text.jsx";
import styles from "./LoginScreen.module.css";

export default function LoginScreen() {
  const { navigate, seenOnboarding } = useGame();
  const enter = () => navigate(seenOnboarding ? "menu" : "onboarding");

  return (
    <Screen bare layout="single">
      <Logo className={styles.logo} />

      <BodyText className={styles.tagline}>
        El companion del juego de mesa cooperativo de cocina. Un dispositivo, por
        turnos.
      </BodyText>

      <Button variant="primary" wide className={styles.cta} onClick={enter} sound="press">
        Entrar como invitado
      </Button>
    </Screen>
  );
}
