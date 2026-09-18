"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  description: string;
  emails: number;
  targets: number;
  infrastructure: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "ACTIVE" | "MONITORED" | "CLOSED";
  firstSeen: string;
  lastSeen: string;
  domains: string[];
};

const campaigns: Campaign[] = [
  {
    id: "CMP-2026-001",
    name: "Invoice Payment Campaign",
    description:
      "Coordinated financial phishing activity targeting accounts and finance teams.",
    emails: 18,
    targets: 11,
    infrastructure: 7,
    severity: "CRITICAL",
    status: "ACTIVE",
    firstSeen: "05 Sep 2026",
    lastSeen: "05 Sep 2026",
    domains: ["paypa1-security.com", "protonmail.com"],
  },
  {
    id: "CMP-2026-002",
    name: "Microsoft Credential Harvest",
    description:
      "Credential phishing emails using Microsoft-themed domains and login pages.",
    emails: 31,
    targets: 24,
    infrastructure: 12,
    severity: "HIGH",
    status: "MONITORED",
    firstSeen: "03 Sep 2026",
    lastSeen: "05 Sep 2026",
    domains: ["micros0ft-support.com", "login-secure.net"],
  },
  {
    id: "CMP-2026-003",
    name: "Account Verification Wave",
    description:
      "Repeated account verification emails containing suspicious authentication links.",
    emails: 12,
    targets: 9,
    infrastructure: 5,
    severity: "HIGH",
    status: "MONITORED",
    firstSeen: "29 Aug 2026",
    lastSeen: "02 Sep 2026",
    domains: ["account-verify.com", "security-login.net"],
  },
  {
    id: "CMP-2026-004",
    name: "Executive Impersonation",
    description:
      "Emails impersonating internal executives requesting urgent business actions.",
    emails: 8,
    targets: 5,
    infrastructure: 4,
    severity: "MEDIUM",
    status: "CLOSED",
    firstSeen: "20 Aug 2026",
    lastSeen: "23 Aug 2026",
    domains: ["executive-mail.net"],
  },
];

export default function CampaignsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.id.toLowerCase().includes(search.toLowerCase()) ||
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.domains.some((domain) =>
          domain.toLowerCase().includes(search.toLowerCase())
        );

      const matchesSeverity =
        severity === "ALL" || campaign.severity === severity;

      const matchesStatus =
        status === "ALL" || campaign.status === status;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [search, severity, status]);

  const criticalCount = campaigns.filter(
    (campaign) => campaign.severity === "CRITICAL"
  ).length;

  const activeCount = campaigns.filter(
    (campaign) => campaign.status === "ACTIVE"
  ).length;

  const totalEmails = campaigns.reduce(
    (total, campaign) => total + campaign.emails,
    0
  );

  const totalInfrastructure = campaigns.reduce(
    (total, campaign) => total + campaign.infrastructure,
    0
  );

  return (
    <main className="min-h-screen bg-[#071018] text-white">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-20 flex h-screen w-[250px] flex-col border-r border-slate-800 bg-[#08121b]">
        <div className="flex h-[82px] items-center border-b border-slate-800 px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-cyan-400/50 bg-cyan-400/10 text-cyan-300">
              ◈
            </div>

            <div>
              <div className="text-[15px] font-bold tracking-[0.22em]">
                TRACE
              </div>
              <div className="text-[10px] tracking-[0.45em] text-cyan-400">
                MAIL AI
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <NavSection title="OVERVIEW">
            <NavItem
              label="Dashboard"
              onClick={() => router.push("/dashboard")}
            />
          </NavSection>

          <NavSection title="INVESTIGATE">
            <NavItem
              label="New Analysis"
              onClick={() => router.push("/analysis/new")}
            />
            <NavItem
              label="Investigations"
              onClick={() => router.push("/investigations")}
            />
          </NavSection>

          <NavSection title="INTELLIGENCE">
            <NavItem
              label="Threat Graph"
              onClick={() => router.push("/threat-graph")}
            />
            <NavItem
              label="Campaigns"
              active
              onClick={() => router.push("/campaigns")}
            />
            <NavItem
              label="Geo Intelligence"
              onClick={() => router.push("/geo-intelligence")}
            />
          </NavSection>

          <NavSection title="EVIDENCE">
            <NavItem
              label="Evidence Integrity"
              onClick={() => router.push("/evidence")}
            />
            <NavItem
              label="Reports"
              onClick={() => router.push("/reports")}
            />
          </NavSection>

          <NavSection title="SYSTEM">
            <NavItem
              label="Settings"
              onClick={() => router.push("/settings")}
            />
          </NavSection>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0b1721] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm text-cyan-300">
              ZA
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Analyst</div>
              <div className="truncate text-xs text-slate-500">
                Security Operations
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="ml-[250px] min-h-screen">
        {/* TOP BAR */}
        <header className="flex h-[82px] items-center justify-between border-b border-slate-800 px-8">
          <div>
            <div className="text-xs tracking-[0.25em] text-cyan-400">
              THREAT INTELLIGENCE
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-wide">
              Campaigns
            </h1>
          </div>

          <button
            onClick={() => router.push("/analysis/new")}
            className="border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] text-cyan-300 transition hover:bg-cyan-400/20"
          >
            + NEW ANALYSIS
          </button>
        </header>

        <div className="p-8">
          {/* INTRO */}
          <div className="mb-7 max-w-3xl">
            <h2 className="text-lg font-semibold">
              Coordinated Threat Campaigns
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              TraceMail correlates suspicious emails, domains, URLs,
              infrastructure and targeted users to identify related attacks
              instead of treating every email as an isolated incident.
            </p>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="CAMPAIGNS"
              value={campaigns.length}
              description="Detected attack clusters"
            />

            <StatCard
              label="ACTIVE CAMPAIGNS"
              value={activeCount}
              description="Currently being monitored"
              danger
            />

            <StatCard
              label="CORRELATED EMAILS"
              value={totalEmails}
              description="Emails linked to campaigns"
            />

            <StatCard
              label="INFRASTRUCTURE"
              value={totalInfrastructure}
              description="Unique infrastructure indicators"
            />
          </div>

          {/* FILTER BAR */}
          <div className="mt-8 border border-slate-800 bg-[#0a151f]">
            <div className="flex items-center gap-3 border-b border-slate-800 p-4">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns, domains or campaign IDs..."
                  className="w-full border border-slate-700 bg-[#071018] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/60"
                />
              </div>

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="border border-slate-700 bg-[#071018] px-4 py-3 text-sm text-slate-300 outline-none"
              >
                <option value="ALL">All Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-slate-700 bg-[#071018] px-4 py-3 text-sm text-slate-300 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="MONITORED">Monitored</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4">CAMPAIGN</th>
                    <th className="px-5 py-4">ACTIVITY</th>
                    <th className="px-5 py-4">INFRASTRUCTURE</th>
                    <th className="px-5 py-4">SEVERITY</th>
                    <th className="px-5 py-4">STATUS</th>
                    <th className="px-5 py-4">LAST SEEN</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      onClick={() =>
                        router.push(`/campaigns/${campaign.id}`)
                      }
                      className="cursor-pointer border-b border-slate-800/70 transition hover:bg-cyan-400/[0.03]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />

                          <div>
                            <div className="font-medium text-slate-100">
                              {campaign.name}
                            </div>

                            <div className="mt-1 text-[11px] text-cyan-400">
                              {campaign.id}
                            </div>

                            <div className="mt-2 max-w-[300px] text-xs leading-5 text-slate-500">
                              {campaign.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="text-sm text-slate-200">
                          {campaign.emails} emails
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {campaign.targets} targets
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="text-sm text-slate-200">
                          {campaign.infrastructure} indicators
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {campaign.domains.map((domain) => (
                            <span
                              key={domain}
                              className="border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <SeverityBadge severity={campaign.severity} />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={campaign.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-xs text-slate-400">
                        {campaign.lastSeen}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/campaigns/${campaign.id}`);
                          }}
                          className="border border-slate-700 px-3 py-2 text-[10px] tracking-[0.12em] text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCampaigns.length === 0 && (
                <div className="py-16 text-center">
                  <div className="text-sm text-slate-400">
                    No campaigns found.
                  </div>

                  <div className="mt-2 text-xs text-slate-600">
                    Try changing the search or filters.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CORRELATION EXPLANATION */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <InsightCard
              number="01"
              title="EMAIL CORRELATION"
              text="Related emails are grouped using sender patterns, subjects, URLs, authentication failures and behavioral indicators."
            />

            <InsightCard
              number="02"
              title="INFRASTRUCTURE CORRELATION"
              text="Domains, IP addresses and URLs are connected to identify infrastructure reused across multiple attacks."
            />

            <InsightCard
              number="03"
              title="CAMPAIGN INTELLIGENCE"
              text="Analysts can investigate the complete campaign instead of reviewing every suspicious email independently."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- COMPONENTS ---------------- */

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="mb-2 px-3 text-[9px] font-semibold tracking-[0.25em] text-slate-600">
        {title}
      </div>

      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center border-l-2 px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border-cyan-400 bg-cyan-400/[0.07] text-cyan-300"
          : "border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  description,
  danger = false,
}: {
  label: string;
  value: number;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="border border-slate-800 bg-[#0a151f] p-5">
      <div className="text-[9px] tracking-[0.2em] text-slate-500">
        {label}
      </div>

      <div
        className={`mt-3 text-3xl font-semibold ${
          danger ? "text-red-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>

      <div className="mt-2 text-xs text-slate-600">{description}</div>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: Campaign["severity"];
}) {
  const styles = {
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
    HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    MEDIUM: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: Campaign["status"];
}) {
  const styles = {
    ACTIVE: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    MONITORED: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    CLOSED: "border-slate-600 bg-slate-800/40 text-slate-400",
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function InsightCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-slate-800 bg-[#0a151f] p-5">
      <div className="text-xs text-cyan-400">{number}</div>

      <div className="mt-3 text-xs font-semibold tracking-[0.15em] text-slate-200">
        {title}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}