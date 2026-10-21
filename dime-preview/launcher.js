/* Independent Dime preview. No access to MePocket state, storage, auth or sync. */
(() => {
  'use strict';
  const opener = document.getElementById('dimePreviewOpen');
  if (!opener) return;
  let dialog;
  let frame;
  let status;
  const locked = () => document.body.classList.contains('auth-locked') ||
    document.getElementById('siteGate')?.hidden === false;

  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.id = 'mepocketDimeDialog';
    dialog.setAttribute('aria-label', 'Dime');
    dialog.innerHTML = '<div class="mepocket-dime-stage"><p class="mepocket-dime-loading" role="status">กำลังเปิด…</p></div>';
    document.body.appendChild(dialog);
    status = dialog.querySelector('.mepocket-dime-loading');
    dialog.addEventListener('close', () => {
      frame?.remove();
      frame = null;
      status.hidden = false;
      document.body.classList.remove('mepocket-dime-open');
      if (!locked() && opener.isConnected) opener.focus({ preventScroll: true });
    });
  }

  opener.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (locked()) return;
    if (!dialog) createDialog();
    if (dialog.open) return;
    frame = document.createElement('iframe');
    frame.title = 'Dime';
    // Intentionally omit allow-same-origin: the preview cannot reach parent storage or DOM.
    frame.setAttribute('sandbox', 'allow-scripts allow-downloads');
    frame.setAttribute('allow', "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-read 'none'");
    frame.referrerPolicy = 'no-referrer';
    frame.addEventListener('load', () => { status.hidden = true; }, { once: true });
    frame.src = './dime-preview/index.html';
    dialog.querySelector('.mepocket-dime-stage').appendChild(frame);
    document.body.classList.add('mepocket-dime-open');
    dialog.showModal();
  });

  // The isolated frame may request only its own dismissal. It receives no host data.
  window.addEventListener('message', event => {
    if (!dialog?.open || !frame || event.source !== frame.contentWindow || locked()) return;
    if (event.data?.type === 'mepocket:dime:exit' && event.data.version === 1) dialog.close();
  });

  // A newly locked parent must always cover the preview, including PIN changes.
  new MutationObserver(() => {
    if (dialog?.open && locked()) dialog.close();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
