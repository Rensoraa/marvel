const STORAGE_KEY = 'chronoTrackerData';
const XP_PER_UNIT = 200; // 2,000 XP -> 100 tokens, 1,000 tokens -> 100 units => 200 XP per unit

const RING_RADIUS = 104;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

const els = {
  // modal / setup
  overlay: document.getElementById('modalOverlay'),
  form: document.getElementById('setupForm'),
  targetUnits: document.getElementById('targetUnits'),
  avgGameTime: document.getElementById('avgGameTime'),
  xpPerGame: document.getElementById('xpPerGame'),
  errUnits: document.getElementById('errUnits'),
  errTime: document.getElementById('errTime'),
  errXp: document.getElementById('errXp'),
  cancelSetup: document.getElementById('cancelSetup'),
  modalTag: document.getElementById('modalTag'),
  modalTitle: document.getElementById('modalTitle'),
  modalLead: document.getElementById('modalLead'),
  submitSetup: document.getElementById('submitSetup'),

  // header
  settingsBtn: document.getElementById('settingsBtn'),

  // ring
  ringProgress: document.getElementById('ringProgress'),
  pctValue: document.getElementById('pctValue'),
  unitsReadout: document.getElementById('unitsReadout'),

  // stats
  statGamesLogged: document.getElementById('statGamesLogged'),
  statGamesToGo: document.getElementById('statGamesToGo'),
  statTimeRemaining: document.getElementById('statTimeRemaining'),
  statXp: document.getElementById('statXp'),
  statTokens: document.getElementById('statTokens'),
  statXpPerGame: document.getElementById('statXpPerGame'),

  // log section
  logGameBtn: document.getElementById('logGameBtn'),
  customToggle: document.getElementById('customToggle'),
  customRow: document.getElementById('customRow'),
  customXpInput: document.getElementById('customXpInput'),
  customSubmit: document.getElementById('customSubmit'),
  undoBtn: document.getElementById('undoBtn'),
  historyNote: document.getElementById('historyNote'),
};

els.ringProgress.style.strokeDasharray = RING_CIRC;
els.ringProgress.style.strokeDashoffset = RING_CIRC;

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

function fmt(n){
  return Math.round(n).toLocaleString('en-US');
}
function fmt1(n){
  return (Math.round(n * 10) / 10).toLocaleString('en-US');
}

function render(){
  if(!data) return;

  const { targetUnits, avgGameTime, xpPerGame, history } = data;

  const totalXpNeeded = targetUnits * XP_PER_UNIT;
  const currentXp = history.reduce((a, b) => a + b, 0);

  const gamesNeeded = Math.ceil(totalXpNeeded / xpPerGame);
  const gamesPlayed = history.length;
  const gamesLeft = Math.max(0, gamesNeeded - gamesPlayed);

  const timeLeftMin = gamesLeft * avgGameTime;
  const unitsEarned = currentXp / XP_PER_UNIT;
  const tokensEarned = Math.floor(currentXp / 20);

  const pct = totalXpNeeded > 0 ? Math.min(1, currentXp / totalXpNeeded) : 0;

  // ring
  els.ringProgress.style.strokeDashoffset = RING_CIRC * (1 - pct);
  els.pctValue.textContent = Math.round(pct * 100) + '%';
  els.unitsReadout.textContent = fmt1(unitsEarned) + ' / ' + fmt(targetUnits) + ' units';

  // stats
  els.statGamesLogged.textContent = fmt(gamesPlayed);
  els.statGamesToGo.textContent = fmt(gamesLeft);

  if(timeLeftMin >= 60){
    els.statTimeRemaining.textContent = fmt1(timeLeftMin / 60) + ' hrs';
  } else {
    els.statTimeRemaining.textContent = fmt(timeLeftMin) + ' min';
  }

  els.statXp.textContent = fmt(currentXp) + ' / ' + fmt(totalXpNeeded);
  els.statTokens.textContent = fmt(tokensEarned);
  els.statXpPerGame.textContent = fmt(xpPerGame);

  // history note
  if(gamesPlayed === 0){
    els.historyNote.textContent = 'No games logged yet.';
  } else {
    const last = history[history.length - 1];
    els.historyNote.textContent =
      gamesPlayed + ' game' + (gamesPlayed === 1 ? '' : 's') +
      ' logged \u2014 last: +' + fmt(last) + ' XP';
  }

  els.undoBtn.disabled = gamesPlayed === 0;
}

function openModal(isFirstRun){
  if(isFirstRun){
    els.modalTag.textContent = 'First time here?';
    els.modalTitle.textContent = "Hey — let's set up your run";
    els.modalLead.textContent =
      "Give us your target units and your average grind, and we'll work out how many games you've got left.";
    els.cancelSetup.classList.add('hidden');
    els.submitSetup.textContent = 'Calculate my run';
    els.targetUnits.value = '';
    els.avgGameTime.value = '';
    els.xpPerGame.value = '';
  } else {
    els.modalTag.textContent = 'Edit run';
    els.modalTitle.textContent = 'Update your numbers';
    els.modalLead.textContent =
      'Adjust your target or your averages \u2014 your logged games stay put.';
    els.cancelSetup.classList.remove('hidden');
    els.submitSetup.textContent = 'Save changes';
    if(data){
      els.targetUnits.value = data.targetUnits;
      els.avgGameTime.value = data.avgGameTime;
      els.xpPerGame.value = data.xpPerGame;
    }
  }
  els.overlay.classList.remove('hidden');
}

function closeModal(){
  els.overlay.classList.add('hidden');
}

function validateField(input, errEl){
  const val = parseFloat(input.value);
  const ok = !isNaN(val) && val > 0;
  errEl.style.display = ok ? 'none' : 'block';
  return ok;
}

els.form.addEventListener('submit', function(e){
  e.preventDefault();

  const okUnits = validateField(els.targetUnits, els.errUnits);
  const okTime = validateField(els.avgGameTime, els.errTime);
  const okXp = validateField(els.xpPerGame, els.errXp);
  if(!okUnits || !okTime || !okXp) return;

  const targetUnits = parseFloat(els.targetUnits.value);
  const avgGameTime = parseFloat(els.avgGameTime.value);
  const xpPerGame = parseFloat(els.xpPerGame.value);

  if(!data){
    data = { targetUnits, avgGameTime, xpPerGame, history: [] };
  } else {
    data.targetUnits = targetUnits;
    data.avgGameTime = avgGameTime;
    data.xpPerGame = xpPerGame;
  }

  saveData(data);
  closeModal();
  render();
});

els.cancelSetup.addEventListener('click', closeModal);

els.settingsBtn.addEventListener('click', function(){
  openModal(!data);
});

els.logGameBtn.addEventListener('click', function(){
  if(!data) return;
  data.history.push(data.xpPerGame);
  saveData(data);
  render();
});

els.customToggle.addEventListener('click', function(){
  els.customRow.classList.toggle('hidden');
  if(!els.customRow.classList.contains('hidden')){
    els.customXpInput.focus();
  }
});

els.customSubmit.addEventListener('click', function(){
  if(!data) return;
  const val = parseFloat(els.customXpInput.value);
  if(isNaN(val) || val < 0) return;
  data.history.push(val);
  saveData(data);
  els.customXpInput.value = '';
  els.customRow.classList.add('hidden');
  render();
});

els.customXpInput.addEventListener('keydown', function(e){
  if(e.key === 'Enter') els.customSubmit.click();
});

els.undoBtn.addEventListener('click', function(){
  if(!data || data.history.length === 0) return;
  data.history.pop();
  saveData(data);
  render();
});

// init
if(!data){
  openModal(true);
} else {
  render();
}

console.log('Unit Clock loaded');
console.log(` /$$   /$$ /$$   /$$ /$$$$$$ /$$$$$$$$ /$$$$$$ 
| $$  | $$| $$$ | $$|_  $$_/|__  $$__//$$__  $$
| $$  | $$| $$$$| $$  | $$     | $$  | $$  \__/
| $$  | $$| $$ $$ $$  | $$     | $$  |  $$$$$$ 
| $$  | $$| $$  $$$$  | $$     | $$   \____  $$
| $$  | $$| $$\  $$$  | $$     | $$   /$$  \ $$
|  $$$$$$/| $$ \  $$ /$$$$$$   | $$  |  $$$$$$/
 \______/ |__/  \__/|______/   |__/   \______/ 
                                               
                                               
                                               `);
console.error('Just kidding, this is a fake error to get your attention :)');
console.warn('This website is made by Claude.ai because i was to lazy to make it myself.\nSonnet 4.6 Slow is the model used for this project');