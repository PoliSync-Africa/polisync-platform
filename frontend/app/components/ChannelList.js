"use client";

const channels = [
  "🇬🇭 Ghana HQ",
  "📍 Bono East",
  "🏛 Techiman South",
  "🗳 Polling Agents",
  "🚨 Emergency"
];

export default function ChannelList(){
  return(
    <div
      style={{
        background:"#082C24",
        color:"white",
        borderRadius:20,
        padding:20,
        height:"100%"
      }}
    >
      <h3 style={{color:"#D4AF37"}}>Channels</h3>

      {channels.map(channel=>(
        <div
          key={channel}
          style={{
            padding:"12px",
            borderRadius:10,
            marginTop:10,
            cursor:"pointer"
          }}
        >
          {channel}
        </div>
      ))}
    </div>
  )
}
