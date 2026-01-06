import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const { userId, productId, audience, platform } = await req.json();
  if (!userId || !audience || !platform) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const prompts = [
    "Write a punchy headline",
    "Write a compelling hook",
    "Write a strong CTA",
  ];
  const texts: string[] = [];
  try {
    for (let i = 0; i < 10; i++) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Platform: ${platform}. Audience: ${audience}. ${prompts[i % prompts.length]}.` }],
        }),
      });
      const data = await res.json();
      texts.push(data?.choices?.[0]?.message?.content || "");
    }
  } catch (e) {
    // If AI not configured, return empty
  }

  const created = await Promise.all(
    texts.map((t) =>
      prisma.adVariant.create({
        data: { memberId: userId, productId: productId ?? undefined, platform, text: t || "", active: false },
      })
    )
  );

  return NextResponse.json({ count: created.length });
}

