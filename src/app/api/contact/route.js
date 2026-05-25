import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

/* Basic email sanity. Anything passing this regex still gets validated
   downstream by Resend itself. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { email, message, name } = await request.json();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (!message || message.trim().length < 5) {
      return NextResponse.json({ ok: false, error: "Message too short" }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });
    }

    const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
    if (!to) {
      return NextResponse.json({ ok: false, error: "Server email not configured" }, { status: 500 });
    }

    const subject = `Velocyn inquiry — ${name ? name + " · " : ""}${email}`;
    const text = [
      name ? `Name: ${name}` : null,
      `From: ${email}`,
      "",
      message.trim(),
    ].filter(Boolean).join("\n");

    /* The verified domain on Resend is velocynsolutions.com, so the
       From address must use that domain. Override with RESEND_FROM_EMAIL
       in env if you want to switch the mailbox name later. */
    const fromEmail = process.env.RESEND_FROM_EMAIL || "contact@velocynsolutions.com";
    const { data, error } = await resend.emails.send({
      from: `Velocyn Contact <${fromEmail}>`,
      to,
      replyTo: email,
      subject,
      text,
    });

    if (error) {
      console.error("[contact] resend error:", error);
      return NextResponse.json({ ok: false, error: "Send failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error("[contact] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
