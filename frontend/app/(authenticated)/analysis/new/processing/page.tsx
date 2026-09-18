"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  "Uploading Evidence",
  "Parsing Email",
  "Checking Authentication",
  "Extracting Indicators",
  "Tracing Infrastructure",
  "Correlating Threats",
  "Generating Investigation",
];

export default function ProcessingPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    const storedCaseId = sessionStorage.getItem("tracemail_case_id");

    if (storedCaseId) {
      setCaseId(storedCaseId);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((previous) => {
        if (previous >= steps.length - 1) {
          clearInterval(interval);
          return previous;
        }

        return previous + 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === steps.length - 1) {
      const timeout = setTimeout(() => {
        /*
         * The backend creates the real investigation case.
         * For now, the investigations page is the available
         * frontend destination.
         */
        router.push("/investigations");
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [currentStep, router]);

  const progress = Math.round(
    ((currentStep + 1) / steps.length) * 100
  );

  return (
    <main className="min-h-screen bg-[#071019] text-white flex items-center justify-center p-6">

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">

          <div className="text-xs tracking-[0.3em] text-cyan-400 mb-4">
            TRACE MAIL AI
          </div>

          <h1 className="text-3xl font-bold">
            Analyzing Evidence
          </h1>

          <p className="text-gray-500 mt-2">
            TraceMail AI is performing a forensic analysis of the submitted email.
          </p>

          {caseId && (
            <p className="text-xs text-gray-600 mt-4">
              Investigation Case:{" "}
              <span className="text-cyan-500">
                {caseId}
              </span>
            </p>
          )}

        </div>

        {/* Processing card */}
        <div className="border border-gray-800 bg-[#0b1621] rounded-lg p-8">

          {/* Progress */}
          <div className="flex justify-between items-center mb-3">

            <span className="text-sm text-gray-400">
              Analysis Progress
            </span>

            <span className="text-sm text-cyan-400">
              {progress}%
            </span>

          </div>

          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-10">

            <div
              className="h-full bg-cyan-500 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          {/* Steps */}
          <div className="space-y-5">

            {steps.map((step, index) => {

              const completed = index < currentStep;
              const active = index === currentStep;
              const pending = index > currentStep;

              return (
                <div
                  key={step}
                  className="flex items-center gap-4"
                >

                  {/* Status */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm shrink-0
                    ${
                      completed
                        ? "border-green-500 text-green-400 bg-green-500/10"
                        : active
                        ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                        : "border-gray-700 text-gray-600"
                    }`}
                  >

                    {completed ? (
                      "✓"
                    ) : active ? (
                      <span className="animate-pulse">
                        ◌
                      </span>
                    ) : (
                      "○"
                    )}

                  </div>

                  {/* Text */}
                  <div className="flex-1">

                    <p
                      className={`text-sm ${
                        completed
                          ? "text-green-400"
                          : active
                          ? "text-cyan-400"
                          : "text-gray-600"
                      }`}
                    >
                      {step}
                    </p>

                    {active && (
                      <p className="text-xs text-gray-600 mt-1">
                        Processing...
                      </p>
                    )}

                  </div>

                  {/* State */}
                  <span className="text-[10px] tracking-wider text-gray-600">

                    {completed
                      ? "COMPLETE"
                      : active
                      ? "RUNNING"
                      : pending
                      ? "QUEUED"
                      : ""}

                  </span>

                </div>
              );
            })}

          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-6">

          <p className="text-xs text-gray-600">
            Do not close this window while the investigation is being processed.
          </p>

        </div>

      </div>

    </main>
  );
}