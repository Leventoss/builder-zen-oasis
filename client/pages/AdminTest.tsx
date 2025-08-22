import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";

export default function AdminTest() {
  const { user, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runAPITests = async () => {
    setLoading(true);
    setTestResults([]);
    const results: any[] = [];

    // Test 1: Basic fetch test
    try {
      const response = await fetch("/api/test");
      const data = await response.json();
      results.push({
        test: "Basic API Test",
        status: "success",
        data: data,
      });
    } catch (error) {
      results.push({
        test: "Basic API Test",
        status: "error",
        error: error.message,
      });
    }

    // Test 2: Admin stats
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      results.push({
        test: "Admin Stats",
        status: "success",
        data: data,
      });
    } catch (error) {
      results.push({
        test: "Admin Stats",
        status: "error",
        error: error.message,
      });
    }

    // Test 3: Animes
    try {
      const response = await fetch("/api/animes");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      results.push({
        test: "Animes API",
        status: "success",
        data: {
          success: data.success,
          count: data.data?.length || 0,
          firstAnime: data.data?.[0]?.title || "N/A",
        },
      });
    } catch (error) {
      results.push({
        test: "Animes API",
        status: "error",
        error: error.message,
      });
    }

    // Test 4: Users
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      results.push({
        test: "Admin Users",
        status: "success",
        data: {
          success: data.success,
          count: data.data?.length || 0,
        },
      });
    } catch (error) {
      results.push({
        test: "Admin Users",
        status: "error",
        error: error.message,
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      runAPITests();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-anime-dark">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white">
            Admin Test - Access Denied
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anime-dark">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">API Diagnostic Test</h1>
          <Button
            onClick={runAPITests}
            disabled={loading}
            className="bg-anime-accent hover:bg-anime-accent/80"
          >
            {loading ? "Testing..." : "Run Tests"}
          </Button>
        </div>

        <div className="bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Test Results
          </h2>

          {loading && <div className="text-gray-400">Running API tests...</div>}

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.status === "success"
                      ? "bg-green-900/20 border border-green-600/40"
                      : "bg-red-900/20 border border-red-600/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{result.test}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        result.status === "success"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>

                  {result.status === "success" ? (
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-red-400 text-sm">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {testResults.length === 0 && !loading && (
            <div className="text-gray-400">
              Click "Run Tests" to check API connectivity
            </div>
          )}
        </div>

        <div className="mt-8 bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">User Info</h2>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            {JSON.stringify(
              {
                id: user?.id,
                username: user?.username,
                email: user?.email,
                isAdmin: user?.isAdmin,
                isPremium: user?.isPremium,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="mt-8 bg-anime-card border border-anime-accent/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Environment Info
          </h2>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            {JSON.stringify(
              {
                location: window.location.href,
                userAgent: navigator.userAgent.slice(0, 100) + "...",
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
