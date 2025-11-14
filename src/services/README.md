# TestSpite MCP Service

This service provides a convenient way to interact with the TestSpite MCP API.

## Setup

1. Add your TestSpite MCP API key to the `.env` file:
```env
VITE_TESTSPITE_MCP_API_KEY=your_api_key_here
```

2. Restart your development server after adding the key.

## Usage

### Basic Usage

```typescript
import { testspiteMcp } from "@/services/testspiteMcp";

// Check if API key is configured
if (testspiteMcp.isConfigured()) {
  // Make API calls
  const data = await testspiteMcp.get("/endpoint");
}
```

### Making API Requests

```typescript
import { testspiteMcp } from "@/services/testspiteMcp";

// GET request
const data = await testspiteMcp.get("/api/v1/resource");

// POST request
const result = await testspiteMcp.post("/api/v1/resource", {
  name: "Example",
  value: "Data"
});

// PUT request
const updated = await testspiteMcp.put("/api/v1/resource/123", {
  name: "Updated"
});

// DELETE request
await testspiteMcp.delete("/api/v1/resource/123");
```

### Custom Instance

```typescript
import TestSpiteMcpService from "@/services/testspiteMcp";

const customService = new TestSpiteMcpService({
  apiKey: "custom-key",
  baseUrl: "https://custom-api-url.com"
});
```

### Error Handling

```typescript
import { testspiteMcp } from "@/services/testspiteMcp";

try {
  const data = await testspiteMcp.get("/endpoint");
  console.log(data);
} catch (error) {
  console.error("API Error:", error.message);
}
```

## API Reference

### Methods

- `getApiKey()`: Returns the configured API key
- `isConfigured()`: Checks if API key is configured
- `request<T>(endpoint, options)`: Make a custom request
- `get<T>(endpoint, options)`: GET request
- `post<T>(endpoint, data, options)`: POST request
- `put<T>(endpoint, data, options)`: PUT request
- `delete<T>(endpoint, options)`: DELETE request

