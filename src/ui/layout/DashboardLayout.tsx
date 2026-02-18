import { ReactNode, useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { MainLayout } from './MainLayout';
import { UserManager } from '../UserManager';
import { ProjectManager } from '../ProjectManager';
import { TemplateManager } from '../TemplateManager';
import { LicenseRequiredMessage } from '../LicenseRequiredMessage';
import { useLicenseContext } from '../../context/LicenseContext';
import { useAppStore } from '../../store';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarSteps?: { id: string; label: string; completed?: boolean; hasInfo?: boolean; exportExports?: boolean[] }[];
  activeStep?: string;
  onStepSelect?: (id: string) => void;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  username?: string | null;
}

export const DashboardLayout = ({
  children,
  sidebarSteps,
  activeStep,
  onStepSelect,
  title,
  subtitle,
  headerActions,
  username
}: DashboardLayoutProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });
  const { currentProjectId, currentTemplateId, step, reset } = useAppStore();
  const { allowed } = useLicenseContext();
  const pendingMenuRef = useRef<string | null>(null);

  // Reset activeMenu when project or template opens, or when step is 'template' (creating new template)
  useEffect(() => {
    if (currentProjectId || currentTemplateId || step === 'template') {
      setActiveMenu(null);
      pendingMenuRef.current = null;
    }
  }, [currentProjectId, currentTemplateId, step]);

  // When project/template closes, open pending menu if any
  useEffect(() => {
    if (!currentProjectId && !currentTemplateId && pendingMenuRef.current) {
      const menuToOpen = pendingMenuRef.current;
      pendingMenuRef.current = null;
      // Use setTimeout to ensure state is fully updated
      setTimeout(() => {
        setActiveMenu(menuToOpen);
      }, 0);
    }
  }, [currentProjectId, currentTemplateId]);

  const renderMenuContent = () => {
    // Tool (project/template/wizard) only with valid license
    const hasToolOpen = currentProjectId || currentTemplateId || step === 'template';
    if (hasToolOpen && !allowed) {
      return <LicenseRequiredMessage onClose={reset} />;
    }
    if (hasToolOpen) {
      return children;
    }

    // Menu content: Gebruiker always; Projecten only with license/trial; Templates always when logged in
    if (activeMenu) {
      switch (activeMenu) {
        case 'users':
          return <UserManager />;
        case 'projects':
          return allowed ? <ProjectManager /> : <LicenseRequiredMessage />;
        case 'templates':
          return username ? <TemplateManager /> : null;
        default:
          return null;
      }
    }

    return children;
  };

  // Always show sidebar steps if a project or template is open
  const showSteps = currentProjectId || currentTemplateId;

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    } catch {}
  };

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
        steps={showSteps ? sidebarSteps : undefined}
        activeStep={showSteps ? activeStep : undefined}
        onStepSelect={onStepSelect}
        username={username}
        activeMenu={activeMenu}
        onMenuSelect={(menu) => {
          // If a project or template is still open, store the menu to open later
          // (don't check if menu is already active, because we need to close project/template first)
          if (currentProjectId || currentTemplateId) {
            pendingMenuRef.current = menu;
            // Don't set activeMenu yet - it will be set when project/template closes
            return;
          }
          
          // Don't do anything if the menu is already active (only check when no project/template is open)
          if (activeMenu === menu) return;
          
          // Otherwise, open the menu immediately
          setActiveMenu(menu);
        }}
      />
      <MainLayout
        title={title}
        subtitle={subtitle}
        headerActions={headerActions}
      >
        {renderMenuContent()}
      </MainLayout>
    </div>
  );
};
