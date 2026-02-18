/**
 * Tauri auto-updater service.
 * - Checks for updates at app start (only when online)
 * - Shows update dialog to user
 * - Downloads and installs update, then relaunches
 */

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { confirm, message as showMessage } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';
import type { Update } from '@tauri-apps/plugin-updater';
import i18n from '../i18n/i18n';

export interface UpdaterTranslations {
  updateAvailable: string;
  updateDescription: string;
  updateInstall: string;
  updateLater: string;
  updateError: string;
  updateDownloading: string;
  updateInstallFailed: string;
}

const FALLBACK_NL: UpdaterTranslations = {
  updateAvailable: 'Update beschikbaar',
  updateDescription: 'Er is een nieuwe versie beschikbaar. Wil je nu updaten?',
  updateInstall: 'Nu updaten',
  updateLater: 'Later',
  updateError: 'Kon niet controleren op updates',
  updateDownloading: 'Update downloaden...',
  updateInstallFailed: 'De update kon niet worden geïnstalleerd. Probeer het later opnieuw.',
};

function getTr(key: keyof UpdaterTranslations): string {
  try {
    const v = i18n.t(key);
    if (v && typeof v === 'string' && v !== key) return v;
  } catch (_) {}
  return FALLBACK_NL[key];
}

/** Check if the app is running in Tauri (desktop). Robust for dev and production. */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}

/** Simple online check: navigator.onLine + HEAD request to a reliable host */
async function isOnline(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    await fetch('https://github.com', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/** Get current app version from Tauri config */
export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return '0.0.0';
  try {
    return await getVersion();
  } catch {
    return '0.0.0';
  }
}

/** Result of a manual update check – for showing feedback to the user */
export type UpdateCheckResult =
  | { status: 'update'; update: Update }
  | { status: 'latest' }
  | { status: 'offline' }
  | { status: 'error'; message: string };

/**
 * Check for updates and return result (for manual check with user feedback).
 */
export async function checkForUpdatesWithFeedback(): Promise<UpdateCheckResult> {
  if (!isTauri()) return { status: 'error', message: 'Not in Tauri' };

  try {
    const update = await check();
    if (update) {
      return { status: 'update', update };
    }
    return { status: 'latest' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Updater] Error:', err);
    return { status: 'error', message: msg };
  }
}

/** Messages for manual update check feedback */
export const UPDATE_CHECK_MESSAGES = {
  latest: 'Je hebt de nieuwste versie.',
  offline: 'Geen internetverbinding. Controleer je verbinding.',
  error: (msg: string) => `Kon niet controleren: ${msg}`,
};

/**
 * Manual update check – shows feedback to user and installs if update found.
 */
export async function manualCheckForUpdates(): Promise<void> {
  if (!isTauri()) return;

  const result = await checkForUpdatesWithFeedback();

  if (result.status === 'update') {
    const dialogMessage = `${getTr('updateDescription')}\n\n${result.update.version}${result.update.date ? ` (${result.update.date})` : ''}`;
    const ok = await confirm(dialogMessage, {
      title: getTr('updateAvailable'),
      kind: 'info',
      okLabel: getTr('updateInstall'),
      cancelLabel: getTr('updateLater'),
    });
    if (ok) {
      try {
        await downloadAndInstall(result.update);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[Updater] Install failed:', err);
        const url = 'https://github.com/Archie-Automation/knx_ga_generator/releases/latest';
        const fullMsg = `${getTr('updateInstallFailed')}\n\n${errMsg}\n\nDownload handmatig: ${url}`;
        await showMessage(fullMsg, { title: getTr('updateAvailable'), kind: 'error' });
      }
    }
    return;
  }

  const feedbackMsg =
    result.status === 'latest'
      ? UPDATE_CHECK_MESSAGES.latest
      : result.status === 'offline'
        ? UPDATE_CHECK_MESSAGES.offline
        : UPDATE_CHECK_MESSAGES.error(result.message);

  await showMessage(feedbackMsg, { title: getTr('updateAvailable'), kind: 'info' });
}

/**
 * Main update flow: check online, check for update, prompt user, install, relaunch.
 */
export async function checkForUpdates(): Promise<void> {
  if (!isTauri()) return;

  try {
    const update = await check();
    if (!update) {
      console.info('[Updater] No update available (already on latest)');
      return;
    }

    console.info('[Updater] Update found:', update.version);
    const dialogMessage = `${getTr('updateDescription')}\n\n${update.version}${update.date ? ` (${update.date})` : ''}`;
    const ok = await confirm(dialogMessage, {
      title: getTr('updateAvailable'),
      kind: 'info',
      okLabel: getTr('updateInstall'),
      cancelLabel: getTr('updateLater'),
    });

    if (!ok) return;

    try {
      await downloadAndInstall(update);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Updater] Install failed:', err);
      const url = 'https://github.com/Archie-Automation/knx_ga_generator/releases/latest';
      const fullMsg = `${getTr('updateInstallFailed')}\n\n${errMsg}\n\nDownload handmatig: ${url}`;
      await showMessage(fullMsg, { title: getTr('updateAvailable'), kind: 'error' });
    }
  } catch (err) {
    console.error('[Updater] Error:', err);
    throw err;
  }
}

/** Download and install update, then relaunch */
async function downloadAndInstall(update: Update): Promise<void> {
  try {
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        console.info('[Updater] Download started');
      } else if (event.event === 'Progress') {
        const { contentLength, chunkLength } = event.data;
        if (contentLength && chunkLength) {
          const pct = Math.round((chunkLength / contentLength) * 100);
          console.info(`[Updater] Download progress: ${pct}%`);
        }
      } else if (event.event === 'Finished') {
        console.info('[Updater] Download finished');
      }
    });
    await relaunch();
  } catch (err) {
    console.error('[Updater] Install failed:', err);
    throw err;
  }
}
