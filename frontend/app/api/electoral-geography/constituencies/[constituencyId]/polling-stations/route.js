const API_DEFAULT="https://polisync-platform-1.onrender.com";
const API_BASES=[process.env.NEXT_PUBLIC_API_URL,process.env.BACKEND_URL,API_DEFAULT].map((value)=>String(value||"").replace(/\/+$/,"" )).filter((value,index,array)=>value&&array.indexOf(value)===index);

async function fetchStations(base, constituencyId, search, authorization){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try{
    return await fetch(`${base}/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations${search}`,{method:"GET",headers:{Accept:"application/json",...(authorization?{Authorization:authorization}:{})},cache:"no-store",signal:controller.signal});
  }finally{clearTimeout(timeout)}
}

export async function GET(request,{params}){
  try{
    const {constituencyId}=await params;
    if(!constituencyId) return Response.json({success:false,message:"Constituency ID is required."},{status:400});
    const incoming=new URL(request.url);
    const authorization=request.headers.get("authorization")||"";
    let lastError=null;
    for(const base of API_BASES){
      for(let attempt=0;attempt<3;attempt++){
        try{
          const response=await fetchStations(base,constituencyId,incoming.search,authorization);
          const text=await response.text();
          let payload={};
          try{payload=text?JSON.parse(text):{}}catch{payload={success:false,message:text||"Unable to load polling stations."}}
          if(response.ok||response.status<500) return Response.json(payload,{status:response.status,headers:{"Cache-Control":"no-store, max-age=0"}});
          lastError=new Error(payload.message||`Polling station service returned ${response.status}.`);
        }catch(error){lastError=error}
        await new Promise((resolve)=>setTimeout(resolve,700*(attempt+1)));
      }
    }
    return Response.json({success:false,code:"POLLING_STATIONS_UNAVAILABLE",message:lastError?.name==="AbortError"?"Polling station service timed out. Please try again.":"Polling station service is temporarily unavailable. Please try again."},{status:502,headers:{"Cache-Control":"no-store, max-age=0"}});
  }catch(error){
    return Response.json({success:false,message:error?.message||"Unable to connect to the polling stations service."},{status:502,headers:{"Cache-Control":"no-store, max-age=0"}});
  }
}
