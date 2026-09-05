"use client";

export default function TrustScoreCard({ score = 98 }) {
  const color =
    score >= 90 ? "#16A34A" :
    score >= 70 ? "#F59E0B" :
    "#DC2626";

  return (
    <div
      style={{
        background:"white",
        borderRadius:22,
        padding:28,
        textAlign:"center"
      }}
    >
      <h3 style={{color:"#0B3D2E"}}>Trust Score</h3>

      <div
        style={{
          width:150,
          height:150,
          margin:"20px auto",
          borderRadius:"50%",
          background:`conic-gradient(${color} ${score*3.6}deg,#E5E7EB 0deg)`,
          display:"flex",
          justifyContent:"center",
          alignItems:"center"
        }}
      >
        <div
          style={{
            width:112,
            height:112,
            borderRadius:"50%",
            background:"white",
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            fontSize:32,
            fontWeight:"bold",
            color
          }}
        >
          {score}
        </div>
      </div>

      <p>Confidence level based on automated verification.</p>
    </div>
  );
}
