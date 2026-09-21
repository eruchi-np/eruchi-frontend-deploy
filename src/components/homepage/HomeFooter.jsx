import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";
import { INSTAGRAM_URL, LINKEDIN_URL, SUPPORT_EMAIL } from "../../utils/siteConfig";
import "./homepage.css";

function FooterCol({ title, links }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {links.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-grid">
        <div className="home-footer-brand">
          <img src="/logo-mark.png" alt="eRuchi" className="h-8 w-auto" />
          <p>Earn rewards by sharing your opinions. Nepal&apos;s community-powered survey platform.</p>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <div className="home-socials">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: "Surveys", to: "/standalone-surveys" },
            { label: "Rewards", to: "/shop" },
            { label: "Businesses", to: "/for-business" },
            { label: "How it Works", to: "/faqs" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "About", to: "/faqs" },
            { label: "Careers", href: `mailto:${SUPPORT_EMAIL}?subject=Careers` },
            { label: "Contact", href: `mailto:${SUPPORT_EMAIL}` },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { label: "FAQs", to: "/faqs" },
            { label: "Help Center", to: "/faqs" },
            { label: "Report an Issue", href: `mailto:${SUPPORT_EMAIL}?subject=Report an Issue` },
          ]}
        />
      </div>

      <div className="home-footer-bottom">
        <p>© {new Date().getFullYear()} eRuchi. All rights reserved.</p>
        <nav>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </nav>
        <p className="home-loc">Kathmandu, Nepal</p>
      </div>
      <div className="h-[calc(5.25rem+env(safe-area-inset-bottom))] md:hidden" />
    </footer>
  );
}
