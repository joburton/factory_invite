// Start the browser write during the click, before fetching the email's images.
// No selection from the application document is ever copied.
export async function copyEmailToClipboard(payload: Promise<string>, plain: string) {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Rich clipboard access unavailable');
  }
  const html = payload.then(value => {
    const parsed = new DOMParser().parseFromString(value, 'text/html');
    if (parsed.querySelector('form,input,textarea,button,aside,main') || parsed.querySelectorAll('table.sabin-invite').length !== 1) {
      throw new Error('Only an invitation may be copied');
    }
    if (parsed.querySelectorAll('img[alt="Sabin"]').length !== 1 ||
        parsed.querySelectorAll('img[alt="Sewing felt at the Sabin factory"]').length !== 1 ||
        parsed.querySelector('style, [rowspan], .sabin-mobile-photo, .sabin-photo')) {
      throw new Error('Copied email must contain a single visible layout');
    }
    return new Blob([value], { type: 'text/html' });
  });
  await navigator.clipboard.write([new ClipboardItem({
    'text/html': html,
    'text/plain': new Blob([plain], { type: 'text/plain' }),
  })]);
}
