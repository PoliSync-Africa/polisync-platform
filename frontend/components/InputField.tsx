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
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "600"
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
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "16px"
        }}
      />
    </div>
  );
}
