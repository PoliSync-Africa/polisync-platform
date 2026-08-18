"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SupportBubble from "../components/SupportBubble";
import TrustScoreCard from "../components/TrustScoreCard";
import EvidenceTimeline from "../components/EvidenceTimeline";
import FraudAlertCard from "../components/FraudAlertCard";
import ReviewQueue from "../components/ReviewQueue";

export default function IntegrityPage(){
  return(
    <div style={{display:"flex", background:"#EEF2F7"}}>
      <Sidebar/>

      <div style={{flex:1}}>
        <Topbar/>

        <div style={{padding:30}}>
          <h1 style={{color:"#0B3D2E"}}>
            Integrity Center
          </h1>

          <p>Automatic verification and investigation dashboard.</p>

          <div
            style={{
              display:"grid",
              gridTemplateColumns:"1fr 1.2fr",
              gap:24,
              marginTop:30
            }}
          >
            <TrustScoreCard score={98}/>

            <EvidenceTimeline/>
          </div>

          <div
            style={{
              display:"grid",
              gap:20,
              marginTop:30
            }}
          >
            <FraudAlertCard
              title="Duplicate Submission Detected"
              level="Critical"
              message="Two submissions received for BE-TEC-014."
            />

            <FraudAlertCard
              title="GPS Mismatch"
              level="Warning"
              message="Submission location differs from assigned polling station."
            />
          </div>

          <div style={{marginTop:30}}>
            <ReviewQueue/>
          </div>
        </div>

        <SupportBubble/>
      </div>
    </div>
  )
}
