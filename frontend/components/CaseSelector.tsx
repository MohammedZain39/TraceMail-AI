"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CaseItem = {
  case_id?: string;
  filename?: string;

  email?: {
    subject?: string;
    sender?: string;
  };

  threat_analysis?: {
    severity?: string;
    risk_score?: number;
    classification?: string;
  };

  status?: string;
};

type CaseSelectorProps = {
  value: string | null;
  onChange: (id: string) => void;
};

export default function CaseSelector({
  value,
  onChange,
}: CaseSelectorProps) {
  const [cases, setCases] =
    useState<CaseItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * =====================================================
   * LOAD AUTHENTICATED CASES
   * =====================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadCases = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * IMPORTANT:
         * Never use normal fetch here.
         *
         * apiFetch attaches:
         * Authorization: Bearer <supabase access token>
         */

        const response = await apiFetch(
          "/cases",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load investigation cases (${response.status})`
          );
        }

        const data =
          await response.json();

        if (!mounted) {
          return;
        }

        const loadedCases =
          Array.isArray(data?.cases)
            ? data.cases
            : [];

        setCases(loadedCases);

        /*
         * If there is no case currently selected
         * and cases exist, don't automatically change
         * the selection. Let the user choose.
         */

      } catch (err) {
        console.error(
          "Failed to load investigation cases:",
          err
        );

        if (!mounted) {
          return;
        }

        setCases([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load investigation cases."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCases();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =====================================================
   * SELECT CASE
   * =====================================================
   */

  const handleChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCase =
      event.target.value;

    if (!selectedCase) {
      return;
    }

    try {
      sessionStorage.setItem(
        "tracemail_case_id",
        selectedCase
      );
    } catch (err) {
      console.error(
        "Unable to persist selected case:",
        err
      );
    }

    onChange(selectedCase);
  };

  /*
   * =====================================================
   * LOADING STATE
   * =====================================================
   */

  if (loading) {
    return (
      <div className="w-full">

        <div className="mb-1.5 text-[9px] tracking-[0.22em] text-gray-600">
          SELECT INVESTIGATION CASE
        </div>

        <div className="h-[50px] rounded-xl border border-[#1b2a3d] bg-[#0b1220] px-4 flex items-center">

          <span className="text-xs text-gray-600 animate-pulse">
            Loading investigation cases...
          </span>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * ERROR STATE
   * =====================================================
   */

  if (error) {
    return (
      <div className="w-full">

        <div className="mb-1.5 text-[9px] tracking-[0.22em] text-gray-600">
          SELECT INVESTIGATION CASE
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">

          <p className="text-[10px] text-red-400">
            Unable to load investigation cases.
          </p>

          <p className="text-[9px] text-gray-700 mt-1 truncate">
            {error}
          </p>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * EMPTY STATE
   * =====================================================
   */

  if (cases.length === 0) {
    return (
      <div className="w-full">

        <div className="mb-1.5 text-[9px] tracking-[0.22em] text-gray-600">
          SELECT INVESTIGATION CASE
        </div>

        <div className="h-[50px] rounded-xl border border-[#1b2a3d] bg-[#0b1220] px-4 flex items-center justify-between">

          <span className="text-xs text-gray-700">
            No investigation cases available
          </span>

          <span className="text-gray-700 text-xs">
            ▼
          </span>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * SELECTOR
   * =====================================================
   */

  return (
    <div className="w-full">

      <div className="mb-1.5 text-[9px] tracking-[0.22em] text-gray-600">
        SELECT INVESTIGATION CASE
      </div>

      <div className="relative">

        <select
          value={value || ""}
          onChange={handleChange}
          className="appearance-none w-full h-[50px] rounded-xl border border-[#1b2a3d] bg-[#0b1220] px-4 pr-10 text-sm text-[#e7edf5] outline-none transition focus:border-cyan-500/40 hover:border-gray-700 [color-scheme:dark]"
        >

          <option
            value=""
            disabled
          >
            Choose an investigation case
          </option>

          {cases.map((item) => {

            const caseId =
              item.case_id || "";

            const subject =
              item.email?.subject ||
              item.filename ||
              "Email investigation";

            const severity =
              String(
                item.threat_analysis
                  ?.severity || ""
              ).toUpperCase();

            return (
              <option
                key={caseId}
                value={caseId}
              >
                {caseId} · {subject}
                {severity
                  ? ` · ${severity}`
                  : ""}
              </option>
            );
          })}

        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs">
          ▼
        </div>

      </div>

    </div>
  );
}