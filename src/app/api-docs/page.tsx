"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

/**
 * API Documentation Page
 * Displays interactive Swagger/OpenAPI documentation
 */
export default function ApiDocsPage() {
  // Set page title
  useEffect(() => {
    document.title = "API Documentation - POS System";
  }, []);
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the OpenAPI specification
    fetch("/api/docs")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load API documentation");
        }
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-xl font-semibold mb-2">
              Error Loading Documentation
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-docs-container">
      <style jsx global>{`
        .api-docs-container {
          min-height: 100vh;
          background: #fafafa;
        }

        /* Swagger UI customization */
        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 30px 0;
        }

        .swagger-ui .info .title {
          font-size: 2.5rem;
          color: #1f2937;
        }

        .swagger-ui .scheme-container {
          background: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
          padding: 15px 20px;
        }

        .swagger-ui .opblock {
          border: 1px solid #e5e7eb;
          margin-bottom: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 4px;
          font-weight: 600;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }

        .swagger-ui .opblock.opblock-patch {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .swagger-ui .btn.execute {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }

        .swagger-ui .btn.execute:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .swagger-ui .response-col_status {
          font-weight: 600;
        }

        .swagger-ui .parameters-col_description p {
          margin: 0;
        }

        /* Custom header */
        .api-docs-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          margin-bottom: 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .api-docs-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .api-docs-header p {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
        }

        /* Container */
        .swagger-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }
      `}</style>

      {/* Custom Header */}
      <div className="api-docs-header">
        <div className="swagger-container">
          <h1>🚀 POS System API Documentation</h1>
          <p>
            Complete REST API reference for authentication, user management,
            sessions, and reporting
          </p>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="swagger-container">
        {spec && (
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
          />
        )}
      </div>
    </div>
  );
}
