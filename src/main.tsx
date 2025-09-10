import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorDebugPanel } from "@/components/ErrorDebugPanel";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <LanguageProvider>
      <App />
      <ErrorDebugPanel />
    </LanguageProvider>
  </ErrorBoundary>
);
