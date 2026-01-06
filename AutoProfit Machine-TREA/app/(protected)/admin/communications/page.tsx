import { Sidebar } from "@/src/components/Sidebar";
import { prisma } from "@/src/lib/prisma";

export default async function Communications() {
  const tickets = await prisma.supportTicket.findMany({ include: { member: { include: { user: true } }, messages: true }, orderBy: { createdAt: "desc" } });
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 24 }}>
        <h2>Communications</h2>
        <ul>
          {tickets.map((t) => (
            <li key={t.id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
              <div>Member: {t.member.user.email}</div>
              <div>Subject: {t.subject}</div>
              <div>Status: {t.status}</div>
              <div>Messages:</div>
              <ul>
                {t.messages.map((m) => (
                  <li key={m.id}>{m.senderRole}: {m.content}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

