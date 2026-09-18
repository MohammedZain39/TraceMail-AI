"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

export default function SettingsPage() {
  const [automaticAnalysis, setAutomaticAnalysis] =
    useState(true);

  const [privacyRedaction, setPrivacyRedaction] =
    useState(true);

  const [investigationAlerts, setInvestigationAlerts] =
    useState(true);

  const [apiOnline, setApiOnline] =
    useState<boolean | null>(null);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    checkApi();
  }, []);

  async function checkApi() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/health`,
        {
          cache: "no-store",
        }
      );

      setApiOnline(response.ok);
    } catch {
      setApiOnline(false);
    }
  }

  function saveChanges() {
    /*
     * These settings are currently frontend prototype
     * preferences. They can later be persisted to Supabase.
     */

    localStorage.setItem(
      "tracemail-settings",
      JSON.stringify({
        automaticAnalysis,
        privacyRedaction,
        investigationAlerts,
      })
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "tracemail-settings"
        );

      if (!stored) return;

      const settings = JSON.parse(stored);

      if (
        typeof settings.automaticAnalysis ===
        "boolean"
      ) {
        setAutomaticAnalysis(
          settings.automaticAnalysis
        );
      }

      if (
        typeof settings.privacyRedaction ===
        "boolean"
      ) {
        setPrivacyRedaction(
          settings.privacyRedaction
        );
      }

      if (
        typeof settings.investigationAlerts ===
        "boolean"
      ) {
        setInvestigationAlerts(
          settings.investigationAlerts
        );
      }
    } catch {
      // Ignore malformed local settings.
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#071019] text-white">
      {/* 
        IMPORTANT:
        No sidebar.
        No navbar.
        No ml-64.
        Authenticated layout owns them globally.
      */}

      <div className="mx-auto w-full max-w-[1400px] px-8 py-8">
        {/* HEADER */}
        <section className="border-b border-slate-800 pb-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">
                SYSTEM
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Settings
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Configure TraceMail analysis and privacy
                behavior.
              </p>
            </div>

            <button
              onClick={saveChanges}
              className="rounded-md bg-cyan-400 px-5 py-3 text-xs font-bold tracking-wide text-[#04101a] transition hover:bg-cyan-300"
            >
              {saved
                ? "SAVED"
                : "SAVE CHANGES"}
            </button>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          {/* ANALYSIS */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0a1622]">
            <SectionHeader
              title="ANALYSIS"
              description="How incoming email evidence is processed."
            />

            <SettingRow
              title="Automatic analysis"
              description="Run the TraceMail analysis pipeline when an email artifact is submitted."
              enabled={automaticAnalysis}
              onChange={setAutomaticAnalysis}
            />

            <SettingRow
              title="Privacy redaction"
              description="Redact common personal identifiers from investigator-facing displays where possible."
              enabled={privacyRedaction}
              onChange={setPrivacyRedaction}
            />

            <SettingRow
              title="Investigation alerts"
              description="Enable local alert preferences for high-risk analysis results."
              enabled={investigationAlerts}
              onChange={setInvestigationAlerts}
            />
          </div>

          {/* SYSTEM STATUS */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0a1622]">
            <SectionHeader
              title="SYSTEM STATUS"
              description="Live connectivity checks."
            />

            <div className="p-5">
              <div className="rounded-lg border border-slate-800 bg-[#071019] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    TraceMail API
                  </span>

                  <span
                    className={
                      apiOnline === true
                        ? "text-xs text-emerald-400"
                        : apiOnline === false
                        ? "text-xs text-red-400"
                        : "text-xs text-slate-500"
                    }
                  >
                    <span className="mr-2">
                      ●
                    </span>

                    {apiOnline === true
                      ? "ONLINE"
                      : apiOnline === false
                      ? "OFFLINE"
                      : "CHECKING"}
                  </span>
                </div>

                <p className="mt-3 break-all font-mono text-[11px] text-slate-600">
                  {API_BASE_URL}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatusBox
                  label="ANALYSIS ENGINE"
                  value="LOCAL API"
                />

                <StatusBox
                  label="EVIDENCE"
                  value="SHA-256"
                />

                <StatusBox
                  label="DATABASE"
                  value="CASE STORE"
                />

                <StatusBox
                  label="MAP"
                  value="LEAFLET"
                />
              </div>
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-[#0a1622]">
          <SectionHeader
            title="INTEGRATIONS"
            description="Connection points used by the TraceMail prototype."
          />

          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
            <IntegrationCard
              title="Email ingestion"
              subtitle="EML upload"
              status="READY"
            />

            <IntegrationCard
              title="Geo intelligence"
              subtitle="IP enrichment"
              status="READY"
            />

            <IntegrationCard
              title="Forensic reports"
              subtitle="PDF generation"
              status="READY"
            />
          </div>
        </section>

        {/* PRIVACY */}
        <section className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-[#0a1622]">
          <SectionHeader
            title="PRIVACY & EVIDENCE"
            description="Investigation safeguards and evidence handling."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <InfoCard
              title="Privacy-preserving forensics"
              value={
                privacyRedaction
                  ? "ENABLED"
                  : "DISABLED"
              }
              description="Technical indicators can remain visible while common personal identifiers are redacted from investigator-facing views."
              active={privacyRedaction}
            />

            <InfoCard
              title="Evidence integrity"
              value="SHA-256"
              description="Analyzed email evidence is fingerprinted using SHA-256 and associated with the investigation case."
              active
            />

            <InfoCard
              title="Chain of custody"
              value="SUPPORTED"
              description="TraceMail associates evidence fingerprints with investigation records and ledger events for tamper-evident integrity workflows."
              active
            />

            <InfoCard
              title="Geolocation disclaimer"
              value="INFRASTRUCTURE CONTEXT"
              description="IP geolocation represents observed infrastructure and should not be interpreted as the exact physical location or identity of an attacker."
              active
            />
          </div>
        </section>

        {/* VERSION */}
        <footer className="mt-6 flex flex-col gap-2 border-t border-slate-800 pt-5 text-[10px] text-slate-600 md:flex-row md:items-center md:justify-between">
          <span>
            TRACE MAIL AI — FORENSIC INTELLIGENCE
          </span>

          <span className="font-mono">
            ANALYSIS ENGINE v1.0
          </span>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   COMPONENTS
   ============================================================ */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-800 px-5 py-5">
      <p className="text-[11px] tracking-[0.2em] text-cyan-400">
        {title}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-slate-800 px-5 py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-slate-300">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          enabled
            ? "border-cyan-400 bg-cyan-400"
            : "border-slate-700 bg-slate-800"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function StatusBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#071019] p-4">
      <p className="text-[9px] tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

function IntegrationCard({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#071019] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">
          {title}
        </p>

        <span className="text-[10px] uppercase tracking-wider text-emerald-400">
          {status}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        {subtitle}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
  active = false,
}: {
  title: string;
  value: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#071019] p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-300">
          {title}
        </p>

        <span
          className={
            active
              ? "text-[10px] tracking-wider text-emerald-400"
              : "text-[10px] tracking-wider text-slate-600"
          }
        >
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}