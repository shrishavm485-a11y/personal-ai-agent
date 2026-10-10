const $ = (id) => document.getElementById(id);
const log = $('log'), input = $('input'), sendBtn = $('send');
const STORE = 'agent.chat.v1', COLOR = 'agent.color.v1';
let history = JSON.parse(localStorage.getItem(STORE) || '[]');
let mode = 'chat', busy = false;

const ACTIONS = [
  { t: 'Explain a Topic', s: 'Study', mode: 'study', p: 'Explain this topic simply with an example: ' },
  { t: 'Help Me Code', s: 'Code', mode: 'code', p: 'Help me with this code problem: ' },
  { t: 'Plan My Day', s: 'Productivity', mode: 'plan', p: 'Plan my day. Here are my tasks and the time I have: ' },
  { t: 'Generate a Prompt', s: 'Prompts', mode: 'prompt', p: 'Write a detailed prompt for: ' },
  { t: 'Quiz Me', s: 'Study', mode: 'study', p: 'Create a 5-question quiz with answers on: ' }
];
const GREETINGS = ['Sunday reset. What are we building?', 'Monday. Pick one big thing.', 'Tuesday. Keep the momentum.', 'Midweek. Ask me anything.', 'Thursday. Almost there.', 'Friday. Finish strong.', 'Saturday. Time to experiment.'];
$('greet').textContent = GREETINGS[new Date().getDay()];

ACTIONS.forEach((a) => {
  const b = document.createElement('button');
  b.className = 'card';
  b.innerHTML = `${a.t}<small>${a.s}</small>`;
  b.onclick = () => { mode = a.mode; input.value = a.p; input.focus(); };
  $('actions').appendChild(b);
});

function setColor(c) { document.documentElement.style.setProperty('--accent', c); localStorage.setItem(COLOR, c); }
document.querySelectorAll('.swatches button').forEach((b) => (b.onclick = () => setColor(b.dataset.color)));
if (localStorage.getItem(COLOR)) setColor(localStorage.getItem(COLOR));

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function render(text) {
  return text.split('```').map((part, i) => {
    if (i % 2) return `<pre><code>${esc(part.replace(/^\w*\n/, ''))}</code></pre>`;
    return `<p>${esc(part).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`;
  }).join('');
}

function addMsg(role, text, cls = '') {
  const d = document.createElement('div');
  d.className = `msg ${role} ${cls}`;
  d.innerHTML = role === 'ai' ? render(text) : `<p>${esc(text)}</p>`;
  if (role === 'ai' && !cls) {
    const c = document.createElement('button');
    c.className = 'btn small copy'; c.textContent = 'Copy';
    c.onclick = async () => { try { await navigator.clipboard.writeText(text); c.textContent = 'Copied!'; } catch { c.textContent = 'Copy failed'; } setTimeout(() => (c.textContent = 'Copy'), 1500); };
    d.appendChild(c);
  }
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  return d;
}

function save() { localStorage.setItem(STORE, JSON.stringify(history.slice(-40))); }
function load() {
  log.innerHTML = '';
  if (!history.length) return addMsg('ai', "Hi! I'm your personal AI. I can explain topics, debug code, plan your day, or write prompts. Pick a card above or just ask.", 'welcome');
  history.forEach((m) => addMsg(m.role === 'user' ? 'user' : 'ai', m.content));
}

async function send() {
  const text = input.value.trim();
  if (!text || busy) return;
  busy = true; sendBtn.disabled = true; input.value = '';
  log.querySelector('.welcome')?.remove();
  addMsg('user', text);
  history.push({ role: 'user', content: text }); save();
  const loader = addMsg('ai', '', 'loading'); loader.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, messages: history.slice(-20).map(({ role, content }) => ({ role, content })) })
    });
    const data = await res.json().catch(() => ({}));
    loader.remove();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    addMsg('ai', data.reply);
    history.push({ role: 'assistant', content: data.reply }); save();
  } catch (e) {
    loader.remove();
    history.pop(); save();
    addMsg('ai', e.message === 'Failed to fetch' ? 'Cannot reach the server. Check your connection and try again.' : e.message, 'err');
  }
  busy = false; sendBtn.disabled = false; input.focus();
}

sendBtn.onclick = send;
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
$('clear').onclick = () => { history = []; save(); mode = 'chat'; load(); };

fetch('/api/health').then((r) => r.json()).then((d) => {
  $('status').className = 'status ' + (d.configured ? 'on' : 'off');
  $('statusText').textContent = d.configured ? 'Connected' : 'No API key';
  if (!d.configured) addMsg('ai', 'Setup needed: add AI_API_KEY to your environment variables, then restart. See the README.', 'err');
}).catch(() => { $('status').className = 'status off'; $('statusText').textContent = 'Offline'; });

load();
