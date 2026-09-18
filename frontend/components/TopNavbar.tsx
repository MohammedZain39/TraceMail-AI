"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TopNavbar() {
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // =========================================================
  // THEME
  // =========================================================

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("tracemail-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme);
      setTheme(savedTheme);
      return;
    }

    // Default TraceMail theme
    applyTheme("dark");
    setTheme("dark");
  }, []);

  function applyTheme(nextTheme: "light" | "dark") {
    const html = document.documentElement;

    // Remove both first so they can never conflict
    html.classList.remove("light");
    html.classList.remove("dark");

    // Add exactly one theme
    html.classList.add(nextTheme);

    // Also keep the native browser color scheme correct
    html.style.colorScheme = nextTheme;
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    applyTheme(nextTheme);

    localStorage.setItem("tracemail-theme", nextTheme);
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  // =========================================================
  // CLOSE DROPDOWNS
  // =========================================================

  function closeDropdowns() {
    setShowNotifications(false);
    setShowProfile(false);
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="top-navbar">
        <div className="top-navbar-left">
          <div className="mobile-logo">
            <div className="logo-mark">T</div>

            <div>
              <div className="logo-title">TraceMail AI</div>
              <div className="logo-subtitle">
                EMAIL FORENSIC INTELLIGENCE
              </div>
            </div>
          </div>
        </div>

        <div className="top-navbar-actions">
          <button
            type="button"
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            🌙
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="top-navbar">
      {/* =====================================================
          LEFT
          ===================================================== */}

      <div className="top-navbar-left">
        <div className="mobile-logo">
          <div className="logo-mark">T</div>

          <div>
            <div className="logo-title">TraceMail AI</div>

            <div className="logo-subtitle">
              EMAIL FORENSIC INTELLIGENCE
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="navbar-search">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Search investigations, IOCs, domains..."
          />

          <span className="search-shortcut">⌘ K</span>
        </div>
      </div>

      {/* =====================================================
          RIGHT ACTIONS
          ===================================================== */}

      <div className="top-navbar-actions">

        {/* THEME BUTTON */}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
          title={
            theme === "dark"
              ? "Switch to light theme"
              : "Switch to dark theme"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* =================================================
            NOTIFICATIONS
            ================================================= */}

        <div className="navbar-dropdown-container">
          <button
            type="button"
            className="navbar-icon-button"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications((value) => !value);
              setShowProfile(false);
            }}
          >
            🔔

            <span className="notification-dot" />
          </button>

          {showNotifications && (
            <div className="navbar-dropdown">
              <div className="dropdown-header">
                <div>
                  <div className="dropdown-title">
                    Notifications
                  </div>

                  <div className="dropdown-subtitle">
                    Recent security events
                  </div>
                </div>

                <div className="notification-count">
                  3
                </div>
              </div>

              <div className="notification-item">
                <span className="notification-indicator critical" />

                <div>
                  <div className="notification-title">
                    Critical threat detected
                  </div>

                  <div className="notification-text">
                    A high-risk phishing email requires
                    investigation.
                  </div>

                  <div className="notification-time">
                    Just now
                  </div>
                </div>
              </div>

              <div className="notification-item">
                <span className="notification-indicator warning" />

                <div>
                  <div className="notification-title">
                    Suspicious infrastructure
                  </div>

                  <div className="notification-text">
                    An IOC was associated with a known
                    suspicious domain.
                  </div>

                  <div className="notification-time">
                    12 min ago
                  </div>
                </div>
              </div>

              <div className="notification-item">
                <span className="notification-indicator success" />

                <div>
                  <div className="notification-title">
                    Evidence secured
                  </div>

                  <div className="notification-text">
                    Investigation evidence was successfully
                    integrity-checked.
                  </div>

                  <div className="notification-time">
                    28 min ago
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="view-notifications"
                onClick={() => {
                  closeDropdowns();
                  router.push("/investigations");
                }}
              >
                View investigations →
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            PROFILE
            ================================================= */}

        <div className="navbar-dropdown-container">
          <button
            type="button"
            className="profile-button"
            onClick={() => {
              setShowProfile((value) => !value);
              setShowNotifications(false);
            }}
          >
            <div className="profile-avatar">
              ZA
            </div>

            <div className="profile-info">
              <div className="profile-name">
                Security Analyst
              </div>

              <div className="profile-role">
                SOC Analyst
              </div>
            </div>

            <span className="profile-chevron">
              ▾
            </span>
          </button>

          {showProfile && (
            <div className="navbar-dropdown profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="large-avatar">
                  ZA
                </div>

                <div>
                  <div className="dropdown-title">
                    Security Analyst
                  </div>

                  <div className="dropdown-subtitle">
                    SOC Analyst
                  </div>
                </div>
              </div>

              <div className="dropdown-divider" />

              <Link
                href="/settings"
                className="dropdown-action"
                onClick={closeDropdowns}
              >
                ⚙️
                <span>Settings</span>
              </Link>

              <Link
                href="/evidence"
                className="dropdown-action"
                onClick={closeDropdowns}
              >
                🔐
                <span>Evidence Ledger</span>
              </Link>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-action logout"
                onClick={handleLogout}
              >
                ↪
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}