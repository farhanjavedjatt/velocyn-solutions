"use client";
/* =========================================================================
   ContactForm — inline form in the CTA section. Posts to /api/contact,
   which sends an email to NEXT_PUBLIC_SUPPORT_EMAIL via Resend.
   ========================================================================= */
import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || "Send failed");
        setStatus("error");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Network error");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="contact-form contact-form-sent">
        <p className="serif">Thanks — we&apos;ll be in touch within 24 hours.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-form-row">
        <label className="contact-field">
          <span className="contact-field-label">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            maxLength={120}
          />
        </label>
        <label className="contact-field">
          <span className="contact-field-label">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            maxLength={200}
          />
        </label>
      </div>
      <label className="contact-field">
        <span className="contact-field-label">What are you building?</span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Briefly — the product, the stage, what you'd want from us."
          maxLength={4000}
        />
      </label>
      <div className="contact-form-actions">
        <button
          type="submit"
          className="contact-submit"
          data-magnetic
          disabled={status === "sending"}
        >
          <span>{status === "sending" ? "Sending…" : "Send message"}</span>
          <span className="arrow">→</span>
        </button>
        {status === "error" && (
          <span className="contact-error">{error}</span>
        )}
      </div>
    </form>
  );
}
