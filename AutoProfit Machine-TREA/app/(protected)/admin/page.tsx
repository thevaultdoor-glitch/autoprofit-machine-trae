import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

async function getData() {
  const members = await prisma.memberProfile.findMany({
    include: { user: true, products: true },
    orderBy: { createdAt: "desc" },
  });
  const revenue = await prisma.revenueShare.findMany({
    include: { order: { include: { product: { include: { member: true } } } } },
  });
  let totalAdmin = 0;
  let totalMember = 0;
  const byMember: Record<string, number> = {};
  for (const r of revenue) {
    totalAdmin += r.adminShareCents;
    totalMember += r.memberShareCents;
    const mid = r.order.product.memberId;
    byMember[mid] = (byMember[mid] || 0) + r.memberShareCents;
  }
  const topMembers = Object.entries(byMember)
    .map(([memberId, cents]) => ({ memberId, cents }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 10);
  const jobsPending = await prisma.researchJob.count({ where: { status: "PENDING" } });
  const jobsFailed = await prisma.researchJob.count({ where: { status: "FAILED" } });
  const postsDue = await prisma.scheduledPost.count({ where: { status: "PENDING", scheduledAt: { lte: new Date() } } });
  return { members, totalAdmin, totalMember, topMembers, jobsPending, jobsFailed, postsDue };
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions as any);
  const role = (session as any)?.role;
  const data = await getData();
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Admin Panel</h2>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ border: "1px solid #eee", padding: 12 }}>
            <div>Total Platform Revenue</div>
            <div>${(data.totalAdmin / 100).toFixed(2)}</div>
          </div>
          <div style={{ border: "1px solid #eee", padding: 12 }}>
            <div>Total Member Revenue</div>
            <div>${(data.totalMember / 100).toFixed(2)}</div>
          </div>
          <div style={{ border: "1px solid #eee", padding: 12 }}>
            <div>System Health</div>
            <div>Jobs pending: {data.jobsPending}</div>
            <div>Jobs failed: {data.jobsFailed}</div>
            <div>Posts due: {data.postsDue}</div>
          </div>
        </section>

        <section>
          <h3>Top Performing Members</h3>
          <ul>
            {data.topMembers.map((t) => {
              const m = data.members.find((mm) => mm.id === t.memberId);
              return (
                <li key={t.memberId}>
                  {(m?.workspaceName || m?.user.email) as any} — ${(t.cents / 100).toFixed(2)}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3>Members</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Email</th>
                <th style={{ textAlign: "left" }}>Approved</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left" }}>Plan</th>
                <th style={{ textAlign: "left" }}>Revenue Share %</th>
                <th style={{ textAlign: "left" }}>Stripe Cust</th>
                <th style={{ textAlign: "left" }}>Stripe Sub</th>
                <th style={{ textAlign: "left" }}>Connect Acc</th>
                <th style={{ textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.email}</td>
                  <td>{m.approved ? "Yes" : "No"}</td>
                  <td>{m.user.status}</td>
                  <td>{m.plan || "-"}</td>
                  <td>{m.revenueSharePercent}</td>
                  <td>{m.stripeCustomerId || "-"}</td>
                  <td>{m.stripeSubscriptionId || "-"}</td>
                  <td>{m.stripeConnectAccountId || "-"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <ApproveForm id={m.id} approved={!m.approved} />
                    <StatusForm id={m.userId} status={m.user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                    <ShareForm id={m.id} percent={m.revenueSharePercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

async function approveMember(id: string, approved: boolean) {
  await prisma.memberProfile.update({ where: { id }, data: { approved } });
}

async function setStatus(userId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
  await prisma.user.update({ where: { id: userId }, data: { status } });
}

async function setShare(id: string, percent: number) {
  await prisma.memberProfile.update({ where: { id }, data: { revenueSharePercent: percent } });
}

function ApproveForm({ id, approved }: { id: string; approved: boolean }) {
  async function action() {
    "use server";
    await approveMember(id, approved);
  }
  return (
    <form action={action}>
      <button type="submit">{approved ? "Approve" : "Revoke"}</button>
    </form>
  );
}

function StatusForm({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" | "BANNED" }) {
  async function action() {
    "use server";
    await setStatus(id, status);
  }
  return (
    <form action={action}>
      <button type="submit">Set {status}</button>
    </form>
  );
}

function ShareForm({ id, percent }: { id: string; percent: number }) {
  async function action(formData: FormData) {
    "use server";
    const p = Number(formData.get("percent"));
    if (!Number.isNaN(p) && p >= 0 && p <= 100) await setShare(id, p);
  }
  return (
    <form action={action} style={{ display: "flex", gap: 4 }}>
      <input name="percent" type="number" min={0} max={100} defaultValue={percent} />
      <button type="submit">Save</button>
    </form>
  );
}

