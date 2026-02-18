import { createContext, useContext, type ReactNode } from "react";
import { useLicenseStore } from "../hooks/useLicenseStore";
import type { UseLicenseResult } from "../hooks/useLicenseStore";

const LicenseContext = createContext<UseLicenseResult | null>(null);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const value = useLicenseStore();
  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
}

export function useLicenseContext(): UseLicenseResult {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicenseContext must be used within LicenseProvider");
  return ctx;
}
