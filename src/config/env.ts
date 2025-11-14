/**
 * Environment variables configuration
 * Access environment variables through this file for type safety
 */

export const env = {
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  
  // TestSpite MCP
  testspiteMcpApiKey: import.meta.env.VITE_TESTSPITE_MCP_API_KEY || "",
  testspiteMcpApiUrl: import.meta.env.VITE_TESTSPITE_MCP_API_URL || "https://api.testspite.com",
} as const;

// Validate required environment variables in production
if (import.meta.env.PROD) {
  const requiredVars = [
    { key: "VITE_SUPABASE_URL", value: env.supabaseUrl },
    { key: "VITE_SUPABASE_ANON_KEY", value: env.supabaseAnonKey },
  ];

  const missingVars = requiredVars
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }
}

