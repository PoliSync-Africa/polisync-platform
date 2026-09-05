"use client";

import { useEffect, useRef, useState } from "react";

export default function PinkSheetPage() {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setFileName(file.name);
  };

  const handleCameraChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);

    event.target.value = "";
  };

  const handleGalleryChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);

    event.target.value = "";
  };

  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setFileName("");
    setError("");
  };

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111F",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#0F1E33",
          borderRadius: "22px",
          padding: "28px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "30px",
          }}
        >
          📄 Pink Sheet Capture
        </h1>

        <p
          style={{
            color: "#BFD7EA",
            marginBottom: "28px",
            lineHeight: "1.6",
          }}
        >
          Capture or upload an official Electoral Commission Pink Sheet.
        </p>

        {!image ? (
          <>
            <div
              style={{
                border: "2px dashed #4B6B95",
                borderRadius: "18px",
                padding: "42px 20px",
                textAlign: "center",
                background: "#102640",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "52px",
                  marginBottom: "14px",
                }}
              >
                📷
              </div>

              <h3
                style={{
                  marginTop: "0",
                  marginBottom: "10px",
                }}
              >
                Capture Pink Sheet
              </h3>

              <p
                style={{
                  color: "#BFD7EA",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                Take a clear photo of the completed Pink Sheet or select an
                existing image from your phone.
              </p>
            </div>

            {/* Hidden camera input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              style={{ display: "none" }}
            />

            {/* Hidden gallery input */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryChange}
              style={{ display: "none" }}
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "14px",
                border: "none",
                background: "#0A7F5A",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              📷 Open Camera
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "14px",
                border: "1px solid #4B6B95",
                background: "transparent",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🖼️ Upload from Gallery
            </button>

            {error && (
              <p
                style={{
                  color: "#FF6B6B",
                  marginTop: "16px",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                background: "#102640",
                borderRadius: "18px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  color: "#BFD7EA",
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                Pink Sheet Preview
              </p>

              <img
                src={image}
                alt="Pink Sheet preview"
                style={{
                  width: "100%",
                  display: "block",
                  borderRadius: "12px",
                  maxHeight: "600px",
                  objectFit: "contain",
                  background: "#07111F",
                }}
              />

              <p
                style={{
                  color: "#BFD7EA",
                  fontSize: "14px",
                  marginBottom: 0,
                  marginTop: "12px",
                  wordBreak: "break-word",
                }}
              >
                {fileName || "Pink Sheet image"}
              </p>
            </div>

            <button
              type="button"
              onClick={removeImage}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "14px",
                border: "1px solid #B91C1C",
                background: "transparent",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              🔄 Retake / Choose Another
            </button>

            <button
              type="button"
              disabled
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "14px",
                border: "none",
                background: "#0A7F5A",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
            >
              🔍 Process Pink Sheet — Next Step
            </button>
          </>
        )}
      </div>
    </main>
  );
}
