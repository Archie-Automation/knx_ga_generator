import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import pkg from '../../../package.json';
import { DarkModeToggle, useDarkMode } from '../DarkModeToggle';
import { LanguageSelector } from '../LanguageSelector';
import { LicenseStatus } from '../LicenseStatus';
import { Stepper } from '../Stepper';
import { useLicenseContext } from '../../context/LicenseContext';
import { useAppStore } from '../../store';
import { manualCheckForUpdates, isTauri } from '../../lib/updater';

interface SidebarProps {
  steps?: { id: string; label: string; completed?: boolean; hasInfo?: boolean; exportExports?: boolean[] }[];
  activeStep?: string;
  onStepSelect?: (id: string) => void;
  username?: string | null;
  activeMenu?: string | null;
  onMenuSelect?: (menu: string | null) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const Sidebar = ({ steps, activeStep, onStepSelect, username, activeMenu, onMenuSelect, collapsed = false, onCollapsedChange }: SidebarProps) => {
  const { t, i18n } = useTranslation();
  const { isDark: hookIsDark } = useDarkMode();
  const { allowed, deviceLimitReached } = useLicenseContext();
  const { step, currentProjectId, currentTemplateId, getProjects, getTemplates, loadProject, loadTemplateById, setStep, reset, saveProject, saveUserTemplate, saveTemplateAs, template, signOutAuth, getDisplayName } = useAppStore();
  
  // Check dark mode from DOM class to ensure sync with toggle
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark-mode')
  );
  
  useEffect(() => {
    // Update when hook changes
    setIsDark(hookIsDark);
    
    // Also listen to DOM mutations for immediate updates
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark-mode'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [hookIsDark]);
  
  // Get logo path based on dark mode
  const logoPath = isDark ? "/logo_dark.png" : "/logo_light.png";
  
  // Get current project and template info
  const projects = username ? getProjects() : [];
  const templates = username ? getTemplates() : [];
  const currentProject = currentProjectId ? projects.find(p => p.id === currentProjectId) : null;
  const currentTemplate = currentTemplateId ? templates.find(t => t.id === currentTemplateId) : null;
  
  // Get template name from project if project is active, otherwise use currentTemplate
  // Priority for projects: 1) project.templateName, 2) find template in templates list by matching config, 3) teachByExampleConfig.templateName, 4) template.name
  // Priority for templates: currentTemplate.name
  let activeTemplateName: string | null = null;
  if (currentProject) {
    // First try project.templateName
    if (currentProject.templateName) {
      activeTemplateName = currentProject.templateName;
    } else {
      // Try to find matching template in templates list by comparing teachByExampleConfig or name
      const matchingTemplate = templates.find(t => {
        // Match by teachByExampleConfig templateName
        if (t.template?.teachByExampleConfig?.templateName && 
            currentProject.template?.teachByExampleConfig?.templateName &&
            t.template.teachByExampleConfig.templateName === currentProject.template.teachByExampleConfig.templateName) {
          return true;
        }
        // Match by template name if teachByExampleConfig matches
        if (t.template?.teachByExampleConfig && currentProject.template?.teachByExampleConfig) {
          const tConfig = JSON.stringify(t.template.teachByExampleConfig);
          const pConfig = JSON.stringify(currentProject.template.teachByExampleConfig);
          if (tConfig === pConfig) {
            return true;
          }
        }
        return false;
      });
      
      if (matchingTemplate) {
        activeTemplateName = matchingTemplate.name;
      } else {
        // Fallback to teachByExampleConfig.templateName or template.name
        activeTemplateName = currentProject.template?.teachByExampleConfig?.templateName || currentProject.template?.name || null;
      }
    }
  } else {
    activeTemplateName = currentTemplate?.name || null;
  }

  // Get translations and capitalize first letter
  const getTranslatedLabel = (key: string) => {
    const translated = t(key);
    // If translation returns the key itself, it means translation wasn't found
    // In that case, react-i18next returns the key
    if (translated === key) {
      // Translation not found, use language-specific fallback
      const lang = i18n.language || 'nl';
      const fallbacks: Record<string, Record<string, string>> = {
        'user': {
          'nl': 'Gebruiker',
          'en': 'User',
          'es': 'Usuario',
          'fr': 'Utilisateur',
          'de': 'Benutzer'
        },
        'users': {
          'nl': 'Gebruikers',
          'en': 'Users',
          'es': 'Usuarios',
          'fr': 'Utilisateurs',
          'de': 'Benutzer'
        },
        'projects': {
          'nl': 'Projecten',
          'en': 'Projects',
          'es': 'Proyectos',
          'fr': 'Projets',
          'de': 'Projekte'
        },
        'templates': {
          'nl': 'Templates',
          'en': 'Templates',
          'es': 'Plantillas',
          'fr': 'Modèles',
          'de': 'Templates'
        }
      };
      const fallback = fallbacks[key]?.[lang] || fallbacks[key]?.['nl'] || key;
      return fallback.charAt(0).toUpperCase() + fallback.slice(1);
    }
    // Translation found, capitalize first letter
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  };

  const menuItems = [
    { id: 'users', label: getTranslatedLabel('user'), icon: '👤' },
    ...(username && !deviceLimitReached && allowed ? [
      { id: 'projects', label: getTranslatedLabel('projects'), icon: '🏢' },
      { id: 'templates', label: getTranslatedLabel('templates'), icon: '📄' }
    ] : [])
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Sidebar Header */}
        <div className="sidebar-header" style={{ flexDirection: 'column' }}>
          <div className="sidebar-actions" style={{ flexDirection: 'row', gap: 8, width: '100%', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <DarkModeToggle />
            <LanguageSelector />
            <button
              type="button"
              className="sidebar-collapse-toggle"
              onClick={() => onCollapsedChange?.(!collapsed)}
              title={collapsed ? (t('expandSidebar') || 'Sidebar uitklappen') : (t('collapseSidebar') || 'Sidebar inklappen')}
              aria-label={collapsed ? (t('expandSidebar') || 'Sidebar uitklappen') : (t('collapseSidebar') || 'Sidebar inklappen')}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {/* Settings - Always on top */}
        <div className="sidebar-menu">
        <div className="sidebar-nav-label">
          {t('settings') || 'Instellingen'}
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-menu-item ${activeMenu === item.id && !currentProjectId && !currentTemplateId ? 'active' : ''}`}
            onClick={() => {
              // Don't do anything if the menu is already active AND no project/template is open
              // (if project/template is open, we need to close it first, so allow the click)
              if (activeMenu === item.id && !currentProjectId && !currentTemplateId) return;
              
              // If we're in a project, confirm before closing (prevents accidental reset)
              if (currentProjectId && currentProject) {
                if (!confirm(t('confirmCloseProject'))) return;
                try {
                  saveProject(currentProject.name);
                  reset();
                  onMenuSelect?.(item.id);
                  return;
                } catch (err) {
                  console.error('Failed to save project:', err);
                  return;
                }
              }
              // If we're in a template (without project), save it first
              else if (currentTemplateId && !currentProjectId && template) {
                // Save template to template list if it has a name
                const currentTemplate = templates.find(t => t.id === currentTemplateId);
                if (currentTemplate) {
                  try {
                    saveTemplateAs(currentTemplate.name, template);
                  } catch (err) {
                    console.error('Failed to save template:', err);
                    // Still continue to close and open menu even if save fails
                  }
                } else {
                  // Also save as user template
                  try {
                    saveUserTemplate();
                  } catch (err) {
                    console.error('Failed to save user template:', err);
                    // Still continue to close and open menu even if save fails
                  }
                }
                // Close the template by resetting
                reset();
                // Open menu - DashboardLayout will handle the timing
                onMenuSelect?.(item.id);
                return;
              }
              
              // Then open the menu
              onMenuSelect?.(item.id);
            }}
          >
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Ingeladen gegevens (Data) - User, Project, Template info */}
      {username && (
        <div className="sidebar-menu sidebar-data-section">
          <div className="sidebar-nav-label">
            {t('data') || 'Ingeladen gegevens'}
          </div>
          {/* Always show username */}
          <div 
            className={`sidebar-info-item sidebar-info-item-clickable ${activeMenu === 'users' && !currentProjectId && !currentTemplateId ? 'sidebar-info-item-active' : ''}`}
            onClick={() => {
              // Don't do anything if users menu is already active AND no project/template is open
              // (if project/template is open, we need to close it first, so allow the click)
              if (activeMenu === 'users' && !currentProjectId && !currentTemplateId) return;
              
              // If we're in a project, confirm before closing (prevents accidental reset)
              if (currentProjectId && currentProject) {
                if (!confirm(t('confirmCloseProject'))) return;
                try {
                  saveProject(currentProject.name);
                  reset();
                  onMenuSelect?.('users');
                  return;
                } catch (err) {
                  console.error('Failed to save project:', err);
                  return;
                }
              }
                // If we're in a template (without project), save it first
                else if (currentTemplateId && !currentProjectId && template) {
                  // Save template to template list if it has a name
                  const currentTemplate = templates.find(t => t.id === currentTemplateId);
                  if (currentTemplate) {
                    try {
                      saveTemplateAs(currentTemplate.name, template);
                    } catch (err) {
                      console.error('Failed to save template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  } else {
                    // Also save as user template
                    try {
                      saveUserTemplate();
                    } catch (err) {
                      console.error('Failed to save user template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  }
                // Close the template by resetting
                reset();
                // Open menu - DashboardLayout will handle the timing
                onMenuSelect?.('users');
                return;
                }
              
              onMenuSelect?.('users');
            }}
          >
            <span className="sidebar-menu-icon">👤</span>
            <span className="sidebar-menu-label">{username ? (getDisplayName(username) || username) : ''}</span>
          </div>
          <button
            type="button"
            className="button ghost sidebar-sign-out"
            onClick={() => signOutAuth()}
            style={{ marginTop: 8, width: '100%', fontSize: '0.875rem', justifyContent: 'center' }}
            title={t('signOut') || 'Uitloggen'}
          >
            <span className="sidebar-sign-out-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="12" height="12" rx="1" />
                <path d="M9 9 L21 9" />
                <polyline points="16 6 21 9 16 12" />
              </svg>
            </span>
            <span className="sidebar-sign-out-text">{t('signOut') || 'Uitloggen'}</span>
          </button>
          {/* If project is active and license valid, show project as info */}
          {allowed && currentProject && (
            <div 
              className={`sidebar-info-item sidebar-info-item-clickable`}
              onClick={() => {
                // Don't do anything if projects menu is already active AND no project/template is open
                // (if project/template is open, we need to close it first, so allow the click)
                if (activeMenu === 'projects' && !currentProjectId && !currentTemplateId) return;
                
              // If we're in a project, confirm before closing (prevents accidental reset when clicking near Stepper)
              if (currentProjectId && currentProject) {
                if (!confirm(t('confirmCloseProject'))) return;
                try {
                  saveProject(currentProject.name);
                  reset();
                  onMenuSelect?.('projects');
                  return;
                } catch (err) {
                  console.error('Failed to save project:', err);
                  return;
                }
              }
                // If we're in a template (without project), save it first
                else if (currentTemplateId && !currentProjectId && template) {
                  // Save template to template list if it has a name
                  const currentTemplate = templates.find(t => t.id === currentTemplateId);
                  if (currentTemplate) {
                    try {
                      saveTemplateAs(currentTemplate.name, template);
                    } catch (err) {
                      console.error('Failed to save template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  } else {
                    // Also save as user template
                    try {
                      saveUserTemplate();
                    } catch (err) {
                      console.error('Failed to save user template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  }
                  // Close the template by resetting
                  reset();
                  // Open menu - DashboardLayout will handle the timing
                  onMenuSelect?.('projects');
                  return;
                }
                
                // Load the project and open projects menu
                if (loadProject(currentProject.id)) {
                  onMenuSelect?.('projects');
                } else {
                  // Just open the projects menu
                  onMenuSelect?.('projects');
                }
              }}
            >
              <span className="sidebar-menu-icon">🏢</span>
              <span className="sidebar-menu-label">{currentProject.name}</span>
            </div>
          )}
          {/* If template is active (without project), show template as info */}
          {allowed && activeTemplateName && currentTemplateId && !currentProjectId && (
            <div 
              className={`sidebar-info-item sidebar-info-item-clickable`}
              onClick={() => {
                // Don't do anything if templates menu is already active AND no project/template is open
                // (if project/template is open, we need to close it first, so allow the click)
                if (activeMenu === 'templates' && !currentProjectId && !currentTemplateId) return;
                
                // If we're in a template (without project), save it first
                if (currentTemplateId && !currentProjectId && template) {
                  // Save template to template list if it has a name
                  const currentTemplate = templates.find(t => t.id === currentTemplateId);
                  if (currentTemplate) {
                    try {
                      saveTemplateAs(currentTemplate.name, template);
                    } catch (err) {
                      console.error('Failed to save template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  } else {
                    // Also save as user template
                    try {
                      saveUserTemplate();
                    } catch (err) {
                      console.error('Failed to save user template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  }
                  // Close the template by resetting
                  reset();
                  // Open menu - DashboardLayout will handle the timing
                  onMenuSelect?.('templates');
                  return;
                }
                
                // Load the template and open templates menu
                if (loadTemplateById(currentTemplateId)) {
                  onMenuSelect?.('templates');
                } else {
                  // Just open the templates menu
                  onMenuSelect?.('templates');
                }
              }}
            >
              <span className="sidebar-menu-icon">📄</span>
              <span className="sidebar-menu-label">{activeTemplateName}</span>
            </div>
          )}
          {/* Show template name if available but not active (e.g., in a project) */}
          {allowed && activeTemplateName && (!currentTemplateId || currentProjectId) && (
            <div 
              className={`sidebar-info-item ${currentProjectId ? '' : 'sidebar-info-item-clickable'} ${activeMenu === 'templates' && !currentProjectId && !currentTemplateId ? 'sidebar-info-item-active' : ''}`}
              onClick={() => {
                // When in a project: template name is informational only – do NOT close project on click
                // (prevents accidental reset when adding/editing project content)
                if (currentProjectId) return;
                
                // Don't do anything if templates menu is already active AND no project/template is open
                if (activeMenu === 'templates' && !currentProjectId && !currentTemplateId) return;
                
                // If we're in a template (without project), save it first
                if (currentTemplateId && !currentProjectId && template) {
                  // Save template to template list if it has a name
                  const currentTemplate = templates.find(t => t.id === currentTemplateId);
                  if (currentTemplate) {
                    try {
                      saveTemplateAs(currentTemplate.name, template);
                    } catch (err) {
                      console.error('Failed to save template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  } else {
                    // Also save as user template
                    try {
                      saveUserTemplate();
                    } catch (err) {
                      console.error('Failed to save user template:', err);
                      // Still continue to close and open menu even if save fails
                    }
                  }
                  // Close the template by resetting
                  reset();
                  // Open menu - DashboardLayout will handle the timing
                  onMenuSelect?.('templates');
                  return;
                }
                
                // If there's a currentTemplateId, use it
                if (currentTemplateId && loadTemplateById(currentTemplateId)) {
                  onMenuSelect?.('templates');
                } 
                // Otherwise, try to find it by name
                else {
                  const templateToLoad = templates.find(t => 
                    t.name === activeTemplateName || 
                    t.template?.teachByExampleConfig?.templateName === activeTemplateName ||
                    t.template?.name === activeTemplateName
                  );
                  if (templateToLoad && loadTemplateById(templateToLoad.id)) {
                    onMenuSelect?.('templates');
                  } else {
                    // Just open the templates menu
                    onMenuSelect?.('templates');
                  }
                }
              }}
            >
              <span className="sidebar-menu-icon">📄</span>
              <span className="sidebar-menu-label">{activeTemplateName}</span>
            </div>
          )}
        </div>
      )}

        {/* Navigation - Below Settings */}
        {steps && activeStep && (
          <nav className="sidebar-nav">
            <div className="sidebar-nav-label">
              {t('navigation') || 'Navigatie'}
            </div>
            <Stepper
              steps={steps}
              activeId={activeStep}
              onSelect={onStepSelect}
            />
          </nav>
        )}

        {/* License – above footer */}
        {username && <LicenseStatus />}

        {/* Sidebar Footer – update button also here when expanded (footer hidden when collapsed) */}
        <div className="sidebar-footer">
          <img 
            src={logoPath}
            alt="Archie Automation Logo" 
            className="sidebar-footer-logo"
            key={logoPath}
          />
          <div className="sidebar-footer-text-block">
            <span className="sidebar-footer-text">Copyright by Archie Automation</span>
            {!collapsed && isTauri() ? (
              <button
                type="button"
                className="button ghost sidebar-version-refresh"
                onClick={() => { manualCheckForUpdates().catch((err) => console.error('[Updater] Manual check failed:', err)); }}
                title={t('updateCheckButton') || 'Controleren op updates'}
                aria-label={t('updateCheckButton') || 'Controleren op updates'}
              >
                <span className="sidebar-version-refresh-text">v {pkg.version}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
            ) : (
              <span className="sidebar-footer-version">v {pkg.version}</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
