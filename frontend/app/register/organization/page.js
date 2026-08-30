"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("account");
  const [accountType, setAccountType] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [existingAccount, setExistingAccount] = useState("");
  const [observerMode, setObserverMode] = useState("");
  const [party, setParty] = useState("");
  const [region, setRegion] = useState("");
  const [constituency, setConstituency] = useState("");
  const [electionMode, setElectionMode] = useState("");
  const [electionId, setElectionId] = useState("");
  const [observerName, setObserverName] = useState("");
  const [form, setForm] = useState({ firstName:"", middleName:"", lastName:"", dateOfBirth:"", nationality:"Ghanaian", identificationType:"", identificationNumber:"", email:"", phone:"", password:"", confirmPassword:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailOtpSuccess, setEmailOtpSuccess] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailResendLoading, setEmailResendLoading] = useState(false);

  const politicalParties = ["NPP","NDC","CPP","LPG","GUM","PNC","PPP","The Base Movement","The New Force","UP (Movement For Change)","GFP","Independent"];
  const regions = ["Ahafo","Ashanti","Bono","Bono East","Central","Eastern","Greater Accra","North East","Northern","Oti","Savannah","Upper East","Upper West","Volta","Western","Western North"];
  const constituencies = [];
  const update = (field,value) => setForm((p)=>({...p,[field]:value}));
  const normalizePhone = (raw) => { let v=String(raw||"").trim().replace(/\s+/g,""); if(/^0\d{9}$/.test(v))v="+233"+v.slice(1); if(/^233\d{9}$/.test(v))v="+"+v; return v; };

  function chooseOrganizationType(type){ setError(""); setOrganizationType(type); if(type==="political-party")setStep("party"); else if(type==="presidential-candidate")setStep("presidential"); else if(type==="parliamentary-candidate")setStep("parliamentary"); else setStep("observer"); }
  function validatePassword(){ if(form.password.length<8){setError("Password must contain at least 8 characters.");return false;} if(form.password!==form.confirmPassword){setError("Passwords do not match.");return false;} return true; }
  function validatePersonal(){ const fields=["firstName","lastName","dateOfBirth","nationality","identificationType","identificationNumber","email","phone","password","confirmPassword"]; if(fields.some((f)=>!String(form[f]||"").trim())){setError("Please complete all required fields.");return false;} if(!validatePassword())return false; return true; }
  async function submitRegistration(additionalData={}){
    if(!validatePersonal())return;
    setLoading(true);setError("");
    try{const api=(process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,""); if(!api)throw new Error("Production API URL is not configured."); const payload={...form, ...additionalData}; const r=await fetch(`${api}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)}); const d=await r.json().catch(()=>({})); if(!r.ok||!d.success)throw new Error(d.message||"Registration failed."); setRegisteredPhone(normalizePhone(form.phone));setSuccess(d.message||"Account created.");setStep("verify-phone");}catch(e){setError(e.message||"Registration failed.");}finally{setLoading(false);}
  }
  async function verifyPhone(e){e.preventDefault();setOtpError("");setOtpLoading(true);try{const api=(process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");const r=await fetch(`${api}/api/auth/verify-phone`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:registeredPhone,code:otpCode.trim()})});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.message||"Verification failed.");setOtpSuccess("Phone verified. Check your email to complete verification.");}catch(e){setOtpError(e.message||"Verification failed.");}finally{setOtpLoading(false);}}
  async function resendPhone(){setResendLoading(true);try{const api=(process.env.NEXT_PUBLIC_API_URL||"").replace(/\/+$/,"");const r=await fetch(`${api}/api/auth/resend-phone-verification`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:registeredPhone})});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.message||"Unable to resend code.");setOtpSuccess(d.message||"Code resent.");}catch(e){setOtpError(e.message||"Unable to resend code.");}finally{setResendLoading(false);}}

  return <main style={page}><div style={card}><Image src="/IMG_9654.jpeg" alt="PoliSync Africa" width={280} height={180} style={{width:280,height:"auto",maxWidth:"100%",objectFit:"contain",display:"block",margin:"0 auto"}} />
    {step==="account"&&<><h1 style={title}>Organization / Candidate Registration</h1><p style={subtitle}>Select the organizational path you need.</p><div style={list}><Link href="/register/personal" style={choice}><strong>Personal Account</strong><span>Choose Personal Use, Researcher, Journalist or Media House.</span></Link><button style={choice} onClick={()=>setStep("organization")}><strong>Organizational Account</strong><span>Political parties, candidates and observer organizations.</span></button></div></>}
    {step==="organization"&&<><Back onClick={()=>setStep("account")}/><h1 style={title}>Organizational Account</h1><p style={subtitle}>Choose the organization type.</p><div style={list}>{[["political-party","Political Party"],["presidential-candidate","Presidential Candidate"],["parliamentary-candidate","Parliamentary Candidate"],["observer","Observer Organization"]].map(([v,t])=><button key={v} style={choice} onClick={()=>chooseOrganizationType(v)}><strong>{t}</strong><span>Continue with the approved PoliSync registration workflow.</span></button>)}</div></>}
    {step==="party"&&<SimpleOrg title="Political Party" back={()=>setStep("organization")} text="Political party registration is subject to PoliSync Africa verification. A certified party administrator creates the party and automatically becomes its national party administrator." />}
    {step==="presidential"&&<><Back onClick={()=>setStep("organization")}/><h1 style={title}>Presidential Candidate</h1><p style={subtitle}>Candidate account setup.</p><div style={formBox}><select style={input} value={party} onChange={e=>setParty(e.target.value)}><option value="">Select Political Party</option>{politicalParties.map(p=><option key={p}>{p}</option>)}</select><button style={primary} onClick={()=>setStep("presidential-personal")}>Continue</button></div></>}
    {step==="presidential-personal"&&<PersonalForm form={form} update={update} submit={()=>submitRegistration({registrationType:"presidential_candidate",candidateParty:party})} loading={loading} back={()=>setStep("presidential")} />}
    {step==="parliamentary"&&<><Back onClick={()=>setStep("organization")}/><h1 style={title}>Parliamentary Candidate</h1><p style={subtitle}>Select party, region and constituency.</p><div style={formBox}><select style={input} value={party} onChange={e=>setParty(e.target.value)}><option value="">Select Political Party</option>{politicalParties.map(p=><option key={p}>{p}</option>)}</select><select style={input} value={region} onChange={e=>setRegion(e.target.value)}><option value="">Select Region</option>{regions.map(r=><option key={r}>{r}</option>)}</select><select style={input} value={constituency} onChange={e=>setConstituency(e.target.value)} disabled><option value="">Constituency will load from electoral geography</option>{constituencies.map(c=><option key={c}>{c}</option>)}</select><button style={primary} disabled={!party||!region} onClick={()=>setStep("parliamentary-personal")}>Continue</button></div></>}
    {step==="parliamentary-personal"&&<PersonalForm form={form} update={update} submit={()=>submitRegistration({registrationType:"parliamentary_candidate",candidateParty:party,region,constituency})} loading={loading} back={()=>setStep("parliamentary")} />}
    {step==="observer"&&<SimpleOrg title="Observer Organization" back={()=>setStep("organization")} text="Join or create an approved observer organization through the organization onboarding workflow." />}
    {step==="verify-phone"&&<><h1 style={title}>Verify Phone</h1><p style={subtitle}>Enter the SMS code sent to {registeredPhone}.</p><form onSubmit={verifyPhone} style={formBox}><input style={input} value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="Verification code"/><button style={primary} disabled={otpLoading}>{otpLoading?"Verifying...":"Verify Phone"}</button><button type="button" style={linkButton} onClick={resendPhone} disabled={resendLoading}>{resendLoading?"Resending...":"Resend Code"}</button></form></>}
    {error&&<div style={errorBox}>{error}</div>}{success&&<div style={successBox}>{success}</div>}
    <p style={{textAlign:"center",fontSize:12,color:"#6f7a73",marginTop:20}}>Already have an account? <Link href="/login" style={{color:"#075f2b",fontWeight:800}}>Sign in</Link></p>
  </div></main>;
}

function PersonalForm({form,update,submit,loading,back}){const fields=[['firstName','First name'],['middleName','Middle name'],['lastName','Last name'],['dateOfBirth','Date of birth'],['nationality','Nationality'],['identificationNumber','Identification number'],['email','Email'],['phone','Phone (+233...)'],['password','Password'],['confirmPassword','Confirm password']];return <><Back onClick={back}/><h1 style={title}>Personal Information</h1><div style={formBox}>{fields.map(([k,l])=><input key={k} style={input} placeholder={l} type={k.includes('password')?'password':k==='email'?'email':k==='dateOfBirth'?'date':'text'} value={form[k]} onChange={e=>update(k,e.target.value)}/>)}<select style={input} value={form.identificationType} onChange={e=>update('identificationType',e.target.value)}><option value="">Identification type</option><option value="ghana_card">Ghana Card</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option></select><button style={primary} onClick={submit} disabled={loading}>{loading?'Creating...':'Create Account'}</button></div></>}
function SimpleOrg({title:t,back,text}){return <><Back onClick={back}/><h1 style={title}>{t}</h1><p style={subtitle}>{text}</p><div style={successBox}>Organization onboarding is protected by PoliSync verification and role-based permissions.</div></>}
function Back({onClick}){return <button onClick={onClick} style={backButton}>← Back</button>}
const page={minHeight:'100vh',padding:'28px 16px',background:'linear-gradient(135deg,#f8faf8,#eef7f0)',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'Arial,sans-serif'};
const card={width:'100%',maxWidth:720,background:'#fff',borderRadius:26,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,.08)',border:'1px solid #dce6df',boxSizing:'border-box'};
const title={textAlign:'center',color:'#075f2b',fontSize:27,margin:'8px 0'};
const subtitle={textAlign:'center',color:'#6e7871',fontSize:14,lineHeight:1.6,margin:'0 0 20px'};
const list={display:'grid',gap:12};
const choice={display:'flex',flexDirection:'column',gap:6,textDecoration:'none',textAlign:'left',padding:18,borderRadius:16,border:'1px solid #dce6df',background:'#fff',color:'#25332b',cursor:'pointer',fontSize:14};
const formBox={display:'grid',gap:11};
const input={width:'100%',boxSizing:'border-box',padding:'13px 14px',border:'1px solid #d5e0d8',borderRadius:10,background:'#fbfdfb',fontSize:14};
const primary={width:'100%',padding:14,border:0,borderRadius:11,background:'#075f2b',color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer'};
const backButton={border:0,background:'transparent',color:'#075f2b',fontWeight:800,cursor:'pointer',padding:0};
const linkButton={border:0,background:'transparent',color:'#075f2b',fontWeight:800,padding:8};
const errorBox={marginTop:14,padding:12,borderRadius:10,background:'#fff2f2',border:'1px solid #efcaca',color:'#a00000',fontSize:12};
const successBox={marginTop:14,padding:12,borderRadius:10,background:'#ecfdf3',border:'1px solid #b7dfc5',color:'#08733a',fontSize:12,lineHeight:1.5};
