const $=id=>document.getElementById(id);
let socket,state;
let waitingForDiceResult = false;
let previousDicePosition = 0;

const icons = {
  earn: '\u{1FA99}',
  shop: '\u{1F6CD}\uFE0F',
  save: '\u{1F437}',
  surprise: '\u{1F381}',
  expense: '\u{1F9FE}',
  decision: '\u2696\uFE0F'
};function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function message(type,extra={}){if(socket?.readyState===1)socket.send(JSON.stringify({type,...extra}))}function connect(type){const name=$('name').value.trim();if(!name)return showError('Enter your first name.');const code=$('code').value.trim().toUpperCase();if(type==='join'&&!code)return showError('Enter the room code.');const proto=location.protocol==='https:'?'wss:':'ws:';socket=new WebSocket(proto+'//'+location.host);socket.onopen=()=>message(type,{name,code,token:type==='join'?localStorage.getItem('moneyville-token-'+code):null});socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='error')return showError(m.message);if(m.type==='state'){state=m;if(m.rejoinToken){localStorage.setItem('moneyville-token-'+m.code,m.rejoinToken);localStorage.setItem('moneyville-room',m.code);localStorage.setItem('moneyville-name',m.players.find(p=>p.id===m.you)?.name||name)}render()}};socket.onclose=()=>showError('Disconnected from the server. Reconnect using the same name and room code.')}function showError(s){$('error').textContent=s}function render(){showError('');$('entry').hidden=true;$('game').hidden=false;$('roomcode').textContent=state.code;$('status').textContent=state.status==='lobby'?'Waiting for players (2-5).':state.status==='playing'?`Round ${state.round} - Game in progress`:'Game complete!';$('start').hidden=!(state.status==='lobby'&&state.you===state.host);$('start').disabled=state.players.length<2;const p=state.players[state.turn];$('turn').innerHTML=state.status==='lobby'?'<b>Waiting to start</b>':state.status==='finished'?`<b>${'\u{1F3C6}'} Adventure complete!</b>`:`<b>Current player: ${esc(p.name)}</b><p>${p.position===40?'Bicycle Shop Savings Challenge':`Space ${p.position} - $${p.balance} saved`}</p>`;const cells=[{position:0,category:'start'},...state.pathTypes.map((category,i)=>({position:i+1,category}))];$('board').innerHTML=cells.map(c=>{let people=state.players.filter(p=>p.position===c.position);return `<div class="space ${c.category==='start'?'startspace':c.category}" title="${esc(state.labels[c.category]||'START')}"><strong>${c.position||'START'}</strong><span class="symbol">${icons[c.category]||'\u{1F6A9}'}</span><span class="tokens">${people.map(p=>`<span class="token" title="${esc(p.name)}" style="background:${p.color}"></span>`).join('')}</span></div>`}).join('');$('players').innerHTML=state.players.map(x=>`<div class="person ${p?.id===x.id&&state.status==='playing'?'active':''}"><span class="token" style="background:${x.color}"></span><strong>${esc(x.name)}${x.id===state.you?' (you)':''}</strong><span>${'\u{1F4B0}'} $${x.balance}</span><small>${x.finished?'\u{1F6B2} Bought bicycle':x.position===40?'At shop':`Space ${x.position}`}${!x.connected?' - offline':''}</small></div>`).join('');$('log').innerHTML=[...state.log].reverse().map(x=>`<p>${esc(x)}</p>`).join('');let yourTurn=state.status==='playing'&&p.id===state.you;let pending=state.pending;$('roll').hidden=!(yourTurn&&!pending);$('roll').textContent = p.position === 40
  ? '\u{1F4BC} Draw Earn Money Card'
  : '\u{1F3B2} Roll 1-3';if(state.status==='finished'){$('card').innerHTML=`<p class="winner">${'\u{1F3C6}'} Winner: ${state.players.filter(p=>state.winners.includes(p.id)).map(p=>esc(p.name)).join(', ')}</p><p>Players who reached $100 completed their bicycle purchase!</p>`}else if(pending){let canChoose=yourTurn&&pending.player===state.you;let buttons=(pending.choices||[]).map(c=>{let blocked=(c==='buy'||c==='invest')&&p.balance<pending.price;return `<button class="choice" data-choice="${c}" ${!canChoose||blocked?'disabled':''}>${c==='buy'?`Buy ($${pending.price})`:c==='save'?'Save money':c==='invest'?`Invest ($${pending.price})`:'Skip investment'}</button>`}).join('');const amount=pending.amount||0;const summary=pending.result?`<div class="event-result"><strong class="${amount<0?'loss':'gain'}">${amount>0?'+':''}$${amount}</strong><p>Savings: $${pending.before} -> $${pending.after}</p></div>`:'';const continueButton=pending.result?`<button id="continue-card" ${canChoose?'':'disabled'}>${canChoose?'Continue to next turn':'Waiting for the current player'}</button>`:'';$('card').innerHTML=`<div class="card ${pending.category}"><strong>${esc(state.labels[pending.category])}</strong><h3>${esc(pending.title)}</h3><p>${esc(pending.description)}</p>${summary}${buttons}${continueButton}</div>${!canChoose?'<p class="muted">Waiting for the current player.</p>':''}`;$('card').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>message('choose',{choice:b.dataset.choice}));const btn=$('continue-card');if(btn&&canChoose)btn.onclick=()=>message('continue');}else{$('card').innerHTML=state.status==='lobby'?'<p>Invite players using your room code, then start!</p>':yourTurn?'<p>Your turn! Roll the die or draw a job card at the Bicycle Shop.</p>':'<p>Wait for your turn.</p>'}renderPopup(pending,p);}
function renderPopup(pending,p){let overlay=$('event-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='event-overlay';document.body.appendChild(overlay)}if(!pending||state.status!=='playing'){overlay.hidden=true;overlay.innerHTML='';return}overlay.hidden=false;const canChoose=pending.player===state.you&&state.turn>=0&&state.players[state.turn]?.id===state.you;const amount=pending.amount||0;const summary=pending.result?`<div class="event-result"><strong class="${amount<0?'loss':'gain'}">${amount>0?'+':''}$${amount}</strong><p>Before: $${pending.before} - After: $${pending.after}</p></div>`:'';const buttons=(pending.choices||[]).map(c=>{const blocked=(c==='buy'||c==='invest')&&p.balance<pending.price;return `<button data-popup-choice="${c}" ${!canChoose||blocked?'disabled':''}>${c==='buy'?`Buy for $${pending.price}`:c==='save'?'Save my money':c==='invest'?`Invest $${pending.price}`:'Skip investment'}</button>`}).join('');overlay.innerHTML=`<div class="event-modal card ${pending.category}" role="dialog" aria-modal="true" aria-label="Event card"><div class="event-icon">${icons[pending.category]||'ðŸŽ'}</div><strong>${esc(state.labels[pending.category])}</strong><h2>${esc(pending.title)}</h2><p>${esc(pending.description)}</p>${summary}<div class="event-actions">${buttons}${pending.result?`<button id="popup-continue" ${canChoose?'':'disabled'}>${canChoose?'Continue':'Waiting for current player'}</button>`:''}</div>${!canChoose?'<p class="muted">Waiting for the current player to finish this card.</p>':''}</div>`;overlay.querySelectorAll('[data-popup-choice]').forEach(b=>b.onclick=()=>message('choose',{choice:b.dataset.popupChoice}));const next=$('popup-continue');if(next&&canChoose)next.onclick=()=>message('continue');}
let diceAnimationActive = false;
let diceAnimationTimer = null;
let diceFinalTimer = null;
let diceOverlay = null;

function showDiceAnimation(result, onComplete) {
  if (diceAnimationTimer) clearInterval(diceAnimationTimer);
  if (diceFinalTimer) clearTimeout(diceFinalTimer);

  diceAnimationActive = true;

  if (!diceOverlay) {
    diceOverlay = document.createElement('div');
    diceOverlay.id = 'dice-overlay';
    document.body.appendChild(diceOverlay);
  }

  diceOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 35, 65, 0.65);
  `;

  diceOverlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 24px;
      padding: 35px 55px;
      text-align: center;
      box-shadow: 0 15px 50px rgba(0,0,0,.25);
      font-family: inherit;
      color: #245781;
    ">
      <h2>🎲 Rolling the Dice!</h2>
      <div id="animated-die" style="
        font-size: 100px;
        line-height: 1.3;
      ">⚀</div>
      <p id="dice-message">Let's see how far you go!</p>
    </div>
  `;

  const faces = ['⚀', '⚁', '⚂'];
  const die = document.getElementById('animated-die');

  diceAnimationTimer = setInterval(() => {
    die.textContent = faces[Math.floor(Math.random() * 3)];
  }, 100);

  diceFinalTimer = setTimeout(() => {
    clearInterval(diceAnimationTimer);
    diceAnimationTimer = null;

    die.textContent = faces[result - 1];
    document.getElementById('dice-message').textContent =
      `You rolled ${result}!`;

    diceFinalTimer = setTimeout(() => {
      diceOverlay.style.display = 'none';
      diceAnimationActive = false;
      if (onComplete) onComplete();
    }, 700);
  }, 1000);
}
$('create').onclick=()=>connect('create');$('join').onclick=()=>connect('join');$('start').onclick=()=>message('start');$('roll').onclick=()=>{
  if(diceAnimationActive)return;
  message('roll');
};
$('copy').onclick=()=>navigator.clipboard?.writeText(state.code).then(()=>{$('copy').textContent='Copied!'});

// Pre-fill previous room for easy reconnection after a tab closes.
$("code").value=localStorage.getItem("moneyville-room")||"";$("name").value=localStorage.getItem("moneyville-name")||"";
