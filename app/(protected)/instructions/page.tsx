import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";

function Video({ url, title }: { url: string; title: string }) {
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  if (isYouTube) {
    const id = url.includes("youtu.be/") ? url.split("youtu.be/")[1].split("?")[0] : new URL(url).searchParams.get("v") || "";
    const src = `https://www.youtube.com/embed/${id}`;
    return <iframe title={title} src={src} style={{ width: "100%", height: 360 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  return <video controls src={url} style={{ width: "100%" }} />;
}

export default async function Instructions() {
  const guides = await prisma.publicGuide.findMany({ where: { role: "MEMBER", published: true }, orderBy: { updatedAt: "desc" } });
  const tutorials = await prisma.tutorial.findMany({ where: { role: "MEMBER", published: true }, orderBy: { updatedAt: "desc" } });
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Member Training</h2>
        <section>
          <h3>Written Guides</h3>
          <ul>
            {guides.map((g) => (
              <li key={g.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                <h4>{g.title}</h4>
                <div dangerouslySetInnerHTML={{ __html: g.content }} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Video Tutorials</h3>
          <ul style={{ display: "grid", gap: 16 }}>
            {tutorials.map((t) => (
              <li key={t.id} style={{ border: "1px solid #eee", padding: 12 }}>
                <h4>{t.title}</h4>
                {t.description && <p>{t.description}</p>}
                <Video url={t.videoUrl} title={t.title} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
