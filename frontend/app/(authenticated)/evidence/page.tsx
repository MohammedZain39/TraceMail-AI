"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type CaseItem = {
  case_id?: string;
  filename?: string;
  evidence_hash?: string;
  risk_score?: number;
  severity?: string;
  status?: string;
  classification?: string;
  sender?: string;
  subject?: string;
  created_at?: string;
};

type LedgerEntry = {
  event_type?: string;
  evidence_hash?: string;
  timestamp?: string;
  case_id?: string;
};

type LedgerResult = {
  valid?: boolean;
  total_entries?: number;
  entries?: LedgerEntry[];
};

export default function EvidencePage() {
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [ledger, setLedger] = useState<LedgerResult | null>(null);

  const [selectedCase, setSelectedCase] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");

  /*
   * ============================================================
   * LOAD CASES + LEDGER
   * ============================================================
   */

  const loadEvidenceData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [casesResponse, ledgerResponse] = await Promise.all([
        apiFetch("/cases", {
          cache: "no-store",
        }),

        apiFetch("/ledger/verify", {
          cache: "no-store",
        }),
      ]);

      if (!casesResponse.ok) {
        throw new Error(
          `Cases request failed with ${casesResponse.status}`
        );
      }

      if (!ledgerResponse.ok) {
        throw new Error(
          `Ledger request failed with ${ledgerResponse.status}`
        );
      }

      const caseData = await casesResponse.json();
      const ledgerData = await ledgerResponse.json();

      const loadedCases: CaseItem[] = Array.isArray(caseData?.cases)
        ? caseData.cases
        : [];

      setCases(loadedCases);
      setLedger(ledgerData || null);

      /*
       * Keep the case selected across pages.
       */
      const storedCase =
        typeof window !== "undefined"
          ? sessionStorage.getItem("tracemail_case_id")
          : null;

      const storedExists =
        storedCase &&
        loadedCases.some(
          (item) => item.case_id === storedCase
        );

      const firstCase = loadedCases[0]?.case_id || "";

      const initialCase = storedExists
        ? storedCase!
        : firstCase;

      setSelectedCase(initialCase);

      if (initialCase && typeof window !== "undefined") {
        sessionStorage.setItem(
          "tracemail_case_id",
          initialCase
        );
      }
    } catch (err) {
      console.error(
        "Failed to load evidence data:",
        err
      );

      setError(
        "Unable to load evidence integrity data."
      );

      setCases([]);
      setLedger(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvidenceData();
  }, [loadEvidenceData]);

  /*
   * ============================================================
   * ACTIVE CASE
   * ============================================================
   */

  const activeCase = useMemo(() => {
    return (
      cases.find(
        (item) => item.case_id === selectedCase
      ) || null
    );
  }, [cases, selectedCase]);

  /*
   * ============================================================
   * CASE SELECTION
   * ============================================================
   */

  function handleCaseChange(caseId: string) {
    setSelectedCase(caseId);
    setVerifyMessage("");

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "tracemail_case_id",
        caseId
      );
    }
  }

  /*
   * ============================================================
   * VERIFY LEDGER
   * ============================================================
   */

  async function verifyLedger() {
    try {
      setVerifying(true);
      setVerifyMessage("");
      setError("");

      const response = await apiFetch(
        "/ledger/verify",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Ledger verification failed with ${response.status}`
        );
      }

      const data = await response.json();

      setLedger(data);

      if (data?.valid) {
        setVerifyMessage(
          "Evidence ledger verified successfully."
        );
      } else {
        setVerifyMessage(
          "Ledger verification requires review."
        );
      }
    } catch (err) {
      console.error(
        "Ledger verification error:",
        err
      );

      setVerifyMessage(
        "Unable to verify the evidence ledger."
      );
    } finally {
      setVerifying(false);
    }
  }

  /*
   * ============================================================
   * DOWNLOAD REPORT
   * ============================================================
   */

  async function downloadReport() {
    if (!activeCase?.case_id) {
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const response = await apiFetch(
        `/cases/${encodeURIComponent(
          activeCase.case_id
        )}/report`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Report download failed with ${response.status}`
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download = `${activeCase.case_id}_forensic_report.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Failed to download forensic report:",
        err
      );

      setError(
        "Unable to download the forensic report."
      );
    } finally {
      setDownloading(false);
    }
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071019] text-white px-5 py-6">
        <div className="mx-auto w-full max-w-[1250px]">
          <PageHeading />

          <div className="mt-8 rounded-xl border border-gray-800 bg-[#0b1621] p-10">
            <LoadingState />
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#071019] text-white px-5 py-6">
      <div className="mx-auto w-full max-w-[1250px]">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

          <PageHeading />

          <div className="w-full xl:w-[430px]">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Select Investigation Case
            </label>

            <select
              value={selectedCase}
              onChange={(event) =>
                handleCaseChange(event.target.value)
              }
              disabled={cases.length === 0}
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-[#223244]
                bg-[#0b1621]
                px-4
                py-3
                text-sm
                text-gray-300
                outline-none
                transition
                focus:border-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {cases.length === 0 ? (
                <option value="">
                  No investigation cases available
                </option>
              ) : null}

              {cases.map((item) => (
                <option
                  key={item.case_id}
                  value={item.case_id}
                >
                  {item.case_id} ·{" "}
                  {item.filename ||
                    item.subject ||
                    "Email investigation"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/[0.04] px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {/* =====================================================
            NO CASE
        ====================================================== */}

        {!activeCase ? (
          <div className="mt-6 rounded-xl border border-gray-800 bg-[#0b1621]">
            <EmptyState
              title="NO INVESTIGATION SELECTED"
              description="Analyze an email first to generate preserved forensic evidence."
              action={
                <button
                  onClick={() =>
                    router.push("/analysis/new")
                  }
                  className="
                    rounded-lg
                    bg-cyan-500
                    px-5
                    py-2.5
                    text-xs
                    font-semibold
                    text-black
                    transition
                    hover:bg-cyan-400
                  "
                >
                  + NEW ANALYSIS
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* =================================================
                CASE SUMMARY
            ================================================== */}

            <section className="mt-6 overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621]">

              <div className="border-b border-gray-800 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                  Selected Investigation
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  Evidence and integrity information for the
                  selected case.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-px bg-gray-800 md:grid-cols-2 xl:grid-cols-4">

                <CaseSummary
                  label="CASE ID"
                  value={
                    activeCase.case_id ||
                    "UNKNOWN"
                  }
                  cyan
                />

                <CaseSummary
                  label="RISK"
                  value={`${activeCase.risk_score ?? 0}/100`}
                  danger={
                    Number(activeCase.risk_score || 0) >=
                    80
                  }
                />

                <CaseSummary
                  label="CLASSIFICATION"
                  value={
                    activeCase.classification ||
                    "UNKNOWN"
                  }
                />

                <CaseSummary
                  label="STATUS"
                  value={
                    activeCase.status ||
                    "UNKNOWN"
                  }
                />

              </div>

              <div className="border-t border-gray-800 px-5 py-4">
                <p className="text-sm font-medium text-gray-300">
                  {activeCase.filename ||
                    activeCase.subject ||
                    "Email investigation"}
                </p>

                {activeCase.sender ? (
                  <p className="mt-1 text-xs text-gray-600">
                    {activeCase.sender}
                  </p>
                ) : null}
              </div>
            </section>

            {/* =================================================
                MAIN CONTENT
            ================================================== */}

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">

              {/* ===============================================
                  EVIDENCE FINGERPRINT
              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621] xl:col-span-8">

                <SectionHeader
                  title="ORIGINAL EVIDENCE FINGERPRINT"
                  subtitle="SHA-256 cryptographic identifier generated from the analyzed email evidence."
                />

                <div className="p-5">

                  <div className="rounded-xl border border-gray-800 bg-[#09131d] p-5">

                    <div className="flex items-center justify-between gap-4 border-b border-gray-800 pb-4">

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                          Hash Algorithm
                        </p>

                        <p className="mt-1 text-sm text-gray-300">
                          SHA-256
                        </p>
                      </div>

                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.04] px-3 py-2">
                        <span className="text-xs font-medium text-cyan-400">
                          CRYPTOGRAPHIC
                        </span>
                      </div>

                    </div>

                    <div className="pt-4">

                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                        Evidence Hash
                      </p>

                      <p className="mt-2 break-all font-mono text-xs leading-6 text-gray-300">
                        {activeCase.evidence_hash ||
                          "Evidence hash unavailable"}
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">

                    <InfoMetric
                      label="SEVERITY"
                      value={
                        activeCase.severity ||
                        "UNKNOWN"
                      }
                    />

                    <InfoMetric
                      label="STATUS"
                      value={
                        activeCase.status ||
                        "UNKNOWN"
                      }
                    />

                    <InfoMetric
                      label="EVIDENCE"
                      value="SHA-256"
                    />

                  </div>

                </div>
              </section>

              {/* ===============================================
                  LEDGER STATUS
              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621] xl:col-span-4">

                <SectionHeader
                  title="LEDGER INTEGRITY"
                  subtitle="Current chain-of-custody verification state."
                />

                <div className="p-5">

                  <div
                    className={`
                      rounded-xl
                      border
                      p-5
                      ${
                        ledger?.valid
                          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                          : "border-amber-500/20 bg-amber-500/[0.04]"
                      }
                    `}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-full
                          border
                          text-lg
                          ${
                            ledger?.valid
                              ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/[0.08] text-amber-400"
                          }
                        `}
                      >
                        {ledger?.valid ? "✓" : "!"}
                      </div>

                      <div>
                        <p
                          className={`
                            text-sm
                            font-semibold
                            ${
                              ledger?.valid
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          `}
                        >
                          {ledger?.valid
                            ? "VERIFIED"
                            : "REQUIRES REVIEW"}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                          {ledger?.total_entries ?? 0}{" "}
                          recorded ledger entries
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        void verifyLedger()
                      }
                      disabled={verifying}
                      className="
                        mt-5
                        w-full
                        rounded-lg
                        border
                        border-gray-700
                        px-4
                        py-2.5
                        text-xs
                        font-medium
                        text-gray-300
                        transition
                        hover:border-cyan-500/50
                        hover:text-cyan-400
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {verifying
                        ? "VERIFYING..."
                        : "VERIFY LEDGER"}
                    </button>

                  </div>

                  {verifyMessage ? (
                    <p className="mt-3 text-xs text-gray-500">
                      {verifyMessage}
                    </p>
                  ) : null}

                  <div className="mt-4 rounded-xl border border-gray-800 bg-[#09131d] p-4">

                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                      Integrity Model
                    </p>

                    <p className="mt-2 text-sm text-gray-400">
                      SHA-256 chained evidence ledger
                    </p>

                    <p className="mt-3 text-[11px] leading-5 text-gray-600">
                      Evidence integrity is tamper-evident
                      and supports chain-of-custody workflows.
                      It does not by itself establish legal
                      admissibility.
                    </p>

                  </div>

                </div>
              </section>

              {/* ===============================================
                  REPORT
              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621] xl:col-span-5">

                <SectionHeader
                  title="FORENSIC ARTIFACT"
                  subtitle="Evidence-linked investigation report."
                />

                <div className="p-5">

                  <div className="rounded-xl border border-gray-800 bg-[#09131d] p-5">

                    <div className="flex items-start justify-between">

                      <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/[0.04]">
                          <span className="text-sm font-bold text-red-400">
                            PDF
                          </span>
                        </div>

                        <p className="mt-5 text-sm font-medium text-gray-300">
                          Forensic Investigation Report
                        </p>

                        <p className="mt-2 text-xs leading-5 text-gray-600">
                          Contains structured threat findings,
                          header analysis, infrastructure
                          intelligence, Threat DNA and evidence
                          integrity information.
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() =>
                        void downloadReport()
                      }
                      disabled={downloading}
                      className="
                        mt-5
                        w-full
                        rounded-lg
                        bg-cyan-500
                        px-4
                        py-3
                        text-xs
                        font-semibold
                        text-black
                        transition
                        hover:bg-cyan-400
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {downloading
                        ? "GENERATING REPORT..."
                        : "DOWNLOAD FORENSIC REPORT"}
                    </button>

                  </div>

                </div>
              </section>

              {/* ===============================================
                  CASE EVIDENCE DETAILS
              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621] xl:col-span-7">

                <SectionHeader
                  title="CASE EVIDENCE DETAILS"
                  subtitle="Identifiers associated with the preserved investigation artifact."
                />

                <div className="grid grid-cols-1 gap-px bg-gray-800 md:grid-cols-2">

                  <DetailCell
                    label="CASE ID"
                    value={
                      activeCase.case_id ||
                      "Unavailable"
                    }
                  />

                  <DetailCell
                    label="SEVERITY"
                    value={
                      activeCase.severity ||
                      "Unavailable"
                    }
                  />

                  <DetailCell
                    label="CLASSIFICATION"
                    value={
                      activeCase.classification ||
                      "Unavailable"
                    }
                  />

                  <DetailCell
                    label="STATUS"
                    value={
                      activeCase.status ||
                      "Unavailable"
                    }
                  />

                  <DetailCell
                    label="RISK SCORE"
                    value={`${activeCase.risk_score ?? 0} / 100`}
                  />

                  <DetailCell
                    label="SOURCE ARTIFACT"
                    value={
                      activeCase.filename ||
                      "Email evidence"
                    }
                  />

                </div>

              </section>

              {/* ===============================================
                  RECENT LEDGER EVENTS
              ================================================ */}

              <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0b1621] xl:col-span-12">

                <SectionHeader
                  title="RECENT LEDGER EVENTS"
                  subtitle="Evidence operations recorded by the TraceMail integrity ledger."
                />

                {ledger?.entries &&
                ledger.entries.length > 0 ? (
                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[700px] text-left">

                      <thead>
                        <tr className="border-b border-gray-800">

                          <th className="px-5 py-3 text-[9px] uppercase tracking-[0.18em] text-gray-600">
                            Event
                          </th>

                          <th className="px-5 py-3 text-[9px] uppercase tracking-[0.18em] text-gray-600">
                            Evidence Hash
                          </th>

                          <th className="px-5 py-3 text-[9px] uppercase tracking-[0.18em] text-gray-600">
                            Case
                          </th>

                          <th className="px-5 py-3 text-[9px] uppercase tracking-[0.18em] text-gray-600">
                            Timestamp
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {ledger.entries
                          .slice(0, 10)
                          .map((entry, index) => (
                            <tr
                              key={`${entry.evidence_hash || "event"}-${index}`}
                              className="border-b border-gray-800/70 transition hover:bg-white/[0.015]"
                            >

                              <td className="px-5 py-4 text-xs font-medium text-cyan-400">
                                {entry.event_type ||
                                  "EVIDENCE EVENT"}
                              </td>

                              <td className="max-w-[420px] px-5 py-4">

                                <p className="truncate font-mono text-[10px] text-gray-500">
                                  {entry.evidence_hash ||
                                    "—"}
                                </p>

                              </td>

                              <td className="px-5 py-4 font-mono text-[10px] text-gray-500">
                                {entry.case_id ||
                                  selectedCase ||
                                  "—"}
                              </td>

                              <td className="px-5 py-4 text-[10px] text-gray-600">
                                {entry.timestamp ||
                                  "—"}
                              </td>

                            </tr>
                          ))}

                      </tbody>

                    </table>

                  </div>
                ) : (
                  <EmptyState
                    title="NO LEDGER EVENTS"
                    description="No recorded evidence operations were returned by the backend."
                  />
                )}

              </section>

            </div>

            {/* =================================================
                DISCLAIMER
            ================================================== */}

            <div className="mt-5 rounded-xl border border-gray-800 bg-[#09131d] px-5 py-4">

              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                Evidence Handling Notice
              </p>

              <p className="mt-2 max-w-5xl text-[11px] leading-5 text-gray-600">
                TraceMail AI uses cryptographic hashes to
                detect changes to preserved evidence and
                maintain an auditable evidence history.
                Integrity verification supports forensic
                workflows but does not independently establish
                legal admissibility or prove attribution.
              </p>

            </div>

          </>
        )}
      </div>
    </main>
  );
}

/*
 * =============================================================
 * PAGE HEADING
 * =============================================================
 */

function PageHeading() {
  return (
    <div>
      <div className="flex items-center gap-3">

        <span className="h-6 w-1 rounded-full bg-cyan-400" />

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Evidence Integrity
        </h1>

      </div>

      <p className="mt-2 text-xs text-gray-600">
        Cryptographic evidence verification and
        chain-of-custody support.
      </p>
    </div>
  );
}

/*
 * =============================================================
 * SECTION HEADER
 * =============================================================
 */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-gray-800 px-5 py-4">

      <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">
        {title}
      </p>

      <p className="mt-1 text-xs text-gray-600">
        {subtitle}
      </p>

    </div>
  );
}

/*
 * =============================================================
 * CASE SUMMARY
 * =============================================================
 */

function CaseSummary({
  label,
  value,
  cyan = false,
  danger = false,
}: {
  label: string;
  value: string;
  cyan?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-[#09131d] px-5 py-4">

      <p className="text-[9px] uppercase tracking-[0.18em] text-gray-600">
        {label}
      </p>

      <p
        className={`
          mt-2
          truncate
          text-sm
          font-medium
          ${
            danger
              ? "text-red-400"
              : cyan
              ? "text-cyan-400"
              : "text-gray-300"
          }
        `}
      >
        {value}
      </p>

    </div>
  );
}

/*
 * =============================================================
 * INFO METRIC
 * =============================================================
 */

function InfoMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#09131d] p-4">

      <p className="text-[9px] uppercase tracking-[0.18em] text-gray-600">
        {label}
      </p>

      <p className="mt-2 truncate text-xs text-gray-400">
        {value}
      </p>

    </div>
  );
}

/*
 * =============================================================
 * DETAIL CELL
 * =============================================================
 */

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#09131d] p-5">

      <p className="text-[9px] uppercase tracking-[0.18em] text-gray-600">
        {label}
      </p>

      <p className="mt-2 break-words text-xs text-gray-300">
        {value}
      </p>

    </div>
  );
}

/*
 * =============================================================
 * LOADING
 * =============================================================
 */

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-cyan-400" />

        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gray-600">
          Loading Evidence
        </p>

      </div>

    </div>
  );
}

/*
 * =============================================================
 * EMPTY STATE
 * =============================================================
 */

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-6">

      <div className="max-w-md text-center">

        <p className="text-sm font-medium text-cyan-400">
          {title}
        </p>

        <p className="mt-2 text-xs leading-5 text-gray-600">
          {description}
        </p>

        {action ? (
          <div className="mt-5">
            {action}
          </div>
        ) : null}

      </div>

    </div>
  );
}