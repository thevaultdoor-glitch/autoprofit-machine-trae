import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export default async function Campaigns() {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.userId as string | undefined;
  const member = userId ? await prisma.memberProfile.findUnique({ where: { userId } }) : null;
  const campaigns = member ? await prisma.campaign.findMany({ where: { memberId: member.id }, orderBy: { createdAt: "desc" } }) : [];

  async function create(formData: FormData) {
    "use server";
    const name = String(formData.get("name"));
    const niche = String(formData.get("niche"));
    const dailyInstagram = Number(formData.get("dailyInstagram"));
    const dailyTikTok = Number(formData.get("dailyTikTok"));
    const dailyYouTube = Number(formData.get("dailyYouTube"));
    if (!userId) return;
    const res = await fetch(`${process.env.APP_URL}/api/campaigns/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, niche, dailyInstagram, dailyTikTok, dailyYouTube }),
    });
    await res.json();
  }

  async function toggle(campaignId: string, status: "ACTIVE" | "PAUSED") {
    "use server";
    await fetch(`${process.env.APP_URL}/api/campaigns/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, status }),
    });
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Campaigns</h2>
        <section>
          <h3>Create Campaign</h3>
          <form action={create} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
            <input name="name" placeholder="Name" />
            <input name="niche" placeholder="Niche" />
            <input name="dailyInstagram" type="number" defaultValue={3} min={0} max={20} />
            <input name="dailyTikTok" type="number" defaultValue={3} min={0} max={20} />
            <input name="dailyYouTube" type="number" defaultValue={1} min={0} max={10} />
            <button type="submit">Create</button>
          </form>
        </section>

        <section>
          <h3>Your Campaigns</h3>
          <ul>
            {campaigns.map((c) => (
              <li key={c.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                <div>{c.name} — {c.niche} — {c.status}</div>
                <div>IG {c.dailyInstagram}/day, TT {c.dailyTikTok}/day, YT {c.dailyYouTube}/day</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <form action={async () => toggle(c.id, c.status === "ACTIVE" ? "PAUSED" : "ACTIVE") }>
                    <button type="submit">{c.status === "ACTIVE" ? "Pause" : "Resume"}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

