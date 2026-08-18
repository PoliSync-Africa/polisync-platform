"use client";

export default function CameraCapture() {
  return (
    <div
      style={{
        background:"#082C24",
        color:"white",
        borderRadius:24,
        padding:24,
        textAlign:"center"
      }}
    >
      <div
        style={{
          height:260,
          border:"3px dashed #D4AF37",
          borderRadius:20,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          fontSize:64
        }}
      >
        📷
      </div>

      <h3 style={{marginTop:20}}>Capture EC8 Form</h3>

      <button
        style={{
          marginTop:18,
          padding:"14px 28px",
          background:"#D4AF37",
          color:"#082C24",
          border:"none",
          borderRadius:12,
          fontWeight:"bold"
        }}
      >
        Open Camera
      </button>
    </div>
  );
}
