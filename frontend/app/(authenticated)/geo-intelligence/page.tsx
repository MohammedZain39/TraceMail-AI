"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type IPIntel = {
  ip: string;
  status?: string;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isp?: string | null;
  organization?: string | null;
  asn?: string | null;
  hosting?: boolean;
  vpn?: boolean;
  tor?: boolean;
  risk?: string;
};

type RelayHop = {
  hop: number;
  raw_header?: string;
  ips?: {
    ip: string;
    classification?: string;
  }[];
};

type CaseData = {
  case_id: string;
  filename?: string;

  email?: {
    sender?: string;
    recipient?: string;
    subject?: string;
    reply_to?: string;
    date?: string;
  };

  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };

  forensic_analysis?: {
    total_received_headers?: number;
    earliest_observed_public_ip?: string | null;
    public_ips?: string[];
    relay_path?: RelayHop[];
  };

  ip_intelligence?: IPIntel[];
};

type CaseListItem = {
  case_id?: string;
  email?: {
    subject?: string;
    sender?: string;
  };
  threat_analysis?: {
    risk_score?: number;
    severity?: string;
    classification?: string;
  };
};

type MapNode = {
  ip: string;
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  hosting?: boolean;
  vpn?: boolean;
  tor?: boolean;
  risk?: string;
  hop?: number;
  earliest?: boolean;
};

export default function GeoIntelligencePage() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [caseId, setCaseId] = useState<string>("");
  const [caseData, setCaseData] = useState<CaseData | null>(null);

  const [selectedIP, setSelectedIP] =
    useState<string | null>(null);

  const [loadingCases, setLoadingCases] =
    useState(true);

  const [loadingCase, setLoadingCase] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD CASE LIST
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function loadCases() {
      try {
        setLoadingCases(true);
        setError("");

        const response = await apiFetch("/cases", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load cases (${response.status})`
          );
        }

        const data = await response.json();

        const loadedCases: CaseListItem[] =
          Array.isArray(data?.cases)
            ? data.cases
            : [];

        if (!mounted) return;

        setCases(loadedCases);

        const stored =
          sessionStorage.getItem(
            "tracemail_case_id"
          );

        const storedExists = loadedCases.some(
          (item) =>
            item.case_id === stored
        );

        if (stored && storedExists) {
          setCaseId(stored);
        } else if (loadedCases[0]?.case_id) {
          setCaseId(loadedCases[0].case_id);
          sessionStorage.setItem(
            "tracemail_case_id",
            loadedCases[0].case_id
          );
        }
      } catch (err) {
        console.error(
          "Failed to load cases:",
          err
        );

        if (mounted) {
          setError(
            "Unable to load investigation cases."
          );
        }
      } finally {
        if (mounted) {
          setLoadingCases(false);
        }
      }
    }

    loadCases();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD SELECTED CASE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      setSelectedIP(null);
      return;
    }

    let mounted = true;

    async function loadCase() {
      try {
        setLoadingCase(true);
        setError("");
        setSelectedIP(null);

        sessionStorage.setItem(
          "tracemail_case_id",
          caseId
        );

        const response = await apiFetch(
          `/cases/${encodeURIComponent(caseId)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load case (${response.status})`
          );
        }

        const data = await response.json();

        if (!mounted) return;

        setCaseData(
          data?.case || null
        );
      } catch (err) {
        console.error(
          "Failed to load geographic intelligence:",
          err
        );

        if (mounted) {
          setCaseData(null);
          setError(
            "Failed to load geographic intelligence."
          );
        }
      } finally {
        if (mounted) {
          setLoadingCase(false);
        }
      }
    }

    loadCase();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  /*
   * ---------------------------------------------------------
   * DATA
   * ---------------------------------------------------------
   */

  const intelligence =
    caseData?.ip_intelligence || [];

  const relayPath =
    caseData?.forensic_analysis?.relay_path || [];

  const riskScore =
    caseData?.threat_analysis?.risk_score ?? 0;

  const severity =
    caseData?.threat_analysis?.severity ||
    "UNKNOWN";

  const classification =
    caseData?.threat_analysis?.classification ||
    "Unknown";

  /*
   * ---------------------------------------------------------
   * MAP NODES
   * ---------------------------------------------------------
   */

  const mapNodes = useMemo<MapNode[]>(() => {
    if (!caseData) return [];

    const earliest =
      caseData.forensic_analysis
        ?.earliest_observed_public_ip;

    return intelligence
      .filter(
        (item) =>
          typeof item.latitude === "number" &&
          typeof item.longitude === "number"
      )
      .map((item) => {
        const relay =
          relayPath.find((hop) =>
            hop.ips?.some(
              (entry) =>
                entry.ip === item.ip
            )
          );

        return {
          ip: item.ip,
          latitude:
            item.latitude as number,
          longitude:
            item.longitude as number,
          city: item.city || undefined,
          region:
            item.region || undefined,
          country:
            item.country || undefined,
          isp:
            item.isp || undefined,
          organization:
            item.organization ||
            undefined,
          asn:
            item.asn || undefined,
          hosting: item.hosting,
          vpn: item.vpn,
          tor: item.tor,
          risk: item.risk,
          hop: relay?.hop,
          earliest:
            item.ip === earliest,
        };
      });
  }, [
    caseData,
    intelligence,
    relayPath,
  ]);

  /*
   * ---------------------------------------------------------
   * ACTIVE IP
   * ---------------------------------------------------------
   */

  const activeIP =
    selectedIP ||
    caseData?.forensic_analysis
      ?.earliest_observed_public_ip ||
    intelligence[0]?.ip ||
    null;

  const selectedIntel =
    intelligence.find(
      (item) =>
        item.ip === activeIP
    ) || null;

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */

  const publicIPCount =
    caseData?.forensic_analysis
      ?.public_ips?.length ??
    intelligence.length;

  const geolocatedCount =
    mapNodes.length;

  const countryCount =
    new Set(
      intelligence
        .map(
          (item) =>
            item.country
        )
        .filter(Boolean)
    ).size;

  const relayCount =
    caseData?.forensic_analysis
      ?.total_received_headers ??
    relayPath.length;

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loadingCases) {
    return (
      <div className="min-h-[calc(100vh-72px)] w-full bg-[#071019] text-white">
        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />

            <p className="text-[10px] tracking-[0.3em] text-cyan-400">
              GEO ENGINE
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Loading investigation intelligence...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-[calc(100vh-72px)] w-full bg-[#071019] text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-7 lg:px-8">
        {/* PAGE HEADER */}

        <header className="mb-6 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-cyan-400" />

              <div>
                <p className="text-[10px] tracking-[0.3em] text-cyan-400">
                  INTELLIGENCE
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  Geo Intelligence
                </h1>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Infrastructure geolocation and
              relay-path analysis
            </p>
          </div>

          {/* CASE SELECTOR */}

          <div className="w-[430px] max-w-full">
            <label className="mb-2 block text-[9px] tracking-[0.22em] text-slate-500">
              SELECT INVESTIGATION CASE
            </label>

            <select
              value={caseId}
              onChange={(event) => {
                const value =
                  event.target.value;

                setCaseId(value);

                if (value) {
                  sessionStorage.setItem(
                    "tracemail_case_id",
                    value
                  );
                }
              }}
              className="h-12 w-full appearance-none rounded-xl border border-slate-800 bg-[#0b1621] px-4 text-sm text-slate-300 outline-none transition focus:border-cyan-500/50"
            >
              <option value="">
                Select an investigation...
              </option>

              {cases.map((item) => (
                <option
                  key={item.case_id}
                  value={item.case_id}
                >
                  {item.case_id} ·{" "}
                  {item.email?.subject ||
                    "Email Investigation"}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!caseId && (
          <section className="flex min-h-[620px] items-center justify-center rounded-2xl border border-slate-800 bg-[#0b1621]">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                ⌖
              </div>

              <h2 className="text-sm font-semibold tracking-wide text-cyan-400">
                SELECT AN INVESTIGATION
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Choose an investigation case above
                to inspect its infrastructure,
                geolocation and relay path.
              </p>
            </div>
          </section>
        )}

        {/* CASE */}

        {caseId && (
          <>
            {/* CASE STRIP */}

            <section className="mb-4 rounded-xl border border-slate-800 bg-[#0b1621] px-5 py-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-cyan-400">
                      {caseData?.case_id ||
                        caseId}
                    </span>

                    <SeverityBadge
                      severity={severity}
                      score={riskScore}
                    />
                  </div>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {caseData?.email
                      ?.subject ||
                      caseData?.filename ||
                      "Email investigation"}
                  </p>

                  {caseData?.email?.sender && (
                    <p className="mt-1 font-mono text-[10px] text-slate-700">
                      {caseData.email.sender}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-8">
                  <MiniMetric
                    label="RISK"
                    value={`${riskScore}/100`}
                    danger={riskScore >= 60}
                  />

                  <MiniMetric
                    label="CLASSIFICATION"
                    value={classification}
                  />
                </div>
              </div>
            </section>

            {/* STATS */}

            <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="PUBLIC IPS"
                value={String(
                  publicIPCount
                )}
              />

              <Stat
                label="GEOLOCATED"
                value={String(
                  geolocatedCount
                )}
              />

              <Stat
                label="COUNTRIES"
                value={String(
                  countryCount
                )}
              />

              <Stat
                label="RELAY HOPS"
                value={String(
                  relayCount
                )}
              />
            </section>

            {/* MAIN WORKSPACE */}

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* MAP */}

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1621]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                      INFRASTRUCTURE MAP
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Geographic context for observed
                      network infrastructure
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] tracking-widest text-slate-700">
                      MAPPED
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {geolocatedCount}/
                      {publicIPCount}
                    </p>
                  </div>
                </div>

                <div className="relative h-[500px] overflow-hidden bg-[#08131d]">
                  {loadingCase ? (
                    <MapLoading />
                  ) : mapNodes.length > 0 ? (
                    <GeoMap
                      nodes={mapNodes}
                      activeIP={activeIP}
                      onSelectIP={
                        setSelectedIP
                      }
                    />
                  ) : (
                    <EmptyMap
                      publicIPCount={
                        publicIPCount
                      }
                    />
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-5 text-[9px] text-slate-600">
                    <span>
                      <i className="mr-1.5 text-cyan-400">
                        ●
                      </i>
                      Observed infrastructure
                    </span>

                    <span>
                      <i className="mr-1.5 text-orange-400">
                        ●
                      </i>
                      Earliest observed node
                    </span>
                  </div>

                  <span className="text-[9px] text-slate-700">
                    OpenStreetMap
                  </span>
                </div>
              </div>

              {/* SELECTED INFRASTRUCTURE */}

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1621]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                      SELECTED INFRASTRUCTURE
                    </p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      Select an observed IP to inspect
                    </p>
                  </div>

                  {selectedIntel?.risk && (
                    <RiskBadge
                      risk={
                        selectedIntel.risk
                      }
                    />
                  )}
                </div>

                <div className="p-5">
                  {selectedIntel ? (
                    <>
                      <div className="mb-5">
                        <p className="font-mono text-xl text-white">
                          {
                            selectedIntel.ip
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            selectedIntel.city,
                            selectedIntel.region,
                            selectedIntel.country,
                          ]
                            .filter(Boolean)
                            .join(
                              ", "
                            ) ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Detail
                          label="ISP"
                          value={
                            selectedIntel.isp ||
                            "Unknown"
                          }
                        />

                        <Detail
                          label="ASN"
                          value={
                            selectedIntel.asn ||
                            "Unknown"
                          }
                        />

                        <Detail
                          label="ORGANIZATION"
                          value={
                            selectedIntel.organization ||
                            "Unknown"
                          }
                        />

                        <Detail
                          label="HOSTING"
                          value={
                            selectedIntel.hosting
                              ? "YES"
                              : "NO"
                          }
                        />

                        <Detail
                          label="VPN"
                          value={
                            selectedIntel.vpn
                              ? "DETECTED"
                              : "NO"
                          }
                        />

                        <Detail
                          label="TOR"
                          value={
                            selectedIntel.tor
                              ? "DETECTED"
                              : "NO"
                          }
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-3">
                        <p className="text-[10px] leading-5 text-yellow-500/70">
                          Geolocation represents
                          observed network
                          infrastructure. It does
                          not establish the
                          attacker's physical
                          location or identity.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="py-16 text-center">
                      <p className="text-xs text-slate-600">
                        No IP intelligence
                        available.
                      </p>
                    </div>
                  )}

                  {/* IP SWITCHER */}

                  {intelligence.length > 0 && (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <p className="mb-3 text-[9px] tracking-[0.2em] text-slate-700">
                        OBSERVED IPS
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {intelligence.map(
                          (item) => (
                            <button
                              key={item.ip}
                              type="button"
                              onClick={() =>
                                setSelectedIP(
                                  item.ip
                                )
                              }
                              className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] transition ${
                                item.ip ===
                                activeIP
                                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                                  : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                              }`}
                            >
                              {item.ip}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* RELAY PATH */}

            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1621]">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                    OBSERVED RELAY PATH
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Reconstructed from Received
                    headers
                  </p>
                </div>

                <span className="text-[10px] text-slate-600">
                  {relayPath.length} hops
                </span>
              </div>

              <div className="overflow-x-auto px-5 py-5">
                {relayPath.length > 0 ? (
                  <div className="flex min-w-max items-center">
                    {relayPath.map(
                      (hop, index) => {
                        const hopIP =
                          hop.ips?.[0]?.ip;

                        const hopIntel =
                          intelligence.find(
                            (item) =>
                              item.ip ===
                              hopIP
                          );

                        return (
                          <div
                            key={`${hop.hop}-${hopIP}`}
                            className="flex items-center"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                hopIP &&
                                setSelectedIP(
                                  hopIP
                                )
                              }
                              className={`min-w-[190px] rounded-xl border px-4 py-3 text-left transition ${
                                hopIP ===
                                activeIP
                                  ? "border-cyan-500/40 bg-cyan-500/5"
                                  : "border-slate-800 bg-[#09131d] hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] tracking-widest text-slate-700">
                                  HOP{" "}
                                  {String(
                                    hop.hop
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>

                                <span className="text-[9px] text-slate-700">
                                  {hop.ips
                                    ?.length ||
                                    0}{" "}
                                  IP
                                </span>
                              </div>

                              <p className="mt-2 font-mono text-xs text-slate-300">
                                {hopIP ||
                                  "No IP extracted"}
                              </p>

                              <p className="mt-1 truncate text-[9px] text-slate-600">
                                {hopIntel
                                  ? [
                                      hopIntel.city,
                                      hopIntel.country,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        ", "
                                      ) ||
                                    "Location unavailable"
                                  : hop.ips?.[0]
                                      ?.classification ||
                                    "Observed"}
                              </p>
                            </button>

                            {index <
                              relayPath.length -
                                1 && (
                              <span className="px-4 text-slate-700">
                                →
                              </span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-700">
                    No Received-header relay
                    path is available for this
                    case.
                  </p>
                )}
              </div>
            </section>

            {/* IP INTELLIGENCE */}

            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1621]">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-cyan-400">
                    IP INTELLIGENCE
                  </p>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Enrichment returned for
                    observed public infrastructure
                  </p>
                </div>

                <span className="text-[10px] text-slate-600">
                  {intelligence.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] tracking-widest text-slate-700">
                      <th className="px-5 py-3 font-normal">
                        IP
                      </th>

                      <th className="px-5 py-3 font-normal">
                        LOCATION
                      </th>

                      <th className="px-5 py-3 font-normal">
                        ISP / ORG
                      </th>

                      <th className="px-5 py-3 font-normal">
                        NETWORK
                      </th>

                      <th className="px-5 py-3 font-normal">
                        RISK
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {intelligence.map(
                      (item) => (
                        <tr
                          key={item.ip}
                          onClick={() =>
                            setSelectedIP(
                              item.ip
                            )
                          }
                          className={`cursor-pointer border-b border-slate-800/70 transition ${
                            item.ip ===
                            activeIP
                              ? "bg-cyan-500/5"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="px-5 py-3 font-mono text-[11px] text-cyan-400">
                            {item.ip}
                          </td>

                          <td className="px-5 py-3 text-[10px] text-slate-400">
                            {[
                              item.city,
                              item.region,
                              item.country,
                            ]
                              .filter(Boolean)
                              .join(
                                ", "
                              ) ||
                              "Unknown"}
                          </td>

                          <td className="px-5 py-3 text-[10px] text-slate-500">
                            {item.isp ||
                              item.organization ||
                              "Unknown"}
                          </td>

                          <td className="px-5 py-3 text-[9px] text-slate-600">
                            {[
                              item.hosting
                                ? "HOSTING"
                                : "",
                              item.vpn
                                ? "VPN"
                                : "",
                              item.tor
                                ? "TOR"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(
                                " · "
                              ) ||
                              "STANDARD"}
                          </td>

                          <td className="px-5 py-3">
                            <span
                              className={
                                item.risk ===
                                "HIGH"
                                  ? "text-[9px] text-red-400"
                                  : "text-[9px] text-slate-500"
                              }
                            >
                              {item.risk ||
                                "UNKNOWN"}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {intelligence.length ===
                  0 && (
                  <div className="py-12 text-center text-xs text-slate-700">
                    No IP intelligence
                    records available.
                  </div>
                )}
              </div>
            </section>

            {/* DISCLAIMER */}

            <p className="mx-auto max-w-3xl py-5 text-center text-[9px] leading-5 text-slate-700">
              Geo-location represents observed
              infrastructure associated with the
              analyzed artifact. It does not
              establish the attacker's physical
              location or identity.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

/*
 * ============================================================
 * MAP
 * ============================================================
 *
 * This deliberately uses an iframe-based OpenStreetMap view.
 * That means this page does NOT depend on the missing
 * "@/app/components/ThreatMap" module.
 */

function GeoMap({
  nodes,
  activeIP,
  onSelectIP,
}: {
  nodes: MapNode[];
  activeIP: string | null;
  onSelectIP: (ip: string) => void;
}) {
  const active =
    nodes.find(
      (node) =>
        node.ip === activeIP
    ) || nodes[0];

  const lat =
    active?.latitude ?? 20.5937;

  const lon =
    active?.longitude ?? 78.9629;

  const delta = 8;

  const bbox = [
    lon - delta,
    lat - delta,
    lon + delta,
    lat + delta,
  ].join(",");

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div className="relative h-full w-full">
      <iframe
        title="TraceMail geographic intelligence map"
        src={mapUrl}
        className="h-full w-full border-0"
      />

      {/* MAP OVERLAY */}

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-700/80 bg-[#071019]/90 px-4 py-3 backdrop-blur">
        <p className="text-[9px] tracking-[0.18em] text-cyan-400">
          OBSERVED INFRASTRUCTURE
        </p>

        <p className="mt-1 text-xs text-slate-300">
          {nodes.length} geolocated node
          {nodes.length === 1
            ? ""
            : "s"}
        </p>
      </div>

      {/* IP CONTROLS */}

      {nodes.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700/80 bg-[#071019]/90 p-3 backdrop-blur">
            {nodes.map((node) => (
              <button
                key={node.ip}
                type="button"
                onClick={() =>
                  onSelectIP(node.ip)
                }
                className={`pointer-events-auto rounded-lg border px-3 py-2 font-mono text-[9px] transition ${
                  node.ip === activeIP
                    ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                    : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                {node.ip}

                {node.earliest && (
                  <span className="ml-2 text-orange-400">
                    EARLIEST
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MapLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />

        <p className="text-[10px] tracking-[0.25em] text-cyan-400">
          GEO ENGINE
        </p>

        <p className="mt-2 text-xs text-slate-600">
          Loading geographic intelligence...
        </p>
      </div>
    </div>
  );
}

function EmptyMap({
  publicIPCount,
}: {
  publicIPCount: number;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 text-slate-600">
          ⌖
        </div>

        <p className="text-sm text-slate-500">
          No geolocated infrastructure
          available
        </p>

        <p className="mt-2 text-[10px] text-slate-700">
          Observed public IPs:{" "}
          {publicIPCount}
        </p>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * UI HELPERS
 * ============================================================
 */

function SeverityBadge({
  severity,
  score,
}: {
  severity: string;
  score: number;
}) {
  const danger =
    score >= 80;

  const warning =
    score >= 60 &&
    score < 80;

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[9px] tracking-wide ${
        danger
          ? "border-red-500/30 bg-red-500/5 text-red-400"
          : warning
            ? "border-orange-500/30 bg-orange-500/5 text-orange-400"
            : "border-slate-700 text-slate-500"
      }`}
    >
      {severity}
    </span>
  );
}

function RiskBadge({
  risk,
}: {
  risk: string;
}) {
  const normalized =
    risk.toUpperCase();

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[9px] ${
        normalized === "HIGH"
          ? "border-red-500/30 text-red-400"
          : normalized === "MEDIUM"
            ? "border-orange-500/30 text-orange-400"
            : "border-slate-700 text-slate-500"
      }`}
    >
      {normalized}
    </span>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] px-5 py-4">
      <p className="text-[9px] tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="max-w-[240px]">
      <p className="text-[8px] tracking-[0.18em] text-slate-700">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-xs ${
          danger
            ? "text-red-400"
            : "text-slate-400"
        }`}
      >
        {value}
      </p>
    </div>
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
    <div className="rounded-lg border border-slate-800 bg-[#09131d] px-3 py-3">
      <p className="text-[8px] tracking-[0.16em] text-slate-700">
        {label}
      </p>

      <p
        className="mt-1.5 truncate text-[10px] text-slate-400"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}