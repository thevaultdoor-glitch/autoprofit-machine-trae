"use client";
import { useState } from "react";

export default function Chatbot() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  return (
    <main style={{ padding: 24 }}>
      <h2>AI Assistant</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question" />
        <button
          onClick={async () => {
            const res = await fetch("/api/chatbot", { method: "POST", body: JSON.stringify({ question: q }) });
            const data = await res.json();
            setA(data.answer || data.error || "");
          }}
        >Ask</button>
        <div>{a}</div>
      </div>
    </main>
  );
}

