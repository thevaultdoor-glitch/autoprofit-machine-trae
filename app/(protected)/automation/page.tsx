import { Sidebar } from "@/src/components/Sidebar";

export default function Automation() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Automation</h2>
        <p>Master control panel to toggle automation pipelines.</p>
      </main>
    </div>
  );
}

