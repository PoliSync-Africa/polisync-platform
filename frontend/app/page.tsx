import LoginCard from "../components/LoginCard";
import WeatherWidget from "../components/WeatherWidget";
import GhanaMap from "../components/GhanaMap";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "24px",
        gap: "24px",
      }}
    >
      <LoginCard />
      <WeatherWidget />
      <GhanaMap />
    </main>
  );
}
