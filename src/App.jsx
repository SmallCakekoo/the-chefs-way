import { Suspense, lazy } from "react";
import { GameProvider, useGame } from "./game/GameContext.jsx";
import AppFrame from "./components/AppFrame.jsx";

import LoginScreen from "./screens/LoginScreen.jsx";
import MenuScreen from "./screens/MenuScreen.jsx";
const RegisterScreen = lazy(() => import("./screens/RegisterScreen.jsx"));
const TurnScreen = lazy(() => import("./screens/TurnScreen.jsx"));
const FinaleScreen = lazy(() => import("./screens/FinaleScreen.jsx"));
const ResultsScreen = lazy(() => import("./screens/ResultsScreen.jsx"));
const DevRefScreen = lazy(() => import("./screens/DevRefScreen.jsx"));
const ProfileScreen = lazy(() => import("./screens/ProfileScreen.jsx"));
const SettingsScreen = lazy(() => import("./screens/SettingsScreen.jsx"));

const SCREENS = {
  login: LoginScreen,
  menu: MenuScreen,
  register: RegisterScreen,
  turn: TurnScreen,
  finale: FinaleScreen,
  results: ResultsScreen,
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
  // El menú es un montaje a pantalla completa, sin el marco de tablet.
  if (["menu", "login", "turn", "finale", "results", "profile", "settings"].includes(route)) {
    return (
      <Suspense fallback={null}>
        <Active key={key} />
      </Suspense>
    );
  }
  return (
    <AppFrame>
      <Suspense fallback={null}>
        <Active key={key} />
      </Suspense>
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
