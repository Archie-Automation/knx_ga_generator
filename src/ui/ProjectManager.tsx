import { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { saveTextWithDialog } from '../lib/saveFile';

export const ProjectManager = () => {
  const {
    username,
    currentProjectId,
    loadProject,
    deleteProject,
    getProjects,
    exportProject,
    importProject
  } = useAppStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const projects = getProjects();
  const currentProject = projects.find(p => p.id === currentProjectId);


  const handleLoadProject = (projectId: string) => {
    if (!loadProject(projectId)) {
      alert(t('projectLoadError') || 'Fout bij laden project');
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(t('confirmDeleteProject')?.replace('{name}', projectName) || `Weet je zeker dat je "${projectName}" wilt verwijderen?`)) {
      deleteProject(projectId);
      setRefreshKey(prev => prev + 1); // Force re-render to update project list
    }
  };

  const handleExportProject = async (projectId: string) => {
    const json = exportProject(projectId);
    if (!json) {
      alert(t('projectExportError') || 'Fout bij exporteren project');
      return;
    }
    await saveTextWithDialog(json, `knx-project-${projectId}.json`);
  };

  const handleImportProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        if (importProject(json)) {
          setRefreshKey(prev => prev + 1); // Force re-render to update project list
        } else {
          alert(t('projectImportError') || 'Fout bij importeren project');
        }
      } catch (err) {
        alert(t('projectImportError') || 'Fout bij importeren project');
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
      <div className="card" style={{ marginBottom: 16 }}>
        <p>{t('setUsernameFirst') || 'Stel eerst een gebruikersnaam in om projecten te beheren'}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{t('projects') || 'Projecten'}</h3>
        <button 
          onClick={handleImportProject} 
          className="button secondary"
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          {t('importProject') || 'Project importeren'}
        </button>
      </div>
      <div>
        <div style={{ marginBottom: 72 }}>
          <p style={{ margin: 0, marginBottom: 16, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {currentProject ? (
              <>
                <strong>{t('currentProject') || 'Huidig project'}:</strong> {currentProject.name}
              </>
            ) : (
              t('noProject') || 'Geen project ingeladen'
            )}
          </p>
        </div>

        {/* Information box about creating a new project */}
        <div className="card" style={{ marginBottom: 24, backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: '18px', lineHeight: '1.2' }}>ℹ</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
                {t('howToCreateProject') || 'Hoe maak je een nieuw project aan?'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {t('howToCreateProjectInfo') || 'Om een nieuw project aan te maken, moet je eerst een template hebben. Je kunt dit doen door:\n\n1. Een bestaande template in te laden via het menu "Templates" in de sidebar\n2. Een nieuw template aan te maken via het menu "Templates" in de sidebar\n\nZodra je een template hebt geladen, kun je via de template naar Device selectie gaan om een project aan te maken.'}
              </p>
            </div>
          </div>
        </div>

        <div key={refreshKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {projects.length === 0 ? (
            <p className="small" style={{ margin: 0 }}>{t('noProjects') || 'Geen projecten opgeslagen'}</p>
          ) : (
            projects.map((project) => (
                <div
                  key={project.id}
                  className="card"
                  style={{
                    padding: '16px',
                    backgroundColor: project.id === currentProjectId ? 'var(--color-primary-bg)' : 'var(--color-bg-card)',
                    border: project.id === currentProjectId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{project.name}</h4>
                      {project.id === currentProjectId && (
                        <span style={{ marginLeft: 8, fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                          ({t('current') || 'Huidig'})
                        </span>
                      )}
                      <p className="small" style={{ margin: '4px 0 0 0' }}>
                        {t('lastUpdated') || 'Laatst bijgewerkt'}: {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex" style={{ gap: 8 }}>
                      {project.id !== currentProjectId && (
                        <button
                          onClick={() => handleLoadProject(project.id)}
                          className="button primary"
                          style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                          {t('load') || 'Laden'}
                        </button>
                      )}
                      <button
                        onClick={() => handleExportProject(project.id)}
                        className="button secondary"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                      >
                        {t('export') || 'Exporteren'}
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
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













