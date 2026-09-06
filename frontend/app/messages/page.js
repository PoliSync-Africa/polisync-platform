"use client";
import MessagesPanel from "../../components/dashboard/MessagesPanel";

export default function MessagesPage() {
  return <main className="communicationsPage">
    <div className="communicationsWrap"><MessagesPanel /></div>
    <style jsx>{`
      .communicationsPage{min-height:100vh;box-sizing:border-box;padding:24px;background:#F3F5F7;overflow-x:hidden}
      .communicationsWrap{width:100%;max-width:1100px;margin:0 auto}
      @media(max-width:640px){.communicationsPage{padding:10px}.communicationsWrap{width:100%}}
      @media(min-width:641px) and (max-width:1024px){.communicationsPage{padding:18px}.communicationsWrap{max-width:960px}}
    `}</style>
  </main>;
}
