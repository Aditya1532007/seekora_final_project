import { useEffect, useState } from "react";
import { showToast } from "@/components/Toast";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "signup") => void;
  onOpenPalette: () => void;
  isSignedIn: boolean;
  userEmail: string | null;
  onSignOut: () => void;
  onOpenApp: () => void;
}

export function Navbar({ onOpenAuth, onOpenPalette, isSignedIn, userEmail, onSignOut, onOpenApp }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("seekora-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem("seekora-theme", newTheme);
    showToast(newTheme === "light" ? "Light mode activated" : "Dark mode activated");
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how" },
    { label: "Tech", href: "#stack" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "#roadmap" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="logo">
        <div className="logo-icon">S</div>
        Seekora
      </div>
      <ul className={`nav-links ${mobileOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="nav-cta" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span className="kbd-hint" onClick={onOpenPalette} style={{ cursor: "pointer" }}>
          <kbd>Ctrl</kbd>+<kbd>K</kbd>
        </span>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle color theme">
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
        {isSignedIn ? (
          <>
            <button className="btn" onClick={onOpenApp}>
              Open App
            </button>
            <button
              className="icon-btn"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
            >
              ⏻
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => onOpenAuth("signup")}>
            Get Started
          </button>
        )}
        <button
          className="hamburger"
          style={{ display: "none" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>
    </nav>
  );
}
