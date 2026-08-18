"use client";

const messages = [
  {
    name:"Regional Coordinator",
    text:"Bono East has reached 92% reporting."
  },
  {
    name:"Polling Agent",
    text:"EC8 uploaded successfully."
  },
  {
    name:"HQ",
    text:"Verification team reviewing submissions."
  }
];

export default function ChatPanel(){
  return(
    <div
      style={{
        background:"white",
        borderRadius:20,
        padding:24,
        display:"flex",
        flexDirection:"column",
        height:"100%"
      }}
    >
      <h3>Live Operations Chat</h3>

      <div style={{flex:1, marginTop:20}}>
        {messages.map((msg,index)=>(
          <div key={index} style={{marginBottom:18}}>
            <strong>{msg.name}</strong>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>

      <input
        placeholder="Type a message..."
        style={{
          padding:14,
          borderRadius:12,
          border:"1px solid #D1D5DB"
        }}
      />
    </div>
  )
}
