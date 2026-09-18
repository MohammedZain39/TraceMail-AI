"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type RiskFactor = {
  type?: string;
  message?: string;
  severity?: string;
};

type CaseData = {
  case_id?: string;
  filename?: string;
  evidence_hash?: string;
  status?: string;
  created_at?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
    date?: string;
    reply_to?: string;
    body?: string;

    attachments?: Array<{
      filename?: string;
      content_type?: string;
    }>;

    authentication?: {
      authentication_results?: string;
      received_spf?: string;
      dkim_signature_present?: boolean;
    };
  };

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
    risk_factors?: RiskFactor[];
    extracted_urls?: string[];
    extracted_domains?: string[];
    analysis_engine?: string;
  };

  forensic_analysis?: {
    total_received_headers?: number;
    all_ips?: string[];
    public_ips?: string[];
    earliest_observed_public_ip?: string;

    relay_path?: Array<{
      hop?: number;
      raw_header?: string;

      ips?: Array<{
        ip?: string;
        classification?: string;
      }>;
    }>;
  };

  ip_intelligence?: Record<string, unknown>;

  url_intelligence?: unknown;

  threat_dna?: {
    fingerprint?: Record<string, unknown>;
    dna_string?: string;
    risk_pattern?: string;
  };

  threat_graph?: {
    nodes?: Array<Record<string, unknown>>;
    edges?: Array<Record<string, unknown>>;
    node_count?: number;
    edge_count?: number;
  };
};

export default function InvestigationDetailPage() {
  const router = useRouter();
  const params = useParams();

  const caseId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [caseData, setCaseData] =
    useState<CaseData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [downloadingReport, setDownloadingReport] =
    useState(false);

  /*
   * =====================================================
   * LOAD CASE
   * =====================================================
   */

  useEffect(() => {
    if (!caseId) {
      return;
    }

    const loadCase = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `/cases/${encodeURIComponent(caseId)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Investigation not found (${response.status})`
          );
        }

        const data = await response.json();

        setCaseData(
          data?.case || null
        );
      } catch (err) {
        console.error(
          "Failed to load investigation:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load investigation."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCase();
  }, [caseId]);

  /*
   * =====================================================
   * DOWNLOAD FORENSIC REPORT
   * =====================================================
   */

  const downloadReport = async () => {
    if (!caseId || downloadingReport) {
      return;
    }

    try {
      setDownloadingReport(true);
      setError("");

      const response = await apiFetch(
        `/cases/${encodeURIComponent(caseId)}/report`
      );

      if (!response.ok) {
        throw new Error(
          `Report download failed (${response.status})`
        );
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;

      anchor.download =
        `${caseId}-forensic-report.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Failed to download report:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to download forensic report."
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071019] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-cyan-400 text-sm tracking-[0.3em] animate-pulse">
            TRACE MAIL AI
          </div>

          <p className="text-gray-500 mt-4">
            Loading forensic investigation...
          </p>

        </div>

      </main>
    );
  }

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (error || !caseData) {
    return (
      <main className="min-h-screen bg-[#071019] text-white flex items-center justify-center p-6">

        <div className="max-w-lg w-full border border-red-500/30 bg-[#0b1621] rounded-lg p-8 text-center">

          <div className="text-red-400 text-4xl mb-4">
            !
          </div>

          <h1 className="text-xl font-bold">
            Investigation Unavailable
          </h1>

          <p className="text-gray-500 mt-3">
            {error ||
              "The requested investigation could not be found."}
          </p>

          <button
            onClick={() =>
              router.push("/investigations")
            }
            className="mt-6 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded"
          >
            ← BACK TO INVESTIGATIONS
          </button>

        </div>

      </main>
    );
  }

  /*
   * =====================================================
   * DATA
   * =====================================================
   */

  const threat =
    caseData.threat_analysis || {};

  const forensic =
    caseData.forensic_analysis || {};

  const email =
    caseData.email || {};

  const dna =
    caseData.threat_dna || {};

  const graph =
    caseData.threat_graph || {};

  const risk =
    threat.risk_score ?? 0;

  const severity =
    String(
      threat.severity || "UNKNOWN"
    ).toUpperCase();

  const classification =
    threat.classification ||
    "Unknown Classification";

  const severityClass =
    severity === "CRITICAL"
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : severity === "HIGH"
      ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
      : severity === "MEDIUM"
      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
      : "text-green-400 bg-green-500/10 border-green-500/30";

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-[#071019] text-white">

      {/* HEADER */}

      <header className="border-b border-gray-800 bg-[#09131d]">

        <div className="max-w-7xl mx-auto px-8 py-6">

          <button
            onClick={() =>
              router.push("/investigations")
            }
            className="text-gray-500 hover:text-cyan-400 text-sm mb-5"
          >
            ← Back to Investigations
          </button>

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-xs tracking-[0.3em] text-cyan-400 mb-2">
                FORENSIC INVESTIGATION
              </p>

              <h1 className="text-3xl font-bold">
                {caseData.case_id ||
                  caseId}
              </h1>

              <p className="text-gray-500 mt-2">
                {caseData.filename ||
                  "Email Evidence"}
              </p>

            </div>

            <div className="text-right">

              <div className="text-4xl font-bold">

                {risk}

                <span className="text-gray-600 text-lg">
                  /100
                </span>

              </div>

              <span
                className={`inline-block mt-2 border rounded px-3 py-1 text-xs font-bold ${severityClass}`}
              >
                {severity}
              </span>

            </div>

          </div>

        </div>

      </header>

      {/* MAIN CONTENT */}

      <section className="max-w-7xl mx-auto p-8">

        {/* THREAT CLASSIFICATION */}

        <div className="border border-gray-800 bg-[#0b1621] rounded-lg p-6 mb-6">

          <p className="text-xs tracking-widest text-gray-600 mb-3">
            THREAT CLASSIFICATION
          </p>

          <h2 className="text-2xl font-bold">
            {classification}
          </h2>

          {threat.risk_factors &&
            threat.risk_factors.length > 0 && (

              <div className="mt-5 space-y-2">

                {threat.risk_factors.map(
                  (factor, index) => (

                    <div
                      key={`${factor.type || "factor"}-${index}`}
                      className="flex items-center justify-between gap-4 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />

                        <div className="min-w-0">

                          <p className="text-sm text-red-300">
                            {factor.message ||
                              "Risk factor detected"}
                          </p>

                          {factor.type && (
                            <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
                              {factor.type}
                            </p>
                          )}

                        </div>

                      </div>

                      {factor.severity && (
                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-red-400 border border-red-500/20 px-2 py-1 rounded">
                          {factor.severity}
                        </span>
                      )}

                    </div>

                  )
                )}

              </div>
            )}

        </div>

        {/* EMAIL + AUTHENTICATION */}

        <div className="grid grid-cols-2 gap-6 mb-6">

          <Panel title="EMAIL EVIDENCE">

            <InfoRow
              label="FROM"
              value={
                email.sender ||
                "Unknown"
              }
            />

            <InfoRow
              label="TO"
              value={
                email.recipient ||
                "Unknown"
              }
            />

            <InfoRow
              label="REPLY-TO"
              value={
                email.reply_to ||
                "Not present"
              }
            />

            <InfoRow
              label="SUBJECT"
              value={
                email.subject ||
                "Unknown"
              }
            />

            <InfoRow
              label="DATE"
              value={
                email.date ||
                "Unknown"
              }
            />

          </Panel>

          <Panel title="AUTHENTICATION">

            <InfoRow
              label="SPF"
              value={
                email.authentication
                  ?.received_spf ||
                "Not available"
              }
            />

            <InfoRow
              label="DKIM"
              value={
                email.authentication
                  ?.dkim_signature_present
                  ? "SIGNATURE PRESENT"
                  : "NOT PRESENT"
              }
            />

            <InfoRow
              label="AUTH RESULTS"
              value={
                email.authentication
                  ?.authentication_results ||
                "Not available"
              }
            />

          </Panel>

        </div>

        {/* HEADER FORENSICS */}

        <Panel title="HEADER FORENSICS">

          <div className="grid grid-cols-4 gap-4 mb-6">

            <Metric
              label="RECEIVED HOPS"
              value={String(
                forensic.total_received_headers ??
                  0
              )}
            />

            <Metric
              label="OBSERVED IPS"
              value={String(
                forensic.all_ips?.length ??
                  0
              )}
            />

            <Metric
              label="PUBLIC IPS"
              value={String(
                forensic.public_ips?.length ??
                  0
              )}
            />

            <Metric
              label="EARLIEST OBSERVED"
              value={
                forensic.earliest_observed_public_ip ||
                "UNKNOWN"
              }
            />

          </div>

          {forensic.relay_path &&
            forensic.relay_path.length > 0 && (

              <div className="space-y-3">

                {forensic.relay_path.map(
                  (hop, index) => (

                    <div
                      key={index}
                      className="border border-gray-800 rounded-lg p-4 bg-[#071019]"
                    >

                      <div className="flex justify-between">

                        <span className="text-cyan-400 text-sm">
                          HOP{" "}
                          {hop.hop ??
                            index + 1}
                        </span>

                        <span className="text-xs text-gray-600">
                          {hop.ips?.length ||
                            0}{" "}
                          IP(s)
                        </span>

                      </div>

                      <p className="text-xs text-gray-500 mt-3 break-all">
                        {hop.raw_header ||
                          "No raw header available"}
                      </p>

                      {hop.ips &&
                        hop.ips.length > 0 && (

                          <div className="mt-4 flex flex-wrap gap-2">

                            {hop.ips.map(
                              (item, ipIndex) => (

                                <span
                                  key={`${item.ip || "ip"}-${ipIndex}`}
                                  className="font-mono text-xs border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 rounded px-3 py-2"
                                >
                                  {item.ip ||
                                    "Unknown IP"}

                                  {item.classification && (
                                    <span className="text-gray-600 ml-2">
                                      {item.classification}
                                    </span>
                                  )}
                                </span>

                              )
                            )}

                          </div>
                        )}

                    </div>

                  )
                )}

              </div>
            )}

        </Panel>

        {/* IP + URL INTELLIGENCE */}

        <div className="grid grid-cols-2 gap-6 mt-6">

          <Panel title="IP INTELLIGENCE">

            {forensic.public_ips &&
            forensic.public_ips.length > 0 ? (

              <div className="space-y-3">

                {forensic.public_ips.map(
                  (ip) => (

                    <div
                      key={ip}
                      className="border border-gray-800 rounded-lg p-4"
                    >

                      <p className="text-cyan-400 font-mono">
                        {ip}
                      </p>

                      <p className="text-xs text-gray-600 mt-2">
                        Infrastructure intelligence available
                      </p>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-gray-600">
                No public IP addresses observed.
              </p>

            )}

          </Panel>

          <Panel title="URL / IOC INTELLIGENCE">

            <p className="text-xs text-gray-500 mb-4">
              Extracted URLs
            </p>

            {threat.extracted_urls &&
            threat.extracted_urls.length > 0 ? (

              <div className="space-y-3">

                {threat.extracted_urls.map(
                  (url) => (

                    <div
                      key={url}
                      className="border border-red-500/20 bg-red-500/5 rounded-lg p-4"
                    >

                      <p className="text-red-300 text-sm break-all font-mono">
                        {url}
                      </p>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-gray-600">
                No URLs extracted.
              </p>

            )}

            {threat.extracted_domains &&
              threat.extracted_domains.length > 0 && (

                <div className="mt-5">

                  <p className="text-xs text-gray-500 mb-3">
                    Domains
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {threat.extracted_domains.map(
                      (domain) => (

                        <span
                          key={domain}
                          className="text-xs text-cyan-400 border border-cyan-500/20 rounded px-3 py-2"
                        >
                          {domain}
                        </span>

                      )
                    )}

                  </div>

                </div>
              )}

          </Panel>

        </div>

        {/* THREAT DNA */}

        <div className="mt-6">

          <Panel title="THREAT DNA">

            <div className="grid grid-cols-3 gap-4 mb-5">

              <Metric
                label="PATTERN"
                value={
                  dna.risk_pattern ||
                  "Unknown"
                }
              />

              <Metric
                label="NODES"
                value={String(
                  graph.node_count ?? 0
                )}
              />

              <Metric
                label="EDGES"
                value={String(
                  graph.edge_count ?? 0
                )}
              />

            </div>

            <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-lg p-5">

              <p className="text-[10px] tracking-widest text-gray-500 mb-3">
                DNA FINGERPRINT
              </p>

              <p className="text-cyan-400 font-mono text-sm break-all">
                {dna.dna_string ||
                  "Fingerprint unavailable"}
              </p>

            </div>

          </Panel>

        </div>

        {/* THREAT GRAPH */}

        <div className="mt-6">

          <Panel title="THREAT GRAPH">

            <div className="grid grid-cols-2 gap-4">

              <Metric
                label="GRAPH NODES"
                value={String(
                  graph.node_count ?? 0
                )}
              />

              <Metric
                label="GRAPH RELATIONSHIPS"
                value={String(
                  graph.edge_count ?? 0
                )}
              />

            </div>

            <div className="mt-5 border border-gray-800 rounded-lg p-5 bg-[#071019]">

              <p className="text-sm text-gray-400">
                Email infrastructure relationship graph generated from the investigation.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/threat-graph"
                  )
                }
                className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
              >
                Open Threat Graph →
              </button>

            </div>

          </Panel>

        </div>

        {/* EVIDENCE INTEGRITY */}

        <div className="mt-6">

          <Panel title="EVIDENCE INTEGRITY">

            <div className="border border-gray-800 bg-[#071019] rounded-lg p-5">

              <p className="text-[10px] tracking-widest text-gray-600 mb-3">
                SHA-256 EVIDENCE HASH
              </p>

              <p className="font-mono text-xs text-cyan-400 break-all">
                {caseData.evidence_hash ||
                  "Evidence hash unavailable"}
              </p>

            </div>

            <div className="mt-4 flex items-center justify-between gap-4">

              <div>

                <p className="text-sm text-green-400">
                  ✓ Evidence integrity recorded
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  TraceMail evidence ledger
                </p>

              </div>

              <button
                onClick={() =>
                  void downloadReport()
                }
                disabled={downloadingReport}
                className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingReport
                  ? "GENERATING REPORT..."
                  : "DOWNLOAD FORENSIC REPORT"}
              </button>

            </div>

          </Panel>

        </div>

      </section>

    </main>
  );
}

/*
 * =========================================================
 * PANEL
 * =========================================================
 */

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-800 bg-[#0b1621] rounded-lg p-6">

      <h2 className="text-xs tracking-[0.2em] text-gray-500 mb-5">
        {title}
      </h2>

      {children}

    </section>
  );
}

/*
 * =========================================================
 * INFO ROW
 * =========================================================
 */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-gray-800 last:border-0 py-3">

      <p className="text-[10px] tracking-widest text-gray-600">
        {label}
      </p>

      <p className="text-sm text-gray-300 mt-1 break-all">
        {value}
      </p>

    </div>
  );
}

/*
 * =========================================================
 * METRIC
 * =========================================================
 */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-[#071019]">

      <p className="text-[10px] tracking-widest text-gray-600">
        {label}
      </p>

      <p className="text-lg font-bold mt-2 text-gray-200 break-all">
        {value}
      </p>

    </div>
  );
}