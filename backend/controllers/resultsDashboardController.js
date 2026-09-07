const Result = require("../models/Result");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const id = v => String(v || "").trim();

function addCandidateTotals(target, candidates = []) {
  for (const c of candidates) { const key = c.candidateName || c.candidateId; if (key) target[key] = (target[key] || 0) + Number(c.manualVotes || 0); }
}
function addPartyTotals(target, candidates = []) {
  for (const c of candidates) { const key = String(c.party || "Other Parties").trim() || "Other Parties"; target[key] = (target[key] || 0) + Number(c.manualVotes || 0); }
}
function pct(value, total) { return total ? Math.round((Number(value) / Number(total)) * 100) : 0; }

exports.dashboard = async (req, res) => {
  try {
    const organizationId = id(req.query.organizationId), electionId = id(req.query.electionId), electionType = id(req.query.electionType);
    const regionId = id(req.query.regionId), constituencyId = id(req.query.constituencyId), pollingStationId = id(req.query.pollingStationId), view = id(req.query.view) || "national";
    const electionFilter = {};
    if (electionId && electionId !== "all") electionFilter._id = electionId;
    if (electionType && electionType !== "all") electionFilter.type = electionType;
    const elections = await Election.find(electionFilter).select("name year type country status parties candidates").sort({ year: -1, createdAt: -1 }).lean();
    const electionFilterWasSpecified = (electionId && electionId !== "all") || (electionType && electionType !== "all");
    const electionIds = elections.map(e => e._id);

    const resultMatch = {};
    if (organizationId && organizationId !== "all") resultMatch.organizationId = organizationId;
    if (electionFilterWasSpecified) resultMatch.electionId = { $in: electionIds };
    if (regionId && regionId !== "all") resultMatch.regionId = regionId;
    if (constituencyId && constituencyId !== "all") resultMatch.constituencyId = constituencyId;
    if (pollingStationId && pollingStationId !== "all") resultMatch.pollingStationId = pollingStationId;
    if (req.user.role === "polling_station_agent") resultMatch.submittedBy = req.user._id;
    const results = await Result.find(resultMatch).lean();

    const national = {}, partyVotes = {}, regionTotals = new Map(), constituencyTotals = new Map(), stationTotals = new Map(), historyMap = new Map();
    let validVotes = 0, submittedStations = 0, pending = 0, verified = 0, discrepancy = 0, rejected = 0;
    const constituencyPartyVotes = new Map();
    for (const result of results) {
      submittedStations++; validVotes += Number(result.manualTotals?.totalValidVotes || 0);
      if (result.verificationStatus === "verified") verified++; else if (["discrepancy", "disputed"].includes(result.verificationStatus)) discrepancy++; else if (result.verificationStatus === "rejected") rejected++; else pending++;
      addCandidateTotals(national, result.candidateResults); addPartyTotals(partyVotes, result.candidateResults);
      const rKey = id(result.regionId); const cKey = id(result.constituencyId); const sKey = id(result.pollingStationId);
      if (rKey) { if (!regionTotals.has(rKey)) regionTotals.set(rKey, { id:rKey, submitted:0, validVotes:0, candidates:{}, parties:{} }); const x=regionTotals.get(rKey); x.submitted++; x.validVotes+=Number(result.manualTotals?.totalValidVotes||0); addCandidateTotals(x.candidates,result.candidateResults); addPartyTotals(x.parties,result.candidateResults); }
      if (cKey) { if (!constituencyTotals.has(cKey)) constituencyTotals.set(cKey,{id:cKey,regionId:rKey,submitted:0,validVotes:0,candidates:{},parties:{}}); const x=constituencyTotals.get(cKey); x.submitted++; x.validVotes+=Number(result.manualTotals?.totalValidVotes||0); addCandidateTotals(x.candidates,result.candidateResults); addPartyTotals(x.parties,result.candidateResults); }
      if (sKey) { if (!stationTotals.has(sKey)) stationTotals.set(sKey,{id:sKey,constituencyId:cKey,regionId:rKey,submitted:0,validVotes:0,candidates:{},parties:{}}); const x=stationTotals.get(sKey); x.submitted++; x.validVotes+=Number(result.manualTotals?.totalValidVotes||0); addCandidateTotals(x.candidates,result.candidateResults); addPartyTotals(x.parties,result.candidateResults); }
      if (cKey) { const byElection = id(result.electionId); if (!constituencyPartyVotes.has(cKey)) constituencyPartyVotes.set(cKey,new Map()); const byParty=constituencyPartyVotes.get(cKey); for(const c of result.candidateResults||[]){const p=String(c.party||"Other Parties").trim()||"Other Parties"; byParty.set(p,(byParty.get(p)||0)+Number(c.manualVotes||0));} }
      const hk=`${id(result.organizationId)||"unassigned"}:${id(result.electionId)}`; if(!historyMap.has(hk)) historyMap.set(hk,{organizationId:id(result.organizationId)||null,electionId:id(result.electionId),submittedStations:0,validVotes:0,pending:0,verified:0,discrepancy:0,rejected:0,candidates:{},lastSubmittedAt:result.updatedAt||result.createdAt||null}); const h=historyMap.get(hk); h.submittedStations++; h.validVotes+=Number(result.manualTotals?.totalValidVotes||0); if(result.verificationStatus==="verified")h.verified++;else if(["discrepancy","disputed"].includes(result.verificationStatus))h.discrepancy++;else if(result.verificationStatus==="rejected")h.rejected++;else h.pending++; addCandidateTotals(h.candidates,result.candidateResults); if(result.updatedAt&&(!h.lastSubmittedAt||new Date(result.updatedAt)>new Date(h.lastSubmittedAt)))h.lastSubmittedAt=result.updatedAt;
    }

    const [organizations, regions, constituencies, pollingStations] = await Promise.all([
      Organization.find({}).select("name organizationType politicalPartyName organizationStatus").sort({name:1}).lean(),
      Region.find({isActive:true}).select("name regionNumber country latitude longitude").sort({regionNumber:1,name:1}).lean(),
      Constituency.find({isActive:true}).select("name constituencyNumber district regionId latitude longitude").populate("regionId","name regionNumber").sort({regionId:1,constituencyNumber:1,name:1}).lean(),
      PollingStation.find({isActive:true}).select("name pollingStationCode district stationType regionId constituencyId latitude longitude").populate("regionId","name regionNumber").populate("constituencyId","name constituencyNumber").sort({pollingStationCode:1,name:1}).lean()
    ]);

    // Coverage is based on the official active EC geography, not merely submitted results.
    const stationScope = { isActive:true }; if(regionId&&regionId!=="all")stationScope.regionId=regionId; if(constituencyId&&constituencyId!=="all")stationScope.constituencyId=constituencyId;
    const scopedStations = await PollingStation.find(stationScope).select("_id regionId constituencyId").lean();
    const receivedSet = new Set(results.map(r=>id(r.pollingStationId)).filter(Boolean));
    const coverage = { national:{totalPollingStations:await PollingStation.countDocuments({isActive:true}),received:0,awaitingPending:0,totalConstituencies:constituencies.length,totalRegions:regions.length},regions:[],constituencies:[] };
    const allActiveStations = await PollingStation.find({isActive:true}).select("_id regionId constituencyId").lean();
    const countCoverage = items => { const total=new Map(),received=new Map(); for(const s of allActiveStations){const k=id(s[items]); if(k){total.set(k,(total.get(k)||0)+1);if(receivedSet.has(id(s._id)))received.set(k,(received.get(k)||0)+1);}} return {total,received}; };
    const rc=countCoverage("regionId"), cc=countCoverage("constituencyId");
    coverage.national.received=receivedSet.size; coverage.national.awaitingPending=Math.max(coverage.national.totalPollingStations-coverage.national.received,0);
    coverage.national.receivedConstituencies=new Set(results.map(r=>id(r.constituencyId)).filter(Boolean)).size; coverage.national.awaitingPendingConstituencies=Math.max(coverage.national.totalConstituencies-coverage.national.receivedConstituencies,0);
    coverage.national.receivedRegions=new Set(results.map(r=>id(r.regionId)).filter(Boolean)).size; coverage.national.awaitingPendingRegions=Math.max(coverage.national.totalRegions-coverage.national.receivedRegions,0);
    coverage.regions=regions.map(r=>{const k=id(r._id),t=rc.total.get(k)||0,rec=rc.received.get(k)||0;return {...r,totalPollingStations:t,received:rec,awaitingPending:Math.max(t-rec,0),totalConstituencies:constituencies.filter(c=>id(c.regionId?._id||c.regionId)===k).length,receivedConstituencies:new Set(results.filter(x=>id(x.regionId)===k).map(x=>id(x.constituencyId)).filter(Boolean)).size};});
    coverage.regions=coverage.regions.map(r=>({...r,awaitingPendingConstituencies:Math.max(r.totalConstituencies-r.receivedConstituencies,0)}));
    coverage.constituencies=constituencies.map(c=>{const k=id(c._id),t=cc.total.get(k)||0,rec=cc.received.get(k)||0;return {...c,totalPollingStations:t,received:rec,awaitingPending:Math.max(t-rec,0)};});

    const partySeatSummary={}; for(const [,byParty] of constituencyPartyVotes){const winner=Array.from(byParty.entries()).sort((a,b)=>b[1]-a[1])[0];if(winner)partySeatSummary[winner[0]]=(partySeatSummary[winner[0]]||0)+1;}
    const organizationMap=new Map(organizations.map(o=>[id(o._id),o]));
    const history=Array.from(historyMap.values()).map(x=>({...x,organization:x.organizationId?organizationMap.get(x.organizationId)||null:null,election:elections.find(e=>id(e._id)===x.electionId)||null})).sort((a,b)=>new Date(b.lastSubmittedAt||0)-new Date(a.lastSubmittedAt||0));
    const decorate=(items,totals)=>items.map(item=>{const t=totals.get(id(item._id))||{};return {...item,submitted:t.submitted||0,validVotes:t.validVotes||0,candidates:t.candidates||{},parties:t.parties||{}};});
    const selectedRegion=regionId&&regionId!=="all"?regions.find(r=>id(r._id)===regionId)||null:null;
    const selectedConstituency=constituencyId&&constituencyId!=="all"?constituencies.find(c=>id(c._id)===constituencyId)||null:null;
    const selectedStation=pollingStationId&&pollingStationId!=="all"?pollingStations.find(s=>id(s._id)===pollingStationId)||null:null;
    const selectedRegionCoverage=selectedRegion?coverage.regions.find(r=>id(r._id)===regionId)||null:null;
    const selectedConstituencyCoverage=selectedConstituency?coverage.constituencies.find(c=>id(c._id)===constituencyId)||null:null;
    const partyTotalVotes=Object.values(partyVotes).reduce((a,b)=>a+b,0);
    const presidentialSummary=Object.entries(partyVotes).map(([party,votes])=>({party,votes,percentage:pct(votes,partyTotalVotes)})).sort((a,b)=>b.votes-a.votes);

    res.json({success:true,source:"PoliSync EC electoral geography",filters:{organizations,elections,electionTypes:await Election.distinct("type"),regions,constitituencies:constituencies,constituencies,pollingStations},selection:{view,organizationId:organizationId||"all",electionId:electionId||"all",electionType:electionType||"all",regionId:regionId||"all",constituencyId:constituencyId||"all",pollingStationId:pollingStationId||"all"},selected:{region:selectedRegion,constituency:selectedConstituency,pollingStation:selectedStation},summary:{submittedStations,validVotes,pending,verified,discrepancy,rejected},coverage, presidentialSummary, parliamentarySummary:{seatsByParty:partySeatSummary,totalConstituencies:coverage.national.totalConstituencies},national,history,regional:decorate(regions,regionTotals),constituency:decorate(constituencies,constituencyTotals),pollingStation:decorate(pollingStations,stationTotals)});
  } catch(error){ console.error("dynamic results dashboard:",error); res.status(500).json({success:false,message:error.message}); }
};
