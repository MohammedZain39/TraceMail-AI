"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type CaseItem = {
  case_id?: string;
  filename?: string;
  created_at?: string;
  status?: string;
  evidence_hash?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
    date?: string;
  };

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };
};

function formatDate(value?: string) {
  if (!value) return "Unknown";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function severityClass(severity?: string) {
  switch (String(severity || "").toUpperCase()) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-600";

    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-600";

    case "MEDIUM":
      return "border-yellow-200 bg-yellow-50 text-yellow-600";

    case "LOW":
    case "SAFE":
      return "border-emerald-200 bg-emerald-50 text-emerald-600";

    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function riskBarClass(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-emerald-500";
}

export default function ReportsPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/cases", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load reports (${response.status})`
        );
      }

      const data = await response.json();

      setCases(
        Array.isArray(data?.cases)
          ? data.cases
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load reports:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reports."
      );

      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const filteredCases = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return cases;

    return cases.filter((item) => {
      const values = [
        item.case_id,
        item.filename,
        item.email?.sender,
        item.email?.subject,
        item.threat_analysis?.classification,
        item.threat_analysis?.severity,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [cases, search]);

  const downloadReport = async (
    caseId: string
  ) => {
    if (downloadingId) return;

    try {
      setDownloadingId(caseId);
      setError("");

      const response = await apiFetch(
        `/cases/${encodeURIComponent(caseId)}/report`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let message = `Report download failed (${response.status})`;

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const objectUrl =
        window.URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = objectUrl;

      anchor.download =
        `${caseId}_forensic_report.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error(
        "Failed to download forensic report:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download forensic report."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const totalReports = cases.length;

  const criticalReports = cases.filter(
    (item) =>
      String(
        item.threat_analysis?.severity || ""
      ).toUpperCase() === "CRITICAL"
  ).length;

  const highRiskReports = cases.filter(
    (item) => {
      const score =
        item.threat_analysis?.risk_score ?? 0;

      return score >= 60;
    }
  ).length;

  return (
    <main className="tm-reports-page min-h-screen">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">

        {/* =========================================
            HEADER
        ========================================= */}

        <section className="tm-report-header">
          <div className="flex items-start justify-between gap-6">

            <div>
              <p className="tm-eyebrow">
                FORENSIC OUTPUT
              </p>

              <h1 className="tm-page-title">
                Reports
              </h1>

              <p className="tm-page-description">
                Review and export forensic investigation
                reports generated from analyzed email
                evidence.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/analysis/new")
              }
              className="tm-primary-button"
            >
              + NEW ANALYSIS
            </button>

          </div>
        </section>

        {/* =========================================
            SUMMARY CARDS
        ========================================= */}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <SummaryCard
            label="TOTAL REPORTS"
            value={String(totalReports)}
            description="Generated investigations"
            icon="▤"
          />

          <SummaryCard
            label="CRITICAL REPORTS"
            value={String(criticalReports)}
            description="Immediate attention"
            danger
            icon="!"
          />

          <SummaryCard
            label="HIGH RISK"
            value={String(highRiskReports)}
            description="Risk score ≥ 60"
            icon="◇"
          />

        </section>

        {/* =========================================
            SEARCH
        ========================================= */}

        <section className="tm-search-panel mt-6">

          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <div className="tm-search-wrapper">

              <span className="tm-search-icon">
                ⌕
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search case, sender, subject or classification..."
                className="tm-search-input"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="tm-search-clear"
                >
                  ×
                </button>
              )}

            </div>

            <button
              type="button"
              onClick={() => void loadCases()}
              disabled={loading}
              className="tm-refresh-button"
            >
              ↻
              <span>
                {loading
                  ? "LOADING..."
                  : "REFRESH"}
              </span>
            </button>

          </div>

        </section>

        {/* =========================================
            ERROR
        ========================================= */}

        {error && (
          <div className="tm-error mt-4">
            <span className="tm-error-icon">
              !
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* =========================================
            REPORT ARCHIVE
        ========================================= */}

        <section className="tm-report-archive mt-6">

          {/* ARCHIVE HEADER */}

          <div className="tm-archive-header">

            <div>
              <p className="tm-section-label">
                REPORT ARCHIVE
              </p>

              <h2 className="tm-archive-title">
                Forensic Investigation Reports
              </h2>

              <p className="tm-archive-description">
                {filteredCases.length} report
                {filteredCases.length === 1
                  ? ""
                  : "s"} available
              </p>
            </div>

            <div className="tm-archive-count">
              {filteredCases.length}
            </div>

          </div>

          {/* CONTENT */}

          {loading ? (
            <LoadingState />
          ) : filteredCases.length === 0 ? (
            <EmptyState
              search={search}
              onCreate={() =>
                router.push("/analysis/new")
              }
            />
          ) : (
            <div>

              {filteredCases.map((item) => {

                const caseId =
                  item.case_id || "UNKNOWN";

                const score =
                  item.threat_analysis?.risk_score ?? 0;

                const severity =
                  String(
                    item.threat_analysis?.severity ||
                      "UNKNOWN"
                  ).toUpperCase();

                const classification =
                  item.threat_analysis
                    ?.classification ||
                  "Potentially Suspicious";

                const subject =
                  item.email?.subject ||
                  item.filename ||
                  "Unknown Email";

                const sender =
                  item.email?.sender ||
                  "Unknown Sender";

                const isDownloading =
                  downloadingId === caseId;

                return (
                  <article
                    key={caseId}
                    className="tm-report-row"
                  >

                    {/* TOP */}

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center">

                      {/* CASE / EMAIL */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/investigations/${encodeURIComponent(
                                  caseId
                                )}`
                              )
                            }
                            className="tm-case-id"
                          >
                            {caseId}
                          </button>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-wider ${severityClass(
                              severity
                            )}`}
                          >
                            {severity}
                          </span>

                        </div>

                        <h3 className="tm-email-subject">
                          {subject}
                        </h3>

                        <p className="tm-email-sender">
                          {sender}
                        </p>

                        <div className="tm-date">
                          {formatDate(
                            item.created_at ||
                              item.email?.date
                          )}
                        </div>

                      </div>

                      {/* CLASSIFICATION */}

                      <div className="min-w-0 xl:w-64">

                        <p className="tm-data-label">
                          CLASSIFICATION
                        </p>

                        <p className="tm-classification">
                          {classification}
                        </p>

                      </div>

                      {/* RISK */}

                      <div className="w-full xl:w-44">

                        <div className="flex items-center justify-between">

                          <p className="tm-data-label">
                            RISK SCORE
                          </p>

                          <span className="tm-risk-number">
                            {score}
                            <span className="tm-risk-max">
                              /100
                            </span>
                          </span>

                        </div>

                        <div className="tm-risk-track">
                          <div
                            className={`h-full rounded-full ${riskBarClass(
                              score
                            )}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, score)
                              )}%`,
                            }}
                          />
                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/reports/${encodeURIComponent(
                                caseId
                              )}`
                            )
                          }
                          className="tm-secondary-button"
                        >
                          VIEW REPORT
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void downloadReport(caseId)
                          }
                          disabled={isDownloading}
                          className="tm-primary-small"
                        >
                          {isDownloading
                            ? "DOWNLOADING..."
                            : "DOWNLOAD PDF"}
                        </button>

                      </div>

                    </div>

                    {/* EVIDENCE */}

                    <div className="tm-evidence-row">

                      <div className="min-w-0">

                        <span className="tm-data-label">
                          EVIDENCE SHA-256
                        </span>

                        <p className="tm-hash">
                          {item.evidence_hash ||
                            "Evidence hash unavailable"}
                        </p>

                      </div>

                      <span className="tm-evidence-status">
                        <span className="tm-green-dot" />
                        EVIDENCE LINKED
                      </span>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

      </div>

      {/* =========================================
          PAGE THEME
      ========================================= */}

      <style jsx>{`

        /* =========================================
           PAGE
        ========================================= */

        .tm-reports-page {
          --page-bg: #071019;
          --surface: #0a1622;
          --surface-alt: #0d1b29;
          --border: #223246;

          --text-strong: #f1f5f9;
          --text: #d4deea;
          --text-soft: #94a3b8;
          --muted: #66778d;

          background:
            radial-gradient(
              900px 400px at 70% -10%,
              rgba(34, 211, 238, 0.06),
              transparent 70%
            ),
            #071019;

          color: var(--text);
        }

        /* =========================================
           LIGHT THEME
        ========================================= */

        :global(html.light) .tm-reports-page {
          --page-bg: #f5f9fd;
          --surface: #ffffff;
          --surface-alt: #eef6fb;
          --border: #d8e4ee;

          --text-strong: #17233a;
          --text: #33445d;
          --text-soft: #607089;
          --muted: #8190a4;

          background:
            radial-gradient(
              850px 380px at 72% -8%,
              rgba(14, 165, 233, 0.13),
              transparent 68%
            ),
            radial-gradient(
              650px 300px at 10% 20%,
              rgba(125, 211, 252, 0.08),
              transparent 70%
            ),
            #f5f9fd;
        }

        /* =========================================
           HEADER
        ========================================= */

        .tm-report-header {
          padding-bottom: 28px;

          border-bottom: 1px solid
            var(--border);
        }

        .tm-eyebrow {
          color: #06b6d4;

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.3em;
        }

        .tm-page-title {
          margin-top: 7px;

          color: var(--text-strong);

          font-size: 34px;
          font-weight: 650;

          letter-spacing: -0.035em;
        }

        .tm-page-description {
          margin-top: 8px;

          max-width: 680px;

          color: var(--text-soft);

          font-size: 14px;
          line-height: 1.6;
        }

        /* =========================================
           PRIMARY BUTTON
        ========================================= */

        .tm-primary-button {
          flex-shrink: 0;

          padding: 12px 18px;

          border: 1px solid
            rgba(8, 182, 214, 0.3);

          border-radius: 9px;

          background: #08b9d9;

          color: #04202a;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 0.05em;

          cursor: pointer;

          box-shadow:
            0 7px 20px
            rgba(8, 185, 217, 0.16);

          transition:
            transform 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .tm-primary-button:hover {
          background: #22c5df;

          transform: translateY(-1px);

          box-shadow:
            0 10px 25px
            rgba(8, 185, 217, 0.23);
        }

        /* =========================================
           SUMMARY CARDS
        ========================================= */

        :global(.tm-summary-card) {
          background: var(--surface);
        }

        /* =========================================
           SEARCH
        ========================================= */

        .tm-search-panel {
          padding: 12px;

          border: 1px solid
            var(--border);

          border-radius: 13px;

          background: var(--surface);

          box-shadow:
            0 8px 25px
            rgba(15, 23, 42, 0.035);
        }

        .tm-search-wrapper {
          position: relative;

          flex: 1;
        }

        .tm-search-icon {
          position: absolute;

          left: 15px;
          top: 50%;

          transform: translateY(-50%);

          color: #7890a8;

          font-size: 15px;
        }

        .tm-search-input {
          width: 100%;

          height: 46px;

          box-sizing: border-box;

          padding: 0 42px;

          border: 1px solid
            var(--border);

          border-radius: 9px;

          outline: none;

          background: var(--surface-alt);

          color: var(--text-strong);

          font-size: 13px;

          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .tm-search-input::placeholder {
          color: var(--muted);
        }

        .tm-search-input:focus {
          border-color:
            rgba(8, 182, 214, 0.5);

          background: var(--surface);

          box-shadow:
            0 0 0 3px
            rgba(8, 182, 214, 0.08);
        }

        .tm-search-clear {
          position: absolute;

          right: 12px;
          top: 50%;

          transform: translateY(-50%);

          border: none;
          background: transparent;

          color: var(--muted);

          cursor: pointer;

          font-size: 18px;
        }

        .tm-search-clear:hover {
          color: #06b6d4;
        }

        .tm-refresh-button {
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding: 0 17px;

          border: 1px solid
            var(--border);

          border-radius: 9px;

          background: var(--surface);

          color: var(--text-soft);

          font-size: 10px;
          font-weight: 650;

          letter-spacing: 0.05em;

          cursor: pointer;

          transition: 160ms ease;
        }

        .tm-refresh-button:hover {
          border-color:
            rgba(8, 182, 214, 0.4);

          color: #0891b2;

          background: var(--surface-alt);
        }

        /* =========================================
           ERROR
        ========================================= */

        .tm-error {
          display: flex;
          align-items: center;

          gap: 9px;

          padding: 12px 14px;

          border: 1px solid
            rgba(239, 68, 68, 0.25);

          border-radius: 9px;

          background: rgba(254, 242, 242, 0.9);

          color: #dc2626;

          font-size: 12px;
        }

        :global(html.dark) .tm-error {
          background: rgba(127, 29, 29, 0.12);

          color: #f87171;
        }

        .tm-error-icon {
          width: 20px;
          height: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #fee2e2;

          font-weight: 800;
        }

        /* =========================================
           ARCHIVE
        ========================================= */

        .tm-report-archive {
          overflow: hidden;

          border: 1px solid
            var(--border);

          border-radius: 14px;

          background: var(--surface);

          box-shadow:
            0 12px 35px
            rgba(15, 23, 42, 0.045);
        }

        .tm-archive-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 21px 24px;

          border-bottom: 1px solid
            var(--border);

          background:
            linear-gradient(
              90deg,
              var(--surface),
              var(--surface-alt)
            );
        }

        .tm-section-label {
          color: var(--muted);

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.24em;
        }

        .tm-archive-title {
          margin-top: 5px;

          color: var(--text-strong);

          font-size: 18px;
          font-weight: 650;
        }

        .tm-archive-description {
          margin-top: 4px;

          color: var(--text-soft);

          font-size: 11px;
        }

        .tm-archive-count {
          width: 40px;
          height: 40px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid
            rgba(8, 182, 214, 0.18);

          border-radius: 10px;

          background: rgba(8, 182, 214, 0.06);

          color: #0891b2;

          font-size: 13px;
          font-weight: 700;
        }

        /* =========================================
           REPORT ROW
        ========================================= */

        .tm-report-row {
          padding: 23px 24px;

          border-bottom: 1px solid
            var(--border);

          transition:
            background 180ms ease;
        }

        .tm-report-row:last-child {
          border-bottom: none;
        }

        .tm-report-row:hover {
          background: var(--surface-alt);
        }

        .tm-case-id {
          padding: 0;

          border: none;

          background: transparent;

          color: #0891b2;

          font-family: monospace;

          font-size: 12px;
          font-weight: 700;

          cursor: pointer;
        }

        .tm-case-id:hover {
          color: #06b6d4;

          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .tm-email-subject {
          margin-top: 11px;

          overflow: hidden;

          color: var(--text-strong);

          font-size: 14px;
          font-weight: 600;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .tm-email-sender {
          margin-top: 4px;

          overflow: hidden;

          color: var(--text-soft);

          font-size: 11px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .tm-date {
          margin-top: 10px;

          color: var(--muted);

          font-size: 10px;
        }

        /* =========================================
           DATA
        ========================================= */

        .tm-data-label {
          color: var(--muted);

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.19em;
        }

        .tm-classification {
          margin-top: 7px;

          color: var(--text);

          font-size: 12px;
          line-height: 1.5;
        }

        .tm-risk-number {
          color: var(--text-strong);

          font-family: monospace;

          font-size: 13px;
          font-weight: 700;
        }

        .tm-risk-max {
          color: var(--muted);

          font-size: 9px;
        }

        .tm-risk-track {
          height: 6px;

          margin-top: 9px;

          overflow: hidden;

          border-radius: 999px;

          background:
            rgba(100, 116, 139, 0.14);
        }

        /* =========================================
           ACTIONS
        ========================================= */

        .tm-secondary-button {
          padding: 10px 13px;

          border: 1px solid
            var(--border);

          border-radius: 8px;

          background: var(--surface);

          color: var(--text-soft);

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.08em;

          cursor: pointer;

          transition: 160ms ease;
        }

        .tm-secondary-button:hover {
          border-color:
            rgba(8, 182, 214, 0.45);

          color: #0891b2;

          background: var(--surface-alt);
        }

        .tm-primary-small {
          padding: 10px 13px;

          border: 1px solid
            rgba(8, 182, 214, 0.25);

          border-radius: 8px;

          background: #08b9d9;

          color: #04202a;

          font-size: 9px;
          font-weight: 800;

          letter-spacing: 0.08em;

          cursor: pointer;

          transition: 160ms ease;
        }

        .tm-primary-small:hover {
          background: #22c5df;

          transform: translateY(-1px);
        }

        .tm-primary-small:disabled {
          opacity: 0.55;

          cursor: wait;

          transform: none;
        }

        /* =========================================
           EVIDENCE
        ========================================= */

        .tm-evidence-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top: 18px;
          padding-top: 15px;

          border-top: 1px solid
            var(--border);
        }

        .tm-hash {
          max-width: 650px;

          margin-top: 5px;

          overflow: hidden;

          color: var(--text-soft);

          font-family: monospace;

          font-size: 9px;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .tm-evidence-status {
          display: flex;
          align-items: center;

          gap: 7px;

          flex-shrink: 0;

          color: #059669;

          font-size: 9px;
          font-weight: 700;

          letter-spacing: 0.08em;
        }

        .tm-green-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #10b981;

          box-shadow:
            0 0 8px
            rgba(16, 185, 129, 0.45);
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 700px) {
          .tm-page-title {
            font-size: 29px;
          }

          .tm-report-header
            :global(.flex) {
            flex-direction: column;
          }

          .tm-primary-button {
            width: 100%;
          }

          .tm-archive-header {
            padding: 18px;
          }

          .tm-report-row {
            padding: 19px;
          }

          .tm-evidence-row {
            align-items: flex-start;

            flex-direction: column;
          }

          .tm-evidence-status {
            align-self: flex-start;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  label,
  value,
  description,
  danger = false,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  danger?: boolean;
  icon: string;
}) {
  return (
    <div className="tm-summary-card group rounded-xl border border-[var(--tm-border,#d8e4ee)] bg-[var(--tm-surface,#fff)] p-5 shadow-[0_8px_25px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]">

      <div className="flex items-start justify-between">

        <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--tm-muted,#8190a4)]">
          {label}
        </p>

        <span
          className={`
            flex h-8 w-8 items-center justify-center
            rounded-lg text-xs font-bold
            ${
              danger
                ? "bg-red-50 text-red-500"
                : "bg-cyan-50 text-cyan-600"
            }
          `}
        >
          {icon}
        </span>

      </div>

      <p
        className={`
          mt-4 text-3xl font-bold tracking-tight
          ${
            danger
              ? "text-red-500"
              : "text-[var(--tm-text-strong,#17233a)]"
          }
        `}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-[var(--tm-text-soft,#607089)]">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   LOADING
   ============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-sm font-bold text-cyan-600 animate-pulse">
          T
        </div>

        <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500">
          TRACE MAIL AI
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Loading forensic reports...
        </p>

      </div>

    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function EmptyState({
  search,
  onCreate,
}: {
  search: string;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-xl text-cyan-500">
        ◇
      </div>

      <h3 className="mt-5 text-sm font-semibold text-cyan-600">
        {search
          ? "NO MATCHING REPORTS"
          : "NO FORENSIC REPORTS"}
      </h3>

      <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
        {search
          ? "Try a different case ID, sender, subject or classification."
          : "Analyze an email artifact to generate your first forensic investigation report."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-lg bg-cyan-500 px-5 py-2.5 text-[10px] font-bold tracking-wider text-white shadow-[0_6px_18px_rgba(6,182,212,0.18)] transition hover:bg-cyan-400"
        >
          + NEW ANALYSIS
        </button>
      )}

    </div>
  );
}