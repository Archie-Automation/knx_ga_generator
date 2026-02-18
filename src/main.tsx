import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n'; // Initialize i18next
import { LanguageProvider } from './i18n/useTranslation';
import './styles.css';

console.log('Starting KNX app...');

/** In Tauri: fetch vervangen door plugin zodat Edge Functions (o.a. Licentie kopen) werken. */
async function setupTauriFetch(): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) return;
  try {
    const { fetch } = await import('@tauri-apps/plugin-http');
    (window as unknown as { fetch: typeof fetch }).fetch = fetch;
  } catch (e) {
    console.warn('[Tauri] HTTP plugin niet beschikbaar, fetch niet vervangen:', e);
  }
}

// Wait for DOM, then setup Tauri fetch (if needed) and only then load App (which loads Supabase)
function runBootstrap() {
  const doRender = async () => {
    await setupTauriFetch();
    const { default: App } = await import('./App');
    initApp(App);
  };
  doRender();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runBootstrap);
} else {
  runBootstrap();
}

// Initialize dark mode before rendering
const initDarkMode = () => {
  try {
    const stored = localStorage.getItem('knx-dark-mode');
    if (stored === 'true' || (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark-mode');
    }
  } catch {
    // Ignore errors
  }
};

initDarkMode();

function initApp(App: React.ComponentType) {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    console.log('Root element found, creating React root...');
    
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <I18nextProvider i18n={i18n}>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </I18nextProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Failed to start app:', error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; color: red; font-family: sans-serif;';
    errorDiv.innerHTML = `
      <h1>Fout bij het starten van de app</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      ${error instanceof Error && error.stack ? `<pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error.stack}</pre>` : ''}
      <p>Controleer de browser console voor meer details.</p>
    `;
    document.body.appendChild(errorDiv);
  }
}

