/**
 * TestSpite MCP API Service
 * Handles all interactions with the TestSpite MCP API
 */

import { env } from "@/config/env";

export interface TestSpiteMcpConfig {
  apiKey: string;
  baseUrl?: string;
}

export class TestSpiteMcpService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: TestSpiteMcpConfig) {
    this.apiKey = config?.apiKey || env.testspiteMcpApiKey;
    this.baseUrl = config?.baseUrl || env.testspiteMcpApiUrl;
    
    if (!this.apiKey) {
      console.warn("TestSpite MCP API key is not configured. Please add VITE_TESTSPITE_MCP_API_KEY to your .env file");
    }
  }

  /**
   * Get the API key (for use in headers, etc.)
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Check if the API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== "";
  }

  /**
   * Make an authenticated API request to TestSpite MCP
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("TestSpite MCP API key is not configured");
    }

    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(
        `TestSpite MCP API error: ${error.message || response.statusText} (${response.status})`
      );
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Export a singleton instance
export const testspiteMcp = new TestSpiteMcpService();

// Export for custom instances
export default TestSpiteMcpService;

