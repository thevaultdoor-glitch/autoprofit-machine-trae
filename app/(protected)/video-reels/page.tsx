import { Sidebar } from "@/src/components/Sidebar";

export default function VideoReels() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Video Reel Generator</h2>
        <p>Generate 10 script variations with timestamps and CTAs.</p>
      </main>
    </div>
  );
}

