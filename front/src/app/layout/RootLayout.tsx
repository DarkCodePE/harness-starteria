import React from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '../context/AppContext';
import { AutofillProvider } from '../context/AutofillContext';
import { PortfolioLeadProvider } from '../portfolio/PortfolioLeadContext';

function isExplicitDemoEnabled() {
  if (import.meta.env.VITE_ENABLE_DEMO_DATA === 'true') return true;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('starteria.demo.enabled') === 'true';
}

function PortfolioLeadDataBoundary() {
  const { user } = useApp();
  const enableDemoData = user?.email?.toLowerCase() === 'portfolio@starteria.io' || isExplicitDemoEnabled();

  return (
    <PortfolioLeadProvider enableDemoData={enableDemoData}>
      <Toaster position="top-center" richColors closeButton />
      <Outlet />
    </PortfolioLeadProvider>
  );
}

/**
 * RootLayout wraps every route with AppProvider so that React context
 * and route components always share the same React tree — avoiding HMR
 * mismatches where a reloaded context module creates a new Context object
 * that doesn't match the one used by the Provider sitting outside the router.
 */
export function RootLayout() {
  return (
    <AppProvider>
      <AutofillProvider>
        <PortfolioLeadDataBoundary />
      </AutofillProvider>
    </AppProvider>
  );
}
