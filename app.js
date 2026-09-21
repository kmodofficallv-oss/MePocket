const STORAGE_KEY = 'pocket-finance-state-v2';
const RATES_TO_THB = { THB: 1, USD: 35.2 };
const BANK_CATALOG = {
  scb:{code:'SCB',name:'ธนาคารไทยพาณิชย์',color:'#e3d7ff',ink:'#4b2387'},
  kbank:{code:'KBANK',name:'ธนาคารกสิกรไทย',color:'#d8f5df',ink:'#167440'},
  ktb:{code:'KTB',name:'ธนาคารกรุงไทย',color:'#d7ecff',ink:'#1670af'},
  bbl:{code:'BBL',name:'ธนาคารกรุงเทพ',color:'#dce4ff',ink:'#234c9a'},
  bay:{code:'BAY',name:'ธนาคารกรุงศรีอยุธยา',color:'#fff1bf',ink:'#775d00'}
};

const seedState = {
  profileName: 'คุณานนต์',
  settings: { hideBalances: false, compactNumbers: false, notifications: true, systemNotifications: false },
  debitCard: { title:'Pocket Debit', holder:'KUNANON C.', number:'5201884273190426', color:'#18251f' },
  accounts: [
    { id:'thb', currency:'THB', flag:'🇹🇭', badge:'฿', badgeColor:'#52e884', name:'Pocket Save', accountNo:'206-974523-6', balance:26450, gradient:'linear-gradient(135deg,#caffdf 0%,#70f6a3 52%,#14bf8a 100%)', tag:'#eef1ef', country:'ประเทศไทย', rateText:'ดอกเบี้ยสูงสุด 3% ต่อปี' },
    { id:'usd', currency:'USD', flag:'🇺🇸', badge:'$', badgeColor:'#9c62ff', name:'Pocket USD', accountNo:'957906585', balance:95.75, gradient:'linear-gradient(135deg,#f4eaff 0%,#d6b8ff 50%,#8e47f7 100%)', tag:'#eee6ff', country:'สหรัฐอเมริกา', rateText:'บัญชีสกุลเงินดอลลาร์สหรัฐ' },
    { id:'fcd', currency:'USD', flag:'🇺🇸', badge:'◎', badgeColor:'#9cdb29', name:'Pocket FCD - USD', accountNo:'206-974567-4', balance:520.30, gradient:'linear-gradient(135deg,#f2ffd8 0%,#c8ff5b 53%,#8ed817 100%)', tag:'#dff9e6', country:'ประเทศไทย', rateText:'ดอกเบี้ยสูงสุด 4.50% ต่อปี' }
  ],
  goals: [
    { id:'trip', name:'เที่ยวญี่ปุ่น', balance:7800, target:20000, color:'#a987ff', icon:'✈' },
    { id:'emergency', name:'เงินฉุกเฉิน', balance:12000, target:50000, color:'#b7f542', icon:'✚' },
    { id:'equipment', name:'อุปกรณ์ทำงาน', balance:4500, target:30000, color:'#ffb65c', icon:'◉' }
  ],
  externalBanks: [],
  scheduledDeposits: [],
  transactions: [
    { id:'t1', type:'income', account:'thb', amount:35000, currency:'THB', note:'รายได้จากงานออกแบบ', date:'2026-09-18T09:40:00.000Z' },
    { id:'t2', type:'transfer', from:'thb', toType:'goal', to:'trip', amount:3000, currency:'THB', received:3000, receivedCurrency:'THB', note:'เก็บเพิ่มสำหรับทริป', date:'2026-09-18T08:18:00.000Z' },
    { id:'t3', type:'expense', account:'thb', amount:680, currency:'THB', note:'ค่าอาหารและเดินทาง', date:'2026-09-17T12:20:00.000Z' },
    { id:'t4', type:'transfer', from:'thb', toType:'account', to:'usd', amount:3520, currency:'THB', received:100, receivedCurrency:'USD', note:'แลกเก็บเป็น USD', date:'2026-09-16T04:49:03.000Z' },
    { id:'t5', type:'expense', account:'fcd', amount:2.26, currency:'USD', note:'ค่าธรรมเนียมต่างประเทศ', date:'2026-09-15T17:30:00.000Z' }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

let state = loadState();
let selectedAccountId = 'thb';
let activeView = 'home';
let entryType = 'income';
let transactionFilter = 'all';
let reorderMode = false;
let toastTimer;
let carouselScrollTimer;
let depositPopupTimer;
let depositPopupActive = false;
const depositPopupQueue = [];
let homeDeckIndex = 0;
let homeDeckAnimating = false;
let homeDeckAnimationTimer;
let homeDeckPointerId = null;
let homeDeckStartY = 0;
let homeDeckCurrentY = 0;
let homeDeckWasDragged = false;
let homeDeckSuppressClick = false;
let homeDeckWheelLocked = false;
let transferPickerType = '';

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.accounts?.length ? { ...clone(seedState), ...saved, settings:{...seedState.settings,...saved.settings}, debitCard:{...seedState.debitCard,...saved.debitCard}, externalBanks:Array.isArray(saved.externalBanks)?saved.externalBanks:[], scheduledDeposits:Array.isArray(saved.scheduledDeposits)?saved.scheduledDeposits.filter(item=>item.status!=='done'):[] } : clone(seedState);
  } catch { return clone(seedState); }
}

function saveState(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
  if (message && state.settings.notifications) notify(message);
}

const accountById = id => state.accounts.find(account => account.id === id);
const goalById = id => state.goals.find(goal => goal.id === id);
const externalBankById = id => state.externalBanks.find(bank => bank.id === id);
const rateOf = currency => RATES_TO_THB[currency] || 1;
const totalTHB = () => state.accounts.reduce((sum, account) => sum + account.balance * rateOf(account.currency), 0) + state.goals.reduce((sum, goal) => sum + goal.balance, 0);

function formatAmount(value, currency = 'THB', forceFull = false) {
  const options = state.settings.compactNumbers && !forceFull && Math.abs(value) >= 100000
    ? { notation:'compact', maximumFractionDigits:1 }
    : { minimumFractionDigits:2, maximumFractionDigits:2 };
  return `${new Intl.NumberFormat('th-TH', options).format(Number(value) || 0)} ${currency}`;
}

function formatTime(value = new Date()) {
  return new Intl.DateTimeFormat('th-TH', { day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
}

function icon(name, className = 'icon') { return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function flagClass(account) { return account.currency === 'THB' ? 'flag-th' : 'flag-us'; }
function flagHTML(account, mini = false) {
  const countryClass = flagClass(account);
  return mini
    ? `<span class="flag-mini ${countryClass}" aria-hidden="true"></span>`
    : `<span class="flag-badge" style="--badge:${account.badgeColor}"><span class="flag-face ${countryClass}" aria-hidden="true"></span><i>${esc(account.badge)}</i></span>`;
}

function bankProfile(code) { return BANK_CATALOG[code] || BANK_CATALOG.scb; }
function bankBadgeHTML(bank, className='bank-logo') {
  const profile=bankProfile(bank?.bankCode||bank?.code);
  return `<span class="${className}" style="--bank-color:${profile.color};--bank-ink:${profile.ink}" aria-hidden="true">${esc(profile.code)}</span>`;
}

function mixHex(hex, target, weight) {
  const source = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#58f38e';
  const end = /^#[0-9a-f]{6}$/i.test(target) ? target : '#ffffff';
  const channels = [1,3,5].map(index => Math.round(parseInt(source.slice(index,index+2),16) * (1-weight) + parseInt(end.slice(index,index+2),16) * weight));
  return `#${channels.map(value => value.toString(16).padStart(2,'0')).join('')}`;
}

function accountGradient(color) {
  return `linear-gradient(135deg,${mixHex(color,'#ffffff',.68)} 0%,${mixHex(color,'#ffffff',.18)} 54%,${mixHex(color,'#111111',.12)} 100%)`;
}

function accountTagClass(account) { return account.id === 'usd' ? 'purple-tag' : account.id === 'fcd' ? 'green-tag' : ''; }

function accountRowHTML(account) {
  const equivalent = account.currency === 'THB' ? '' : `≈ ${formatAmount(account.balance * rateOf(account.currency), 'THB')}`;
  const separatedTHB = state.goals.reduce((sum, goal) => sum + Number(goal.balance || 0), 0);
  const separatedAmount = separatedTHB / rateOf(account.currency);
  const description = account.currency === 'THB'
    ? 'บัญชีออมทรัพย์ประเทศไทย'
    : account.id === 'fcd' ? 'บัญชีเงินฝากเงินตราต่างประเทศ' : 'บัญชีเงินฝากสกุลดอลลาร์สหรัฐ';
  return `<button class="account-row" data-account="${esc(account.id)}" style="--account-gradient:${account.gradient}" aria-label="เปิดบัญชี ${esc(account.name)}">
    ${flagHTML(account)}
    <span class="account-name"><b>${esc(account.name)}</b><small>${esc(description)}</small></span>
    <span class="account-id"><b>${esc(account.accountNo || account.id)} ${icon('copy','icon icon-inline')}</b></span>
    <span class="account-available">
      <small>ยอดเงินที่ใช้ได้ ${icon('info','icon icon-inline')}</small>
      <strong class="balance-value">${formatAmount(account.balance, account.currency)}</strong>
      ${equivalent ? `<em class="balance-value">${equivalent}</em>` : ''}
    </span>
    <span class="account-footer">
      <span class="account-separated"><small>ยอดเงินที่แยกเก็บได้ ${icon('info','icon icon-inline')}</small><strong class="balance-value">${formatAmount(separatedAmount, account.currency)}</strong></span>
      <span class="account-book">${icon('book','icon icon-inline')}<b>สมุดบัญชี</b>${icon('chevron-right','icon icon-inline')}</span>
    </span>
  </button>`;
}

function updateHomeAccountDeck() {
  const deck = $('#accountList');
  const cards = $$('.account-row', deck);
  if (!cards.length) return;
  homeDeckIndex = (homeDeckIndex + cards.length) % cards.length;
  deck.setAttribute('aria-label', 'ปัดขึ้นหรือลงเพื่อสลับบัญชี');
  cards.forEach((card, index) => {
    const depth = (index - homeDeckIndex + cards.length) % cards.length;
    card.classList.remove('deck-active', 'deck-next', 'deck-last', 'deck-hidden', 'leaving-up', 'leaving-down');
    card.style.removeProperty('--drag-y');
    card.style.removeProperty('--drag-rotate');
    if (depth === 0) card.classList.add('deck-active');
    else if (depth === 1) card.classList.add('deck-next');
    else if (depth === 2) card.classList.add('deck-last');
    else card.classList.add('deck-hidden');
    card.tabIndex = depth === 0 ? 0 : -1;
    card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
  });
}

function switchHomeAccount(direction) {
  if (homeDeckAnimating) return;
  const cards = $$('#accountList .account-row');
  if (cards.length < 2) return;
  const activeCard = cards[homeDeckIndex];
  homeDeckAnimating = true;
  activeCard?.classList.add(direction > 0 ? 'leaving-up' : 'leaving-down');
  clearTimeout(homeDeckAnimationTimer);
  homeDeckAnimationTimer = setTimeout(() => {
    homeDeckIndex = (homeDeckIndex + direction + cards.length) % cards.length;
    homeDeckAnimating = false;
    updateHomeAccountDeck();
  }, 240);
}

function bindHomeAccountDeck() {
  const deck = $('#accountList');
  if (!deck || deck.dataset.deckBound === 'true') return;
  deck.dataset.deckBound = 'true';

  deck.addEventListener('pointerdown', event => {
    if (homeDeckAnimating || (event.pointerType === 'mouse' && event.button !== 0) || !event.target.closest('.deck-active')) return;
    homeDeckPointerId = event.pointerId;
    homeDeckStartY = event.clientY;
    homeDeckCurrentY = event.clientY;
    homeDeckWasDragged = false;
    deck.classList.add('deck-dragging');
    deck.setPointerCapture?.(event.pointerId);
  });

  deck.addEventListener('pointermove', event => {
    if (event.pointerId !== homeDeckPointerId) return;
    homeDeckCurrentY = event.clientY;
    const distance = Math.max(-52, Math.min(52, homeDeckCurrentY - homeDeckStartY));
    if (Math.abs(distance) > 6) {
      homeDeckWasDragged = true;
      event.preventDefault();
    }
    const activeCard = $('.account-row.deck-active', deck);
    activeCard?.style.setProperty('--drag-y', `${distance}px`);
    activeCard?.style.setProperty('--drag-rotate', `${distance / 38}deg`);
  });

  const finishDrag = event => {
    if (event.pointerId !== homeDeckPointerId) return;
    const distance = homeDeckCurrentY - homeDeckStartY;
    homeDeckSuppressClick = homeDeckWasDragged;
    homeDeckPointerId = null;
    deck.classList.remove('deck-dragging');
    deck.releasePointerCapture?.(event.pointerId);
    const activeCard = $('.account-row.deck-active', deck);
    activeCard?.style.removeProperty('--drag-y');
    activeCard?.style.removeProperty('--drag-rotate');
    if (homeDeckWasDragged && Math.abs(distance) >= 28) switchHomeAccount(distance < 0 ? 1 : -1);
  };

  deck.addEventListener('pointerup', finishDrag);
  deck.addEventListener('pointercancel', finishDrag);
  deck.addEventListener('click', event => {
    if (!homeDeckSuppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    homeDeckSuppressClick = false;
  }, true);
  deck.addEventListener('wheel', event => {
    if (homeDeckWheelLocked || Math.abs(event.deltaY) < 12) return;
    event.preventDefault();
    homeDeckWheelLocked = true;
    switchHomeAccount(event.deltaY > 0 ? 1 : -1);
    setTimeout(() => { homeDeckWheelLocked = false; }, 430);
  }, { passive:false });
  deck.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    switchHomeAccount(event.key === 'ArrowDown' ? 1 : -1);
  });
}

function renderAccounts() {
  $('#accountList').innerHTML = state.accounts.map(accountRowHTML).join('');
  updateHomeAccountDeck();
  const cards = state.accounts.map((account,index) => `<article class="account-card-shell ${reorderMode?'sorting':''}"><button class="all-account-card" data-account="${esc(account.id)}" style="background:${account.gradient}"><div class="card-top"><b>${flagHTML(account,true)} ${esc(account.name)}</b><span>${icon('chevron-right')}</span></div><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${account.currency === 'USD' ? `<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>` : '<small>พร้อมใช้และโอนไปยังกล่องเป้าหมาย</small>'}</button><div class="account-order-controls"><span>${icon('sort')}<b>ลำดับ ${index+1}</b></span><button data-move-account="${esc(account.id)}" data-direction="-1" ${index===0?'disabled':''} aria-label="เลื่อน ${esc(account.name)} ขึ้น">${icon('up')}</button><button data-move-account="${esc(account.id)}" data-direction="1" ${index===state.accounts.length-1?'disabled':''} aria-label="เลื่อน ${esc(account.name)} ลง">${icon('down')}</button></div></article>`).join('');
  $('#allAccountCards').innerHTML = `${cards}<button class="add-account-card" data-action="add-account"><span>${icon('plus')}</span><b>เพิ่ม Pocket ใหม่</b><small>สร้างบัญชี THB หรือ USD เพิ่มได้</small></button>`;
  $('#allAccountCards').classList.toggle('reorder-active',reorderMode); $('#reorderAccounts').classList.toggle('active',reorderMode); $('#reorderHint').hidden=!reorderMode;
}

function maskedCardNumber(number) {
  const digits=String(number||'').replace(/\D/g,'').padEnd(16,'0').slice(0,16); return `•••• •••• •••• ${digits.slice(-4)}`;
}

function cardVisualHTML(compact=false) {
  const card=state.debitCard;
  if(compact) return `<div class="debit-card-art compact" style="--card-color:${esc(card.color)}"><span class="card-glow"></span><span class="card-brand"><b>${esc(card.title)}</b><small>บัตรเดบิต Pocket Mastercard</small></span><strong>•••• ${String(card.number||'').replace(/\D/g,'').slice(-4)}</strong><span class="card-network"><i></i><i></i></span><button class="compact-card-open" data-action="open-card" aria-label="เปิดข้อมูลบัตรเดบิต">ดูข้อมูลบัตร</button></div>`;
  return `<div class="debit-card-art" style="--card-color:${esc(card.color)}"><span class="card-glow"></span><span class="card-brand"><b>${esc(card.title)}</b><small>DEBIT</small></span><span class="card-chip"></span><strong>${maskedCardNumber(card.number)}</strong><span class="card-holder">${esc(card.holder)}</span><span class="card-network"><i></i><i></i></span></div>`;
}

function renderDebitCard() {
  $('#debitMiniCard').innerHTML=cardVisualHTML(true);
  $('#debitCardLarge').innerHTML=cardVisualHTML(false);
  $('#cardSubtitle').textContent=`${state.debitCard.title} Mastercard`;
  $('#cardUpdated').textContent=formatTime();
  $('#cardAccountStrip').innerHTML=state.accounts.slice(0,3).map(account=>`<article class="card-account-mini"><div>${flagHTML(account,true)}<b>${esc(account.name)}</b></div><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${account.currency==='USD'?`<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>`:''}</article>`).join('');
  const expenses=[...state.transactions].filter(tx=>tx.type==='expense').sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('#cardTransactions').innerHTML=expenses.length?expenses.map(tx=>transactionHTML(tx)).join(''):'<p class="empty">ยังไม่มีรายการใช้งานบัตร</p>';
}

function renderGoals() {
  const cards = state.goals.map(goal => {
    const percent = Math.min(100, Math.round(goal.balance / goal.target * 100));
    return `<article class="goal-card" style="--goal:${goal.color}"><button class="goal-open" data-goal-open="${esc(goal.id)}"><small>${icon('target','icon icon-inline')} เป้าหมาย</small><strong>${esc(goal.name)}</strong><div class="progress"><i style="width:${percent}%"></i></div><div class="goal-meta"><span class="balance-value">${formatAmount(goal.balance,'THB')}</span><span>${percent}%</span></div></button><button class="goal-delete" data-delete-goal="${esc(goal.id)}" aria-label="ลบกล่อง ${esc(goal.name)}">${icon('trash')}</button></article>`;
  }).join('');
  $('#goalCarousel').innerHTML = cards || '<p class="empty">ยังไม่มีกล่องเป้าหมาย</p>';
  $('#goalList').innerHTML = state.goals.map(goal => { const percent=Math.min(100,Math.round(goal.balance/goal.target*100)); return `<article class="goal-row"><button class="goal-row-open" data-goal-open="${esc(goal.id)}"><span class="goal-dot" style="--goal:${goal.color}"></span><span><b>${esc(goal.name)}</b><small class="balance-value">${formatAmount(goal.balance,'THB')} จาก ${formatAmount(goal.target,'THB')}</small></span><strong>${percent}%</strong></button><button class="goal-delete row-delete" data-delete-goal="${esc(goal.id)}" aria-label="ลบกล่อง ${esc(goal.name)}">${icon('trash')}</button></article>`; }).join('') || '<p class="empty">ยังไม่มีกล่องเป้าหมาย</p>';
}

function renderExternalBanks() {
  const list=$('#externalBankList'); if(!list) return;
  list.innerHTML=state.externalBanks.length?state.externalBanks.map(bank=>{
    const profile=bankProfile(bank.bankCode);
    return `<article class="external-bank-row">${bankBadgeHTML(bank)}<span><b>${esc(bank.nickname||profile.name)}</b><small>${esc(profile.name)} · •••• ${esc(String(bank.accountNo||'').slice(-4))}</small></span><button data-delete-external-bank="${esc(bank.id)}" aria-label="ลบ ${esc(bank.nickname||profile.name)}">${icon('trash')}</button></article>`;
  }).join(''):`<button class="external-bank-empty" data-action="add-external-bank"><span>${icon('plus')}</span><b>เพิ่มบัญชีธนาคาร</b><small>บันทึกปลายทางที่โอนเป็นประจำ</small></button>`;
}

function entityName(type, id) {
  return type === 'goal' ? goalById(id)?.name || 'กล่องเป้าหมาย' : accountById(id)?.name || 'บัญชี';
}

function transactionHTML(tx, scopeAccountId = null) {
  let iconName = 'transfer', title = '', subtitle = tx.note || '', amount = '', className = '';
  if (tx.type === 'transfer') {
    const from = accountById(tx.from);
    title = `${from?.name || 'บัญชี'} → ${entityName(tx.toType, tx.to)}`;
    subtitle ||= 'โอนเงิน';
    if (scopeAccountId && tx.toType === 'account' && tx.to === scopeAccountId) { amount = `+${formatAmount(tx.received,tx.receivedCurrency)}`; className='positive'; }
    else { amount = `−${formatAmount(tx.amount,tx.currency)}`; className='negative'; }
  } else {
    iconName = tx.type === 'income' ? 'deposit' : 'withdraw';
    title = tx.note || (tx.type === 'income' ? 'เงินเข้า' : 'รายจ่าย');
    const goalId=String(tx.account||'').startsWith('goal:')?String(tx.account).slice(5):'';
    subtitle = accountById(tx.account)?.name || goalById(goalId)?.name || 'บัญชี';
    amount = `${tx.type === 'income' ? '+' : '−'}${formatAmount(tx.amount,tx.currency)}`;
    className = tx.type === 'income' ? 'positive' : 'negative';
  }
  return `<article class="transaction"><span class="tx-icon">${icon(iconName)}</span><span class="tx-copy"><b>${esc(title)}</b><small>${esc(subtitle)} · ${formatTime(tx.date)}</small></span><span class="tx-money"><b class="${className} balance-value">${amount}</b><small>${tx.type === 'transfer' && tx.receivedCurrency !== tx.currency ? `ได้ ${formatAmount(tx.received,tx.receivedCurrency)}` : ''}</small></span></article>`;
}

function relatedToAccount(tx, id) { return tx.account === id || tx.from === id || (tx.toType === 'account' && tx.to === id); }

function renderTransactions() {
  const sorted = [...state.transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
  $('#recentList').innerHTML = sorted.length ? sorted.slice(0,3).map(tx => transactionHTML(tx)).join('') : '<p class="empty">ยังไม่มีรายการ</p>';
  const filtered = transactionFilter === 'all' ? sorted : sorted.filter(tx => tx.type === transactionFilter);
  $('#allTransactions').innerHTML = filtered.length ? filtered.map(tx => transactionHTML(tx)).join('') : '<p class="empty">ไม่พบรายการประเภทนี้</p>';
  const accountItems = sorted.filter(tx => relatedToAccount(tx, selectedAccountId));
  $('#accountTransactions').innerHTML = accountItems.length ? accountItems.map(tx => transactionHTML(tx,selectedAccountId)).join('') : '<p class="empty">ยังไม่มีรายการในบัญชีนี้</p>';
}

function accountCardHTML(account) {
  const equivalent = account.currency === 'USD' ? `<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>` : '';
  return `<section class="account-hero" data-carousel-account="${esc(account.id)}" style="background:${account.gradient}" aria-label="บัญชี ${esc(account.name)}"><div class="hero-head"><div class="hero-brand">${flagHTML(account)}<div><h2>${esc(account.name)}</h2><p>บัญชีดำเนินการในประเทศ${esc(account.country)}</p></div></div><span class="account-number">${esc(account.accountNo)} ${icon('copy','icon icon-inline')}</span></div><div class="hero-balance"><span>ยอดเงินที่ใช้ได้ ${icon('info','icon icon-inline')}</span><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${equivalent}</div><div class="hero-split"><div><span>${account.id==='fcd'?'บัญชีเงินฝากเงินตราต่างประเทศ':'ยอดเงินที่แยกเก็บได้'} ${icon('info','icon icon-inline')}</span><b class="balance-value">${account.id==='thb'?formatAmount(state.goals.reduce((sum,goal)=>sum+goal.balance,0),'THB'):formatAmount(account.balance*.15,account.currency)}</b></div><button class="book-button">${icon('book','icon icon-inline')} สมุดบัญชี ${icon('chevron-right','icon icon-inline')}</button></div></section>`;
}

function renderDetail() {
  const account = accountById(selectedAccountId) || state.accounts[0];
  if (!account) return;
  $('#currencyTabs').innerHTML = state.accounts.map(item => `<button class="currency-tab ${item.id===account.id?'active':''}" data-account-tab="${esc(item.id)}" role="tab" aria-selected="${item.id===account.id}">${flagHTML(item,true)}${esc(item.currency)}${item.id==='fcd'?' FCD':''}</button>`).join('');
  $('#accountCarousel').innerHTML = state.accounts.map(accountCardHTML).join('');
  $('#carouselDots').innerHTML = state.accounts.map(item => `<i class="${item.id===account.id?'active':''}"></i>`).join('');
  updateDetailMeta();
  requestAnimationFrame(() => scrollToSelectedCard('auto'));
}

function updateDetailMeta() {
  const account = accountById(selectedAccountId) || state.accounts[0];
  if (!account) return;
  $$('.currency-tab').forEach(button => { const active=button.dataset.accountTab===account.id; button.classList.toggle('active',active); button.setAttribute('aria-selected',String(active)); });
  $$('#carouselDots i').forEach((dot,index) => dot.classList.toggle('active',state.accounts[index]?.id===account.id));
  $('#detailUpdated').textContent = formatTime();
  $('#detailInterest').textContent = formatAmount(account.balance * .00008,account.currency);
  $('#accountTransactionTitle').textContent = `รายการเดินบัญชี ${account.name}`;
  const actions = account.currency === 'THB'
    ? [['transfer','transfer','โอนเงิน'],['income','deposit','ฝากเงิน'],['expense','withdraw','รายจ่าย'],['scan','scan','สแกน']]
    : [['exchange-in','deposit','แลกเงินเข้า'],['exchange-out','withdraw','แลกเงินออก'],['income','plus','เพิ่มเงิน'],['scan','scan','สแกน']];
  $('#accountActions').innerHTML = actions.map(([action,iconName,label]) => `<button data-action="${action}" data-account-source="${account.id}"><span>${icon(iconName)}</span><b>${label}</b></button>`).join('');
  renderTransactions();
  updateBalanceVisibility();
}

function scrollToSelectedCard(behavior = 'smooth') {
  const carousel=$('#accountCarousel'); const card=carousel.querySelector(`[data-carousel-account="${selectedAccountId}"]`); if(!card) return;
  const padding=Number.parseFloat(getComputedStyle(carousel).paddingLeft)||0;
  carousel.scrollTo({left:card.offsetLeft-carousel.offsetLeft-padding,behavior});
}

function selectDetailAccount(id, shouldScroll = true) {
  if(!accountById(id)) return; selectedAccountId=id; updateDetailMeta(); if(shouldScroll) scrollToSelectedCard();
}

function renderProfileAndSettings() {
  $('#profileName').textContent = state.profileName;
  $('#profileStats').innerHTML = `<div class="profile-stat"><span>มูลค่ารวมโดยประมาณ</span><strong class="balance-value">${formatAmount(totalTHB(),'THB')}</strong></div><div class="profile-stat"><span>กล่องเป้าหมาย</span><strong>${state.goals.length} กล่อง</strong></div>`;
  Object.entries(state.settings).forEach(([key,value]) => $(`#${key}Switch`)?.classList.toggle('on',Boolean(value)));
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  const status = $('#systemNotificationStatus');
  if(status) status.textContent = permission === 'granted' ? 'เปิดแล้ว — แจ้งเตือนเมื่อฝากอัตโนมัติสำเร็จ' : permission === 'denied' ? 'ถูกปิดในเบราว์เซอร์ กรุณาเปิดจากการตั้งค่าเครื่อง' : permission === 'unsupported' ? 'เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน' : 'แตะเพื่ออนุญาตการแจ้งเตือน';
}

function renderSchedules() {
  const list=$('#scheduleList'); if(!list) return;
  const schedules=[...(state.scheduledDeposits||[])].filter(item=>item.status!=='done').sort((a,b)=>new Date(a.runAt)-new Date(b.runAt));
  list.innerHTML=schedules.length?schedules.map(item=>{const destination=getScheduleDestination(item);const label=item.status==='done'?'ดำเนินการแล้ว':item.status==='failed'?'ไม่สำเร็จ':'รอดำเนินการ';return `<article class="schedule-item ${esc(item.status)}"><span class="schedule-icon">${icon('calendar')}</span><span><b>${esc(destination.entity?.name||'กล่องที่ถูกลบ')}</b><small>${formatTime(item.runAt)} · ${formatAmount(item.amount,item.currency||destination.currency,true)}</small><em>${label}</em></span><button data-delete-schedule="${esc(item.id)}" aria-label="ลบรายการตั้งเวลา">${icon('trash')}</button></article>`;}).join(''):'<p class="schedule-empty">ยังไม่มีรายการฝากอัตโนมัติ</p>';
  const select=$('#scheduleDestination');
  if(select){const previous=select.value;select.innerHTML=`<optgroup label="เงินของฉัน">${state.accounts.map(account=>`<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('')}</optgroup>${state.goals.length?`<optgroup label="กล่องเป้าหมาย">${state.goals.map(goal=>`<option value="goal:${esc(goal.id)}">◎ ${esc(goal.name)} · THB</option>`).join('')}</optgroup>`:''}`;if([...select.options].some(option=>option.value===previous))select.value=previous;updateScheduleDestination();}
}

function getScheduleDestination(value) {
  let type,id;
  if(typeof value==='string') [type,id]=value.split(':');
  else {type=value.destinationType||(value.goalId?'goal':'account');id=value.destinationId||value.goalId;}
  const entity=type==='goal'?goalById(id):accountById(id);
  return {type,id,entity,currency:type==='goal'?'THB':entity?.currency||'THB'};
}

function updateScheduleDestination() {
  const destination=getScheduleDestination($('#scheduleDestination')?.value||'');
  $('#scheduleCurrency').textContent=destination.currency;
  $('#scheduleDestinationNote').textContent=destination.type==='goal'?`บันทึกเงินเข้า “${destination.entity?.name||'กล่องเป้าหมาย'}” โดยตรง`:`บันทึกเป็นเงินเข้าใน “${destination.entity?.name||'Pocket'}”`;
}

function renderAll() {
  renderAccounts(); renderGoals(); renderExternalBanks(); renderTransactions(); renderDetail(); renderDebitCard(); renderProfileAndSettings(); renderSchedules(); fillSelects();
  $('#updatedAt').textContent = formatTime();
  $('#interestTotal').textContent = `฿${new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(totalTHB()*.00008)}`;
  updateBalanceVisibility();
}

function updateBalanceVisibility() { $$('.balance-value').forEach(element => element.classList.toggle('balance-hidden',state.settings.hideBalances)); }

function navigate(view) {
  activeView = view;
  $$('.view').forEach(element => element.classList.toggle('active',element.id === `${view}View`));
  $('#bottomNav').classList.remove('hidden');
  $$('#bottomNav [data-nav]').forEach(button => button.classList.toggle('active',button.dataset.nav === view));
  window.scrollTo({top:0,behavior:'smooth'});
}

function openDetail(id) {
  if (!accountById(id)) return;
  selectedAccountId = id; activeView = 'accountDetail';
  $$('.view').forEach(element => element.classList.toggle('active',element.id === 'accountDetailView'));
  $('#bottomNav').classList.remove('hidden');
  $$('#bottomNav [data-nav]').forEach(button => button.classList.toggle('active',button.dataset.nav === 'accounts'));
  renderDetail(); window.scrollTo({top:0,behavior:'smooth'});
}

function openDebitCard() {
  activeView='cardDetail'; $$('.view').forEach(element=>element.classList.toggle('active',element.id==='cardDetailView')); $('#bottomNav').classList.remove('hidden'); $$('#bottomNav [data-nav]').forEach(button=>button.classList.toggle('active',button.dataset.nav==='accounts')); renderDebitCard(); window.scrollTo({top:0,behavior:'smooth'});
}

function showSheet(id) { const sheet=$(id); sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeSheets() { $$('.sheet.open').forEach(sheet => {sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');}); document.body.style.overflow=''; $$('.form-error').forEach(error=>error.textContent=''); }

function fillSelects() {
  const accountOptions = state.accounts.map(account => `<option value="${esc(account.id)}">${account.flag} ${esc(account.name)} · ${formatAmount(account.balance,account.currency,true)}</option>`).join('');
  const destinations = state.accounts.map(account => `<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)}</option>`).join('') + state.goals.map(goal => `<option value="goal:${esc(goal.id)}">◎ กล่อง: ${esc(goal.name)}</option>`).join('');
  const from=$('#transferFrom'), to=$('#transferTo'), entry=$('#entryAccount');
  const fromValue=from.value, toValue=to.value, entryValue=entry.value;
  from.innerHTML=accountOptions; to.innerHTML=destinations; entry.innerHTML=accountOptions;
  if(accountById(fromValue)) from.value=fromValue;
  if([...to.options].some(option=>option.value===toValue)) to.value=toValue;
  if(accountById(entryValue)) entry.value=entryValue;
  const bankFrom=$('#bankTransferFrom');
  if(bankFrom){const bankValue=bankFrom.value;bankFrom.innerHTML=state.accounts.map(account=>`<option value="${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('');if(accountById(bankValue))bankFrom.value=bankValue;updateBankTransferSource();}
  ensureDifferentDestination(); updateTransferPreview(); updateEntryCurrency();
}

function ensureDifferentDestination() {
  const from=$('#transferFrom').value;
  if($('#transferTo').value === `account:${from}`) { const next=state.accounts.find(account=>account.id!==from); if(next) $('#transferTo').value=`account:${next.id}`; else if(state.goals[0]) $('#transferTo').value=`goal:${state.goals[0].id}`; }
}

function openInternalTransfer(fromId='thb', destination='') {
  fillSelects();
  if(accountById(fromId)) $('#transferFrom').value=fromId;
  if(destination && [...$('#transferTo').options].some(option=>option.value===destination)) $('#transferTo').value=destination;
  ensureDifferentDestination(); $('#transferAmount').value=''; $('#transferNote').value=''; updateTransferPreview(); showSheet('#internalTransferSheet');
}

function openTransfer(fromId='thb', destination='') {
  if(destination){openInternalTransfer(fromId,destination);return;}
  fillSelects();
  const account=accountById(fromId); if(account?.currency==='THB') $('#bankTransferFrom').value=fromId;
  $('#bankAccountNumber').value=''; $('#bankTransferAmount').value=''; $('#bankTransferError').textContent='';
  updateBankTransferSource(); validateBankTransfer(); switchBankTab('account'); showSheet('#transferSheet');
}

function destinationInfo() {
  const [type,id]=$('#transferTo').value.split(':');
  if(type==='goal') return {type,id,currency:'THB',entity:goalById(id)};
  const account=accountById(id); return {type:'account',id,currency:account?.currency||'THB',entity:account};
}

function updateTransferPreview() {
  const from=accountById($('#transferFrom').value); const destination=destinationInfo(); const amount=Number($('#transferAmount').value)||0;
  if(!from) return;
  $('#transferCurrency').textContent=from.currency;
  const received=amount*rateOf(from.currency)/rateOf(destination.currency);
  $('#conversionNote').textContent=`ปลายทางจะได้รับประมาณ ${formatAmount(received,destination.currency,true)} · อัตราตัวอย่าง 1 USD = 35.20 THB`;
}

function confirmTransfer() {
  const from=accountById($('#transferFrom').value); const destination=destinationInfo(); const amount=Number($('#transferAmount').value); let error='';
  if(!from||!destination.entity) error='กรุณาเลือกต้นทางและปลายทาง';
  else if(destination.type==='account'&&destination.id===from.id) error='กรุณาเลือกคนละบัญชี';
  else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน';
  else if(amount>from.balance) error='ยอดเงินต้นทางไม่เพียงพอ';
  $('#transferError').textContent=error; if(error) return;
  const received=Number((amount*rateOf(from.currency)/rateOf(destination.currency)).toFixed(2));
  from.balance=Number((from.balance-amount).toFixed(2));
  destination.entity.balance=Number((destination.entity.balance+received).toFixed(2));
  state.transactions.push({id:crypto.randomUUID(),type:'transfer',from:from.id,toType:destination.type,to:destination.id,amount,currency:from.currency,received,receivedCurrency:destination.currency,note:$('#transferNote').value.trim()||'โอนเงิน',date:new Date().toISOString()});
  closeSheets(); saveState(`โอนไปยัง ${destination.entity.name} แล้ว`);
}

function updateBankTransferSource() {
  const select=$('#bankTransferFrom'); if(!select) return;
  const account=accountById(select.value)||state.accounts[0]; if(!account) return;
  $('#bankSourceName').textContent=account.name;
  $('#bankSourceBalance').textContent=`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`;
  $('#bankSourceFlag').className=`flag-mini ${flagClass(account)}`;
  $('.transfer-source-card')?.style.setProperty('--source-gradient',account.gradient);
  updateBankTransferDestinations();
}

function updateBankTransferDestinations() {
  const select=$('#bankTransferDestination'); if(!select) return;
  const previous=select.value; const sourceId=$('#bankTransferFrom')?.value;
  const accounts=state.accounts.filter(account=>account.id!==sourceId);
  const bankOptions=state.externalBanks.map(bank=>{const profile=bankProfile(bank.bankCode);return `<option value="bank:${esc(bank.id)}">${esc(bank.nickname||profile.name)} · ${esc(profile.code)}</option>`;}).join('');
  select.innerHTML=`<optgroup label="ธนาคารภายนอก">${bankOptions}<option value="bank:new">โอนไปบัญชีธนาคารใหม่ · SCB</option></optgroup>${accounts.length?`<optgroup label="บัญชี Pocket หลัก">${accounts.map(account=>`<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('')}</optgroup>`:''}${state.goals.length?`<optgroup label="กล่องเป้าหมาย">${state.goals.map(goal=>`<option value="goal:${esc(goal.id)}">${esc(goal.icon||'◎')} ${esc(goal.name)} · THB</option>`).join('')}</optgroup>`:''}`;
  if([...select.options].some(option=>option.value===previous)) select.value=previous;
  else select.value=state.externalBanks[0]?`bank:${state.externalBanks[0].id}`:'bank:new';
  updateBankTransferDestination();
}

function bankTransferDestinationInfo() {
  const value=$('#bankTransferDestination')?.value||'bank:new'; const [type,id]=value.split(':');
  if(type==='account'){const entity=accountById(id);return {type,id,entity,currency:entity?.currency||'THB'};}
  if(type==='goal'){const entity=goalById(id);return {type,id,entity,currency:'THB'};}
  const saved=externalBankById(id); const profile=bankProfile(saved?.bankCode||'scb');
  return {type:'bank',id,entity:saved?{...saved,name:saved.nickname||profile.name,bankName:profile.name,code:profile.code,color:profile.color}:{name:'บัญชีธนาคารใหม่',bankName:profile.name,code:profile.code,color:profile.color,accountNo:''},currency:'THB'};
}

function updateBankTransferDestination() {
  const source=accountById($('#bankTransferFrom')?.value); const destination=bankTransferDestinationInfo();
  const external=destination.type==='bank'; const externalFields=$('#bankExternalFields');
  if(externalFields) externalFields.hidden=!external;
  $('#bankTransferLimit').hidden=!external;
  $('#confirmBankTransfer').textContent=external?'ถัดไป':'ยืนยันการโอน';
  $('#bankDestinationMeta').textContent=external?(destination.entity?.bankName||'ธนาคารภายนอก'):destination.type==='goal'?'กล่องเป้าหมาย':'บัญชี Pocket หลัก';
  $('#bankDestinationName').textContent=destination.entity?.name||'เลือกปลายทาง';
  const iconElement=$('#bankDestinationIcon');
  if(iconElement){
    iconElement.innerHTML=external?esc(destination.entity?.code||'SCB'):destination.type==='goal'?esc(destination.entity?.icon||'◎'):flagHTML(destination.entity,true);
    iconElement.classList.toggle('has-flag',destination.type==='account');
    iconElement.style.setProperty('--destination-accent',external?(destination.entity?.color||'#e3d7ff'):destination.type==='goal'?(destination.entity?.color||'#7ee0cb'):'#fff');
  }
  if(external&&destination.entity?.accountNo) $('#bankAccountNumber').value=destination.entity.accountNo;
  $('#bankTransferCurrency').textContent=source?.currency||'THB';
  const amount=Number($('#bankTransferAmount')?.value)||0;
  const received=source?amount*rateOf(source.currency)/rateOf(destination.currency):0;
  $('#bankTransferConversion').textContent=external
    ? 'โอนออกเป็นเงินบาทไปยังบัญชีธนาคาร'
    : `ปลายทางจะได้รับประมาณ ${formatAmount(received,destination.currency,true)}`;
  validateBankTransfer();
}

function transferPickerOption(value, iconMarkup, title, subtitle, accent, selected, flag=false) {
  return `<button type="button" class="transfer-picker-option${selected?' selected':''}" data-transfer-picker-option="${esc(value)}">
    <span class="transfer-picker-option-icon${flag?' is-flag':''}" style="--picker-accent:${esc(accent)}">${iconMarkup}</span>
    <span class="transfer-picker-option-copy"><b>${esc(title)}</b><small>${esc(subtitle)}</small></span>
    <span class="transfer-picker-option-check">${selected?icon('check'):''}</span>
  </button>`;
}

function openTransferPicker(type) {
  const picker=$('#transferPickerSheet'); const options=$('#transferPickerOptions');
  if(!picker||!options) return;
  transferPickerType=type;
  const sourceId=$('#bankTransferFrom')?.value; const selectedValue=type==='source'?sourceId:$('#bankTransferDestination')?.value;
  $('#transferPickerTitle').textContent=type==='source'?'เลือก Pocket ต้นทาง':'เลือกปลายทาง';
  const groups=[];
  if(type==='source'){
    groups.push(`<section class="transfer-picker-group"><p>บัญชี Pocket ของฉัน</p>${state.accounts.map(account=>transferPickerOption(account.id,flagHTML(account,true),account.name,`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`,'#fff',selectedValue===account.id,true)).join('')}</section>`);
  }else{
    const savedBanks=state.externalBanks.map(bank=>{const profile=bankProfile(bank.bankCode);return transferPickerOption(`bank:${bank.id}`,bankBadgeHTML(bank,'bank-picker-logo'),bank.nickname||profile.name,`${profile.name} · •••• ${String(bank.accountNo||'').slice(-4)}`,profile.color,selectedValue===`bank:${bank.id}`);}).join('');
    groups.push(`<section class="transfer-picker-group"><p>ธนาคารภายนอก</p>${savedBanks}${transferPickerOption('bank:new','SCB','บัญชีธนาคารใหม่','กรอกเลขบัญชีเพื่อโอน','#e3d7ff',selectedValue==='bank:new')}</section>`);
    const accounts=state.accounts.filter(account=>account.id!==sourceId);
    if(accounts.length) groups.push(`<section class="transfer-picker-group"><p>บัญชี Pocket หลัก</p>${accounts.map(account=>transferPickerOption(`account:${account.id}`,flagHTML(account,true),account.name,`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`,'#fff',selectedValue===`account:${account.id}`,true)).join('')}</section>`);
    if(state.goals.length) groups.push(`<section class="transfer-picker-group"><p>กล่องเป้าหมาย</p>${state.goals.map(goal=>transferPickerOption(`goal:${goal.id}`,esc(goal.icon||'◎'),goal.name,`${formatAmount(goal.balance,'THB',true)} จากเป้าหมาย ${formatAmount(goal.target,'THB',true)}`,goal.color||'#7ee0cb',selectedValue===`goal:${goal.id}`)).join('')}</section>`);
  }
  options.innerHTML=groups.join('');
  picker.classList.add('open'); picker.setAttribute('aria-hidden','false');
}

function closeTransferPicker() {
  const picker=$('#transferPickerSheet'); if(!picker) return;
  picker.classList.remove('open'); picker.setAttribute('aria-hidden','true'); transferPickerType='';
}

function chooseTransferPicker(value) {
  if(transferPickerType==='source'){
    $('#bankTransferFrom').value=value; updateBankTransferSource();
  }else if(transferPickerType==='destination'){
    $('#bankTransferDestination').value=value;
    const destination=bankTransferDestinationInfo();
    if(destination.type==='bank') $('#bankAccountNumber').value=destination.entity?.accountNo||'';
    updateBankTransferDestination();
  }
  closeTransferPicker();
}

function switchBankTab(tab) {
  $$('[data-bank-tab]').forEach(button=>button.classList.toggle('active',button.dataset.bankTab===tab));
  $$('[data-bank-pane]').forEach(pane=>pane.classList.toggle('active',pane.dataset.bankPane===tab));
}

function validateBankTransfer(showError=false) {
  const account=accountById($('#bankTransferFrom')?.value); const destination=bankTransferDestinationInfo(); const number=$('#bankAccountNumber')?.value.replace(/\D/g,'')||''; const amount=Number($('#bankTransferAmount')?.value)||0; let error='';
  if(!account) error='กรุณาเลือก Pocket ต้นทาง';
  else if(!destination.entity) error='กรุณาเลือกบัญชีหรือกล่องปลายทาง';
  else if(destination.type==='account'&&destination.id===account.id) error='กรุณาเลือกคนละบัญชี';
  else if(destination.type==='bank'&&account.currency!=='THB') error='บัญชีธนาคารภายนอกรับโอนจาก Pocket สกุล THB เท่านั้น';
  else if(destination.type==='bank'&&number.length<10) error='กรุณากรอกเลขบัญชีให้ครบอย่างน้อย 10 หลัก';
  else if(amount<=0) error='กรุณาใส่จำนวนเงิน';
  else if(destination.type==='bank'&&amount>200000) error='เกินวงเงินโอนคงเหลือวันนี้';
  else if(amount>account.balance) error='ยอดเงินใน Pocket ไม่เพียงพอ';
  $('#confirmBankTransfer').disabled=Boolean(error);
  if(showError) $('#bankTransferError').textContent=error;
  else if(!error) $('#bankTransferError').textContent='';
  return !error;
}

function handleBankTransfer(event) {
  event.preventDefault(); if(!validateBankTransfer(true)) return;
  const account=accountById($('#bankTransferFrom').value); const destination=bankTransferDestinationInfo(); const amount=Number($('#bankTransferAmount').value); const number=$('#bankAccountNumber').value.replace(/\D/g,'');
  account.balance=Number((account.balance-amount).toFixed(2));
  if(destination.type==='bank'){
    state.transactions.push({id:crypto.randomUUID(),type:'expense',account:account.id,amount,currency:'THB',note:`โอนไป ${destination.entity?.name||destination.entity?.bankName||'ธนาคารภายนอก'} ••••${number.slice(-4)}`,date:new Date().toISOString()});
    closeSheets(); saveState(`บันทึกโอนไป ${destination.entity?.name||destination.entity?.code||'ธนาคาร'} ${formatAmount(amount,'THB',true)} แล้ว`); return;
  }
  const received=Number((amount*rateOf(account.currency)/rateOf(destination.currency)).toFixed(2));
  destination.entity.balance=Number((destination.entity.balance+received).toFixed(2));
  state.transactions.push({id:crypto.randomUUID(),type:'transfer',from:account.id,toType:destination.type,to:destination.id,amount,currency:account.currency,received,receivedCurrency:destination.currency,note:`โอนไป ${destination.entity.name}`,date:new Date().toISOString()});
  closeSheets(); saveState(`โอนไปยัง ${destination.entity.name} แล้ว`);
}

function closeBankPicker() {
  const picker=$('#bankPickerSheet'); picker.classList.remove('open'); picker.setAttribute('aria-hidden','true');
}

function openScheduleEditor() {
  if(!state.accounts.length&&!state.goals.length){notify('กรุณาสร้าง Pocket หรือกล่องเป้าหมายก่อน');navigate('accounts');return;}
  renderSchedules(); const next=new Date(Date.now()+5*60*1000); const local=new Date(next.getTime()-next.getTimezoneOffset()*60000);
  $('#scheduleDate').value=local.toISOString().slice(0,10); $('#scheduleTime').value=local.toISOString().slice(11,16); $('#scheduleAmount').value=''; $('#scheduleError').textContent=''; updateScheduleDestination(); showSheet('#scheduleSheet');
}

function handleScheduleSubmit(event) {
  event.preventDefault(); const destination=getScheduleDestination($('#scheduleDestination').value); const amount=Number($('#scheduleAmount').value); const runAt=new Date(`${$('#scheduleDate').value}T${$('#scheduleTime').value}`); let error='';
  if(!destination.entity) error='กรุณาเลือกกล่องปลายทาง'; else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน'; else if(Number.isNaN(runAt.getTime())||runAt<=new Date()) error='กรุณาเลือกเวลาในอนาคต';
  $('#scheduleError').textContent=error; if(error) return;
  state.scheduledDeposits.push({id:crypto.randomUUID(),destinationType:destination.type,destinationId:destination.id,currency:destination.currency,amount:Number(amount.toFixed(2)),runAt:runAt.toISOString(),status:'pending',createdAt:new Date().toISOString()});
  closeSheets(); saveState(`ตั้งฝากเข้า “${destination.entity.name}” แล้ว`); requestSystemNotifications(false);
}

function deleteSchedule(id) {
  const item=state.scheduledDeposits.find(schedule=>schedule.id===id); if(!item) return;
  if(!confirm('ลบรายการฝากอัตโนมัตินี้หรือไม่?')) return;
  state.scheduledDeposits=state.scheduledDeposits.filter(schedule=>schedule.id!==id); saveState('ลบรายการตั้งเวลาแล้ว');
}

async function requestSystemNotifications(showFeedback=true) {
  if(!('Notification' in window)){if(showFeedback)notify('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');return false;}
  let permission=Notification.permission;
  if(permission==='default') permission=await Notification.requestPermission();
  state.settings.systemNotifications=permission==='granted'; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderProfileAndSettings();
  if(showFeedback) notify(permission==='granted'?'เปิดการแจ้งเตือนของโทรศัพท์แล้ว':'ยังไม่ได้รับอนุญาตการแจ้งเตือน');
  return permission==='granted';
}

async function sendSystemNotification(title,body) {
  if(!state.settings.systemNotifications||!('Notification' in window)||Notification.permission!=='granted') return;
  try {
    if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.ready;registration.active?.postMessage({type:'POCKET_NOTIFICATION',title,body});}
    else new Notification(title,{body});
  } catch { /* การแจ้งเตือนเป็นความสามารถเสริม */ }
}

function formatDepositAmount(amount,currency) {
  const value=new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(amount)||0);
  return `${value} ${currency==='THB'?'บาท':currency}`;
}

function destinationReference(destination) {
  if(destination.type==='account') return String(destination.entity?.accountNo||destination.id||'').replace(/\D/g,'')||String(destination.id||'');
  const source=String(destination.id||'goal'); let hash=0;
  for(const character of source) hash=((hash*31)+character.charCodeAt(0))>>>0;
  return String(7000000000+(hash%1000000000));
}

function depositTimestamp(value=new Date()) {
  const date=new Date(value);
  const day=new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'2-digit'}).format(date);
  const time=new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
  return {day,time};
}

function showDepositPopup(payload) {
  depositPopupQueue.push(payload); if(depositPopupActive) return; showNextDepositPopup();
}

function showNextDepositPopup() {
  const payload=depositPopupQueue.shift(); if(!payload){depositPopupActive=false;return;}
  depositPopupActive=true; const popup=$('#depositPopup');
  popup.classList.toggle('failed',!payload.success); $('#depositPopupTitle').textContent=payload.success?'รายการเงินเข้าอัตโนมัติสำเร็จ':'ฝากเงินอัตโนมัติไม่สำเร็จ';
  $('#depositPopupAmount').textContent=payload.amountText||'ไม่สามารถทำรายการได้'; $('#depositPopupDetail').textContent=payload.detail;
  popup.classList.add('show'); clearTimeout(depositPopupTimer); depositPopupTimer=setTimeout(hideDepositPopup,5200);
}

function hideDepositPopup() {
  const popup=$('#depositPopup'); popup.classList.remove('show'); clearTimeout(depositPopupTimer);
  setTimeout(()=>{depositPopupActive=false;showNextDepositPopup();},260);
}

function processScheduledDeposits() {
  const due=(state.scheduledDeposits||[]).filter(item=>item.status==='pending'&&new Date(item.runAt)<=new Date()); if(!due.length) return;
  due.forEach(item=>{const destination=getScheduleDestination(item);const completedAt=new Date();const when=depositTimestamp(completedAt);if(!destination.entity){item.status='failed';item.completedAt=completedAt.toISOString();showDepositPopup({success:false,detail:'ไม่พบ Pocket หรือกล่องปลายทางที่เลือกไว้'});sendSystemNotification('รายการเงินเข้าไม่สำเร็จ',`ไม่พบปลายทาง เมื่อ ${when.day} เวลา ${when.time} น.`);return;}const currency=item.currency||destination.currency;const amountText=formatDepositAmount(item.amount,currency);const reference=destinationReference(destination);const targetWord=destination.type==='goal'?'กล่อง':'บัญชี';destination.entity.balance=Number((destination.entity.balance+item.amount).toFixed(2));item.status='done';item.completedAt=completedAt.toISOString();const accountId=destination.type==='goal'?`goal:${destination.id}`:destination.id;state.transactions.push({id:crypto.randomUUID(),type:'income',account:accountId,amount:item.amount,currency,note:'ฝากเงินอัตโนมัติ',date:completedAt.toISOString()});const detail=`เข้า ${destination.entity.name} · ${targetWord} ${reference} · ${when.time} น.`;showDepositPopup({success:true,amountText,detail});sendSystemNotification('รายการเงินเข้า',`${amountText} เข้า${targetWord} ${reference} เมื่อ ${when.day} เวลา ${when.time} น.`);});
  state.scheduledDeposits=(state.scheduledDeposits||[]).filter(item=>item.status!=='done');
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderAll();
}

function openEntry(type='income', accountId='thb') {
  entryType=type; fillSelects(); if(accountById(accountId)) $('#entryAccount').value=accountId;
  $('#entryAmount').value=''; $('#entryNote').value=''; updateEntryType(); updateEntryCurrency(); showSheet('#entrySheet');
}
function updateEntryType(){ $$('[data-entry-type]').forEach(button=>button.classList.toggle('active',button.dataset.entryType===entryType)); $('#entryTitle').textContent=entryType==='income'?'บันทึกเงินเข้า':'บันทึกรายจ่าย'; }
function updateEntryCurrency(){ const account=accountById($('#entryAccount').value); $('#entryCurrency').textContent=account?.currency||'THB'; }

function handleEntrySubmit(event) {
  event.preventDefault(); const account=accountById($('#entryAccount').value); const amount=Number($('#entryAmount').value); let error='';
  if(!account) error='ไม่พบบัญชี'; else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน'; else if(entryType==='expense'&&amount>account.balance) error='ยอดเงินไม่เพียงพอ';
  $('#entryError').textContent=error; if(error) return;
  account.balance=Number((account.balance+(entryType==='income'?amount:-amount)).toFixed(2));
  state.transactions.push({id:crypto.randomUUID(),type:entryType,account:account.id,amount,currency:account.currency,note:$('#entryNote').value.trim()||(entryType==='income'?'เงินเข้า':'รายจ่าย'),date:new Date().toISOString()});
  closeSheets(); saveState(entryType==='income'?'บันทึกเงินเข้าแล้ว':'บันทึกรายจ่ายแล้ว');
}

function handleGoalSubmit(event) {
  event.preventDefault(); const name=$('#goalName').value.trim(); const target=Number($('#goalTarget').value); if(!name||!target||target<=0) return;
  state.goals.push({id:`goal-${Date.now()}`,name,balance:0,target,color:$('#goalColor').value,icon:'◇'}); event.target.reset(); updateColorValue('goal'); closeSheets(); saveState(`สร้างกล่อง “${name}” แล้ว`);
}

function handleAccountSubmit(event) {
  event.preventDefault();
  const name=$('#accountName').value.trim(); const currency=$('#accountCurrency').value; const balance=Number($('#accountBalance').value)||0; const color=$('#accountColor').value;
  if(!name || !['THB','USD'].includes(currency) || balance<0) return;
  const suffix=String(Date.now()).slice(-7);
  state.accounts.push({id:`account-${Date.now()}`,currency,flag:currency==='THB'?'🇹🇭':'🇺🇸',badge:currency==='THB'?'฿':'$',badgeColor:color,name,accountNo:`${currency==='THB'?'206':'957'}-${suffix}`,balance:Number(balance.toFixed(2)),gradient:accountGradient(color),tag:mixHex(color,'#ffffff',.78),country:currency==='THB'?'ประเทศไทย':'สหรัฐอเมริกา',rateText:currency==='THB'?'บัญชีสกุลเงินบาท':'บัญชีสกุลเงินดอลลาร์สหรัฐ'});
  event.target.reset(); updateAccountCurrencyLabel(); updateColorValue('account'); closeSheets(); saveState(`สร้าง “${name}” แล้ว`);
}

function handleExternalBankSubmit(event) {
  event.preventDefault();
  const bankCode=$('#externalBankCode').value; const profile=bankProfile(bankCode); const accountNo=$('#externalBankAccountNumber').value.replace(/\D/g,'').slice(0,13); const nickname=$('#externalBankNickname').value.trim()||profile.name; let error='';
  if(!BANK_CATALOG[bankCode]) error='กรุณาเลือกธนาคาร';
  else if(accountNo.length<10) error='กรุณากรอกเลขบัญชี 10–13 หลัก';
  else if(state.externalBanks.some(bank=>bank.accountNo===accountNo&&bank.bankCode===bankCode)) error='มีบัญชีธนาคารนี้อยู่แล้ว';
  $('#externalBankError').textContent=error; if(error) return;
  state.externalBanks.push({id:`bank-${Date.now()}`,bankCode,accountNo,nickname:nickname.slice(0,30)});
  event.target.reset(); closeSheets(); saveState(`เพิ่ม “${nickname}” แล้ว`);
}

function deleteExternalBank(id) {
  const bank=externalBankById(id); if(!bank) return; const profile=bankProfile(bank.bankCode);
  if(!confirm(`ลบ “${bank.nickname||profile.name}” หรือไม่?`)) return;
  state.externalBanks=state.externalBanks.filter(item=>item.id!==id); saveState(`ลบ “${bank.nickname||profile.name}” แล้ว`);
}

function moveAccount(id,direction) {
  const index=state.accounts.findIndex(account=>account.id===id); const next=index+Number(direction); if(index<0||next<0||next>=state.accounts.length)return;
  [state.accounts[index],state.accounts[next]]=[state.accounts[next],state.accounts[index]]; selectedAccountId=state.accounts.find(account=>account.id===selectedAccountId)?.id||state.accounts[0]?.id; saveState('จัดลำดับ Pocket แล้ว');
}

function openCardEditor() {
  $('#debitTitleInput').value=state.debitCard.title; $('#debitHolderInput').value=state.debitCard.holder; $('#debitNumberInput').value=String(state.debitCard.number).replace(/(\d{4})(?=\d)/g,'$1 '); $('#debitColor').value=state.debitCard.color; updateColorValue('debit'); $('#cardEditError').textContent=''; showSheet('#cardEditSheet');
}

function handleCardEdit(event) {
  event.preventDefault(); const title=$('#debitTitleInput').value.trim(); const holder=$('#debitHolderInput').value.trim(); const number=$('#debitNumberInput').value.replace(/\D/g,'').slice(0,16); let error='';
  if(!title||!holder)error='กรุณากรอกชื่อบัตรและชื่อบนบัตร'; else if(number.length!==16)error='เลขบัตรต้องมี 16 หลัก'; $('#cardEditError').textContent=error; if(error)return;
  state.debitCard={title,holder,number,color:$('#debitColor').value}; closeSheets(); saveState('บันทึกข้อมูลบัตรแล้ว');
}

function deleteGoal(id) {
  const goal=goalById(id); if(!goal) return;
  const refund=goal.balance>0?` เงิน ${formatAmount(goal.balance,'THB',true)} จะคืนเข้า Pocket Save`:'';
  if(!confirm(`ลบกล่อง “${goal.name}” หรือไม่?${refund}`)) return;
  const thb=state.accounts.find(account=>account.currency==='THB');
  if(goal.balance>0 && thb){thb.balance=Number((thb.balance+goal.balance).toFixed(2));state.transactions.push({id:crypto.randomUUID(),type:'income',account:thb.id,amount:goal.balance,currency:'THB',note:`คืนเงินจากกล่อง ${goal.name}`,date:new Date().toISOString()});}
  state.goals=state.goals.filter(item=>item.id!==id); saveState(`ลบกล่อง “${goal.name}” แล้ว`);
}

function updateColorValue(type) {
  const input=$(`#${type}Color`); const label=$(`#${type}ColorValue`); if(input&&label) label.textContent=input.value.toUpperCase();
}

function updateAccountCurrencyLabel(){ $('#accountCurrencyLabel').textContent=$('#accountCurrency').value; }

function handleSetting(key) { state.settings[key]=!state.settings[key]; saveState(); }

function notify(message) { const toast=$('#toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2400); }

document.addEventListener('click', event => {
  if(event.target.closest('[data-close-deposit-popup]')){hideDepositPopup();return;}
  const transferPickerOptionButton=event.target.closest('[data-transfer-picker-option]'); if(transferPickerOptionButton){chooseTransferPicker(transferPickerOptionButton.dataset.transferPickerOption);return;}
  const transferPickerButton=event.target.closest('[data-transfer-picker]'); if(transferPickerButton){openTransferPicker(transferPickerButton.dataset.transferPicker);return;}
  if(event.target.closest('[data-close-transfer-picker]')){closeTransferPicker();return;}
  const goalColorButton=event.target.closest('[data-goal-color]'); if(goalColorButton){$('#goalColor').value=goalColorButton.dataset.goalColor;updateColorValue('goal');return;}
  const accountColorButton=event.target.closest('[data-account-color]'); if(accountColorButton){$('#accountColor').value=accountColorButton.dataset.accountColor;updateColorValue('account');return;}
  const debitColorButton=event.target.closest('[data-debit-color]'); if(debitColorButton){$('#debitColor').value=debitColorButton.dataset.debitColor;updateColorValue('debit');return;}
  const deleteGoalButton=event.target.closest('[data-delete-goal]'); if(deleteGoalButton){deleteGoal(deleteGoalButton.dataset.deleteGoal);return;}
  const deleteExternalBankButton=event.target.closest('[data-delete-external-bank]'); if(deleteExternalBankButton){deleteExternalBank(deleteExternalBankButton.dataset.deleteExternalBank);return;}
  const deleteScheduleButton=event.target.closest('[data-delete-schedule]'); if(deleteScheduleButton){deleteSchedule(deleteScheduleButton.dataset.deleteSchedule);return;}
  const bankTab=event.target.closest('[data-bank-tab]')?.dataset.bankTab; if(bankTab){switchBankTab(bankTab);return;}
  const bankOption=event.target.closest('[data-select-bank]'); if(bankOption){closeBankPicker();notify('เลือกธนาคารไทยพาณิชย์แล้ว');return;}
  if(event.target.closest('[data-close-bank]')){closeBankPicker();return;}
  const moveButton=event.target.closest('[data-move-account]'); if(moveButton){moveAccount(moveButton.dataset.moveAccount,moveButton.dataset.direction);return;}
  const account=event.target.closest('[data-account]')?.dataset.account; if(account) openDetail(account);
  const accountTab=event.target.closest('[data-account-tab]')?.dataset.accountTab; if(accountTab) selectDetailAccount(accountTab,true);
  const goal=event.target.closest('[data-goal-open]')?.dataset.goalOpen; if(goal) openTransfer('thb',`goal:${goal}`);
  const nav=event.target.closest('[data-nav]')?.dataset.nav; if(nav) navigate(nav);
  const filter=event.target.closest('[data-filter]')?.dataset.filter; if(filter){transactionFilter=filter;$$('[data-filter]').forEach(button=>button.classList.toggle('active',button.dataset.filter===filter));renderTransactions();updateBalanceVisibility();}
  const entry=event.target.closest('[data-entry-type]')?.dataset.entryType; if(entry){entryType=entry;updateEntryType();}
  const setting=event.target.closest('[data-setting]')?.dataset.setting; if(setting) handleSetting(setting);
  if(event.target.closest('[data-close]')) closeSheets();
  const actionButton=event.target.closest('[data-action]'); const action=actionButton?.dataset.action; const source=actionButton?.dataset.accountSource||(activeView==='accountDetail'?selectedAccountId:'thb');
  if(action==='transfer') openTransfer(source||'thb');
  if(action==='exchange') openTransfer('thb','account:usd');
  if(action==='exchange-in') openTransfer('thb',`account:${source}`);
  if(action==='exchange-out') openTransfer(source,'account:thb');
  if(action==='income'||action==='expense') openEntry(action,source||'thb');
  if(action==='add-goal') showSheet('#goalSheet');
  if(action==='add-account') showSheet('#accountSheet');
  if(action==='add-external-bank') showSheet('#externalBankSheet');
  if(action==='add-schedule') openScheduleEditor();
  if(action==='enable-system-notifications') requestSystemNotifications();
  if(action==='choose-bank') showSheet('#bankPickerSheet');
  if(action==='toggle-reorder'){reorderMode=!reorderMode;renderAccounts();updateBalanceVisibility();}
  if(action==='open-card') openDebitCard();
  if(action==='edit-card') openCardEditor();
  if(action==='scan') notify('โหมดสแกนเป็นตัวอย่าง ยังไม่เชื่อมธนาคาร');
});

$('#detailBack').addEventListener('click',()=>navigate('home'));
$('#cardBack').addEventListener('click',()=>navigate('home'));
$('#accountCarousel').addEventListener('scroll',()=>{
  clearTimeout(carouselScrollTimer);
  carouselScrollTimer=setTimeout(()=>{
    const carousel=$('#accountCarousel'); const center=carousel.scrollLeft+carousel.clientWidth/2;
    const cards=$$('[data-carousel-account]',carousel); if(!cards.length) return;
    const nearest=cards.reduce((best,card)=>Math.abs(card.offsetLeft+card.offsetWidth/2-center)<Math.abs(best.offsetLeft+best.offsetWidth/2-center)?card:best,cards[0]);
    const id=nearest.dataset.carouselAccount; if(id&&id!==selectedAccountId) selectDetailAccount(id,false);
  },80);
});
$('#transferFrom').addEventListener('change',()=>{ensureDifferentDestination();updateTransferPreview();});
$('#transferTo').addEventListener('change',()=>{ensureDifferentDestination();updateTransferPreview();});
$('#transferAmount').addEventListener('input',updateTransferPreview);
$('#swapRoute').addEventListener('click',()=>{const destination=destinationInfo();if(destination.type!=='account'){notify('กล่องเป้าหมายใช้เป็นต้นทางไม่ได้');return;}const old=$('#transferFrom').value;$('#transferFrom').value=destination.id;$('#transferTo').value=`account:${old}`;updateTransferPreview();});
$('#confirmTransfer').addEventListener('click',confirmTransfer);
$('#bankTransferFrom').addEventListener('change',updateBankTransferSource);
$('#bankTransferDestination').addEventListener('change',updateBankTransferDestination);
$('#bankAccountNumber').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,13);validateBankTransfer();});
$('#bankTransferAmount').addEventListener('input',updateBankTransferDestination);
$('#bankTransferForm').addEventListener('submit',handleBankTransfer);
$('#entryAccount').addEventListener('change',updateEntryCurrency);
$('#entryForm').addEventListener('submit',handleEntrySubmit);
$('#goalForm').addEventListener('submit',handleGoalSubmit);
$('#accountForm').addEventListener('submit',handleAccountSubmit);
$('#externalBankForm').addEventListener('submit',handleExternalBankSubmit);
$('#externalBankAccountNumber').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,13);});
$('#goalColor').addEventListener('input',()=>updateColorValue('goal'));
$('#accountColor').addEventListener('input',()=>updateColorValue('account'));
$('#accountCurrency').addEventListener('change',updateAccountCurrencyLabel);
$('#debitColor').addEventListener('input',()=>updateColorValue('debit'));
$('#debitNumberInput').addEventListener('input',event=>{const digits=event.target.value.replace(/\D/g,'').slice(0,16);event.target.value=digits.replace(/(\d{4})(?=\d)/g,'$1 ');});
$('#cardEditForm').addEventListener('submit',handleCardEdit);
$('#scheduleDestination').addEventListener('change',updateScheduleDestination);
$('#scheduleForm').addEventListener('submit',handleScheduleSubmit);
$('#editName').addEventListener('click',()=>{const name=prompt('ชื่อที่ต้องการแสดง',state.profileName);if(name?.trim()){state.profileName=name.trim().slice(0,30);saveState('แก้ชื่อแล้ว');}});
$('#resetData').addEventListener('click',()=>{if(confirm('เริ่มข้อมูลตัวอย่างใหม่ทั้งหมดหรือไม่?')){state=clone(seedState);localStorage.removeItem(STORAGE_KEY);renderAll();notify('เริ่มข้อมูลใหม่แล้ว');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if($('#transferPickerSheet')?.classList.contains('open'))closeTransferPicker();else closeSheets();}});
function stopViewportZoom(event) {
  if (event.touches?.length > 1 || (typeof event.scale === 'number' && event.scale !== 1)) event.preventDefault();
}

['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,event=>event.preventDefault(),{passive:false}));
document.addEventListener('touchstart',stopViewportZoom,{passive:false});
document.addEventListener('touchmove',stopViewportZoom,{passive:false});
document.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
let lastTouchEnd=0;
let lastTouchTarget=null;
document.addEventListener('touchend',event=>{const now=Date.now();const target=event.target.closest?.('button,a,[role="button"]')||event.target;if(now-lastTouchEnd<320&&target===lastTouchTarget)event.preventDefault();lastTouchEnd=now;lastTouchTarget=target;},{passive:false});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
bindHomeAccountDeck();
renderAll();
processScheduledDeposits();
setInterval(processScheduledDeposits,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)processScheduledDeposits();});
window.addEventListener('focus',processScheduledDeposits);
