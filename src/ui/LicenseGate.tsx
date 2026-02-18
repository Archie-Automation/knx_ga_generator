import type { ReactNode } from 'react';

interface LicenseGateProps {
  children: ReactNode;
}

/**
 * No full-screen block: user can always reach app and Gebruikers.
 * Project/template usage is gated inside DashboardLayout and StartScreen.
 */
export function LicenseGate({ children }: LicenseGateProps) {
  return <>{children}</>;
}
