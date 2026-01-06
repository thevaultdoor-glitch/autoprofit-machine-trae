import { Sidebar } from "@/src/components/Sidebar";

export default function Store() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Store</h2>
        <p>Manage products and sales.</p>
      </main>
    </div>
  );
}

