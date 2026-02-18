import { useState } from 'react';
import { useAppStore, buildEmptyTemplate } from '../store';
import { useTranslation } from 'react-i18next';
import { useLicenseContext } from '../context/LicenseContext';
import { LicenseRequiredMessage } from './LicenseRequiredMessage';
import type { ProjectData, TemplateData } from '../types/common';

export const StartScreen = () => {
  const { username, setStep, getProjects, getTemplates, loadProject, loadTemplateById, setTemplate, template } = useAppStore();
  const { t } = useTranslation();
  const { allowed } = useLicenseContext();
  const [showProjectList, setShowProjectList] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);

  const projects = getProjects();
  const templates = getTemplates();

  const handleOpenProject = () => {
    if (projects.length > 0) {
      setShowProjectList(true);
    } else {
      alert(t('noProjectsAvailable'));
    }
  };

  const handleSelectProject = (projectId: string) => {
    if (loadProject(projectId)) {
      setStep('template');
      setShowProjectList(false);
    }
  };

  const handleOpenTemplate = () => {
    if (templates.length > 0) {
      setShowTemplateList(true);
    } else {
      alert(t('noTemplatesAvailable'));
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    if (loadTemplateById(templateId)) {
      setStep('template');
      setShowTemplateList(false);
    }
  };

  const handleStartNewTeachByExample = () => {
    // Create a new empty template if none exists, or clear teachByExampleConfig if template exists
    const templateToUse = template || buildEmptyTemplate();
    const templateWithoutConfig = {
      ...templateToUse,
      teachByExampleConfig: undefined
    };
    setTemplate(templateWithoutConfig);
    // Use setTimeout to ensure template is set before navigating
    // The wizard will automatically start without showing the overview screen
    setTimeout(() => {
      setStep('template');
    }, 0);
  };

  if (showProjectList) {
    return (
      <div className="card no-hover" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px' }}>{t('selectProject')}</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          {projects.map((project: ProjectData) => (
            <button
              key={project.id}
              className="button secondary"
              onClick={() => handleSelectProject(project.id)}
              style={{ width: '100%', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}
            >
              {project.name}
            </button>
          ))}
        </div>
        <button
          className="button ghost"
          onClick={() => setShowProjectList(false)}
          style={{ borderRadius: '10px' }}
        >
          {t('back')}
        </button>
      </div>
    );
  }

  if (showTemplateList) {
    return (
      <div className="card no-hover" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px' }}>{t('selectTemplate')}</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          {templates.map((template: TemplateData) => (
            <button
              key={template.id}
              className="button secondary"
              onClick={() => handleSelectTemplate(template.id)}
              style={{ width: '100%', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}
            >
              {template.name}
            </button>
          ))}
        </div>
        <button
          className="button ghost"
          onClick={() => setShowTemplateList(false)}
          style={{ borderRadius: '10px' }}
        >
          {t('back')}
        </button>
      </div>
    );
  }

  // Show login message if no username
  if (!username) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>
          {t('welcome') || 'Welkom'}
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--color-text)', margin: 0, lineHeight: '1.6' }}>
          {t('pleaseLoginOrCreateUser') || 'Log in via het menu "Gebruiker" in de sidebar.'}
        </p>
      </div>
    );
  }

  // Geen geldige licentie: alleen melding, geen project/template openen of aanmaken
  if (!allowed) {
    return <LicenseRequiredMessage />;
  }

  return (
    <div className="card no-hover" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '24px' }}>{t('whatDoYouWant')}</h2>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div
          onClick={handleOpenProject}
          style={{ 
            width: '100%', 
            padding: '16px 20px',
            color: 'var(--color-text)',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {t('openProject')}
        </div>

        <div
          onClick={handleOpenTemplate}
          style={{ 
            width: '100%', 
            padding: '16px 20px',
            color: 'var(--color-text)',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {t('openTemplate')}
        </div>

        <div
          onClick={handleStartNewTeachByExample}
          style={{ 
            width: '100%', 
            padding: '16px 20px',
            color: 'var(--color-text)',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {t('startNewTemplateByExample')}
        </div>
      </div>
    </div>
  );
};

