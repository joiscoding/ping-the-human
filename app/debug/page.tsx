"use client";

import { useState } from "react";

// Sample data pre-populated for testing
const defaultPayload = {
  FirstName: "Bob",
  LastName: "Builder",
  PhoneNumber: "5554332646",
  PostalAddress: {
    AddressFirstLine: "123 Main St.",
    AddressSecondLine: "",
    City: "Indianapolis",
    State: "IN",
    PostalCode: "46203",
  },
  Email: "bob.builder@gmail.com",
  Source: "Angie's List Quote Request",
  Description: "I'm Looking for recurring house cleaning services please.",
  Category: "Indianapolis – House Cleaning",
  Urgency: "This Week",
  CorrelationId: crypto.randomUUID(),
  ALAccountId: "123456",
};

export default function DebugPage() {
  const [payload, setPayload] = useState(
    JSON.stringify(defaultPayload, null, 2)
  );
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setResponse(null);
    setStatusCode(null);

    try {
      const parsed = JSON.parse(payload);
      const res = await fetch("/api/v1/lead/angi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      setStatusCode(res.status);
      setResponse(JSON.stringify(data, null, 2));
      setStatus(res.ok ? "success" : "error");
    } catch (err) {
      setStatus("error");
      setResponse(
        err instanceof SyntaxError
          ? "Invalid JSON in payload"
          : String(err)
      );
    }
  };

  const generateNewCorrelationId = () => {
    try {
      const parsed = JSON.parse(payload);
      parsed.CorrelationId = crypto.randomUUID();
      setPayload(JSON.stringify(parsed, null, 2));
    } catch {
      // If JSON is invalid, just reset to default with new ID
      const newDefault = { ...defaultPayload, CorrelationId: crypto.randomUUID() };
      setPayload(JSON.stringify(newDefault, null, 2));
    }
  };

  const resetPayload = () => {
    const newDefault = { ...defaultPayload, CorrelationId: crypto.randomUUID() };
    setPayload(JSON.stringify(newDefault, null, 2));
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">API Debug Console</h1>
        <p className="text-gray-500 mb-8">
          Test the POST /api/v1/lead/angi endpoint
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Request Payload</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateNewCorrelationId}
                  className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  New CorrelationId
                </button>
                <button
                  type="button"
                  onClick={resetPayload}
                  className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full h-[500px] p-4 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter JSON payload..."
                spellCheck={false}
              />

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Submit POST Request"
                )}
              </button>
            </form>
          </div>

          {/* Response Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Response</h2>

            {status === "idle" && (
              <div className="h-[500px] p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                Submit a request to see the response
              </div>
            )}

            {status === "loading" && (
              <div className="h-[500px] p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
                <svg
                  className="animate-spin h-8 w-8"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}

            {(status === "success" || status === "error") && (
              <div className="space-y-2">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {status === "success" ? "✓ Success" : "✗ Error"}
                  </span>
                  {statusCode && (
                    <span className="text-sm text-gray-500">
                      Status: {statusCode}
                    </span>
                  )}
                </div>

                {/* Response Body */}
                <pre className="h-[460px] p-4 overflow-auto font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap">
                  {response}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
          <h3 className="font-semibold mb-2">API Endpoint Info</h3>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>
              <strong>URL:</strong>{" "}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                POST /api/v1/lead/angi
              </code>
            </li>
            <li>
              <strong>Response codes:</strong> 201 (created), 200 (duplicate),
              400 (validation error), 500 (server error)
            </li>
            <li>
              <strong>Tip:</strong> Click &quot;New CorrelationId&quot; to generate a
              unique ID and avoid duplicate detection
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
