import { Sidebar } from "@/src/components/Sidebar";

export default function Funnels() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Funnels</h2>
        <p>Build and analyze funnels.</p>
      </main>
    </div>
  );
}

