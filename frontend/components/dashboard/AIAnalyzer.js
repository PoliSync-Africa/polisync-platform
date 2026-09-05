"use client";

import { useState } from "react";

export default function AIAnalyzer({
  role = "user",
}) {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (event) => {
    event?.preventDefault();

    const prompt = input.trim();

    if (!prompt || loading) {
      return;
    }

    setError("");
    setAnalysis("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            prompt,

            role,

            purpose: "general_and_polisync_analysis",
          }),
        }
      );

      let data = {};

try {
  data = await response.json();
} catch {
  data = {
    error: `AI service returned an invalid response (${response.status}).`,
  };
}

if (!response.ok) {
  throw new Error(
    data?.message ||
      data?.error ||
      `AI analysis failed (${response.status}).`
  );
}
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "AI analysis could not be completed."
        );
      }

      const result =
        data?.data?.analysis ||
        data?.data?.response ||
        data?.data?.answer ||
        data?.analysis ||
        data?.response ||
        data?.answer ||
        data?.message;

      if (!result) {
        throw new Error(
          "The AI service returned no analysis."
        );
      }

      setAnalysis(String(result));
    } catch (analysisError) {
      console.error(
        "PoliSync AI Analyzer error:",
        analysisError
      );

      setError(
        analysisError?.message ||
          "Unable to connect to the AI Analyzer."
      );
    } finally {
      setLoading(false);
    }
  };

  const useExample = (example) => {
    setInput(example);
    setError("");
  };

  const clearAnalysis = () => {
    setInput("");
    setAnalysis("");
    setError("");
  };

  return (
    <section className="polisync-ai-analyzer">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="analyzer-header">
        <div className="analyzer-title-area">
          <div className="analyzer-icon">
            ✦
          </div>

          <div>
            <span className="analyzer-label">
              POLISYNC INTELLIGENCE
            </span>

            <h2>AI Analyzer</h2>

            <p>
              Analyze information, research,
              data and general questions.
            </p>
          </div>
        </div>

        <div className="analyzer-badge">
          AI
        </div>
      </div>

      {/* ====================================================
          CAPABILITIES
      ==================================================== */}

      <div className="analyzer-capabilities">
        <span>General AI</span>
        <span>Research</span>
        <span>Election Intelligence</span>
        <span>Data Analysis</span>
        <span>Reports</span>
      </div>

      {/* ====================================================
          INPUT
      ==================================================== */}

      <form
        className="analyzer-form"
        onSubmit={analyze}
      >
        <label htmlFor="ai-analyzer-input">
          What would you like me to analyze?
        </label>

        <textarea
          id="ai-analyzer-input"
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder={
            "Ask a general question or analyze PoliSync information..."
          }
          disabled={loading}
          maxLength={10000}
        />

        <div className="analyzer-form-footer">
          <span>
            {input.length}/10,000
          </span>

          <button
            type="submit"
            disabled={
              loading || !input.trim()
            }
          >
            {loading
              ? "Analyzing..."
              : "Analyze"}
          </button>
        </div>
      </form>

      {/* ====================================================
          EXAMPLES
      ==================================================== */}

      <div className="analyzer-examples">
        <span>Try an example:</span>

        <button
          type="button"
          onClick={() =>
            useExample(
              "Analyze the key factors that can influence voter turnout."
            )
          }
        >
          Voter turnout
        </button>

        <button
          type="button"
          onClick={() =>
            useExample(
              "Explain this information in simple terms."
            )
          }
        >
          Explain simply
        </button>

        <button
          type="button"
          onClick={() =>
            useExample(
              "What insights can be obtained from election results data?"
            )
          }
        >
          Election insights
        </button>

        <button
          type="button"
          onClick={() =>
            useExample(
              "Summarize the main points and identify important trends."
            )
          }
        >
          Find trends
        </button>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="analyzer-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ====================================================
          RESULT
      ==================================================== */}

      {analysis && (
        <div className="analyzer-result">
          <div className="result-header">
            <div>
              <span>
                AI ANALYSIS
              </span>

              <h3>
                Analysis Result
              </h3>
            </div>

            <button
              type="button"
              onClick={clearAnalysis}
            >
              Clear
            </button>
          </div>

          <div className="result-content">
            {analysis}
          </div>

          <div className="result-footer">
            <span>
              Generated by PoliSync AI
            </span>

            <span>
              Role: {formatRole(role)}
            </span>
          </div>
        </div>
      )}

      {/* ====================================================
          PRIVACY NOTICE
      ==================================================== */}

      <div className="analyzer-notice">
        <span>🔒</span>

        <p>
          Avoid entering passwords, authentication
          codes, financial credentials or other
          sensitive personal information into an
          AI request.
        </p>
      </div>

      <style jsx>{`
        .polisync-ai-analyzer {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        /* ==================================================
           HEADER
        ================================================== */

        .analyzer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .analyzer-title-area {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .analyzer-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: #eaf5ee;
          color: #075f2b;
          border: 1px solid #d9e9de;
          font-size: 22px;
          font-weight: 900;
        }

        .analyzer-label {
          display: block;
          color: #c9a227;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .analyzer-title-area h2 {
          margin: 3px 0 0;
          color: #075f2b;
          font-size: 18px;
          font-weight: 850;
        }

        .analyzer-title-area p {
          margin: 3px 0 0;
          color: #818a84;
          font-size: 10px;
          line-height: 1.4;
        }

        .analyzer-badge {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 10px;
          background: #075f2b;
          color: #ffffff;
          border: 2px solid #c9a227;
          font-size: 9px;
          font-weight: 900;
        }

        /* ==================================================
           CAPABILITIES
        ================================================== */

        .analyzer-capabilities {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 16px;
        }

        .analyzer-capabilities span {
          padding: 5px 8px;
          border-radius: 999px;
          background: #f3f8f5;
          color: #557060;
          font-size: 8px;
          font-weight: 750;
        }

        /* ==================================================
           FORM
        ================================================== */

        .analyzer-form {
          margin-top: 16px;
        }

        .analyzer-form label {
          display: block;
          margin-bottom: 6px;
          color: #48554d;
          font-size: 10px;
          font-weight: 800;
        }

        .analyzer-form textarea {
          width: 100%;
          min-height: 115px;
          resize: vertical;
          padding: 12px;
          border: 1px solid #dce6df;
          border-radius: 11px;
          background: #fbfdfb;
          color: #27342d;
          font-family: inherit;
          font-size: 11px;
          line-height: 1.5;
          outline: none;
        }

        .analyzer-form textarea:focus {
          border-color: #075f2b;
          box-shadow:
            0 0 0 2px rgba(7, 95, 43, 0.08);
          background: #ffffff;
        }

        .analyzer-form textarea:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .analyzer-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 7px;
        }

        .analyzer-form-footer span {
          color: #99a19c;
          font-size: 8px;
        }

        .analyzer-form-footer button {
          min-width: 92px;
          padding: 9px 13px;
          border: 0;
          border-radius: 9px;
          background: #075f2b;
          color: #ffffff;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .analyzer-form-footer button:hover:not(:disabled) {
          background: #064d24;
        }

        .analyzer-form-footer button:disabled {
          background: #a5bcae;
          cursor: not-allowed;
        }

        /* ==================================================
           EXAMPLES
        ================================================== */

        .analyzer-examples {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
        }

        .analyzer-examples > span {
          color: #8c958f;
          font-size: 8px;
          font-weight: 700;
        }

        .analyzer-examples button {
          padding: 6px 8px;
          border: 1px solid #e0e8e2;
          border-radius: 999px;
          background: #ffffff;
          color: #657069;
          font-size: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .analyzer-examples button:hover {
          background: #f2f7f4;
          color: #075f2b;
          border-color: #bfd4c5;
        }

        /* ==================================================
           ERROR
        ================================================== */

        .analyzer-error {
          margin-top: 12px;
          padding: 10px;
          border: 1px solid #efd0d0;
          border-radius: 9px;
          background: #fff5f5;
          color: #a00000;
          font-size: 9px;
          line-height: 1.5;
        }

        /* ==================================================
           RESULT
        ================================================== */

        .analyzer-result {
          margin-top: 17px;
          overflow: hidden;
          border: 1px solid #dce8df;
          border-radius: 13px;
          background: #f9fcfa;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 13px;
          background: #edf7f0;
          border-bottom: 1px solid #dce8df;
        }

        .result-header span {
          display: block;
          color: #c9a227;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .result-header h3 {
          margin: 3px 0 0;
          color: #075f2b;
          font-size: 12px;
          font-weight: 850;
        }

        .result-header button {
          padding: 5px 8px;
          border: 1px solid #d5e2d9;
          border-radius: 7px;
          background: #ffffff;
          color: #68746d;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .result-content {
          padding: 14px;
          color: #344139;
          font-size: 11px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .result-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 13px;
          border-top: 1px solid #e3ebe5;
          color: #929b95;
          font-size: 8px;
        }

        /* ==================================================
           PRIVACY NOTICE
        ================================================== */

        .analyzer-notice {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 14px;
          padding: 9px 10px;
          border-radius: 9px;
          background: #fbfaf4;
          border: 1px solid #eee7c9;
        }

        .analyzer-notice span {
          font-size: 11px;
        }

        .analyzer-notice p {
          margin: 0;
          color: #837b5a;
          font-size: 8px;
          line-height: 1.5;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 600px) {
          .polisync-ai-analyzer {
            padding: 17px;
          }

          .analyzer-title-area p {
            display: none;
          }

          .analyzer-capabilities {
            gap: 5px;
          }

          .analyzer-form textarea {
            min-height: 125px;
          }

          .result-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 430px) {
          .analyzer-title-area {
            align-items: flex-start;
          }

          .analyzer-icon {
            width: 38px;
            height: 38px;
          }

          .analyzer-title-area h2 {
            font-size: 16px;
          }

          .analyzer-badge {
            display: none;
          }

          .analyzer-examples {
            align-items: flex-start;
          }

          .analyzer-examples > span {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   ROLE FORMATTER
============================================================ */

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return String(role)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}
