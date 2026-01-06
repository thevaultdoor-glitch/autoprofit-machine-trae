import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";

export default async function AdminCustomers() {
  const orders = await prisma.order.findMany({ include: { product: { include: { member: { include: { user: true } } } } }, orderBy: { createdAt: "desc" } });
  const byEmail = new Map<string, { email: string; purchases: any[] }>();
  for (const o of orders) {
    const email = o.buyerEmail || "unknown@customer";
    const rec = byEmail.get(email) || { email, purchases: [] };
    rec.purchases.push({ productTitle: o.product.title, memberEmail: o.product.member.user.email, amountCents: o.amountCents, createdAt: o.createdAt });
    byEmail.set(email, rec);
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>All Customers</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Email</th>
              <th style={{ textAlign: "left" }}>Purchases</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(byEmail.values()).map((c) => (
              <tr key={c.email}>
                <td>{c.email}</td>
                <td>
                  <ul>
                    {c.purchases.map((p, idx) => (
                      <li key={idx}>{p.productTitle} — ${(p.amountCents / 100).toFixed(2)} — {p.memberEmail} — {new Date(p.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

