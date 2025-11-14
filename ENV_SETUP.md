# Environment Variables Setup

This project uses environment variables for configuration. Follow these steps to set up your environment variables.

## Setup Instructions

1. **Create a `.env` file** in the root directory of the project (if it doesn't exist).

2. **Add your environment variables** to the `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://khrvmlegzzbqmfrkashk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocnZtbGVnenpicW1mcmthc2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDkyOTYsImV4cCI6MjA3NzkyNTI5Nn0.rPdYJxjMUDGvNKJrfEK2yeaLG2pHUGSt_VOrE9iTGqM

# TestSpite MCP API Key
VITE_TESTSPITE_MCP_API_KEY=your_testspite_mcp_api_key_here
```

3. **Replace `your_testspite_mcp_api_key_here`** with your actual TestSpite MCP API key.

## Using Environment Variables in Code

Import and use the environment variables through the config file:

```typescript
import { env } from "@/config/env";

// Access the TestSpite MCP API key
const apiKey = env.testspiteMcpApiKey;

// Example: Using the API key in a fetch request
const response = await fetch("https://api.testspite.com/endpoint", {
  headers: {
    "Authorization": `Bearer ${env.testspiteMcpApiKey}`,
    "Content-Type": "application/json",
  },
});
```

## Important Notes

- The `.env` file is already added to `.gitignore` and will NOT be committed to git.
- Never commit your actual API keys to the repository.
- The `.env.example` file shows the required variables without exposing actual values.
- All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

## Restart Development Server

After adding or modifying environment variables, restart your development server:

```bash
npm run dev
```

