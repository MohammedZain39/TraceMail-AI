"use client";

import { usePathname, useRouter } from "next/navigation";

const navigation = [
  {
    section: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "▦",
      },
    ],
  },
  {
    section: "INVESTIGATE",
    items: [
      {
        label: "New Analysis",
        path: "/analysis/new",
        icon: "+",
      },
      {
        label: "Investigations",
        path: "/investigations",
        icon: "◇",
      },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      {
        label: "Threat Graph",
        path: "/threat-graph",
        icon: "⌘",
      },
      {
        label: "Campaigns",
        path: "/campaigns",
        icon: "⌁",
      },
      {
        label: "Geo Intelligence",
        path: "/geo-intelligence",
        icon: "◎",
      },
    ],
  },
  {
    section: "EVIDENCE",
    items: [
      {
        label: "Evidence Integrity",
        path: "/evidence",
        icon: "◇",
      },
      {
        label: "Reports",
        path: "/reports",
        icon: "▤",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: "⚙",
      },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(path: string) {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  return (
    <aside className="tm-sidebar">

      {/* =========================================
          BRAND
      ========================================= */}

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="tm-sidebar-brand"
      >
        <div className="tm-brand-mark">
          T
        </div>

        <div className="tm-brand-text">
          <div className="tm-brand-name">
            TRACE MAIL
          </div>

          <div className="tm-brand-ai">
            AI
          </div>

          <div className="tm-brand-subtitle">
            FORENSIC
            <br />
            INTELLIGENCE
          </div>
        </div>
      </button>

      {/* =========================================
          NAVIGATION
      ========================================= */}

      <nav className="tm-sidebar-nav">

        {navigation.map((group) => (
          <div
            key={group.section}
            className="tm-nav-group"
          >

            <div className="tm-nav-section">
              {group.section}
            </div>

            <div className="tm-nav-items">

              {group.items.map((item) => {
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() =>
                      router.push(item.path)
                    }
                    className={`tm-nav-item ${
                      active
                        ? "tm-nav-item-active"
                        : ""
                    }`}
                  >

                    <span className="tm-nav-icon">
                      {item.icon}
                    </span>

                    <span className="tm-nav-label">
                      {item.label}
                    </span>

                    {active && (
                      <span className="tm-nav-active-dot" />
                    )}

                  </button>
                );
              })}

            </div>
          </div>
        ))}

      </nav>

      {/* =========================================
          SYSTEM STATUS
      ========================================= */}

      <div className="tm-sidebar-status">

        <div className="tm-status-card">

          <div className="tm-status-top">

            <span className="tm-status-dot" />

            <span className="tm-status-title">
              SYSTEM OPERATIONAL
            </span>

          </div>

          <div className="tm-status-text">
            TraceMail API connected
          </div>

        </div>

      </div>

    </aside>
  );
}