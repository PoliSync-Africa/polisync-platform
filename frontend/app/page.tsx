import LoginCard from "../components/LoginCard";
import WeatherWidget from "../app/components/WeatherWidget";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "32px",
        padding: "24px",
        background: "#0f172a",
        flexWrap: "wrap",
      }}
    >
      <LoginCard />
      <WeatherWidget />
    </main>
  );
}
