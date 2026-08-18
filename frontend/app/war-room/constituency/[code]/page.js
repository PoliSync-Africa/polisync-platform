"use client";

import { useEffect, useState } from "react";

export default function ConstituencyPage({ params }) {

  const [stations, setStations] = useState([]);

  useEffect(() => {

    fetch(`/api/geo/polling-stations/${params.code}`)
      .then(res => res.json())
      .then(data => setStations(data.data || []));

  }, [params.code]);

  return (
    <main style={{ padding: 30 }}>

      <h1>{params.code}</h1>

      {stations.map(station => (

        <div key={station.code}>

          {station.code} — {station.name}

        </div>

      ))}

    </main>
  );

}
