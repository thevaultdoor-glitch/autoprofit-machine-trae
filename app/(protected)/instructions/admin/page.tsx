import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export default async function AdminGuides() {
  const session = await getServerSession(authOptions as any);
  const role = (session as any)?.role;
  const adminGuides = await prisma.publicGuide.findMany({ where: { role: "ADMIN", published: true }, orderBy: { updatedAt: "desc" } });
  const memberGuides = await prisma.publicGuide.findMany({ where: { role: "MEMBER", published: true }, orderBy: { updatedAt: "desc" } });
  const memberTutorials = await prisma.tutorial.findMany({ where: { role: "MEMBER", published: true }, orderBy: { updatedAt: "desc" } });

  async function createGuide(formData: FormData) {
    "use server";
    const title = String(formData.get("title"));
    const roleSel = String(formData.get("role")) as "ADMIN" | "MEMBER";
    const content = String(formData.get("content"));
    await prisma.publicGuide.create({ data: { title, role: roleSel, content, published: true } });
  }

  async function createTutorial(formData: FormData) {
    "use server";
    const title = String(formData.get("title"));
    const roleSel = String(formData.get("role")) as "MEMBER" | "ADMIN";
    const videoUrl = String(formData.get("videoUrl"));
    const description = String(formData.get("description") || "");
    await prisma.tutorial.create({ data: { title, role: roleSel, videoUrl, description, published: true } });
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Training Content</h2>
        {role !== "ADMIN" ? (
          <p>Access restricted.</p>
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
              <div>
                <h3>Create Guide</h3>
                <form action={createGuide} style={{ display: "grid", gap: 8 }}>
                  <input name="title" placeholder="Title" />
                  <select name="role" defaultValue="MEMBER">
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <textarea name="content" placeholder="HTML content" rows={6} />
                  <button type="submit">Publish Guide</button>
                </form>
              </div>
              <div>
                <h3>Create Tutorial</h3>
                <form action={createTutorial} style={{ display: "grid", gap: 8 }}>
                  <input name="title" placeholder="Title" />
                  <select name="role" defaultValue="MEMBER">
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <input name="videoUrl" placeholder="YouTube or MP4 URL" />
                  <textarea name="description" placeholder="Description" rows={4} />
                  <button type="submit">Publish Tutorial</button>
                </form>
              </div>
            </section>
            <section>
              <h3>Admin Guides</h3>
              <ul>
                {adminGuides.map((g) => (
                  <li key={g.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                    <h4>{g.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: g.content }} />
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Member Guides</h3>
              <ul>
                {memberGuides.map((g) => (
                  <li key={g.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                    <h4>{g.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: g.content }} />
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Member Tutorials</h3>
              <ul>
                {memberTutorials.map((t) => (
                  <li key={t.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                    <h4>{t.title}</h4>
                    {t.description && <p>{t.description}</p>}
                    <iframe title={t.title} src={(t.videoUrl.includes("youtube.com") || t.videoUrl.includes("youtu.be")) ? (t.videoUrl.includes("youtu.be/") ? `https://www.youtube.com/embed/${t.videoUrl.split("youtu.be/")[1].split("?")[0]}` : `https://www.youtube.com/embed/${new URL(t.videoUrl).searchParams.get("v")}`) : t.videoUrl} style={{ width: "100%", height: 360 }} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
