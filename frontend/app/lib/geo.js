export async function getPollingStations(constituencyCode) {

  const res = await fetch(
    `/api/geo/polling-stations/${constituencyCode}`
  );

  return res.json();

}
