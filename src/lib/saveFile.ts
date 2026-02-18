/**
 * Save file with "Save As" dialog so the user chooses where to store the export.
 * In Tauri: uses native save dialog and writes via Rust command.
 * In browser: uses File System Access API (showSaveFilePicker) when available, else fallback to download.
 */

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunk = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Opens a save dialog and writes content to the chosen path.
 * @param content File content (binary or text as Uint8Array)
 * @param defaultFilename Suggested filename (e.g. "project-ets.csv")
 * @returns true if saved successfully, false if user cancelled or error
 */
export async function saveFileWithDialog(
  content: Uint8Array,
  defaultFilename: string
): Promise<boolean> {
  if (isTauri()) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await save({
        defaultPath: defaultFilename,
      });
      if (path == null) return false;
      const contentBase64 = uint8ArrayToBase64(content);
      await invoke("save_file", { path, contentBase64 });
      return true;
    } catch (e) {
      console.error("Save file (Tauri):", e);
      return false;
    }
  }

  // Web: File System Access API (Chrome, Edge) or fallback to download
  if (
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window
  ) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (o: { suggestedName: string }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: defaultFilename,
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return false;
      console.error("Save file (showSaveFilePicker):", e);
      return fallbackDownload(content, defaultFilename);
    }
  }

  return fallbackDownload(content, defaultFilename);
}

function fallbackDownload(content: Uint8Array, filename: string): boolean {
  try {
    const blob = new Blob([content]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Save file (fallback download):", e);
    return false;
  }
}

/**
 * Convenience: save UTF-8 text (e.g. JSON) with save dialog.
 */
export async function saveTextWithDialog(
  text: string,
  defaultFilename: string
): Promise<boolean> {
  const bytes = new TextEncoder().encode(text);
  return saveFileWithDialog(bytes, defaultFilename);
}
