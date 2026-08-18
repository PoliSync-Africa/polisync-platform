"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SupportBubble from "../components/SupportBubble";
import CameraCapture from "../components/CameraCapture";
import OCRPreview from "../components/OCRPreview";
import GPSStatus from "../components/GPSStatus";
import ValidationCard from "../components/ValidationCard";

export default function SubmitResultPage() {
  return (
    <div style={{display:"flex", background:"#EEF2F7"}}>
      <Sidebar/>

      <div style={{flex:1}}>
        <Topbar/>

        <div style={{padding:30}}>
          <h1 style={{color:"#0B3D2E"}}>
            Smart EC8 Capture
          </h1>

          <p>Capture, verify and securely submit official polling station results.</p>

          <div
            style={{
              display:"grid",
              gridTemplateColumns:"1.3fr 1fr",
              gap:24,
              marginTop:30
            }}
          >
            <CameraCapture/>

            <GPSStatus/>
          </div>

          <div
            style={{
              display:"grid",
              gridTemplateColumns:"1fr 1fr",
              gap:24,
              marginTop:24
            }}
          >
            <OCRPreview/>

            <ValidationCard/>
          </div>

          <button
            style={{
              marginTop:30,
              padding:"18px 36px",
              background:"#D4AF37",
              color:"#082C24",
              border:"none",
              borderRadius:14,
              fontWeight:"bold",
              fontSize:18
            }}
          >
            Submit Official Result
          </button>
        </div>

        <SupportBubble/>
      </div>
    </div>
  );
}
