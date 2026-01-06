import { Sidebar } from "@/src/components/Sidebar";

export default function AdCreator() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Ad Creator</h2>
        <p>Generate social ads, headlines, hooks, and CTAs.</p>
      </main>
    </div>
  );
}

