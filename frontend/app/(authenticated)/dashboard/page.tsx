"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type CaseData = {
  case_id?: string;
  filename?: string;
  status?: string;
  created_at?: string;
  evidence_hash?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
  };

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD REAL CASE DATA
     ===================================================== */

  const fetchCases = useCallback(async () => {
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

      setCases(
        Array.isArray(data?.cases)
          ? data.cases
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load dashboard cases:",
        err
      );

      setError(
        "Unable to connect to TraceMail backend."
      );

      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  /* =====================================================
     REAL STATISTICS
     ===================================================== */

  const totalCases = cases.length;

  const criticalCases = cases.filter(
    (item) =>
      String(
        item.threat_analysis?.severity || ""
      ).toUpperCase() === "CRITICAL"
  ).length;

  const highRiskCases = cases.filter(
    (item) =>
      String(
        item.threat_analysis?.severity || ""
      ).toUpperCase() === "HIGH"
  ).length;

  const openCases = cases.filter(
    (item) =>
      String(item.status || "").toUpperCase() ===
      "OPEN"
  ).length;

  /* =====================================================
     SORT RECENT CASES
     ===================================================== */

  const recentCases = [...cases]
    .sort((a, b) => {
      const aTime = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const bTime = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return bTime - aTime;
    })
    .slice(0, 5);

  /* =====================================================
     HELPERS
     ===================================================== */

  function getSeverity(item: CaseData) {
    return String(
      item.threat_analysis?.severity || "UNKNOWN"
    ).toUpperCase();
  }

  function getSeverityClass(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "HIGH":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "MEDIUM":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      case "LOW":
        return "border-green-500/30 bg-green-500/10 text-green-400";

      default:
        return "border-gray-700 bg-gray-800/30 text-gray-500";
    }
  }

  function getSubject(item: CaseData) {
    return (
      item.email?.subject ||
      item.filename ||
      "Email Investigation"
    );
  }

  function getClassification(item: CaseData) {
    return (
      item.threat_analysis?.classification ||
      "Suspicious Email"
    );
  }

  function getScore(item: CaseData) {
    return item.threat_analysis?.risk_score ?? 0;
  }

  function formatDate(date?: string) {
    if (!date) {
      return "Unknown";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <div className="min-h-screen w-full bg-[#071019] text-white">
      {/* =================================================
          PAGE HEADER
          Navbar is provided globally by authenticated layout.
          ================================================= */}

      <header className="border-b border-gray-800">
        <div className="px-8 py-7 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
              Security Operations
            </p>

            <h1 className="text-3xl font-bold mt-2">
              Dashboard
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Email threat detection and forensic
              intelligence overview
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/analysis/new")
            }
            className="
              px-5
              py-3
              bg-cyan-500
              hover:bg-cyan-400
              text-black
              text-xs
              font-bold
              rounded-md
              transition
            "
          >
            + NEW ANALYSIS
          </button>
        </div>
      </header>

      {/* =================================================
          DASHBOARD CONTENT
          ================================================= */}

      <section className="px-8 py-7">
        {/* =================================================
            BACKEND ERROR
            ================================================= */}

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/5 rounded-lg px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-400">
                {error}
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Make sure the TraceMail FastAPI
                backend is running.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchCases()}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
            ================================================= */}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Cases"
            value={
              loading
                ? "—"
                : String(totalCases)
            }
            description="All investigations"
            icon="◈"
            iconClass="text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
          />

          <StatCard
            title="Critical"
            value={
              loading
                ? "—"
                : String(criticalCases)
            }
            description="Immediate attention"
            icon="!"
            iconClass="text-red-400 border-red-500/20 bg-red-500/10"
          />

          <StatCard
            title="High Risk"
            value={
              loading
                ? "—"
                : String(highRiskCases)
            }
            description="Requires review"
            icon="↗"
            iconClass="text-orange-400 border-orange-500/20 bg-orange-500/10"
          />

          <StatCard
            title="Open Cases"
            value={
              loading
                ? "—"
                : String(openCases)
            }
            description="Active investigations"
            icon="□"
            iconClass="text-green-400 border-green-500/20 bg-green-500/10"
          />
        </section>

        {/* =================================================
            RECENT INVESTIGATIONS
            ================================================= */}

        <section className="mt-6 border border-gray-800 bg-[#0b1621] rounded-lg overflow-hidden">
          {/* HEADER */}

          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[9px] tracking-[0.25em] text-gray-600 uppercase">
                Case Management
              </p>

              <h2 className="text-lg font-semibold mt-1">
                Recent Investigations
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Latest emails analyzed by TraceMail AI
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  void fetchCases()
                }
                disabled={loading}
                className="
                  text-xs
                  text-gray-500
                  hover:text-cyan-400
                  transition
                  disabled:opacity-50
                "
              >
                ↻ Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/investigations")
                }
                className="
                  text-xs
                  text-cyan-400
                  hover:text-cyan-300
                "
              >
                View all →
              </button>
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="py-16 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />

              <p className="text-xs text-gray-600 mt-4">
                Loading investigations...
              </p>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            recentCases.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl text-gray-700">
                  ◈
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  No investigations yet
                </p>

                <p className="text-xs text-gray-700 mt-2">
                  Upload a suspicious .eml file
                  to create your first case.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/analysis/new")
                  }
                  className="
                    mt-5
                    px-4
                    py-2
                    bg-cyan-500
                    hover:bg-cyan-400
                    text-black
                    text-xs
                    font-bold
                    rounded
                  "
                >
                  + START ANALYSIS
                </button>
              </div>
            )}

          {/* CASE LIST */}

          {!loading &&
            !error &&
            recentCases.length > 0 && (
              <div>
                {recentCases.map(
                  (item, index) => {
                    const severity =
                      getSeverity(item);

                    return (
                      <button
                        type="button"
                        key={
                          item.case_id ||
                          item.evidence_hash ||
                          index
                        }
                        onClick={() => {
                          if (item.case_id) {
                            router.push(
                              `/investigations/${item.case_id}`
                            );
                          }
                        }}
                        className="
                          w-full
                          px-6
                          py-5
                          border-b
                          border-gray-800
                          last:border-b-0
                          hover:bg-white/[0.02]
                          transition
                          text-left
                          group
                        "
                      >
                        <div className="flex items-center gap-5">
                          {/* ICON */}

                          <div
                            className={`
                              w-10
                              h-10
                              shrink-0
                              rounded-lg
                              border
                              flex
                              items-center
                              justify-center
                              text-sm
                              ${getSeverityClass(
                                severity
                              )}
                            `}
                          >
                            ✉
                          </div>

                          {/* DETAILS */}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-semibold text-gray-200 truncate">
                                {getSubject(item)}
                              </p>

                              <span
                                className={`
                                  px-2
                                  py-1
                                  rounded
                                  border
                                  text-[9px]
                                  font-semibold
                                  shrink-0
                                  ${getSeverityClass(
                                    severity
                                  )}
                                `}
                              >
                                {severity}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                              {getClassification(
                                item
                              )}
                            </p>

                            {item.email?.sender && (
                              <p className="text-[10px] text-gray-700 mt-2 truncate">
                                {item.email.sender}
                              </p>
                            )}
                          </div>

                          {/* SCORE */}

                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-gray-200">
                              {getScore(item)}

                              <span className="text-[10px] text-gray-600">
                                /100
                              </span>
                            </p>

                            <p className="text-[10px] text-gray-600 mt-1">
                              {formatDate(
                                item.created_at
                              )}
                            </p>
                          </div>

                          {/* ARROW */}

                          <span className="text-gray-700 group-hover:text-cyan-400 transition text-lg">
                            →
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </section>
    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <div className="border border-gray-800 bg-[#0b1621] rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-gray-600 uppercase">
            {title}
          </p>

          <p className="text-3xl font-bold text-gray-100 mt-3">
            {value}
          </p>

          <p className="text-xs text-gray-600 mt-2">
            {description}
          </p>
        </div>

        <div
          className={`
            w-9
            h-9
            rounded-md
            border
            flex
            items-center
            justify-center
            text-sm
            font-bold
            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}