"use client";

export default function OCRPreview() {
  return (
    <div
      style={{
        background:"white",
        borderRadius:20,
        padding:24
      }}
    >
      <h3>OCR Recognition</h3>

      <table style={{width:"100%", marginTop:18}}>
        <tbody>
          <tr>
            <td>NPP</td>
            <td>312</td>
          </tr>
          <tr>
            <td>NDC</td>
            <td>280</td>
          </tr>
          <tr>
            <td>Rejected</td>
            <td>5</td>
          </tr>
          <tr>
            <td>Total</td>
            <td>597</td>
          </tr>
        </tbody>
      </table>

      <p style={{marginTop:18}}>
        Please confirm these values before submission.
      </p>
    </div>
  );
}
