"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Investigation = {
  case_id?: string;
  id?: string;
  filename?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
    date?: string;
    reply_to?: string;
  };

  sender?: string;
  subject?: string;
  classification?: string;
  severity?: string;
  risk_score?: number;
  risk?: number;
  status?: string;
  date?: string;
  created_at?: string;

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };
};

type NormalizedInvestigation = Investigation & {
  displayId: string;
  displaySubject: string;
  displaySender: string;
  displayClassification: string;
  displaySeverity: string;
  displayRisk: number;
  displayStatus: string;
  displayDate: string;
};

const severityStyles: Record<string, string> = {
  CRITICAL:
    "text-red-400 bg-red-500/10 border-red-500/30",

  HIGH:
    "text-orange-400 bg-orange-500/10 border-orange-500/30",

  MEDIUM:
    "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",

  LOW:
    "text-green-400 bg-green-500/10 border-green-500/30",

  SAFE:
    "text-green-400 bg-green-500/10 border-green-500/30",
};

const statusStyles: Record<string, string> = {
  OPEN: "text-red-400",

  INVESTIGATING:
    "text-cyan-400",

  CLOSED:
    "text-green-400",
};

export default function InvestigationsPage() {
  const router = useRouter();

  const [investigations, setInvestigations] =
    useState<Investigation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All Severity");

  const [statusFilter, setStatusFilter] =
    useState("All Status");

  /* =====================================================
     LOAD AUTHENTICATED CASES
     ===================================================== */

  const loadCases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "/cases",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load investigations (${response.status})`
        );
      }

      const data = await response.json();

      setInvestigations(
        Array.isArray(data?.cases)
          ? data.cases
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load investigations:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load investigations."
      );

      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  /* =====================================================
     NORMALIZE BACKEND DATA
     ===================================================== */

  const normalizedCases =
    useMemo<NormalizedInvestigation[]>(() => {
      return investigations.map((item) => {
        const threat =
          item.threat_analysis || {};

        return {
          ...item,

          displayId:
            item.case_id ||
            item.id ||
            "UNKNOWN",

          displaySubject:
            item.email?.subject ||
            item.subject ||
            item.filename ||
            "Unknown Email",

          displaySender:
            item.email?.sender ||
            item.sender ||
            "Unknown Sender",

          displayClassification:
            threat.classification ||
            item.classification ||
            "Potentially Suspicious",

          displaySeverity:
            String(
              threat.severity ||
                item.severity ||
                "LOW"
            ).toUpperCase(),

          displayRisk:
            threat.risk_score ??
            item.risk_score ??
            item.risk ??
            0,

          displayStatus:
            String(
              item.status ||
                "OPEN"
            ).toUpperCase(),

          displayDate:
            item.email?.date ||
            item.date ||
            item.created_at ||
            "Unknown",
        };
      });
    }, [investigations]);

  /* =====================================================
     FILTER
     ===================================================== */

  const filteredCases =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return normalizedCases.filter(
        (item) => {
          const matchesSearch =
            !query ||
            item.displayId
              .toLowerCase()
              .includes(query) ||
            item.displaySubject
              .toLowerCase()
              .includes(query) ||
            item.displaySender
              .toLowerCase()
              .includes(query) ||
            item.displayClassification
              .toLowerCase()
              .includes(query);

          const matchesSeverity =
            severityFilter ===
              "All Severity" ||
            item.displaySeverity ===
              severityFilter.toUpperCase();

          const matchesStatus =
            statusFilter ===
              "All Status" ||
            item.displayStatus ===
              statusFilter.toUpperCase();

          return (
            matchesSearch &&
            matchesSeverity &&
            matchesStatus
          );
        }
      );
    }, [
      normalizedCases,
      search,
      severityFilter,
      statusFilter,
    ]);

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totalCases =
    normalizedCases.length;

  const openCases =
    normalizedCases.filter(
      (item) =>
        item.displayStatus === "OPEN"
    ).length;

  const highRiskCases =
    normalizedCases.filter(
      (item) =>
        item.displayRisk >= 60
    ).length;

  const closedCases =
    normalizedCases.filter(
      (item) =>
        item.displayStatus === "CLOSED"
    ).length;

  /* =====================================================
     DATE FORMATTER
     ===================================================== */

  function formatDate(
    value: string
  ) {
    if (
      !value ||
      value === "Unknown"
    ) {
      return "Unknown";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <main className="w-full min-h-screen bg-[#071019] text-white">
      {/* =================================================
          PAGE HEADER
          Global sidebar + navbar are NOT rendered here.
          ================================================= */}

      <header className="w-full border-b border-gray-800">
        <div className="w-full px-8 py-7 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
              Investigation Center
            </p>

            <h1 className="text-3xl font-bold mt-2">
              Investigations
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Review and investigate analyzed
              email threats.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/analysis/new"
              )
            }
            className="
              px-5
              py-3
              bg-cyan-500
              hover:bg-cyan-400
              text-black
              font-bold
              rounded-md
              transition
              text-xs
            "
          >
            + NEW ANALYSIS
          </button>
        </div>
      </header>

      {/* =================================================
          CONTENT
          ================================================= */}

      <section className="w-full px-8 py-7">
        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/5 rounded-lg px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-400">
                {error}
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Unable to retrieve investigation
                cases from TraceMail API.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadCases()
              }
              className="
                text-xs
                text-cyan-400
                hover:text-cyan-300
              "
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            STAT CARDS
            ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="TOTAL CASES"
            value={
              loading
                ? "..."
                : String(totalCases)
            }
          />

          <StatCard
            label="OPEN"
            value={
              loading
                ? "..."
                : String(openCases)
            }
          />

          <StatCard
            label="HIGH RISK"
            value={
              loading
                ? "..."
                : String(highRiskCases)
            }
          />

          <StatCard
            label="CLOSED"
            value={
              loading
                ? "..."
                : String(closedCases)
            }
          />
        </div>

        {/* =================================================
            FILTER BAR
            ================================================= */}

        <div className="w-full border border-gray-800 bg-[#0b1621] rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}

            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search case, sender, subject or classification..."
                className="
                  w-full
                  bg-[#071019]
                  border
                  border-gray-700
                  rounded-md
                  px-10
                  py-3
                  text-sm
                  text-gray-300
                  outline-none
                  focus:border-cyan-500
                  transition
                "
              />
            </div>

            {/* Severity */}

            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(
                  e.target.value
                )
              }
              className="
                lg:w-40
                bg-[#071019]
                border
                border-gray-700
                rounded-md
                px-4
                py-3
                text-sm
                text-gray-400
                outline-none
                focus:border-cyan-500
              "
            >
              <option>
                All Severity
              </option>

              <option>
                CRITICAL
              </option>

              <option>
                HIGH
              </option>

              <option>
                MEDIUM
              </option>

              <option>
                LOW
              </option>

              <option>
                SAFE
              </option>
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="
                lg:w-40
                bg-[#071019]
                border
                border-gray-700
                rounded-md
                px-4
                py-3
                text-sm
                text-gray-400
                outline-none
                focus:border-cyan-500
              "
            >
              <option>
                All Status
              </option>

              <option>
                OPEN
              </option>

              <option>
                INVESTIGATING
              </option>

              <option>
                CLOSED
              </option>
            </select>

            {/* Refresh */}

            <button
              type="button"
              onClick={() =>
                void loadCases()
              }
              disabled={loading}
              className="
                lg:w-12
                border
                border-gray-700
                bg-[#071019]
                rounded-md
                text-gray-500
                hover:text-cyan-400
                hover:border-cyan-500/40
                transition
                disabled:opacity-50
              "
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* =================================================
            INVESTIGATIONS TABLE
            ================================================= */}

        <div className="w-full border border-gray-800 bg-[#0b1621] rounded-lg overflow-hidden">
          {/* TABLE HEADER */}

          <div className="px-6 py-5 border-b border-gray-800">
            <h2 className="font-semibold text-lg">
              Investigations
            </h2>

            <p className="text-xs text-gray-600 mt-1">
              {loading
                ? "Loading investigation cases..."
                : `${filteredCases.length} ${
                    filteredCases.length === 1
                      ? "investigation"
                      : "investigations"
                  }`}
            </p>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="py-16 text-center">
              <div className="w-7 h-7 mx-auto border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />

              <p className="text-xs text-gray-600 mt-4">
                Loading investigations...
              </p>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            filteredCases.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-3xl text-gray-700">
                  ◈
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  No investigations found.
                </p>

                <p className="text-xs text-gray-700 mt-2">
                  Try changing your search or
                  filters.
                </p>
              </div>
            )}

          {/* DESKTOP TABLE */}

          {!loading &&
            filteredCases.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-left">
                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        CASE
                      </th>

                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        EMAIL
                      </th>

                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        CLASSIFICATION
                      </th>

                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        RISK
                      </th>

                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        STATUS
                      </th>

                      <th className="px-6 py-4 text-[10px] tracking-[0.18em] text-gray-600">
                        DATE
                      </th>

                      <th className="px-6 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCases.map(
                      (investigation) => {
                        const severity =
                          investigation.displaySeverity.toUpperCase();

                        const status =
                          investigation.displayStatus.toUpperCase();

                        const risk =
                          Math.min(
                            Math.max(
                              investigation.displayRisk,
                              0
                            ),
                            100
                          );

                        return (
                          <tr
                            key={
                              investigation.displayId
                            }
                            onClick={() =>
                              router.push(
                                `/investigations/${investigation.displayId}`
                              )
                            }
                            className="
                              border-b
                              border-gray-800
                              last:border-0
                              hover:bg-[#0e1b27]
                              cursor-pointer
                              transition
                              group
                            "
                          >
                            {/* CASE */}

                            <td className="px-6 py-5">
                              <p className="text-sm text-cyan-400 font-medium">
                                {
                                  investigation.displayId
                                }
                              </p>

                              <p className="text-xs text-gray-600 mt-1">
                                Email Investigation
                              </p>
                            </td>

                            {/* EMAIL */}

                            <td className="px-6 py-5 max-w-[300px]">
                              <p className="text-sm text-gray-300 truncate">
                                {
                                  investigation.displaySubject
                                }
                              </p>

                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {
                                  investigation.displaySender
                                }
                              </p>
                            </td>

                            {/* CLASSIFICATION */}

                            <td className="px-6 py-5 max-w-[250px]">
                              <p className="text-sm text-gray-400">
                                {
                                  investigation.displayClassification
                                }
                              </p>
                            </td>

                            {/* RISK */}

                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{
                                      width: `${risk}%`,
                                    }}
                                  />
                                </div>

                                <span className="text-sm font-bold text-gray-200">
                                  {
                                    investigation.displayRisk
                                  }
                                </span>
                              </div>

                              <span
                                className={`
                                  inline-block
                                  text-[10px]
                                  border
                                  rounded
                                  px-2
                                  py-1
                                  mt-2
                                  ${
                                    severityStyles[
                                      severity
                                    ] ||
                                    "text-gray-400 bg-gray-500/10 border-gray-500/30"
                                  }
                                `}
                              >
                                {severity}
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-6 py-5">
                              <span
                                className={`
                                  text-xs
                                  font-medium
                                  ${
                                    statusStyles[
                                      status
                                    ] ||
                                    "text-gray-400"
                                  }
                                `}
                              >
                                <span className="mr-1">
                                  ●
                                </span>

                                {status}
                              </span>
                            </td>

                            {/* DATE */}

                            <td className="px-6 py-5">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(
                                  investigation.displayDate
                                )}
                              </span>
                            </td>

                            {/* ARROW */}

                            <td className="px-6 py-5 text-gray-700 group-hover:text-cyan-400 transition">
                              →
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-800 bg-[#0b1621] rounded-lg p-5">
      <p className="text-[10px] tracking-[0.18em] text-gray-600">
        {label}
      </p>

      <p className="text-3xl font-bold mt-3 text-gray-100">
        {value}
      </p>
    </div>
  );
}