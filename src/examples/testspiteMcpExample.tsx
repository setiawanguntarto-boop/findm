/**
 * Example component showing how to use TestSpite MCP service
 * This is a reference file - you can delete it or use it as a template
 */

import { useState } from "react";
import { testspiteMcp } from "@/services/testspiteMcp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TestSpiteMcpExample() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    if (!testspiteMcp.isConfigured()) {
      toast({
        title: "API Key Not Configured",
        description: "Please add VITE_TESTSPITE_MCP_API_KEY to your .env file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Example: Replace with actual TestSpite MCP endpoint
      const result = await testspiteMcp.get("/api/v1/test");
      setData(result);
      toast({
        title: "Success",
        description: "Successfully connected to TestSpite MCP API",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to TestSpite MCP API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">TestSpite MCP Integration Example</h2>
      
      <div className="space-y-2">
        <p>API Key Configured: {testspiteMcp.isConfigured() ? "✅ Yes" : "❌ No"}</p>
        
        <Button onClick={handleTestConnection} disabled={loading}>
          {loading ? "Testing..." : "Test Connection"}
        </Button>
      </div>

      {data && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Response:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

