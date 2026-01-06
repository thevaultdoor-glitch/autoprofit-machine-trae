import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function getMemberMetrics(memberId: string) {
  const today = startOfToday();
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);

  const [revToday, rev7, rev30, salesToday, sales7, sales30] = await Promise.all([
    prisma.order.aggregate({ _sum: { amountCents: true }, where: { product: { memberId }, createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { amountCents: true }, where: { product: { memberId }, createdAt: { gte: last7 } } }),
    prisma.order.aggregate({ _sum: { amountCents: true }, where: { product: { memberId }, createdAt: { gte: last30 } } }),
    prisma.order.count({ where: { product: { memberId }, createdAt: { gte: today } } }),
    prisma.order.count({ where: { product: { memberId }, createdAt: { gte: last7 } } }),
    prisma.order.count({ where: { product: { memberId }, createdAt: { gte: last30 } } }),
  ]);

  const grouped = await prisma.order.groupBy({
    by: ["productId"],
    _count: { _all: true },
    where: { product: { memberId }, createdAt: { gte: last30 } },
    orderBy: { _count: { _all: "desc" } },
    take: 5,
  });
  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const funnel = grouped.map((g) => ({
    productId: g.productId,
    title: products.find((p) => p.id === g.productId)?.title || g.productId,
    count: g._count._all,
  }));

  const [views7, clicks7, views30, clicks30] = await Promise.all([
    prisma.trackingEvent.count({ where: { memberId, type: "VIDEO_VIEW", createdAt: { gte: last7 } } }),
    prisma.trackingEvent.count({ where: { memberId, type: "CLICK", createdAt: { gte: last7 } } }),
    prisma.trackingEvent.count({ where: { memberId, type: "VIDEO_VIEW", createdAt: { gte: last30 } } }),
    prisma.trackingEvent.count({ where: { memberId, type: "CLICK", createdAt: { gte: last30 } } }),
  ]);

  const automation = await prisma.automationSetting.upsert({
    where: { memberId },
    create: { memberId },
    update: {},
  });

  return {
    revenue: {
      today: revToday._sum.amountCents || 0,
      last7: rev7._sum.amountCents || 0,
      last30: rev30._sum.amountCents || 0,
    },
    sales: { today: salesToday, last7: sales7, last30: sales30 },
    funnel,
    views: { last7: views7, last30: views30 },
    clicks: { last7: clicks7, last30: clicks30 },
    automation,
  };
}

async function getAdminMetrics() {
  const today = startOfToday();
  const last7 = daysAgo(7);
  const last30 = daysAgo(30);
  const [adminRev30, memberRev30, jobsPending, jobsFailed, postsDue] = await Promise.all([
    prisma.revenueShare.aggregate({ _sum: { adminShareCents: true }, where: { computedAt: { gte: last30 } } }),
    prisma.revenueShare.aggregate({ _sum: { memberShareCents: true }, where: { computedAt: { gte: last30 } } }),
    prisma.researchJob.count({ where: { status: "PENDING" } }),
    prisma.researchJob.count({ where: { status: "FAILED" } }),
    prisma.scheduledPost.count({ where: { status: "PENDING", scheduledAt: { lte: new Date() } } }),
  ]);
  return {
    adminRev30: adminRev30._sum.adminShareCents || 0,
    memberRev30: memberRev30._sum.memberShareCents || 0,
    jobsPending,
    jobsFailed,
    postsDue,
  };
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions as any);
  const role = (session as any)?.role;
  const userId = (session as any)?.userId as string | undefined;

  let metrics: any = null;
  let admin: any = null;

  if (role === "ADMIN") {
    admin = await getAdminMetrics();
  }

  if (userId) {
    const member = await prisma.memberProfile.findUnique({ where: { userId } });
    if (member) {
      metrics = await getMemberMetrics(member.id);
    }
  }

  async function toggleAutomation(formData: FormData) {
    "use server";
    const key = String(formData.get("key"));
    const val = String(formData.get("val")) === "true";
    if (!userId) return;
    const member = await prisma.memberProfile.findUnique({ where: { userId } });
    if (!member) return;
    await prisma.automationSetting.update({ where: { memberId: member.id }, data: { [key]: val } as any });
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24, width: "100%", display: "grid", gap: 24 }}>
        <h2>Dashboard</h2>

        {role === "ADMIN" && admin && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>Total Platform Revenue (30d)</div>
              <div>${(admin.adminRev30 / 100).toFixed(2)}</div>
            </div>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>Total Member Revenue (30d)</div>
              <div>${(admin.memberRev30 / 100).toFixed(2)}</div>
            </div>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>System Health</div>
              <div>Jobs pending: {admin.jobsPending}</div>
              <div>Jobs failed: {admin.jobsFailed}</div>
              <div>Posts due: {admin.postsDue}</div>
            </div>
          </section>
        )}

        {metrics && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>Revenue</div>
              <div>Today: ${(metrics.revenue.today / 100).toFixed(2)}</div>
              <div>Last 7d: ${(metrics.revenue.last7 / 100).toFixed(2)}</div>
              <div>Last 30d: ${(metrics.revenue.last30 / 100).toFixed(2)}</div>
            </div>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>Sales</div>
              <div>Today: {metrics.sales.today}</div>
              <div>Last 7d: {metrics.sales.last7}</div>
              <div>Last 30d: {metrics.sales.last30}</div>
            </div>
            <div style={{ border: "1px solid #eee", padding: 12 }}>
              <div>Engagement</div>
              <div>Views (7d): {metrics.views.last7}</div>
              <div>Clicks (7d): {metrics.clicks.last7}</div>
              <div>Views (30d): {metrics.views.last30}</div>
              <div>Clicks (30d): {metrics.clicks.last30}</div>
            </div>
          </section>
        )}

        {metrics && (
          <section>
            <h3>Funnel Performance (Top 5 products, 30d)</h3>
            <ul>
              {metrics.funnel.map((f: any) => (
                <li key={f.productId}>{f.title} — {f.count} sales</li>
              ))}
            </ul>
          </section>
        )}

        {metrics && (
          <section>
            <h3>Automation</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { key: "researchAutoRuns", label: "Research auto-runs" },
                { key: "autoPostVideos", label: "Auto-post videos" },
                { key: "autoPostTextAds", label: "Auto-post text ads" },
                { key: "autoGenerateDailyContent", label: "Auto-generate daily content" },
                { key: "postingEnabled", label: "Posting enabled" },
                { key: "funnelOptimizationEnabled", label: "Funnel optimization" },
              ].map((t) => (
                <form key={t.key} action={toggleAutomation} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{t.label}</span>
                  <input type="hidden" name="key" value={t.key} />
                  <input type="hidden" name="val" value={metrics.automation[t.key] ? "false" : "true"} />
                  <button type="submit">Turn {metrics.automation[t.key] ? "OFF" : "ON"}</button>
                </form>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <div>Last research run: {metrics.automation.lastResearchRunAt?.toString() || "-"}</div>
              <div>Last posting run: {metrics.automation.lastPostingRunAt?.toString() || "-"}</div>
              <div>Last funnel opt run: {metrics.automation.lastFunnelOptRunAt?.toString() || "-"}</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
