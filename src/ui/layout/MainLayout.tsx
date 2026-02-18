import { ReactNode } from 'react';
import { useDarkMode } from '../DarkModeToggle';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export const MainLayout = ({ children, title, subtitle, headerActions }: MainLayoutProps) => {
  return (
    <div className="main-layout">
      {/* Top Header */}
      {(title || headerActions) && (
        <header className="main-header">
          <div className="main-header-content">
            <div className="main-header-brand">
              {title && (
                <div className="main-header-title-section">
                  <h2 className="main-header-title">{title}</h2>
                  {subtitle && (
                    <p className="main-header-subtitle">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            {headerActions && (
              <div className="main-header-actions">
                {headerActions}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
