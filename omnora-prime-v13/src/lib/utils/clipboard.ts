/**
 * Writes text to the clipboard and clears it after 30 seconds if the text has not changed.
 */
export async function copyToClipboard(
  text: string,
  label: string = 'data'
): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  await navigator.clipboard.writeText(text);

  // Auto-clear clipboard after 30 seconds
  // This prevents other apps from reading sensitive data left in clipboard
  setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      // Only clear if our text is still there
      // (don't clear if user copied something else)
      if (current === text) {
        await navigator.clipboard.writeText('');
      }
    } catch {
      // Permission denied to read clipboard — fine
      // The user may have changed the content or denied permission
    }
  }, 30000);
}
