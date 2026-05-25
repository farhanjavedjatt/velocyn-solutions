/* =========================================================================
   CTA + Footer — closing scene plus full site footer. Contact form posts
   to /api/contact (Resend). "Start a discovery call" opens Calendly.
   ========================================================================= */
import ContactForm from "./ContactForm";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@velocynsolutions.com";
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/";

export default function CTA() {
  return (
    <section className="scene cta section-dark" data-scene="05" id="contact">
      <div className="cta-top">
        <div className="cta-top-left">
          <span className="mono-label">Tell us what you&apos;re building</span>
          <h2 className="serif cta-headline">
            Let&apos;s make <span className="it">something</span> ship.
          </h2>
        </div>
        <div className="cta-top-right">
          <ContactForm />
        </div>
      </div>

      <div className="cta-row">
        <div className="field">
          <span className="l">Email</span>
          <a className="v" href={`mailto:${SUPPORT_EMAIL}`} data-magnetic>
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className="field">
          <span className="l">Web</span>
          <span className="v">velocynsolutions.com</span>
        </div>
        <div className="field">
          <span className="l">Book a call</span>
          <a
            className="v"
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic
          >
            calendly.com/mahrozabass
          </a>
        </div>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-book"
          data-magnetic
        >
          <span>Start a discovery call</span>
          <span className="arrow">→</span>
        </a>
      </div>

      <div className="cta-foot">
        <span>Pakistan · Remote-first · GMT+5</span>
        <span>Currently booking · Q3 2026</span>
        <span>Reply within 24 hours, weekdays</span>
      </div>

      <footer className="cta-footer">
        <div className="cta-footer-col cta-footer-brand">
          <img
            src="/velocyn-logo-cream.png"
            alt="Velocyn Solutions"
            className="cta-footer-brand-mark"
          />
          <p>
            A small studio building web, mobile, and AI products for founders
            who&apos;d rather ship than sit in meetings.
          </p>
        </div>

        <div className="cta-footer-col">
          <h4>Disciplines</h4>
          <ul>
            <li><a href="#services" data-magnetic>AI Voice Agents</a></li>
            <li><a href="#services" data-magnetic>AI Applications & RAG</a></li>
            <li><a href="#services" data-magnetic>Web Platforms</a></li>
            <li><a href="#services" data-magnetic>Mobile Applications</a></li>
          </ul>
        </div>

        <div className="cta-footer-col">
          <h4>Studio</h4>
          <ul>
            <li><a href="#work" data-magnetic>Selected work</a></li>
            <li><a href="#stack" data-magnetic>The stack</a></li>
            <li>
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" data-magnetic>
                Book a call
              </a>
            </li>
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} data-magnetic>
                Get in touch
              </a>
            </li>
          </ul>
        </div>

        <div className="cta-footer-col">
          <h4>Elsewhere</h4>
          <ul>
            <li><a href="#" data-magnetic>LinkedIn</a></li>
            <li><a href="#" data-magnetic>GitHub</a></li>
            <li><a href="#" data-magnetic>Read · Notes</a></li>
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} data-magnetic>
                {SUPPORT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </section>
  );
}
