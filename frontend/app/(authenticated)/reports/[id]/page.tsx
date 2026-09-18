"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type RiskFactor =
  | string
  | {
      factor?: string;
      reason?: string;
      points?: number;
      score?: number;
      description?: string;
      message?: string;
      name?: string;
      title?: string;
      indicator?: string;
      risk_factor?: string;
      type?: string;
      detail?: string;
      weight?: number;
      value?: unknown;
    };

type EmailData = {
  sender?: string;
  recipient?: string;
  subject?: string;
  date?: string;
  reply_to?: string;
  reply_to_address?: string;
  message_id?: string;
  authentication_results?: string;
  received_spf?: string;
  body?: string;
  received_headers?: string[];
  received?: string[];
  attachments?: string[];
};

type ThreatAnalysis = {
  risk_score?: number;
  severity?: string;
  classification?: string;
  risk_factors?: RiskFactor[];
  extracted_urls?: string[];
  extracted_domains?: string[];
};

type ForensicAnalysis = {
  ips?: string[];
  public_ips?: string[];
  relay_path?: unknown[];
  earliest_observed_public_ip?: string | null;
  hop_count?: number;
};

type IPIntelligence = {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  org?: string;
  asn?: string;
  hosting?: boolean;
  proxy?: boolean;
  vpn?: boolean;
  tor?: boolean;
  risk?: string;
};

type URLIntelligence = {
  url?: string;
  domain?: string;
  suspicious?: boolean;
  typosquatting?: boolean;
  risk?: string;
  reasons?: string[];
};

type ThreatDNA = {
  fingerprint?: Record<string, unknown>;
  dna_string?: string;
  risk_pattern?: string;
};

type EvidenceData = {
  hash?: string;
  algorithm?: string;
  status?: string;
};

type CaseData = {
  case_id?: string;
  filename?: string;
  created_at?: string;
  status?: string;
  evidence_hash?: string;

  email?: EmailData;

  threat_analysis?: ThreatAnalysis;

  forensic_analysis?: ForensicAnalysis;

  ip_intelligence?: IPIntelligence[];

  url_intelligence?: URLIntelligence[];

  threat_dna?: ThreatDNA;

  threat_graph?: unknown;

  evidence?: EvidenceData;
};

/* ============================================================
   HELPERS
   ============================================================ */

function safeString(
  value: unknown,
  fallback = "Unavailable"
) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
}

function formatDate(value?: string) {
  if (!value) return "Unavailable";

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

function normalizeResult(value?: string) {
  if (!value) return "UNKNOWN";

  const text = value.toUpperCase();

  if (text.includes("FAIL")) return "FAIL";
  if (text.includes("PASS")) return "PASS";
  if (text.includes("NONE")) return "NONE";

  return text;
}

function resultClass(result: string) {
  if (result === "FAIL") return "danger";
  if (result === "PASS") return "success";

  return "neutral";
}

function severityClass(severity?: string) {
  switch (String(severity || "").toUpperCase()) {
    case "CRITICAL":
      return "critical";

    case "HIGH":
      return "high";

    case "MEDIUM":
      return "medium";

    case "LOW":
    case "SAFE":
      return "low";

    default:
      return "neutral";
  }
}

function riskForIOC(value?: string) {
  const text = String(value || "").toLowerCase();

  if (
    text.includes("typo") ||
    text.includes("suspicious") ||
    text.includes("malicious")
  ) {
    return "HIGH";
  }

  return "OBSERVED";
}

/* ============================================================
   RISK FACTOR FORMATTER
   ============================================================ */

function formatRiskFactor(
  factor: RiskFactor
): {
  text: string;
  points?: number;
} {
  /*
   * Backend may return a simple string.
   */
  if (typeof factor === "string") {
    return {
      text: factor,
    };
  }

  if (!factor || typeof factor !== "object") {
    return {
      text: "Risk indicator detected",
    };
  }

  /*
   * First try the most descriptive fields.
   */
  const directText =
    factor.factor ||
    factor.reason ||
    factor.description ||
    factor.message ||
    factor.name ||
    factor.title ||
    factor.indicator ||
    factor.risk_factor ||
    factor.detail;

  let text = directText
    ? String(directText)
    : "";

  /*
   * If the backend sends a compact "type" field,
   * convert common detector values into readable
   * analyst-friendly descriptions.
   */
  if (!text && factor.type) {
    const type = String(factor.type)
      .toLowerCase()
      .replaceAll("_", " ")
      .trim();

    const knownDescriptions: Record<
      string,
      string
    > = {
      "spf fail":
        "SPF authentication failed",

      "spf failure":
        "SPF authentication failed",

      "dkim fail":
        "DKIM authentication failed",

      "dkim failure":
        "DKIM authentication failed",

      "dmarc fail":
        "DMARC authentication failed",

      "dmarc failure":
        "DMARC authentication failed",

      "reply to mismatch":
        "Reply-To address does not match the sender",

      "reply-to mismatch":
        "Reply-To address does not match the sender",

      urgency:
        "Urgent or pressure-based language detected",

      "urgent language":
        "Urgent or pressure-based language detected",

      financial:
        "Financial or payment-related language detected",

      "financial language":
        "Financial or payment-related language detected",

      credential:
        "Credential or account-verification language detected",

      "credential request":
        "Credential or account-verification language detected",

      url:
        "URL detected in the email",

      "suspicious url":
        "Suspicious URL detected",

      typosquatting:
        "Potential typosquatting domain detected",

      attachment:
        "Attachment detected",

      threat:
        "Threat or account-pressure language detected",
    };

    text =
      knownDescriptions[type] ||
      String(factor.type);
  }

  /*
   * If no descriptive field exists, inspect the object
   * instead of immediately displaying a generic message.
   */
  if (!text) {
    const ignoredKeys = new Set([
      "points",
      "score",
      "weight",
      "value",
    ]);

    const usefulEntries = Object.entries(
      factor
    ).filter(
      ([key, value]) =>
        !ignoredKeys.has(key) &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    );

    if (usefulEntries.length > 0) {
      text = usefulEntries
        .map(
          ([key, value]) =>
            `${key
              .replaceAll("_", " ")
              .replace(/\b\w/g, (char) =>
                char.toUpperCase()
              )}: ${String(value)}`
        )
        .join(" • ");
    }
  }

  /*
   * Final fallback.
   */
  if (!text) {
    text = "Risk indicator detected";
  }

  const rawPoints =
    factor.points ??
    factor.score ??
    factor.weight;

  const points =
    typeof rawPoints === "number"
      ? rawPoints
      : Number.isFinite(
            Number(rawPoints)
          )
        ? Number(rawPoints)
        : undefined;

  return {
    text,
    points,
  };
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function ReportViewerPage() {
  const router = useRouter();
  const params = useParams();

  const caseId = useMemo(() => {
    const value = params?.id;

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return value ? String(value) : "";
  }, [params]);

  const [caseData, setCaseData] =
    useState<CaseData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [downloading, setDownloading] =
    useState(false);

  /* ============================================================
     LOAD CASE
     ============================================================ */

  const loadCase = useCallback(async () => {
    if (!caseId) {
      setError("No case ID was provided.");
      setLoading(false);
      return;
    }

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
        let message =
          `Unable to load case (${response.status})`;

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore JSON parse error.
        }

        throw new Error(message);
      }

      const data = await response.json();

      const resolvedCase =
        data?.case ||
        data?.case_data ||
        data;

      setCaseData(resolvedCase);
    } catch (err) {
      console.error(
        "Failed to load forensic case:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load forensic case."
      );

      setCaseData(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  /* ============================================================
     PDF DOWNLOAD
     ============================================================ */

  const downloadPDF = async () => {
    if (!caseId || downloading) return;

    try {
      setDownloading(true);
      setError("");

      const response = await apiFetch(
        `/cases/${encodeURIComponent(caseId)}/report`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let message =
          `Report download failed (${response.status})`;

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore.
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
          : "Unable to download report."
      );
    } finally {
      setDownloading(false);
    }
  };

  /* ============================================================
     DERIVED DATA
     ============================================================ */

  const email = caseData?.email;

  const threat =
    caseData?.threat_analysis;

  const forensic =
    caseData?.forensic_analysis;

  const riskScore =
    typeof threat?.risk_score === "number"
      ? threat.risk_score
      : 0;

  const severity =
    String(
      threat?.severity || "UNKNOWN"
    ).toUpperCase();

  const classification =
    threat?.classification ||
    "Potentially Suspicious";

  const riskFactors =
    Array.isArray(threat?.risk_factors)
      ? threat.risk_factors
      : [];

  const urls =
    Array.isArray(threat?.extracted_urls)
      ? threat.extracted_urls
      : [];

  const domains =
    Array.isArray(threat?.extracted_domains)
      ? threat.extracted_domains
      : [];

  /* ============================================================
     ONLY USE OBSERVED PUBLIC IPs
     ============================================================ */

  const publicIPs = useMemo(() => {
    const ips =
      forensic?.public_ips || [];

    return Array.from(
      new Set(
        ips.filter(
          (ip): ip is string =>
            typeof ip === "string" &&
            ip.trim().length > 0
        )
      )
    );
  }, [forensic?.public_ips]);

  /* ============================================================
     ONLY MATCH INTELLIGENCE TO OBSERVED IPs
     ============================================================ */

  const ipIntelligence =
    useMemo(() => {
      const raw =
        Array.isArray(caseData?.ip_intelligence)
          ? caseData.ip_intelligence
          : [];

      return raw.filter(
        (item) =>
          typeof item.ip === "string" &&
          publicIPs.includes(item.ip)
      );
    }, [
      caseData?.ip_intelligence,
      publicIPs,
    ]);

  const evidenceHash =
    caseData?.evidence_hash ||
    caseData?.evidence?.hash ||
    "Evidence hash unavailable";

  /* ============================================================
     AUTHENTICATION
     ============================================================ */

  const authenticationResults =
    safeString(
      email?.authentication_results,
      ""
    );

  const spf =
    normalizeResult(
      authenticationResults.match(
        /spf[=\s:]+([a-z]+)/i
      )?.[1] ||
        email?.received_spf ||
        ""
    );

  const dkim =
    normalizeResult(
      authenticationResults.match(
        /dkim[=\s:]+([a-z]+)/i
      )?.[1] || ""
    );

  const dmarc =
    normalizeResult(
      authenticationResults.match(
        /dmarc[=\s:]+([a-z]+)/i
      )?.[1] || ""
    );

  const replyTo =
    email?.reply_to ||
    email?.reply_to_address ||
    "Unavailable";

  /* ============================================================
     EARLIEST OBSERVED IP
     ============================================================ */

  const earliestIP =
    forensic?.earliest_observed_public_ip ||
    publicIPs[publicIPs.length - 1] ||
    null;

  const primaryIPIntel =
    ipIntelligence.find(
      (item) => item.ip === earliestIP
    ) ||
    ipIntelligence[0] ||
    null;

  const hostingIndicator =
    primaryIPIntel?.hosting === true
      ? "YES"
      : primaryIPIntel?.hosting === false
        ? "NO"
        : "UNKNOWN";

  const location =
    primaryIPIntel
      ? [
          primaryIPIntel.city,
          primaryIPIntel.region,
          primaryIPIntel.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "No geolocation available";

  const provider =
    primaryIPIntel?.isp ||
    primaryIPIntel?.org ||
    "Unavailable";

  const dna =
    caseData?.threat_dna;

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <main className="tm-report-viewer">

        <div className="tm-report-loading">

          <div className="tm-loading-mark">
            T
          </div>

          <p>
            TRACE MAIL AI
          </p>

          <span>
            Loading forensic report...
          </span>

        </div>

        <ReportViewerStyles />

      </main>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error || !caseData) {
    return (
      <main className="tm-report-viewer">

        <div className="tm-report-error">

          <div className="tm-error-symbol">
            !
          </div>

          <h1>
            Unable to Load Report
          </h1>

          <p>
            {error ||
              "The requested forensic case could not be found."}
          </p>

          <div className="tm-error-actions">

            <button
              onClick={() =>
                void loadCase()
              }
              className="tm-button secondary"
            >
              RETRY
            </button>

            <button
              onClick={() =>
                router.push("/reports")
              }
              className="tm-button primary"
            >
              BACK TO REPORTS
            </button>

          </div>

        </div>

        <ReportViewerStyles />

      </main>
    );
  }

  /* ============================================================
     REPORT
     ============================================================ */

  return (
    <main className="tm-report-viewer">

      <div className="tm-report-container">

        {/* ======================================================
           HEADER
        ====================================================== */}

        <header className="tm-report-top">

          <div className="tm-report-heading">

            <button
              onClick={() =>
                router.push("/reports")
              }
              className="tm-back-button"
            >
              ← BACK TO REPORTS
            </button>

            <p className="tm-eyebrow">
              FORENSIC REPORT
            </p>

            <h1>
              Investigation Report
            </h1>

            <p className="tm-case-reference">
              {safeString(
                caseData.case_id,
                caseId
              )}
            </p>

          </div>

          <div className="tm-header-actions">

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="tm-button secondary"
            >
              {downloading
                ? "GENERATING..."
                : "EXPORT PDF"}
            </button>

            <button
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    "tracemail_case_id",
                    caseId
                  );
                } catch {
                  // Ignore.
                }

                router.push("/evidence");
              }}
              className="tm-button primary"
            >
              VIEW EVIDENCE
            </button>

          </div>

        </header>

        {/* INLINE ERROR */}

        {error && (
          <div className="tm-inline-error">
            {error}
          </div>
        )}

        {/* ======================================================
           SUMMARY CARDS
        ====================================================== */}

        <section className="tm-summary-grid">

          <ReportStat
            label="CASE ID"
            value={safeString(
              caseData.case_id,
              caseId
            )}
          />

          <ReportStat
            label="RISK SCORE"
            value={`${riskScore} / 100`}
            accent={severityClass(
              severity
            )}
          />

          <ReportStat
            label="CLASSIFICATION"
            value={classification}
          />

          <ReportStat
            label="EVIDENCE"
            value={
              evidenceHash !==
              "Evidence hash unavailable"
                ? "LINKED"
                : "UNAVAILABLE"
            }
          />

        </section>

        {/* ======================================================
           01 EXECUTIVE SUMMARY
        ====================================================== */}

        <ReportSection
          title="01 — EXECUTIVE SUMMARY"
        >

          <div className="tm-executive">

            <div
              className={`tm-severity-banner ${severityClass(
                severity
              )}`}
            >

              <div>

                <span>
                  THREAT ASSESSMENT
                </span>

                <strong>
                  {severity}
                </strong>

              </div>

              <div className="tm-score-large">
                {riskScore}
                <small>
                  /100
                </small>
              </div>

            </div>

            <p>
              TraceMail AI analyzed the submitted
              communication and classified it as{" "}
              <strong>
                {classification}
              </strong>{" "}
              with a risk score of{" "}
              <strong>
                {riskScore}/100
              </strong>
              .
            </p>

            <p>
              The report contains the evidence and
              intelligence actually associated with
              this case. Findings should be interpreted
              together with the original email headers
              and preserved evidence.
            </p>

          </div>

        </ReportSection>

        {/* ======================================================
           02 EMAIL DETAILS
        ====================================================== */}

        <ReportSection
          title="02 — EMAIL DETAILS"
        >

          <div className="tm-detail-grid">

            <Detail
              label="FROM"
              value={safeString(
                email?.sender
              )}
            />

            <Detail
              label="TO"
              value={safeString(
                email?.recipient
              )}
            />

            <Detail
              label="REPLY-TO"
              value={replyTo}
            />

            <Detail
              label="SUBJECT"
              value={safeString(
                email?.subject
              )}
            />

            <Detail
              label="DATE"
              value={formatDate(
                email?.date
              )}
            />

            <Detail
              label="MESSAGE ID"
              value={safeString(
                email?.message_id
              )}
            />

            <Detail
              label="SOURCE FILE"
              value={safeString(
                caseData.filename
              )}
            />

            <Detail
              label="CASE STATUS"
              value={safeString(
                caseData.status
              )}
            />

          </div>

        </ReportSection>

        {/* ======================================================
           03 AUTHENTICATION
        ====================================================== */}

        <ReportSection
          title="03 — EMAIL AUTHENTICATION"
        >

          <div className="tm-auth-grid">

            <AuthCard
              name="SPF"
              result={spf}
            />

            <AuthCard
              name="DKIM"
              result={dkim}
            />

            <AuthCard
              name="DMARC"
              result={dmarc}
            />

          </div>

          <div className="tm-assessment-box">

            <p className="tm-small-label">
              AUTHENTICATION ASSESSMENT
            </p>

            <p>
              Authentication results are presented
              from the analyzed email metadata.
              A passing authentication result alone
              does not establish that a message is safe.
            </p>

          </div>

        </ReportSection>

        {/* ======================================================
           04 THREAT ASSESSMENT
        ====================================================== */}

        <ReportSection
          title="04 — THREAT ASSESSMENT"
        >

          <div className="tm-assessment-grid">

            <AssessmentCard
              title="SEVERITY"
              value={severity}
            />

            <AssessmentCard
              title="THREAT TYPE"
              value={classification}
            />

            <AssessmentCard
              title="RISK SCORE"
              value={`${riskScore} / 100`}
            />

          </div>

          <div className="tm-risk-section">

            <p className="tm-small-label">
              IDENTIFIED RISK FACTORS
            </p>

            {riskFactors.length === 0 ? (
              <div className="tm-empty">
                No detailed risk factors were
                returned for this case.
              </div>
            ) : (
              <div className="tm-risk-list">

                {riskFactors.map(
                  (factor, index) => {

                    const formatted =
                      formatRiskFactor(
                        factor
                      );

                    return (
                      <div
                        key={`${formatted.text}-${index}`}
                        className="tm-risk-item"
                      >

                        <span className="tm-risk-dot" />

                        <span className="tm-risk-text">
                          {formatted.text}
                        </span>

                        {typeof formatted.points ===
                          "number" && (
                          <strong>
                            +{formatted.points}
                          </strong>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </ReportSection>

        {/* ======================================================
           05 IOC
        ====================================================== */}

        <ReportSection
          title="05 — INDICATORS OF COMPROMISE"
        >

          <div className="tm-ioc-list">

            {domains.map(
              (domain, index) => (
                <IOC
                  key={`domain-${index}`}
                  type="DOMAIN"
                  value={domain}
                  risk={riskForIOC(
                    domain
                  )}
                />
              )
            )}

            {urls.map(
              (url, index) => (
                <IOC
                  key={`url-${index}`}
                  type="URL"
                  value={url}
                  risk={riskForIOC(
                    url
                  )}
                />
              )
            )}

            {publicIPs.map(
              (ip, index) => (
                <IOC
                  key={`ip-${index}`}
                  type="OBSERVED IP"
                  value={ip}
                  risk="OBSERVED"
                />
              )
            )}

            {replyTo !==
              "Unavailable" && (
              <IOC
                type="REPLY-TO"
                value={replyTo}
                risk="OBSERVED"
              />
            )}

            {domains.length === 0 &&
              urls.length === 0 &&
              publicIPs.length === 0 &&
              replyTo === "Unavailable" && (
                <div className="tm-empty">
                  No indicators of compromise
                  were extracted from this case.
                </div>
              )}

          </div>

          <p className="tm-disclaimer">
            Observed IP intelligence represents
            infrastructure context. It should not
            automatically be interpreted as the physical
            location or identity of an attacker.
          </p>

        </ReportSection>

        {/* ======================================================
           06 ROUTING
        ====================================================== */}

        <ReportSection
          title="06 — EMAIL ROUTING & FORENSICS"
        >

          <div className="tm-forensics-grid">

            <Detail
              label="PUBLIC IPs OBSERVED"
              value={
                publicIPs.length
                  ? publicIPs.join(", ")
                  : "No public IP observed"
              }
            />

            <Detail
              label="HOP COUNT"
              value={safeString(
                forensic?.hop_count,
                "Unavailable"
              )}
            />

            <Detail
              label="EARLIEST OBSERVED PUBLIC IP"
              value={
                earliestIP ||
                "No public IP observed"
              }
            />

          </div>

          <div className="tm-relay-box">

            <p className="tm-small-label tm-relay-heading">
              OBSERVED RELAY PATH
            </p>

            {publicIPs.length === 0 ? (
              <div className="tm-empty">
                No public relay IP was observed
                in the analyzed headers.
              </div>
            ) : (
              <div className="tm-relay-list">

                {publicIPs.map(
                  (ip, index) => (
                    <RelayStep
                      key={ip}
                      number={String(
                        index + 1
                      ).padStart(2, "0")}
                      title={
                        index ===
                        publicIPs.length - 1
                          ? "Earliest observed public infrastructure"
                          : "Observed public infrastructure"
                      }
                      value={ip}
                    />
                  )
                )}

              </div>
            )}

          </div>

          <div className="tm-note-box">
            Header-derived routing information can be
            incomplete or spoofed. The earliest observed
            public IP is therefore treated as an
            infrastructure observation, not definitive
            attacker attribution.
          </div>

        </ReportSection>

        {/* ======================================================
           07 GEO
        ====================================================== */}

        <ReportSection
          title="07 — GEO & INFRASTRUCTURE INTELLIGENCE"
        >

          {ipIntelligence.length === 0 ? (

            <div className="tm-empty large">

              <strong>
                No geolocation available
              </strong>

              <span>
                No observed public IP has usable
                geolocation intelligence for this case.
              </span>

            </div>

          ) : (

            <>

              <div className="tm-infrastructure-grid">

                <InfrastructureCard
                  label="IP ADDRESS"
                  value={safeString(
                    primaryIPIntel?.ip
                  )}
                />

                <InfrastructureCard
                  label="PROVIDER"
                  value={provider}
                />

                <InfrastructureCard
                  label="LOCATION"
                  value={location}
                />

                <InfrastructureCard
                  label="HOSTING INDICATOR"
                  value={hostingIndicator}
                />

                <InfrastructureCard
                  label="ASN"
                  value={safeString(
                    primaryIPIntel?.asn
                  )}
                />

                <InfrastructureCard
                  label="COUNTRY"
                  value={safeString(
                    primaryIPIntel?.country
                  )}
                />

              </div>

              {ipIntelligence.length > 1 && (

                <div className="tm-ip-table">

                  <p className="tm-small-label">
                    OBSERVED PUBLIC INFRASTRUCTURE
                  </p>

                  {ipIntelligence.map(
                    (item) => (

                      <div
                        key={item.ip}
                        className="tm-ip-row"
                      >

                        <span>
                          {item.ip}
                        </span>

                        <span>
                          {[
                            item.city,
                            item.region,
                            item.country,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "Location unavailable"}
                        </span>

                        <span>
                          {item.isp ||
                            item.org ||
                            "Provider unavailable"}
                        </span>

                      </div>

                    )
                  )}

                </div>

              )}

            </>

          )}

          <p className="tm-disclaimer">
            Geolocation represents infrastructure
            context derived from observed public IP
            addresses. It does not establish the exact
            physical location or identity of an attacker.
          </p>

        </ReportSection>

        {/* ======================================================
           08 THREAT DNA
        ====================================================== */}

        <ReportSection
          title="08 — THREAT DNA"
        >

          {dna ? (

            <div className="tm-dna-box">

              <p className="tm-small-label">
                ATTACK FINGERPRINT
              </p>

              <div className="tm-dna-grid">

                {Object.entries(
                  dna.fingerprint || {}
                ).map(
                  ([label, value]) => (

                    <DNA
                      key={label}
                      label={label
                        .replaceAll(
                          "_",
                          " "
                        )
                        .toUpperCase()}
                      value={String(value)}
                    />

                  )
                )}

              </div>

              {dna.dna_string && (

                <div className="tm-dna-string">

                  <p className="tm-small-label">
                    DNA STRING
                  </p>

                  <code>
                    {dna.dna_string}
                  </code>

                </div>

              )}

              {dna.risk_pattern && (

                <div className="tm-dna-pattern">

                  <span>
                    RISK PATTERN
                  </span>

                  <strong>
                    {dna.risk_pattern}
                  </strong>

                </div>

              )}

            </div>

          ) : (

            <div className="tm-empty">
              Threat DNA was not generated for
              this case.
            </div>

          )}

        </ReportSection>

        {/* ======================================================
           09 EVIDENCE
        ====================================================== */}

        <ReportSection
          title="09 — EVIDENCE INTEGRITY"
        >

          <div className="tm-evidence-box">

            <div className="tm-evidence-header">

              <div>

                <p className="tm-small-label">
                  INTEGRITY STATUS
                </p>

                <strong>
                  {evidenceHash !==
                  "Evidence hash unavailable"
                    ? "LINKED"
                    : "UNAVAILABLE"}
                </strong>

              </div>

              <div>

                <p className="tm-small-label">
                  HASH ALGORITHM
                </p>

                <code>
                  {caseData.evidence?.algorithm ||
                    "SHA-256"}
                </code>

              </div>

            </div>

            <div className="tm-hash-block">

              <p className="tm-small-label">
                ORIGINAL EVIDENCE HASH
              </p>

              <code>
                {evidenceHash}
              </code>

            </div>

          </div>

          <p className="tm-disclaimer">
            Evidence hashing supports integrity
            verification and tamper detection. It does
            not by itself establish legal admissibility.
          </p>

        </ReportSection>

        {/* ======================================================
           10 CONCLUSION
        ====================================================== */}

        <ReportSection
          title="10 — ANALYST CONCLUSION"
        >

          <div className="tm-conclusion">

            <p>
              The analyzed communication received a
              risk score of{" "}
              <strong>
                {riskScore}/100
              </strong>{" "}
              and was classified as{" "}
              <strong>
                {classification}
              </strong>
              .
            </p>

            <p>
              The investigation should consider the
              identified authentication results,
              extracted indicators, routing evidence
              and infrastructure intelligence together
              rather than relying on any single signal.
            </p>

            <p>
              Recommended action: preserve the original
              evidence, avoid interacting with suspicious
              links or requests, verify sensitive requests
              through an independent channel, and
              investigate related infrastructure where
              appropriate.
            </p>

          </div>

        </ReportSection>

        {/* ======================================================
           FOOTER
        ====================================================== */}

        <footer className="tm-report-footer">

          <p>
            TRACE MAIL AI — FORENSIC REPORT
          </p>

          <span>
            Structured forensic intelligence,
            investigation findings and
            evidence-integrity information.
          </span>

          <span>
            Geolocation represents infrastructure
            context and does not establish exact
            attacker location or identity.
          </span>

        </footer>

      </div>

      <ReportViewerStyles />

    </main>
  );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function ReportStat({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="tm-stat-card">

      <p className="tm-small-label">
        {label}
      </p>

      <p
        className={`tm-stat-value ${accent}`}
      >
        {value}
      </p>

    </div>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tm-report-section">

      <h2>
        {title}
      </h2>

      <div>
        {children}
      </div>

    </section>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="tm-detail">

      <p className="tm-small-label">
        {label}
      </p>

      <p>
        {value}
      </p>

    </div>
  );
}

function AuthCard({
  name,
  result,
}: {
  name: string;
  result: string;
}) {
  return (
    <div
      className={`tm-auth-card ${resultClass(
        result
      )}`}
    >

      <p className="tm-small-label">
        {name}
      </p>

      <strong>
        {result}
      </strong>

    </div>
  );
}

function AssessmentCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="tm-assessment-card">

      <p className="tm-small-label">
        {title}
      </p>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function IOC({
  type,
  value,
  risk,
}: {
  type: string;
  value: string;
  risk: string;
}) {
  return (
    <div className="tm-ioc">

      <div className="tm-ioc-main">

        <p className="tm-small-label">
          {type}
        </p>

        <code>
          {value}
        </code>

      </div>

      <span>
        {risk}
      </span>

    </div>
  );
}

function RelayStep({
  number,
  title,
  value,
}: {
  number: string;
  title: string;
  value: string;
}) {
  return (
    <div className="tm-relay-step">

      <div className="tm-relay-number">
        {number}
      </div>

      <div>

        <p>
          {title}
        </p>

        <code>
          {value}
        </code>

      </div>

    </div>
  );
}

function InfrastructureCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="tm-infra-card">

      <p className="tm-small-label">
        {label}
      </p>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function DNA({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="tm-dna-cell">

      <p>
        {label}
      </p>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* ============================================================
   REPORT VIEWER STYLES
   ============================================================ */

function ReportViewerStyles() {
  return (
    <style>{`

      /* ========================================================
         ROOT
      ======================================================== */

      .tm-report-viewer {
        width: 100%;
        min-height: calc(100vh - 70px);

        box-sizing: border-box;

        background:
          radial-gradient(
            900px 450px at 75% -10%,
            rgba(6, 182, 212, 0.08),
            transparent 70%
          ),
          #071019;

        color: #d4deea;
      }

      html.light .tm-report-viewer {
        background:
          radial-gradient(
            850px 400px at 75% -10%,
            rgba(14, 165, 233, 0.12),
            transparent 70%
          ),
          radial-gradient(
            700px 350px at 5% 30%,
            rgba(125, 211, 252, 0.08),
            transparent 70%
          ),
          #f5f9fd;

        color: #33445d;
      }

      /* ========================================================
         CONTAINER
      ======================================================== */

      .tm-report-container {
        width: 100%;
        max-width: 1320px;

        margin: 0 auto;

        padding:
          30px
          34px
          60px;

        box-sizing: border-box;
      }

      /* ========================================================
         HEADER
      ======================================================== */

      .tm-report-top {
        display: flex;

        align-items: flex-end;

        justify-content: space-between;

        gap: 30px;

        padding-bottom: 25px;

        margin-bottom: 20px;

        border-bottom:
          1px solid
          #1e3043;
      }

      html.light .tm-report-top {
        border-bottom-color: #dbe6f0;
      }

      .tm-report-heading {
        min-width: 0;
      }

      .tm-back-button {
        border: none;

        background: transparent;

        padding: 0;

        margin: 0 0 18px;

        color: #7f91a6;

        font-size: 10px;

        letter-spacing: 0.1em;

        cursor: pointer;
      }

      .tm-back-button:hover {
        color: #06b6d4;
      }

      .tm-eyebrow {
        margin: 0;

        color: #06b6d4;

        font-size: 10px;

        font-weight: 800;

        letter-spacing: 0.3em;
      }

      .tm-report-top h1 {
        margin: 8px 0 0;

        color: #f1f5f9;

        font-size: 34px;

        line-height: 1.1;

        font-weight: 650;

        letter-spacing: -0.035em;
      }

      html.light .tm-report-top h1 {
        color: #17233a;
      }

      .tm-case-reference {
        margin: 8px 0 0;

        color: #6f8299;

        font-family: monospace;

        font-size: 12px;
      }

      .tm-header-actions {
        display: flex;

        align-items: center;

        gap: 9px;

        flex-shrink: 0;
      }

      /* ========================================================
         BUTTONS
      ======================================================== */

      .tm-button {
        min-height: 42px;

        padding: 0 16px;

        border-radius: 8px;

        font-size: 9px;

        font-weight: 800;

        letter-spacing: 0.08em;

        cursor: pointer;

        transition:
          transform 150ms ease,
          background 150ms ease,
          border-color 150ms ease,
          color 150ms ease;
      }

      .tm-button:hover {
        transform: translateY(-1px);
      }

      .tm-button:disabled {
        opacity: 0.55;

        cursor: wait;

        transform: none;
      }

      .tm-button.secondary {
        border:
          1px solid
          #25384d;

        background: #0b1724;

        color: #9aaabd;
      }

      html.light .tm-button.secondary {
        border-color: #ccd9e5;

        background: #ffffff;

        color: #53657b;
      }

      .tm-button.secondary:hover {
        border-color: #06b6d4;

        color: #06b6d4;
      }

      .tm-button.primary {
        border:
          1px solid
          rgba(6, 182, 212, 0.4);

        background: #08b9d9;

        color: #04202a;
      }

      .tm-button.primary:hover {
        background: #20c5df;
      }

      /* ========================================================
         SUMMARY
      ======================================================== */

      .tm-summary-grid {
        display: grid;

        grid-template-columns:
          repeat(4, minmax(0, 1fr));

        gap: 12px;

        margin-bottom: 16px;
      }

      .tm-stat-card {
        min-width: 0;

        padding: 20px;

        border:
          1px solid
          #203246;

        border-radius: 10px;

        background: #0a1622;

        box-sizing: border-box;
      }

      html.light .tm-stat-card {
        border-color: #d7e3ed;

        background: rgba(
          255,
          255,
          255,
          0.88
        );

        box-shadow:
          0 5px 18px
          rgba(36, 65, 95, 0.05);
      }

      .tm-small-label {
        margin: 0;

        color: #687b91;

        font-size: 9px;

        font-weight: 750;

        letter-spacing: 0.2em;
      }

      .tm-stat-value {
        margin: 10px 0 0;

        color: #f1f5f9;

        font-size: 17px;

        line-height: 1.4;

        font-weight: 650;

        word-break: break-word;
      }

      html.light .tm-stat-value {
        color: #17233a;
      }

      .tm-stat-value.critical,
      .tm-stat-value.high {
        color: #ef4444;
      }

      .tm-stat-value.medium {
        color: #d97706;
      }

      .tm-stat-value.low {
        color: #059669;
      }

      /* ========================================================
         SECTION
      ======================================================== */

      .tm-report-section {
        width: 100%;

        box-sizing: border-box;

        margin-top: 16px;

        padding: 24px;

        border:
          1px solid
          #203246;

        border-radius: 11px;

        background: #0a1622;
      }

      html.light .tm-report-section {
        border-color: #d7e3ed;

        background: rgba(
          255,
          255,
          255,
          0.88
        );

        box-shadow:
          0 5px 20px
          rgba(36, 65, 95, 0.04);
      }

      .tm-report-section h2 {
        margin: 0 0 20px;

        padding-bottom: 13px;

        border-bottom:
          1px solid
          #203246;

        color: #06b6d4;

        font-size: 10px;

        font-weight: 800;

        letter-spacing: 0.2em;
      }

      html.light .tm-report-section h2 {
        border-bottom-color: #dce7f0;
      }

      /* ========================================================
         EXECUTIVE
      ======================================================== */

      .tm-executive {
        color: #d4deea;

        font-size: 13px;

        line-height: 1.8;
      }

      html.light .tm-executive {
        color: #455870;
      }

      .tm-executive p {
        margin: 14px 0 0;
      }

      .tm-executive strong {
        color: #f1f5f9;
      }

      html.light .tm-executive strong {
        color: #17233a;
      }

      .tm-severity-banner {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;

        padding: 16px 18px;

        border-radius: 9px;
      }

      .tm-severity-banner span {
        display: block;

        margin-bottom: 5px;

        font-size: 8px;

        letter-spacing: 0.18em;
      }

      .tm-severity-banner strong {
        font-size: 17px;
      }

      .tm-severity-banner.critical,
      .tm-severity-banner.high {
        border:
          1px solid
          rgba(239, 68, 68, 0.25);

        background:
          rgba(239, 68, 68, 0.07);

        color: #ef4444;
      }

      .tm-severity-banner.medium {
        border:
          1px solid
          rgba(245, 158, 11, 0.25);

        background:
          rgba(245, 158, 11, 0.07);

        color: #d97706;
      }

      .tm-severity-banner.low {
        border:
          1px solid
          rgba(16, 185, 129, 0.25);

        background:
          rgba(16, 185, 129, 0.07);

        color: #059669;
      }

      .tm-severity-banner.neutral {
        border:
          1px solid
          #203246;

        background: #0d1b29;

        color: #9aa8ba;
      }

      html.light .tm-severity-banner.neutral {
        background: #f5f9fc;

        border-color: #dbe6ef;
      }

      .tm-score-large {
        font-family: monospace;

        font-size: 25px;

        font-weight: 800;
      }

      .tm-score-large small {
        font-size: 10px;

        opacity: 0.65;
      }

      /* ========================================================
         DETAILS
      ======================================================== */

      .tm-detail-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 22px 45px;
      }

      .tm-detail {
        min-width: 0;
      }

      .tm-detail p:last-child {
        margin: 8px 0 0;

        color: #d4deea;

        font-size: 13px;

        line-height: 1.55;

        word-break: break-word;
      }

      html.light .tm-detail p:last-child {
        color: #40536b;
      }

      /* ========================================================
         AUTHENTICATION
      ======================================================== */

      .tm-auth-grid {
        display: grid;

        grid-template-columns:
          repeat(3, minmax(0, 1fr));

        gap: 12px;
      }

      .tm-auth-card {
        padding: 18px;

        border-radius: 9px;

        box-sizing: border-box;
      }

      .tm-auth-card strong {
        display: block;

        margin-top: 10px;

        font-size: 19px;
      }

      .tm-auth-card.danger {
        border:
          1px solid
          rgba(239, 68, 68, 0.22);

        background:
          rgba(239, 68, 68, 0.06);

        color: #ef4444;
      }

      .tm-auth-card.success {
        border:
          1px solid
          rgba(16, 185, 129, 0.22);

        background:
          rgba(16, 185, 129, 0.06);

        color: #059669;
      }

      .tm-auth-card.neutral {
        border:
          1px solid
          #203246;

        background: #0d1b29;

        color: #9aa8ba;
      }

      html.light .tm-auth-card.neutral {
        border-color: #d8e3ed;

        background: #f6f9fc;
      }

      .tm-assessment-box,
      .tm-note-box {
        margin-top: 14px;

        padding: 15px;

        border:
          1px solid
          #203246;

        border-radius: 8px;

        background: #0d1b29;
      }

      html.light .tm-assessment-box,
      html.light .tm-note-box {
        border-color: #dbe6ef;

        background: #f6f9fc;
      }

      .tm-assessment-box p:last-child {
        margin: 8px 0 0;

        color: #9aa8ba;

        font-size: 12px;

        line-height: 1.65;
      }

      html.light .tm-assessment-box p:last-child {
        color: #61748a;
      }

      /* ========================================================
         ASSESSMENT
      ======================================================== */

      .tm-assessment-grid {
        display: grid;

        grid-template-columns:
          repeat(3, minmax(0, 1fr));

        gap: 12px;
      }

      .tm-assessment-card {
        padding: 18px;

        border:
          1px solid
          #203246;

        border-radius: 8px;

        background: #0d1b29;
      }

      html.light .tm-assessment-card {
        border-color: #d8e3ed;

        background: #f6f9fc;
      }

      .tm-assessment-card strong {
        display: block;

        margin-top: 9px;

        color: #f1f5f9;

        font-size: 16px;

        line-height: 1.4;

        word-break: break-word;
      }

      html.light .tm-assessment-card strong {
        color: #17233a;
      }

      /* ========================================================
         RISK FACTORS
      ======================================================== */

      .tm-risk-section {
        margin-top: 21px;
      }

      .tm-risk-list {
        display: grid;

        gap: 7px;

        margin-top: 12px;
      }

      .tm-risk-item {
        display: flex;

        align-items: center;

        gap: 10px;

        min-height: 42px;

        padding: 0 12px;

        border:
          1px solid
          #203246;

        background: #0d1b29;

        color: #d4deea;

        font-size: 12px;

        line-height: 1.5;
      }

      html.light .tm-risk-item {
        border-color: #dbe6ef;

        background: #f7fafc;

        color: #40536b;
      }

      .tm-risk-dot {
        width: 7px;

        height: 7px;

        flex-shrink: 0;

        border-radius: 50%;

        background: #ef4444;

        box-shadow:
          0 0 8px
          rgba(239, 68, 68, 0.4);
      }

      .tm-risk-text {
        flex: 1;

        min-width: 0;

        word-break: break-word;
      }

      .tm-risk-item strong {
        margin-left: auto;

        flex-shrink: 0;

        color: #ef4444;

        font-family: monospace;

        font-size: 11px;
      }

      /* ========================================================
         IOC
      ======================================================== */

      .tm-ioc-list {
        display: grid;

        gap: 8px;
      }

      .tm-ioc {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        padding: 14px;

        border:
          1px solid
          #203246;

        background: #0d1b29;

        box-sizing: border-box;
      }

      html.light .tm-ioc {
        border-color: #dbe6ef;

        background: #f7fafc;
      }

      .tm-ioc-main {
        min-width: 0;
      }

      .tm-ioc code {
        display: block;

        margin-top: 7px;

        color: #d4deea;

        font-size: 12px;

        word-break: break-all;
      }

      html.light .tm-ioc code {
        color: #40536b;
      }

      .tm-ioc > span {
        flex-shrink: 0;

        padding: 5px 8px;

        border:
          1px solid
          rgba(245, 158, 11, 0.25);

        background:
          rgba(245, 158, 11, 0.08);

        color: #d97706;

        font-size: 8px;

        font-weight: 800;

        letter-spacing: 0.08em;
      }

      /* ========================================================
         FORENSICS
      ======================================================== */

      .tm-forensics-grid {
        display: grid;

        grid-template-columns:
          repeat(3, minmax(0, 1fr));

        gap: 12px;
      }

      .tm-relay-box {
        margin-top: 15px;

        border:
          1px solid
          #203246;

        background: #0d1b29;
      }

      html.light .tm-relay-box {
        border-color: #dbe6ef;

        background: #f7fafc;
      }

      .tm-relay-heading {
        display: block;

        padding: 15px;

        border-bottom:
          1px solid
          #203246;
      }

      html.light .tm-relay-heading {
        border-bottom-color: #dbe6ef;
      }

      .tm-relay-list {
        display: grid;
      }

      .tm-relay-step {
        display: flex;

        align-items: center;

        gap: 14px;

        padding: 15px;

        border-bottom:
          1px solid
          #203246;
      }

      html.light .tm-relay-step {
        border-bottom-color: #dbe6ef;
      }

      .tm-relay-step:last-child {
        border-bottom: none;
      }

      .tm-relay-number {
        width: 30px;

        height: 30px;

        display: flex;

        align-items: center;

        justify-content: center;

        flex-shrink: 0;

        border:
          1px solid
          rgba(6, 182, 212, 0.3);

        color: #06b6d4;

        font-family: monospace;

        font-size: 10px;
      }

      .tm-relay-step p {
        margin: 0 0 4px;

        color: #687b91;

        font-size: 10px;
      }

      .tm-relay-step code {
        color: #d4deea;

        font-size: 12px;
      }

      html.light .tm-relay-step code {
        color: #40536b;
      }

      .tm-note-box {
        color: #74869b;

        font-size: 10px;

        line-height: 1.6;
      }

      /* ========================================================
         GEO
      ======================================================== */

      .tm-infrastructure-grid {
        display: grid;

        grid-template-columns:
          repeat(3, minmax(0, 1fr));

        gap: 12px;
      }

      .tm-infra-card {
        padding: 17px;

        border:
          1px solid
          #203246;

        border-radius: 8px;

        background: #0d1b29;
      }

      html.light .tm-infra-card {
        border-color: #dbe6ef;

        background: #f7fafc;
      }

      .tm-infra-card strong {
        display: block;

        margin-top: 8px;

        color: #d4deea;

        font-size: 12px;

        line-height: 1.5;

        word-break: break-word;
      }

      html.light .tm-infra-card strong {
        color: #40536b;
      }

      .tm-ip-table {
        margin-top: 18px;
      }

      .tm-ip-row {
        display: grid;

        grid-template-columns:
          1fr
          1.4fr
          1.2fr;

        gap: 15px;

        padding: 11px 0;

        border-bottom:
          1px solid
          #203246;

        color: #9aa8ba;

        font-size: 11px;
      }

      html.light .tm-ip-row {
        border-bottom-color: #dbe6ef;

        color: #62758b;
      }

      .tm-ip-row span:first-child {
        color: #06b6d4;

        font-family: monospace;
      }

      /* ========================================================
         DNA
      ======================================================== */

      .tm-dna-box {
        padding: 17px;

        border:
          1px solid
          #203246;

        background: #0d1b29;
      }

      html.light .tm-dna-box {
        border-color: #dbe6ef;

        background: #f7fafc;
      }

      .tm-dna-grid {
        display: grid;

        grid-template-columns:
          repeat(4, minmax(0, 1fr));

        gap: 8px;

        margin-top: 14px;
      }

      .tm-dna-cell {
        padding: 12px;

        border:
          1px solid
          #203246;

        background: transparent;
      }

      html.light .tm-dna-cell {
        border-color: #dbe6ef;
      }

      .tm-dna-cell p {
        margin: 0;

        color: #687b91;

        font-size: 8px;

        letter-spacing: 0.12em;
      }

      .tm-dna-cell strong {
        display: block;

        margin-top: 6px;

        color: #06b6d4;

        font-family: monospace;

        font-size: 11px;

        word-break: break-word;
      }

      .tm-dna-string {
        margin-top: 15px;

        padding-top: 15px;

        border-top:
          1px solid
          #203246;
      }

      html.light .tm-dna-string {
        border-top-color: #dbe6ef;
      }

      .tm-dna-string code {
        display: block;

        margin-top: 8px;

        color: #06b6d4;

        font-family: monospace;

        font-size: 11px;

        line-height: 1.7;

        word-break: break-all;
      }

      .tm-dna-pattern {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 15px;

        margin-top: 14px;

        padding: 12px;

        border:
          1px solid
          rgba(6, 182, 212, 0.2);
      }

      .tm-dna-pattern span {
        color: #687b91;

        font-size: 8px;

        letter-spacing: 0.15em;
      }

      .tm-dna-pattern strong {
        color: #06b6d4;

        font-size: 11px;
      }

      /* ========================================================
         EVIDENCE
      ======================================================== */

      .tm-evidence-box {
        padding: 18px;

        border:
          1px solid
          rgba(16, 185, 129, 0.25);

        background:
          rgba(16, 185, 129, 0.045);
      }

      .tm-evidence-header {
        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 20px;
      }

      .tm-evidence-header strong {
        display: block;

        margin-top: 7px;

        color: #10b981;

        font-size: 17px;
      }

      .tm-evidence-header code {
        display: block;

        margin-top: 7px;

        color: #d4deea;

        font-size: 11px;
      }

      html.light .tm-evidence-header code {
        color: #40536b;
      }

      .tm-hash-block {
        margin-top: 16px;

        padding-top: 14px;

        border-top:
          1px solid
          #203246;
      }

      html.light .tm-hash-block {
        border-top-color: #dbe6ef;
      }

      .tm-hash-block code {
        display: block;

        margin-top: 7px;

        color: #9aa8ba;

        font-size: 10px;

        line-height: 1.7;

        word-break: break-all;
      }

      /* ========================================================
         CONCLUSION
      ======================================================== */

      .tm-conclusion {
        padding: 18px;

        border-left:
          2px solid
          #06b6d4;

        background: #0d1b29;

        color: #d4deea;

        font-size: 13px;

        line-height: 1.8;
      }

      html.light .tm-conclusion {
        background: #f7fafc;

        color: #40536b;
      }

      .tm-conclusion p {
        margin: 0;
      }

      .tm-conclusion p + p {
        margin-top: 14px;
      }

      .tm-conclusion strong {
        color: #f1f5f9;
      }

      html.light .tm-conclusion strong {
        color: #17233a;
      }

      /* ========================================================
         EMPTY
      ======================================================== */

      .tm-empty {
        padding: 20px;

        border:
          1px dashed
          #2a3c50;

        color: #718398;

        font-size: 11px;

        line-height: 1.6;
      }

      html.light .tm-empty {
        border-color: #cbd9e5;

        color: #687b91;
      }

      .tm-empty.large {
        display: flex;

        flex-direction: column;

        gap: 5px;

        padding: 30px;
      }

      .tm-empty.large strong {
        color: #d4deea;

        font-size: 13px;
      }

      html.light .tm-empty.large strong {
        color: #40536b;
      }

      /* ========================================================
         DISCLAIMER
      ======================================================== */

      .tm-disclaimer {
        margin: 14px 0 0;

        color: #687b91;

        font-size: 9px;

        line-height: 1.7;
      }

      /* ========================================================
         FOOTER
      ======================================================== */

      .tm-report-footer {
        margin-top: 18px;

        padding: 20px;

        border:
          1px solid
          #203246;

        background: #0a1622;

        color: #687b91;

        font-size: 9px;

        line-height: 1.7;
      }

      html.light .tm-report-footer {
        border-color: #d7e3ed;

        background: rgba(
          255,
          255,
          255,
          0.88
        );
      }

      .tm-report-footer p {
        margin: 0 0 8px;

        color: #94a3b8;

        font-size: 9px;

        font-weight: 800;

        letter-spacing: 0.18em;
      }

      .tm-report-footer span {
        display: block;
      }

      /* ========================================================
         LOADING
      ======================================================== */

      .tm-report-loading {
        min-height: 70vh;

        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;

        padding: 30px;
      }

      .tm-loading-mark {
        width: 48px;

        height: 48px;

        display: flex;

        align-items: center;

        justify-content: center;

        border:
          1px solid
          rgba(6, 182, 212, 0.3);

        border-radius: 12px;

        color: #06b6d4;

        font-weight: 800;

        animation:
          tm-pulse 1.5s infinite;
      }

      .tm-report-loading p {
        margin: 15px 0 0;

        color: #06b6d4;

        font-size: 10px;

        font-weight: 800;

        letter-spacing: 0.25em;
      }

      .tm-report-loading span {
        margin-top: 7px;

        color: #718096;

        font-size: 11px;
      }

      /* ========================================================
         ERROR
      ======================================================== */

      .tm-report-error {
        min-height: 70vh;

        display: flex;

        flex-direction: column;

        align-items: center;

        justify-content: center;

        text-align: center;

        padding: 30px;

        color: #d4deea;
      }

      .tm-error-symbol {
        width: 48px;

        height: 48px;

        display: flex;

        align-items: center;

        justify-content: center;

        border-radius: 50%;

        background:
          rgba(239, 68, 68, 0.08);

        color: #ef4444;

        font-weight: 800;
      }

      .tm-report-error h1 {
        margin: 17px 0 0;

        color: #f1f5f9;

        font-size: 22px;
      }

      html.light .tm-report-error h1 {
        color: #17233a;
      }

      .tm-report-error p {
        margin-top: 8px;

        color: #718096;

        font-size: 12px;
      }

      .tm-error-actions {
        display: flex;

        gap: 8px;

        margin-top: 20px;
      }

      .tm-inline-error {
        margin-bottom: 14px;

        padding: 11px 14px;

        border:
          1px solid
          rgba(239, 68, 68, 0.25);

        border-radius: 8px;

        background:
          rgba(239, 68, 68, 0.06);

        color: #ef4444;

        font-size: 11px;
      }

      /* ========================================================
         ANIMATION
      ======================================================== */

      @keyframes tm-pulse {
        0%,
        100% {
          opacity: 0.45;

          transform: scale(0.97);
        }

        50% {
          opacity: 1;

          transform: scale(1);
        }
      }

      /* ========================================================
         TABLET
      ======================================================== */

      @media (max-width: 1100px) {

        .tm-summary-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .tm-infrastructure-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .tm-dna-grid {
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
        }

      }

      /* ========================================================
         MOBILE
      ======================================================== */

      @media (max-width: 800px) {

        .tm-report-container {
          padding:
            22px
            18px
            40px;
        }

        .tm-report-top {
          align-items: flex-start;

          flex-direction: column;
        }

        .tm-header-actions {
          width: 100%;
        }

        .tm-header-actions .tm-button {
          flex: 1;
        }

        .tm-detail-grid,
        .tm-auth-grid,
        .tm-assessment-grid,
        .tm-forensics-grid {
          grid-template-columns: 1fr;
        }

        .tm-dna-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .tm-ip-row {
          grid-template-columns: 1fr;

          gap: 4px;
        }

      }

      /* ========================================================
         SMALL MOBILE
      ======================================================== */

      @media (max-width: 550px) {

        .tm-summary-grid,
        .tm-infrastructure-grid {
          grid-template-columns: 1fr;
        }

        .tm-dna-grid {
          grid-template-columns: 1fr;
        }

        .tm-report-top h1 {
          font-size: 28px;
        }

        .tm-header-actions {
          flex-direction: column;
        }

        .tm-header-actions .tm-button {
          width: 100%;
        }

        .tm-report-section {
          padding: 18px;
        }

        .tm-evidence-header,
        .tm-dna-pattern {
          align-items: flex-start;

          flex-direction: column;
        }

        .tm-ioc {
          align-items: flex-start;

          flex-direction: column;
        }

        .tm-ioc > span {
          align-self: flex-start;
        }

      }

    `}</style>
  );
}