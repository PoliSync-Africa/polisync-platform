import Logo from "./Logo";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import SocialLoginButtons from "./SocialLoginButtons";
import ThemeSelector from "./ThemeSelector";

export default function LoginCard() {
  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "40px auto",
        padding: "24px",
        borderRadius: "20px",
        border: "1px solid #ddd",
        background: "#fff"
      }}
    >
      <Logo />

      <InputField
        label="Email"
        placeholder="Enter your email"
        type="email"
      />

      <PasswordField />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          fontSize: "14px"
        }}
      >
        <label>
          <input type="checkbox" /> Remember Me
        </label>

        <a href="#">Forgot Password?</a>
      </div>

      <button
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "10px",
          background: "#0A2540",
          color: "#fff",
          border: "none",
          fontWeight: "bold",
          marginBottom: "18px"
        }}
      >
        Login
      </button>

      <SocialLoginButtons />

      <hr style={{ margin: "24px 0" }} />

      <ThemeSelector />
    </div>
  );
}
