import { useState } from "react";
import { RefreshCw, Database, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { companiesAPI, jobsAPI, statsAPI, alertsAPI } from "../../lib/api";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export function AdminDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // Test API connectivity
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9112f926/health`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        diagnostics.checks.apiHealth = {
          status: res.ok ? "✅ OK" : "❌ FAILED",
          code: res.status,
        };
      } catch (e: any) {
        diagnostics.checks.apiHealth = {
          status: "❌ ERROR",
          error: e.message,
        };
      }

      // Test Companies
      try {
        const companies = await companiesAPI.getAll();
        diagnostics.checks.companies = {
          status: "✅ OK",
          count: companies.length,
          sample: companies.slice(0, 3).map((c: any) => c.name),
        };
      } catch (e: any) {
        diagnostics.checks.companies = {
          status: "❌ ERROR",
          error: e.message,
        };
      }

      // Test Jobs
      try {
        const jobs = await jobsAPI.getAll();
        diagnostics.checks.jobs = {
          status: "✅ OK",
          count: jobs.length,
          sample: jobs.slice(0, 3).map((j: any) => j.title),
        };
      } catch (e: any) {
        diagnostics.checks.jobs = {
          status: "❌ ERROR",
          error: e.message,
        };
      }

      // Test Stats
      try {
        const stats = await statsAPI.get();
        diagnostics.checks.stats = {
          status: "✅ OK",
          data: stats,
        };
      } catch (e: any) {
        diagnostics.checks.stats = {
          status: "❌ ERROR",
          error: e.message,
        };
      }

      // Test Subscribers
      try {
        const subscribers = await alertsAPI.getSubscribers();
        diagnostics.checks.subscribers = {
          status: "✅ OK",
          count: subscribers.length,
        };
      } catch (e: any) {
        diagnostics.checks.subscribers = {
          status: "❌ ERROR",
          error: e.message,
        };
      }

      setResults(diagnostics);
      toast.success("Diagnostics complete");
    } catch (error: any) {
      toast.error("Diagnostics failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const seedCompanies = async () => {
    if (!confirm("Seed companies? This will create 48 companies if they don't exist.")) return;
    try {
      setLoading(true);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9112f926/seed`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Seeded ${data.count} companies`);
      runDiagnostics();
    } catch (error: any) {
      toast.error(`Seed failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedJobs = async () => {
    if (!confirm("Seed jobs? This will create realistic job listings.")) return;
    try {
      setLoading(true);
      const res = await jobsAPI.seedJobs();
      console.log("Seed jobs response:", res);
      toast.success(`Seeded ${res.inserted || 0} jobs successfully`);
      runDiagnostics();
    } catch (error: any) {
      console.error("Job seed error:", error);
      toast.error(`Job seed failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">System Diagnostics</h1>
            <p className="text-sm text-gray-500">Test database connectivity and data availability</p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#5B39C8] text-white rounded-lg hover:bg-[#4a2fb0] disabled:opacity-50 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={seedCompanies}
              disabled={loading}
              className="px-4 py-2 bg-[#6B46C1] text-white rounded-lg hover:bg-[#5a3aa0] disabled:opacity-50 font-semibold"
            >
              Seed Companies (48)
            </button>
            <button
              onClick={seedJobs}
              disabled={loading}
              className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#d97706] disabled:opacity-50 font-semibold"
            >
              Seed Jobs
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-[#5B39C8]" />
              <h2 className="text-lg font-bold text-gray-900">Results</h2>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(results.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(results.checks).map(([key, value]: [string, any]) => (
                <div
                  key={key}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {value.status?.includes("✅") ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : value.status?.includes("⚠️") ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, " $1")}</h3>
                        <span className={`text-xs font-semibold ${
                          value.status?.includes("✅")
                            ? "text-green-600"
                            : value.status?.includes("⚠️")
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}>
                          {value.status}
                        </span>
                      </div>
                      {value.error && (
                        <p className="text-sm text-red-600 mb-2">Error: {value.error}</p>
                      )}
                      {value.count !== undefined && (
                        <p className="text-sm text-gray-600">Count: {value.count}</p>
                      )}
                      {value.code && (
                        <p className="text-sm text-gray-600">HTTP Code: {value.code}</p>
                      )}
                      {value.sample && (
                        <p className="text-sm text-gray-600">Sample: {value.sample.join(", ")}</p>
                      )}
                      {value.data && (
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(value.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}