const PersonalWorkspaceProfile = require("../models/PersonalWorkspaceProfile");
const ResearchResource = require("../models/ResearchResource");

const DEFINITIONS = {
  personal_use: { label:"Personal / Civic User", description:"Explore public political and electoral information for personal civic use.", accessProfile:"public_read", permissions:["view_public_data","explore_electoral_geography","view_results","view_candidates","save_items","use_ai_analyzer"] },
  researcher: { label:"Researcher", description:"Conduct structured political, electoral and civic research using public datasets and documented sources.", accessProfile:"research_read", permissions:["view_public_data","explore_electoral_geography","view_results","view_candidates","compare_regions","save_research","export_public_data","use_ai_analyzer"] },
  journalist: { label:"Journalist", description:"Investigate, verify and report on public political and electoral developments, including newsroom-style research and editorial workflows.", accessProfile:"journalist_read", permissions:["view_public_data","explore_electoral_geography","view_results","view_candidates","source_verification","fact_check","press_calendar","newsroom","editorial_calendar","use_ai_analyzer"] },
};

const DEFAULT_RESOURCES = [
  ["electoral-geography","Electoral Geography Explorer","electoral_geography","Navigate Ghana's regions, constituencies and polling stations.",["personal_use","researcher","journalist"],"public",["browse","filter","compare"],"/personal"],
  ["election-results","Election Results Explorer","election_results","Explore permitted public election results by election and geography.",["personal_use","researcher","journalist"],"public",["filter","compare","visualize"],"/elections"],
  ["candidate-directory","Candidate Directory","candidates","Review public candidate profiles, party affiliation and constituency context.",["personal_use","researcher","journalist"],"public",["search","compare","save"],"/personal"],
  ["party-directory","Political Party Directory","parties","Review public party information and election participation.",["personal_use","researcher","journalist"],"public",["search","compare"],"/personal"],
  ["research-datasets","Research Dataset Library","research_data","Structured public datasets for political and electoral research.",["researcher"],"research",["preview","filter","export"],"/personal"],
  ["source-library","Source & Provenance Library","public_records","Record source, date, methodology and provenance for research or reporting.",["researcher","journalist"],"research",["save","cite","verify"],"/personal"],
  ["methodology","Methodology & Data Dictionary","methodology","Definitions, field descriptions, update cycles and data-quality notes.",["researcher","journalist"],"public",["read","cite"],"/personal"],
  ["fact-check","Fact Checking Desk","fact_checking","Compare public claims with available records and evidence.",["journalist"],"journalist",["compare","document","cite"],"/personal"],
  ["press-calendar","Election & Press Calendar","calendar","Election events, public deadlines and press-facing dates.",["journalist"],"public",["view","save","plan"],"/calendar"],
  ["newsroom","Newsroom Workspace","newsroom","Personal newsroom-style assignments, coverage planning and evidence collection for journalists.",["journalist"],"journalist",["create","assign","track"],"/personal"],
  ["data-export","Public Data Export","research_data","Export permitted public datasets for analysis and citation.",["researcher","journalist"],"research",["export","filter"],"/personal"],
  ["geographic-comparison","Geographic Comparison Lab","electoral_geography","Compare public political indicators across regions and constituencies.",["researcher","journalist"],"research",["compare","visualize"],"/personal"],
];

async function ensureResourceCatalog() {
  for (const [key,title,category,description,audience,access,actions,route] of DEFAULT_RESOURCES) {
    await ResearchResource.updateOne({ key }, { $setOnInsert:{ key,title,category,description,audience,access,actions,route,isActive:true } }, { upsert:true });
  }
}

function userId(req) { return req.user?._id || req.user?.id; }
exports.definitions = async (req,res) => res.json({success:true,data:DEFINITIONS});
exports.getProfile = async (req,res) => { const profile=await PersonalWorkspaceProfile.findOne({userId:userId(req)}).lean(); return res.json({success:true,data:profile||null,definitions:DEFINITIONS}); };
exports.upsertProfile = async (req,res) => {
  const {purpose,scopeLevel,regionIds,constituencyIds,pollingStationIds,researchFields,journalismBeat}=req.body||{};
  const definition=DEFINITIONS[purpose];
  if(!definition)return res.status(400).json({success:false,message:"Invalid personal workspace purpose. Choose Personal Use, Researcher or Journalist."});
  const profile=await PersonalWorkspaceProfile.findOneAndUpdate({userId:userId(req)},{$set:{purpose,scopeLevel:scopeLevel||"public_platform",regionIds:Array.isArray(regionIds)?regionIds:[],constituencyIds:Array.isArray(constituencyIds)?constituencyIds:[],pollingStationIds:Array.isArray(pollingStationIds)?pollingStationIds:[],organizationName:"",researchFields:Array.isArray(researchFields)?researchFields:[],journalismBeat:String(journalismBeat||"").trim(),accessProfile:definition.accessProfile,permissions:definition.permissions,onboardingComplete:true}},{upsert:true,new:true,setDefaultsOnInsert:true});
  return res.json({success:true,data:profile,role:definition});
};
exports.resources = async (req,res) => { await ensureResourceCatalog(); const profile=await PersonalWorkspaceProfile.findOne({userId:userId(req)}).lean(); const purpose=profile?.purpose||"personal_use"; const resources=await ResearchResource.find({isActive:true,audience:purpose}).sort({category:1,title:1}).lean(); return res.json({success:true,data:resources,purpose,role:DEFINITIONS[purpose]}); };
exports.resourceCatalog = async (req,res) => { await ensureResourceCatalog(); const resources=await ResearchResource.find({isActive:true}).sort({category:1,title:1}).lean(); return res.json({success:true,data:resources}); };
exports.roleDefinitions=DEFINITIONS;
