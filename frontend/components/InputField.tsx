
type InputFieldProps = {
  label: string;
  placeholder: string;
};

export default function InputField({
  label,
  placeholder
}: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#1B365D"
        }}
      >
        {label}
      </label>

      <input
        type="email"
        placeholder={placeholder}
        style={{
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #D1D5DB",
          fontSize: "15px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}
