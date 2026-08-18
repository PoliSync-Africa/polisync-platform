
import Logo from "./Logo";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import SocialLoginButtons from "./SocialLoginButtons";
import ThemeSelector from "./ThemeSelector";

export default function LoginCard() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        borderRadius: "24px",
        padding: "32px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.12)"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <Logo />

        <h2
          style={{
            marginTop: "16px",
            marginBottom: "8px",
            fontSize: "28px",
            color: "#1B365D"
          }}
        >
          Welcome Back
        </h2>

        <p style={{ color: "#666" }}>
          Sign in to your PoliSync Africa account
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <InputField label="Email Address" placeholder="Enter your email" />

        <PasswordField />

        <div style={{ textAlign: "right" }}>
          <a
            href="#"
            style={{
              color: "#0A84FF",
              textDecoration: "none",
              fontSize: "14px"
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button
          style={{
            background: "#1B365D",
            color: "#fff",
            border: "none",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Login
        </button>

        <button
          style={{
            background: "#F3F4F6",
            color: "#1B365D",
            border: "1px solid #ddd",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Create Account
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        <SocialLoginButtons />
      </div>

      <div style={{ marginTop: "24px" }}>
        <ThemeSelector />
      </div>

      <p
        style={{
          marginTop: "20px",
          textAlign: "center",
          color: "#888",
          fontSize: "13px"
        }}
      >
        Secure Political Intelligence Platform for Africa
      </p>
    </div>
  );
}        <label>
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
