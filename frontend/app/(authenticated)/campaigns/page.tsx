"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type CaseItem = {
  case_id?: string;
  filename?: string;

  email?: {
    sender?: string;
    subject?: string;
    reply_to?: string;
  };

  sender?: string;
  classification?: string;
  severity?: string;
  risk_score?: number;

  threat_analysis?: {
    classification?: string;
    severity?: string;
    risk_score?: number;
  };
};

type Campaign = {
  key: string;
  label: string;
  cases: CaseItem[];
  risk: number;
  classification: string;
};

export default function CampaignsPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  /*
   * ============================================================
   * LOAD CASES
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/cases", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setCases(
            Array.isArray(data?.cases)
              ? data.cases
              : []
          );
        }
      } catch (err) {
        console.error(
          "Failed to load campaign cases:",
          err
        );

        if (!cancelled) {
          setCases([]);
          setError(
            "Unable to load campaign correlations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * BUILD CAMPAIGNS
   *
   * Current MVP correlation:
   *
   * sender domain + classification
   *
   * This gives us meaningful clusters without requiring
   * another database table for campaigns.
   * ============================================================
   */

  const campaigns = useMemo<Campaign[]>(() => {
    const groups = new Map<string, CaseItem[]>();

    for (const item of cases) {
      const sender =
        item.email?.sender ||
        item.sender ||
        item.filename ||
        item.case_id ||
        "unknown";

      const normalizedSender = sender
        .trim()
        .toLowerCase();

      const domain = normalizedSender.includes("@")
        ? normalizedSender.split("@").pop() ||
          normalizedSender
        : normalizedSender;

      const classification =
        item.threat_analysis?.classification ||
        item.classification ||
        "Unclassified";

      const key =
        `${domain}::${classification}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(item);
    }

    return [...groups.entries()]
      .map(([key, group]) => {
        const scores = group.map(
          (item) =>
            item.threat_analysis?.risk_score ??
            item.risk_score ??
            0
        );

        const [domain, ...classificationParts] =
          key.split("::");

        return {
          key,

          label:
            domain || "unknown",

          cases: group,

          risk: Math.max(
            ...scores,
            0
          ),

          classification:
            classificationParts.join("::") ||
            "Unclassified",
        };
      })
      .sort(
        (a, b) =>
          b.risk - a.risk
      );
  }, [cases]);

  /*
   * ============================================================
   * SELECTED CAMPAIGN
   * ============================================================
   */

  const selected =
    campaigns.find(
      (campaign) =>
        campaign.key === selectedKey
    ) ||
    campaigns[0] ||
    null;

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  function getRisk(item: CaseItem) {
    return (
      item.threat_analysis?.risk_score ??
      item.risk_score ??
      0
    );
  }

  function getSeverity(item: CaseItem) {
    return (
      item.threat_analysis?.severity ||
      item.severity ||
      "UNKNOWN"
    );
  }

  function openCase(caseId: string) {
    if (!caseId) return;

    sessionStorage.setItem(
      "tracemail_case_id",
      caseId
    );

    router.push(
      `/investigations/${encodeURIComponent(
        caseId
      )}`
    );
  }

  /*
   * ============================================================
   * PAGE
   *
   * IMPORTANT:
   * NO SIDEBAR HERE.
   * NO TOP NAVBAR HERE.
   * NO ml-56 / ml-64 HERE.
   *
   * The authenticated layout owns those globally.
   * ============================================================
   */

  return (
    <main className="min-h-[calc(100vh-70px)] w-full bg-[#071019] text-white">
      <div className="w-full px-6 py-7 lg:px-8 xl:px-10">
        {/* ======================================================
            PAGE HEADER
            ====================================================== */}

        <header className="mb-7 flex items-start justify-between gap-8">
          <div>
            <p className="text-[10px] font-medium tracking-[0.32em] text-cyan-400">
              CORRELATION
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Campaigns
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Dynamic case clusters derived from observed
              sender infrastructure and classifications.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] tracking-[0.25em] text-slate-600">
              CLUSTERS
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-300">
              {campaigns.length}
            </p>
          </div>
        </header>

        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/25 bg-red-500/[0.04] px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Make sure the TraceMail FastAPI backend is
              running and your analyst session is active.
            </p>
          </div>
        )}

        {/* ======================================================
            LOADING
            ====================================================== */}

        {loading ? (
          <section className="flex min-h-[560px] items-center justify-center rounded-xl border border-slate-800/90 bg-[#0b1621]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="text-sm text-cyan-400">
                LOADING CAMPAIGN CORRELATIONS
              </p>

              <p className="mt-2 text-xs text-slate-600">
                Correlating analyzed investigations...
              </p>
            </div>
          </section>
        ) : campaigns.length === 0 ? (
          /* ====================================================
             EMPTY STATE
             ==================================================== */

          <section className="flex min-h-[560px] items-center justify-center rounded-xl border border-slate-800/90 bg-[#0b1621]">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/[0.04]">
                <span className="text-lg text-cyan-400">
                  ◇
                </span>
              </div>

              <p className="text-sm font-medium tracking-wide text-cyan-400">
                NO CAMPAIGN CORRELATIONS
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Analyze additional email investigations to
                create meaningful infrastructure and
                classification clusters.
              </p>

              <button
                onClick={() =>
                  router.push("/analysis/new")
                }
                className="mt-5 rounded-md bg-cyan-500 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-400"
              >
                + NEW ANALYSIS
              </button>
            </div>
          </section>
        ) : (
          /* ====================================================
             CAMPAIGN CONTENT
             ==================================================== */

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            {/* ==================================================
                LEFT — CAMPAIGN LIST
                ================================================== */}

            <section className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1621]">
              <div className="border-b border-slate-800/90 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.22em] text-cyan-400">
                      CORRELATED CLUSTERS
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Select a cluster to inspect related cases.
                    </p>
                  </div>

                  <span className="rounded border border-slate-700 bg-slate-900/50 px-2 py-1 text-[10px] text-slate-500">
                    {campaigns.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[620px] overflow-y-auto">
                {campaigns.map((campaign) => {
                  const active =
                    selected?.key ===
                    campaign.key;

                  return (
                    <button
                      key={campaign.key}
                      type="button"
                      onClick={() =>
                        setSelectedKey(
                          campaign.key
                        )
                      }
                      className={`w-full border-b border-slate-800/80 px-5 py-4 text-left transition last:border-b-0 ${
                        active
                          ? "bg-cyan-500/[0.07]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${
                                campaign.risk >= 80
                                  ? "bg-red-400"
                                  : campaign.risk >= 60
                                  ? "bg-orange-400"
                                  : campaign.risk >= 40
                                  ? "bg-yellow-400"
                                  : "bg-cyan-400"
                              }`}
                            />

                            <p className="truncate font-mono text-xs text-slate-300">
                              {campaign.label}
                            </p>
                          </div>

                          <p className="mt-2 truncate text-[11px] text-slate-600">
                            {campaign.classification}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 text-xs font-medium ${
                            campaign.risk >= 60
                              ? "text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {campaign.risk}
                          <span className="text-slate-700">
                            /100
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-600">
                        <span>
                          {campaign.cases.length}{" "}
                          {campaign.cases.length === 1
                            ? "case"
                            : "cases"}
                        </span>

                        <span className="text-slate-800">
                          •
                        </span>

                        <span>
                          {campaign.classification}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ==================================================
                RIGHT — CAMPAIGN DETAILS
                ================================================== */}

            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1621]">
              <div className="border-b border-slate-800/90 px-5 py-4">
                <p className="text-[10px] tracking-[0.22em] text-cyan-400">
                  CLUSTER DETAILS
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Cases correlated by observed sender
                  infrastructure and threat classification.
                </p>
              </div>

              {selected ? (
                <div className="p-5">
                  {/* ==========================================
                      SUMMARY
                      ========================================== */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MiniStat
                      label="INFRASTRUCTURE"
                      value={selected.label}
                    />

                    <MiniStat
                      label="RELATED CASES"
                      value={String(
                        selected.cases.length
                      )}
                    />

                    <MiniStat
                      label="MAX RISK"
                      value={`${selected.risk}/100`}
                      danger={selected.risk >= 60}
                    />
                  </div>

                  {/* ==========================================
                      CLASSIFICATION
                      ========================================== */}

                  <div className="mt-5 rounded-lg border border-slate-800/90 bg-[#09131d] p-4">
                    <p className="text-[9px] tracking-[0.2em] text-slate-600">
                      PRIMARY CLASSIFICATION
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-slate-200">
                        {selected.classification}
                      </p>

                      <span
                        className={`rounded border px-2 py-1 text-[9px] font-medium ${
                          selected.risk >= 80
                            ? "border-red-500/30 bg-red-500/[0.06] text-red-400"
                            : selected.risk >= 60
                            ? "border-orange-500/30 bg-orange-500/[0.06] text-orange-400"
                            : "border-slate-700 text-slate-500"
                        }`}
                      >
                        RISK {selected.risk}/100
                      </span>
                    </div>
                  </div>

                  {/* ==========================================
                      RELATED CASES
                      ========================================== */}

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] tracking-[0.2em] text-slate-600">
                          RELATED INVESTIGATIONS
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Infrastructure-linked email cases.
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-600">
                        {selected.cases.length} total
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-800/90">
                      {selected.cases.map(
                        (item, index) => {
                          const id =
                            item.case_id ||
                            `case-${index}`;

                          const risk =
                            getRisk(item);

                          const severity =
                            getSeverity(item);

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() =>
                                openCase(
                                  item.case_id ||
                                    ""
                                )
                              }
                              disabled={
                                !item.case_id
                              }
                              className="group w-full border-b border-slate-800/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-white/[0.025] disabled:cursor-default"
                            >
                              <div className="flex items-start justify-between gap-5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] text-cyan-400">
                                      {item.case_id ||
                                        "UNASSIGNED"}
                                    </span>

                                    <span
                                      className={`rounded border px-1.5 py-0.5 text-[8px] ${
                                        severity.toUpperCase() ===
                                          "CRITICAL" ||
                                        risk >= 80
                                          ? "border-red-500/30 bg-red-500/[0.05] text-red-400"
                                          : severity.toUpperCase() ===
                                              "HIGH" ||
                                            risk >=
                                              60
                                          ? "border-orange-500/30 bg-orange-500/[0.05] text-orange-400"
                                          : "border-slate-700 text-slate-500"
                                      }`}
                                    >
                                      {severity.toUpperCase()}
                                    </span>
                                  </div>

                                  <p className="mt-2 truncate text-xs text-slate-300">
                                    {item.email?.subject ||
                                      item.filename ||
                                      "Email investigation"}
                                  </p>

                                  <p className="mt-1 truncate text-[10px] text-slate-600">
                                    {item.email?.sender ||
                                      item.sender ||
                                      "Unknown sender"}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-4">
                                  <div className="text-right">
                                    <p
                                      className={`text-xs font-semibold ${
                                        risk >= 60
                                          ? "text-red-400"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {risk}
                                      <span className="text-slate-700">
                                        /100
                                      </span>
                                    </p>

                                    <p className="mt-1 text-[9px] text-slate-700">
                                      RISK
                                    </p>
                                  </div>

                                  <span className="text-sm text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-400">
                                    →
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* ==========================================
                      CORRELATION EXPLANATION
                      ========================================== */}

                  <div className="mt-5 rounded-lg border border-cyan-500/10 bg-cyan-500/[0.025] p-4">
                    <p className="text-[9px] tracking-[0.2em] text-cyan-500">
                      CORRELATION SIGNAL
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      These cases are grouped because they
                      share the same observed sender
                      infrastructure and threat
                      classification. This provides an
                      investigation starting point for
                      identifying potentially related attacks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[500px] items-center justify-center">
                  <p className="text-xs text-slate-600">
                    Select a campaign cluster to inspect
                    related investigations.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/*
 * ==============================================================
 * MINI STAT
 * ============================================================== */

function MiniStat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-800/90 bg-[#09131d] p-4">
      <p className="text-[9px] tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 truncate text-sm font-medium ${
          danger
            ? "text-red-400"
            : "text-slate-300"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}