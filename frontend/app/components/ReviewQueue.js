"use client";

const queue = [
  {station:"BE-TEC-014", score:52},
  {station:"BE-TEC-018", score:68},
  {station:"BE-TEC-027", score:74},
  {station:"BE-TEC-033", score:96}
];

export default function ReviewQueue(){
  return(
    <div
      style={{
        background:"white",
        borderRadius:20,
        padding:24
      }}
    >
      <h3>Investigation Queue</h3>

      <table style={{width:"100%", marginTop:18}}>
        <thead>
          <tr>
            <th align="left">Station</th>
            <th align="left">Score</th>
          </tr>
        </thead>

        <tbody>
          {queue.map(item=>(
            <tr key={item.station}>
              <td>{item.station}</td>
              <td>{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
