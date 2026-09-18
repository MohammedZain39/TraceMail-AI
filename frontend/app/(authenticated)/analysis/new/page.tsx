"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function NewAnalysisPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState("");
  const [loading, setLoading] = useState(false);

  const modules = [
    "Threat Detection",
    "Header Forensics",
    "IOC Extraction",
    "IP Intelligence",
    "Domain Intelligence",
    "Threat Correlation",
    "Threat DNA",
    "Evidence Preservation",
  ];

  const handleAnalyze = async () => {
    if (!file && !rawHeaders.trim()) {
      alert("Please upload an .eml file or paste raw email headers.");
      return;
    }

    // Current FastAPI endpoint expects an .eml file.
    if (!file) {
      alert(
        "Please upload the original .EML file. Raw-header analysis will be added to the backend workflow next."
      );
      return;
    }

    if (!file.name.toLowerCase().endsWith(".eml")) {
      alert("Please upload a valid .EML file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch("/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Analysis failed (${response.status})`;

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      /*
       * Store the complete backend result temporarily.
       *
       * This contains:
       * - email
       * - threat analysis
       * - forensic analysis
       * - IP intelligence
       * - URL intelligence
       * - threat graph
       * - threat DNA
       * - evidence / ledger
       * - case
       * - forensic report
       */
      sessionStorage.setItem(
        "tracemail_analysis",
        JSON.stringify(result)
      );

      // Also store the generated case ID separately for easy access.
      if (result?.evidence?.case?.case_id) {
        sessionStorage.setItem(
          "tracemail_case_id",
          result.evidence.case.case_id
        );
      }

      router.push("/analysis/new/processing");
    } catch (error) {
      console.error("TraceMail analysis error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to analyze the email."
      );

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071019] text-white p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold">
            New Investigation
          </h1>

          <p className="text-gray-400 mt-2">
            Analyze a suspicious email and generate forensic intelligence.
          </p>
        </div>

        {/* Upload section */}
        <section className="border border-gray-700 bg-[#0b1621] p-8 rounded-lg">

          <h2 className="text-xl font-semibold mb-2">
            Upload Evidence
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Upload the original email as an .EML file.
          </p>

          <label
            htmlFor="email-file"
            className="block border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-cyan-500 transition"
          >
            <div className="text-4xl mb-4">
              📧
            </div>

            {file ? (
              <>
                <p className="text-cyan-400 font-medium">
                  {file.name}
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  File selected successfully
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300">
                  Drop your .EML file here
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  or click to browse your computer
                </p>
              </>
            )}

            <input
              id="email-file"
              type="file"
              accept=".eml,message/rfc822"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];

                if (selected) {
                  setFile(selected);
                  setRawHeaders("");
                }
              }}
            />
          </label>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-gray-700 flex-1" />

            <span className="text-gray-500 text-sm">
              OR
            </span>

            <div className="h-px bg-gray-700 flex-1" />
          </div>

          {/* Raw headers */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Paste Raw Email Headers
            </label>

            <textarea
              value={rawHeaders}
              onChange={(e) => {
                setRawHeaders(e.target.value);
                setFile(null);
              }}
              placeholder={`From: suspicious@example.com
To: employee@company.com
Subject: Urgent Payment Required
Received: from mail.example.com (8.8.8.8)
Authentication-Results: spf=fail; dkim=fail; dmarc=fail`}
              className="w-full h-48 bg-[#071019] border border-gray-700 rounded-lg p-4 text-sm text-gray-300 outline-none focus:border-cyan-500 resize-none"
            />

            <p className="text-xs text-gray-500 mt-2">
              Raw-header-only analysis is not connected to the current
              backend endpoint yet. Upload an .EML file for the complete
              investigation pipeline.
            </p>
          </div>
        </section>

        {/* Analysis modules */}
        <section className="border border-gray-700 bg-[#0b1621] p-8 rounded-lg mt-6">

          <h2 className="text-xl font-semibold mb-2">
            Analysis Modules
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            The following forensic checks will be performed automatically.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {modules.map((module) => (
              <div
                key={module}
                className="border border-gray-700 rounded-lg p-4 bg-[#09131d]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400">
                    ✓
                  </span>

                  <span className="text-sm text-gray-300">
                    {module}
                  </span>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Start button */}
        <div className="flex justify-end mt-6">

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold rounded-lg transition"
          >
            {loading
              ? "ANALYZING EMAIL..."
              : "START ANALYSIS →"}
          </button>

        </div>

      </div>
    </main>
  );
}