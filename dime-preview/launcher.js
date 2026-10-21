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
    dialog.setAttribute('aria-labelledby', 'mepocketDimeTitle');
    dialog.innerHTML = `<header class="mepocket-dime-bar">
      <button type="button" class="mepocket-dime-back" aria-label="กลับไปการตั้งค่า MePocket"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg><span>ตั้งค่า</span></button>
      <div><h2 id="mepocketDimeTitle">Dime จำลอง</h2><small>แยกจาก MePocket</small></div><span class="mepocket-dime-badge">ต้นแบบ</span>
    </header><div class="mepocket-dime-stage"><p class="mepocket-dime-loading" role="status">กำลังเปิดต้นแบบ…</p></div>`;
    document.body.appendChild(dialog);
    status = dialog.querySelector('.mepocket-dime-loading');
    dialog.querySelector('.mepocket-dime-back').addEventListener('click', () => dialog.close());
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
    frame.title = 'ต้นแบบ Dime — ข้อมูลตัวอย่างแยกจาก MePocket';
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

  // A newly locked parent must always cover the preview, including PIN changes.
  new MutationObserver(() => {
    if (dialog?.open && locked()) dialog.close();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
