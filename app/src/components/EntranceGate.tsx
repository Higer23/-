import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";
type TurnstileApi = { render:(container:HTMLElement,options:{sitekey:string;theme:"dark";callback:(token:string)=>void;"error-callback":()=>void;"expired-callback":()=>void})=>string; remove:(id:string)=>void };
declare global { interface Window { turnstile?: TurnstileApi } }
export default function EntranceGate({children}:{children:ReactNode}) {
 const mountRef=useRef<HTMLDivElement>(null); const [verified,setVerified]=useState(false); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!CONFIG.turnstileSiteKey||!CONFIG.turnstileVerifyUrl||!mountRef.current){setVerified(true);return;}
  let widgetId:string|undefined,cancelled=false;
  const mount=()=>{if(cancelled||!mountRef.current||!window.turnstile)return;widgetId=window.turnstile.render(mountRef.current,{sitekey:CONFIG.turnstileSiteKey,theme:"dark",callback:async(token)=>{
   setBusy(true);setError("");try{const r=await fetch(CONFIG.turnstileVerifyUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});const data=await r.json() as {success?:boolean};if(!r.ok||!data.success)throw new Error("Verification failed");if(!cancelled)setVerified(true);}catch{if(!cancelled)setError("Robot kontrolü doğrulanamadı. İnternet bağlantını kontrol edip tekrar dene.");}finally{if(!cancelled)setBusy(false);}
  },"error-callback":()=>setError("Cloudflare kontrolü yüklenemedi. Sayfayı yenileyip tekrar dene."),"expired-callback":()=>setError("Doğrulama süresi doldu. Lütfen tekrar doğrula.")});};
  if(window.turnstile)mount();else{const existing=document.querySelector<HTMLScriptElement>('script[data-turnstile-api="true"]');if(existing)existing.addEventListener("load",mount,{once:true});else{const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;s.defer=true;s.dataset.turnstileApi="true";s.addEventListener("load",mount,{once:true});s.addEventListener("error",()=>setError("Cloudflare kontrolü yüklenemedi."),{once:true});document.head.appendChild(s);}}
  return()=>{cancelled=true;if(widgetId&&window.turnstile)window.turnstile.remove(widgetId);};
 },[]);
 if(verified)return <>{children}</>;
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#030407",color:"#f2eee5",fontFamily:"Inter,system-ui,sans-serif",padding:24}}><section style={{width:"min(100%,420px)",textAlign:"center",padding:28,border:"1px solid #282a2e",borderRadius:20,background:"#090a0d"}}><p style={{color:"#e7a15c",letterSpacing:".18em",fontSize:11,textTransform:"uppercase"}}>HIGER23 · GÜVENLİ GİRİŞ</p><h1 style={{fontSize:26,margin:"12px 0"}}>Robot olmadığını doğrula</h1><p style={{color:"#a9a5bd",lineHeight:1.6}}>Siteye devam etmeden önce Cloudflare güvenlik kontrolünü tamamla.</p><div ref={mountRef} style={{display:"flex",justifyContent:"center",margin:"24px 0"}}/>{busy&&<p role="status">Doğrulama kontrol ediliyor…</p>}{error&&<p role="alert" style={{color:"#ffb3a7"}}>{error}</p>}</section></main>;
}
