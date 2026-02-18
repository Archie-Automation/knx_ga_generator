import { useState, useRef, useEffect } from 'react';
import { useAppStore, buildEmptyTemplate } from '../store';
import { useTranslation } from 'react-i18next';
import { saveTextWithDialog } from '../lib/saveFile';
import type { TemplateData } from '../types/common';

export const TemplateManager = () => {
  const {
    username,
    currentTemplateId,
    currentProjectId,
    template,
    saveTemplateAs,
    loadTemplateById,
    deleteTemplate,
    getTemplates,
    exportTemplate,
    importTemplate,
    templateHasChanges,
    saveUserTemplate,
    setStep,
    setTemplate
  } = useAppStore();
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Update templateName when showSaveDialog opens and template has a name
  useEffect(() => {
    if (showSaveDialog && template?.teachByExampleConfig?.templateName) {
      setTemplateName(template.teachByExampleConfig.templateName);
    }
  }, [showSaveDialog, template]);

  const templates = getTemplates();
  const currentTemplate = templates.find(t => t.id === currentTemplateId);
  
  // Force re-render when templates change
  useEffect(() => {
    // This effect will run when refreshKey changes, forcing a re-render
  }, [refreshKey]);

  const handleSaveCurrentTemplate = () => {
    if (!username) {
      alert(t('usernameRequired') || 'Gebruikersnaam is verplicht');
      return;
    }
    if (!template) {
      alert('Geen template om op te slaan');
      return;
    }
    
    // When working with a project, we still want to save the template (not the whole project)
    // The project will auto-save the template changes, but we want to explicitly save the template
    // So we just save the template normally (it's part of the project)
    // The project auto-save will handle saving it to the project
    if (currentProjectId) {
      // For projects, we still save as a template, but also update the project's template reference
      // First, save the template if there's a templateId, otherwise save as new template
      const { saveUserTemplate, getProjects } = useAppStore.getState();
      const projects = getProjects();
      const project = projects.find(p => p.id === currentProjectId);
      
      if (currentTemplateId) {
        // If there's a templateId, save the template and update the project's template reference
        saveUserTemplate();
        // Update originalTemplate to reset templateHasChanges
        const sortedTemplate = useAppStore.getState().template;
        if (sortedTemplate) {
          useAppStore.setState({ 
            originalTemplate: JSON.parse(JSON.stringify(sortedTemplate)),
            templateHasChanges: false
          });
        }
      } else {
        // No templateId, show save dialog to create/save as template
        const templateNameFromConfig = template?.teachByExampleConfig?.templateName?.trim();
        if (templateNameFromConfig) {
          setTemplateName(templateNameFromConfig);
        } else if (project) {
          setTemplateName(project.name + ' - Template');
        } else {
          setTemplateName('');
        }
        setShowSaveDialog(true);
      }
      return;
    }
    
    // Always show the dialog to enter/confirm template name
    // Check if template has a name from teachByExampleConfig or currentTemplate
    const templateNameFromConfig = template?.teachByExampleConfig?.templateName?.trim();
    if (templateNameFromConfig) {
      setTemplateName(templateNameFromConfig);
    } else if (currentTemplate) {
      setTemplateName(currentTemplate.name);
    } else {
      setTemplateName('');
    }
    setShowSaveDialog(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert(t('templateNameRequired') || 'Templatenaam is verplicht');
      return;
    }
    if (!username) {
      alert(t('usernameRequired') || 'Gebruikersnaam is verplicht');
      return;
    }
    if (!template) {
      alert('Geen template om op te slaan');
      return;
    }
    try {
      // If there's a current template, update it using saveUserTemplate
      // which will update both the default template and the named template
      if (currentTemplateId && currentTemplate) {
        // Update the template name in the config if it changed
        if (templateName.trim() !== currentTemplate.name) {
          // Save with new name
          const { saveTemplateAs } = useAppStore.getState();
          const templateId = saveTemplateAs(templateName.trim());
          useAppStore.setState({ 
            currentTemplateId: templateId,
            templateHasChanges: false
          });
        } else {
          // Same name, just update the template
          saveUserTemplate();
        }
      } else {
        // No current template, create a new one
        const { saveTemplateAs } = useAppStore.getState();
        const templateId = saveTemplateAs(templateName.trim());
        useAppStore.setState({ 
          currentTemplateId: templateId,
          templateHasChanges: false
        });
      }
      setTemplateName('');
      setShowSaveDialog(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(errorMessage || t('templateSaveError') || 'Fout bij opslaan template');
      console.error(err);
    }
  };

  const handleCreateNewTemplate = () => {
    if (!newTemplateName.trim()) {
      alert(t('templateNameRequired') || 'Templatenaam is verplicht');
      return;
    }
    if (!username) {
      alert(t('usernameRequired') || 'Gebruikersnaam is verplicht');
      return;
    }
    
    const emptyTemplate = buildEmptyTemplate();
    // Create template with all main functions set to "not used" (enabled: 'none')
    // This allows the user to see the overview immediately
    const templateWithName = {
      ...emptyTemplate,
      teachByExampleConfig: {
        templateName: newTemplateName.trim(),
        categories: {
          switching: {
            id: `switching-${Date.now()}`,
            groupName: 'schakelen',
            enabled: 'none',
            exampleAddresses: []
          },
          dimming: {
            id: `dimming-${Date.now()}`,
            groupName: 'dimmen',
            enabled: 'none',
            exampleAddresses: []
          },
          shading: {
            id: `shading-${Date.now()}`,
            groupName: 'jalouzie',
            enabled: 'none',
            exampleAddresses: []
          },
          hvac: {
            id: `hvac-${Date.now()}`,
            groupName: 'klimaat',
            enabled: 'none',
            exampleAddresses: []
          }
        },
        autoGenerateRoomAddresses: false,
        fixedAddresses: emptyTemplate.devices.fixed?.mainGroups || []
      }
    };
    
    // Save the template immediately so it's persisted and has a currentTemplateId
    const { saveTemplateAs, setTemplate } = useAppStore.getState();
    const templateId = saveTemplateAs(newTemplateName.trim(), templateWithName);
    
    // Set the template in the store so it's immediately available
    setTemplate(templateWithName);
    
    useAppStore.setState({ 
      templateHasChanges: false,
      currentTemplateId: templateId,
      currentProjectId: undefined // Reset project ID if any
    });
    setStep('template');
    setShowNewTemplateDialog(false);
    setNewTemplateName('');
  };

  const handleLoadTemplate = (templateId: string) => {
    if (loadTemplateById(templateId)) {
      setStep('template');
      // Template wordt nu getoond in TemplateWizard, geen alert nodig
    } else {
      alert(t('templateLoadError') || 'Fout bij laden template');
    }
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (confirm(t('confirmDeleteTemplate')?.replace('{name}', templateName) || `Weet je zeker dat je "${templateName}" wilt verwijderen?`)) {
      deleteTemplate(templateId);
      setRefreshKey(prev => prev + 1); // Force re-render
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    const json = exportTemplate(templateId);
    if (!json) {
      alert(t('templateExportError') || 'Fout bij exporteren template');
      return;
    }
    await saveTextWithDialog(json, `knx-template-${templateId}.json`);
  };

  const handleImportTemplate = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        if (!importTemplate(json)) {
          alert(t('templateImportError') || 'Fout bij importeren template');
        }
      } catch (err) {
        alert(t('templateImportError') || 'Fout bij importeren template');
        console.error(err);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!username) {
    return (
      <div className="card">
        <h3>{t('templates') || 'Templates'}</h3>
        <p>{t('setUsernameFirstTemplates') || 'Stel eerst een gebruikersnaam in'}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{t('templates') || 'Templates'}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {templateHasChanges && !showSaveDialog && (
            <button 
              onClick={handleSaveCurrentTemplate}
              className="button primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              {currentTemplateId || currentProjectId 
                ? (t('saveTemplate') || 'Template opslaan')
                : t('save')}
            </button>
          )}
          <button 
            onClick={handleImportTemplate} 
            className="button secondary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            {t('importTemplate') || 'Template importeren'}
          </button>
        </div>
      </div>
      <div>
        <div style={{ marginBottom: 72 }}>
          <p style={{ margin: 0, marginBottom: 16, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {currentTemplate ? (
              <>
                <strong>{t('currentTemplate') || 'Huidig template'}:</strong> {currentTemplate.name}
                {templateHasChanges && <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>●</span>}
              </>
            ) : (
              t('noTemplate') || 'Geen template ingeladen'
            )}
          </p>
        </div>

        {showSaveDialog && (
          <div className="card" style={{ marginBottom: 16, backgroundColor: 'var(--color-bg-secondary)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 16 }}>{t('saveTemplate') || 'Template opslaan'}</h4>
            <div className="flex" style={{ gap: 8, flexDirection: 'column' }}>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t('templateNamePlaceholder') || 'Templatenaam'}
                className="input"
                style={{ fontSize: '14px', padding: '10px 14px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTemplate();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
                autoFocus
              />
              <div className="flex" style={{ gap: 8 }}>
                <button 
                  onClick={handleSaveTemplate} 
                  disabled={!templateName.trim()}
                  className="button primary"
                  style={{ flex: 1, fontSize: '14px', padding: '10px 20px' }}
                >
                  {t('save') || 'Opslaan'}
                </button>
                <button 
                  onClick={() => setShowSaveDialog(false)} 
                  className="button secondary"
                  style={{ fontSize: '14px', padding: '10px 20px' }}
                >
                  {t('cancel') || 'Annuleren'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div key={refreshKey} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {templates.length === 0 ? (
            <p className="small" style={{ margin: 0 }}>{t('noTemplates') || 'Geen templates ingeladen'}</p>
          ) : (
            templates.map((template) => (
                <div
                  key={template.id}
                  className="card"
                  style={{
                    padding: '16px',
                    backgroundColor: template.id === currentTemplateId ? 'var(--color-primary-bg)' : 'var(--color-bg-card)',
                    border: template.id === currentTemplateId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{template.name}</h4>
                      {template.id === currentTemplateId && (
                        <span style={{ marginLeft: 8, fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                          ({t('current') || 'Huidig'})
                        </span>
                      )}
                      <p className="small" style={{ margin: '4px 0 0 0' }}>
                        {t('lastUpdated') || 'Laatst bijgewerkt'}: {new Date(template.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex" style={{ gap: 8 }}>
                      {template.id !== currentTemplateId && (
                        <button
                          onClick={() => handleLoadTemplate(template.id)}
                          className="button primary"
                          style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                          {t('load') || 'Laden'}
                        </button>
                      )}
                      <button
                        onClick={() => handleExportTemplate(template.id)}
                        className="button secondary"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                      >
                        {t('export') || 'Exporteren'}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className="button ghost"
                        style={{ fontSize: '13px', padding: '8px 16px', color: 'var(--color-danger)' }}
                      >
                        {t('delete') || 'Verwijderen'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>
        
        <button 
          onClick={() => {
            setNewTemplateName('');
            setShowNewTemplateDialog(true);
          }}
          className="button primary"
          style={{ width: '100%', padding: '12px 20px', fontSize: '14px' }}
        >
          {t('newTemplateTeachByExample') || 'Nieuw Template'}
        </button>
        
        {showNewTemplateDialog && (
          <div className="card" style={{ marginTop: 16, marginBottom: 16, backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="flex" style={{ gap: 8, flexDirection: 'column' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: 4 }}>
                {t('whatShouldTemplateNameBe') || 'Welke naam wilt u aan de template geven?'}
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder={t('templateNamePlaceholder') || 'Templatenaam'}
                className="input"
                style={{ fontSize: '14px', padding: '10px 14px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTemplateName.trim()) {
                    handleCreateNewTemplate();
                  }
                  if (e.key === 'Escape') {
                    setShowNewTemplateDialog(false);
                    setNewTemplateName('');
                  }
                }}
                autoFocus
              />
              <div className="flex" style={{ gap: 8 }}>
                <button 
                  onClick={handleCreateNewTemplate}
                  disabled={!newTemplateName.trim()}
                  className="button primary"
                  style={{ flex: 1, fontSize: '14px', padding: '10px 20px' }}
                >
                  {t('continue') || 'Doorgaan'}
                </button>
                <button 
                  onClick={() => {
                    setShowNewTemplateDialog(false);
                    setNewTemplateName('');
                  }}
                  className="button secondary"
                  style={{ fontSize: '14px', padding: '10px 20px' }}
                >
                  {t('cancel') || 'Annuleren'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
