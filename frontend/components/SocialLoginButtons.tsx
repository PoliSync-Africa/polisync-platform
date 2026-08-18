export default function SocialLoginButtons() {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <button
        style={{
          padding: "14px",
          borderRadius: "10px",
          border: "1px solid #ccc"
        }}
      >
        Continue with Google
      </button>

      <button
        style={{
          padding: "14px",
          borderRadius: "10px",
          border: "1px solid #ccc"
        }}
      >
        Continue with Apple
      </button>
    </div>
  );
}
