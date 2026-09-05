"use client";

export default function HomeNavigationButton(){
  return <a className="home-nav" href="/" aria-label="Go to PoliSync Africa Home">
    <span className="home-icon" aria-hidden="true">⌂</span>
    <span>Home</span>
    <style jsx>{`.home-nav{position:fixed;top:18px;left:18px;z-index:1400;display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid #c9a227;border-radius:11px;background:#fff;color:#075f2b;text-decoration:none;font-size:11px;font-weight:850;box-shadow:0 6px 18px rgba(7,55,28,.12);transition:transform .15s ease,box-shadow .15s ease}.home-nav:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(7,55,28,.16)}.home-icon{font-size:17px;line-height:1}@media(max-width:760px){.home-nav{top:10px;left:10px;padding:8px 11px;font-size:10px}}`}</style>
  </a>;
}
