import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { SocialPostsConnect } from "@/src/components/SocialPostsConnect";

export default async function SocialPosts() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.userId as string | undefined;
  const member = userId ? await prisma.memberProfile.findUnique({ where: { userId } }) : null;
  const posts = member ? await prisma.scheduledPost.findMany({ where: { socialAccount: { memberId: member.id } }, include: { socialAccount: true }, orderBy: { scheduledAt: "asc" } }) : [];
  const statusCounts = member ? await prisma.scheduledPost.groupBy({ by: ["status"], _count: { _all: true }, where: { socialAccount: { memberId: member.id } } }) : [];
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Social Posts</h2>
        {userId && <SocialPostsConnect userId={userId} />}

        <section>
          <h3>Status</h3>
          <ul>
            {statusCounts.map((s) => (
              <li key={s.status}>{s.status}: {s._count._all}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Scheduled</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Platform</th>
                <th style={{ textAlign: "left" }}>Title</th>
                <th style={{ textAlign: "left" }}>Scheduled At</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left" }}>Attempts</th>
                <th style={{ textAlign: "left" }}>Last Error</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.socialAccount.platform}</td>
                  <td>{p.title || "(untitled)"}</td>
                  <td>{new Date(p.scheduledAt).toLocaleString()}</td>
                  <td>{p.status}</td>
                  <td>{p.attemptCount}/{p.maxAttempts}</td>
                  <td>{p.lastError || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
