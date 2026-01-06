import { Sidebar } from "@/src/components/Sidebar";

export default function Products() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Products</h2>
        <p>Create and configure digital products.</p>
      </main>
    </div>
  );
}

