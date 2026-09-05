type InputFieldProps = {
  label: string;
  placeholder: string;
  type?: string;
};

export default function InputField({
  label,
  placeholder,
  type = "text",
}: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#374151",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #D1D5DB",
          fontSize: "16px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
