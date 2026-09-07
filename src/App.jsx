import { GameProvider, useGame } from "./game/GameContext.jsx";
import AppFrame from "./components/AppFrame.jsx";

import LoginScreen from "./screens/LoginScreen.jsx";
import MenuScreen from "./screens/MenuScreen.jsx";
import OnboardingScreen from "./screens/OnboardingScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import TurnScreen from "./screens/TurnScreen.jsx";
import FinaleScreen from "./screens/FinaleScreen.jsx";
import ResultsScreen from "./screens/ResultsScreen.jsx";
import RulesScreen from "./screens/RulesScreen.jsx";
import DevRefScreen from "./screens/DevRefScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";

const SCREENS = {
  login: LoginScreen,
  menu: MenuScreen,
  onboarding: OnboardingScreen,
  register: RegisterScreen,
  turn: TurnScreen,
  finale: FinaleScreen,
  results: ResultsScreen,
  rules: RulesScreen,
  devref: DevRefScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
};

function Router() {
  const { route, turnNo } = useGame();
  const Active = SCREENS[route] || LoginScreen;
  // La pantalla de turno se remonta cada turno (turnNo) para resetear su
  // estado local aunque le toque al mismo jugador.
  const key = route === "turn" ? `turn-${turnNo}` : route;
  return (
    <AppFrame>
      <Active key={key} />
    </AppFrame>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  );
}
