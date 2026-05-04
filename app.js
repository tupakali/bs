/* =======================================
   BS Ranked Assistant — app.js
   Claude API + Web Speech (голосовой чат)
   ======================================= */

const BRAWLIFY_IMG = name =>
  `https://cdn-old.brawlify.com/brawler/${name.replace(/ /g, '-')}.png`;

const MODES_DATA = {
  gem: {
    name: '💎 Gem Grab',
    maps: ['Hard Rock Mine', 'Minecart Madness', 'Gem Fort', 'Double Swoosh'],
    bans: ['Gene', 'Max', 'Sandy', 'Tara', 'Gus'],
    picks: ['Gene', 'Max', 'Pam', 'Gus', 'Byron', 'Sandy', 'Tara'],
    tip: '💡 Нужен саппорт + контроллер + дамагер. Gene и Max — почти всегда первый пик. Не носи 10 самоцветов в одиночку!'
  },
  ball: {
    name: '⚽ Brawl Ball',
    maps: ['Penalty Kick', 'Triple Dribble', 'Pinhole Punt', 'Backyard Bowl'],
    bans: ['Frank', 'Bibi', 'Bull', 'Buzz', 'Rosa'],
    picks: ['Bull', 'El Primo', 'Frank', 'Bibi', 'Rosa', 'Mortis', 'Buzz'],
    tip: '💡 Танки и мобильные бравлеры. Один забивает, один защищает, один давит врагов.'
  },
  hotzone: {
    name: '🔥 Hot Zone',
    maps: ['Ring of Fire', 'Open Space', 'Parallel Plays', 'Dueling Beetles'],
    bans: ['Pam', 'Byron', 'Max', 'Belle', 'Lumi'],
    picks: ['Pam', 'Byron', 'Max', 'Belle', 'Janet', 'Angelo', 'Bonnie'],
    tip: '💡 Зональные бравлеры + хилеры. Держи зону — убийства не главное!'
  },
  knockout: {
    name: '💀 Knockout',
    maps: ['New Horizons', 'Out in the Open', 'Flaring Phoenix', 'Goldarm Gulch'],
    bans: ['Angelo', 'Kenji', 'Piper', 'Belle', 'Melodie'],
    picks: ['Brock', 'Piper', 'Belle', 'Maisie', 'Angelo', 'Kenji', 'Melodie'],
    tip: '💡 Снайперы и контроллеры. Играй от позиции, не лезь в лоб. Один промах = смерть!'
  },
  bounty: {
    name: '⭐ Bounty',
    maps: ['Hideout', 'Layer Cake', 'Dry Season', 'Shooting Star'],
    bans: ['Angelo', 'Hank', 'Belle', 'Piper', 'Kenji'],
    picks: ['Piper', 'Belle', 'Brock', 'Angelo', 'Hank', 'Janet', 'Kenji'],
    tip: '💡 Снайперы на открытых картах, гибриды на закрытых. Звёзды важнее убийств — не умирай!'
  },
  hockey: {
    name: '🏒 Brawl Hockey',
    maps: ['Starr Garden', 'Center Stage'],
    bans: ['Bull', 'Frank', 'Buzz', 'Rosa', 'El Primo'],
    picks: ['Bull', 'Rosa', 'Bibi', 'Frank', 'Buzz', 'El Primo'],
    tip: '💡 Максимально агрессивные танки. Скорость и давление решают всё!'
  }
};

const TIER_DATA = {
  splus: ['Najia', 'Bull', 'Bibi', 'Mortis', 'Angelo', 'Crow'],
  s:     ['Max', 'Byron', 'Melodie', 'Damian', 'Colt', 'Gene', 'Pam'],
  a:     ['Sandy', 'Tara', 'Gus', 'Frank', 'Buzz', 'El Primo', 'Belle', 'Piper', 'Brock', 'Hank', 'Janet', 'Kenji', 'Spike', 'Leon', 'Lumi'],
  b:     ['Poco', 'Nita', 'Bo', 'Rico', 'Colette', 'Chester', 'Gray', 'Emz', 'Griff', 'Rosa', 'Jacky']
};

const SYSTEM_PROMPT = `Ты топовый эксперт по Brawl Stars Ranked Mode (май 2026). Отвечай только на русском. Говори коротко, как живой тренер — без списков со звёздочками и маркдауна, просто текст. Используй английские имена бравлеров.

Актуальная мета май 2026:
S+ тир: Najia, Bull, Bibi, Mortis, Angelo, Crow
S тир: Max, Byron, Melodie, Damian, Colt, Gene, Pam
A тир: Sandy, Tara, Gus, Frank, Buzz, El Primo, Belle, Piper, Brock, Hank, Janet, Kenji, Spike, Leon, Lumi
B тир: Poco, Nita, Bo, Rico, Colette, Chester, Gray, Emz

Каунтеры:
- Bull и El Primo убивают Gene, Pam, Byron в ближнем бою — нужен снайпер
- Angelo бьёт медленных и танков
- Mortis убивает Byron, Poco и медленных саппортов
- Frank контрится Mortis, Leon, Crow
- Crow контрится Frank, Bull

Правила драфта: первый пик — универсал (Max, Byron, Najia, Angelo, Bull). Ласт пик — закрой дыры в компе и контрь весь состав врага.

Предлагай 2–3 варианта пика с объяснением. Без форматирования, без звёздочек.`;

/* ===== PARTICLES ===== */
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mk() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1
    };
  }

  function init() { resize(); particles = Array.from({ length: 120 }, mk); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,85,247,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init(); draw();
})();

/* ===== TIER LIST ===== */
function renderTierList() {
  const map = { splus: 'tierSPlus', s: 'tierS', a: 'tierA', b: 'tierB' };
  Object.entries(map).forEach(([tier, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = TIER_DATA[tier].map(name => `
      <div class="tier-brawler" title="${name}">
        <img src="${BRAWLIFY_IMG(name)}" alt="${name}"
          onerror="this.src='https://via.placeholder.com/44/1a1a2e/9333ea?text=${name[0]}'" />
        <span>${name}</span>
      </div>`).join('');
  });
}

/* ===== MODE SELECTION ===== */
function selectMode(key) {
  const data = MODES_DATA[key];
  if (!data) return;

  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-mode="${key}"]`)?.classList.add('active');

  document.getElementById('detailTitle').textContent = data.name;
  document.getElementById('detailMaps').innerHTML = data.maps.map(m => `<li>${m}</li>`).join('');

  document.getElementById('detailBans').innerHTML = data.bans.map(b => `
    <div class="brawler-chip ban">
      <img src="${BRAWLIFY_IMG(b)}" alt="${b}"
        onerror="this.src='https://via.placeholder.com/28/2a0a0a/f87171?text=${b[0]}'" />
      ${b}
    </div>`).join('');

  document.getElementById('detailPicks').innerHTML = data.picks.map((p, i) => `
    <div class="brawler-chip pick">
      <img src="${BRAWLIFY_IMG(p)}" alt="${p}"
        onerror="this.src='https://via.placeholder.com/28/0a2a0a/4ade80?text=${p[0]}'" />
      ${i === 0 ? '⭐ ' : ''}${p}
    </div>`).join('');

  document.getElementById('detailTip').textContent = data.tip;

  document.getElementById('modeDetail').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMode() {
  document.getElementById('modeDetail').classList.remove('open');
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
  document.body.style.overflow = '';
}

document.getElementById('modeDetail').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeMode();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMode(); closeVoiceModal(); }
});

/* ===== VOICE CHAT ===== */
const WAVE_BARS = 22;
let recognition = null;
let isRecording = false;
let isSpeaking = false;
let history = []; // conversation history for Claude

// Build waveform bars
(function buildWave() {
  const wave = document.getElementById('vmWave');
  for (let i = 0; i < WAVE_BARS; i++) {
    const b = document.createElement('div');
    b.className = 'vm-bar';
    b.style.setProperty('--bd', (0.38 + Math.random() * 0.45) + 's');
    b.style.setProperty('--bh', (8 + Math.random() * 28) + 'px');
    b.style.setProperty('--bdelay', (Math.random() * 0.4) + 's');
    wave.appendChild(b);
  }
})();

function setWave(who) {
  document.querySelectorAll('.vm-bar').forEach(b => {
    b.classList.toggle('vm-bar-active', who !== 'none');
    b.style.background = who === 'user' ? '#3b82f6' : '#a855f7';
  });
}

function setActive(who) {
  // icons
  document.getElementById('userIcon').classList.toggle('vm-active', who === 'user');
  document.getElementById('aiIcon').classList.toggle('vm-active', who === 'ai');
  // labels
  document.getElementById('userLabel').classList.toggle('vm-label-active', who === 'user');
  document.getElementById('aiLabel').classList.toggle('vm-label-active', who === 'ai');
}

function setTranscript(text, who) {
  const box = document.getElementById('vmTranscript');
  if (text === '__loading__') {
    box.innerHTML = '<span class="dot-loader"><span></span><span></span><span></span></span>';
  } else {
    box.textContent = text;
  }
  box.className = 'vm-transcript' + (who === 'user' ? ' tr-user' : who === 'ai' ? ' tr-ai' : '');
}

function setStatus(text) {
  document.getElementById('vmStatus').textContent = text;
}

function openVoiceModal() {
  document.getElementById('voiceOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setActive('none');
  setWave('none');
  setTranscript('Нажми микрофон и спроси кого пикнуть...', '');
  setStatus('');
}

function closeVoiceModal() {
  if (recognition) { try { recognition.stop(); } catch (e) {} }
  if (isSpeaking) { window.speechSynthesis.cancel(); }
  isRecording = false; isSpeaking = false;
  document.getElementById('voiceOverlay').classList.remove('open');
  document.getElementById('micBtn').classList.remove('mic-recording');
  document.body.style.overflow = '';
  setActive('none'); setWave('none');
}

function toggleMic() {
  if (isSpeaking) { window.speechSynthesis.cancel(); isSpeaking = false; }
  if (isRecording) {
    isRecording = false;
    try { recognition.stop(); } catch (e) {}
    document.getElementById('micBtn').classList.remove('mic-recording');
    setActive('none'); setWave('none'); setStatus('');
  } else {
    startListening();
  }
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setTranscript('Твой браузер не поддерживает речь 😔 Используй Chrome', '');
    return;
  }

  recognition = new SR();
  recognition.lang = 'ru-RU';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecording = true;
    document.getElementById('micBtn').classList.add('mic-recording');
    setActive('user'); setWave('user');
    setTranscript('Слушаю...', 'user');
    setStatus('● ЗАПИСЬ');
  };

  recognition.onresult = e => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t; else interim += t;
    }
    setTranscript(final || interim, 'user');
  };

  recognition.onend = () => {
    isRecording = false;
    document.getElementById('micBtn').classList.remove('mic-recording');
    const text = document.getElementById('vmTranscript').textContent.trim();
    if (text && text !== 'Слушаю...' && text.length > 2) {
      askClaude(text);
    } else {
      setActive('none'); setWave('none'); setStatus('');
      setTranscript('Не расслышал. Попробуй ещё раз...', '');
    }
  };

  recognition.onerror = e => {
    isRecording = false;
    document.getElementById('micBtn').classList.remove('mic-recording');
    setActive('none'); setWave('none'); setStatus('');
    const msg = e.error === 'not-allowed'
      ? 'Нет доступа к микрофону. Разреши в браузере!'
      : 'Ошибка: ' + e.error;
    setTranscript(msg, '');
  };

  recognition.start();
}

async function askClaude(userText) {
  setActive('ai'); setWave('ai');
  setTranscript('__loading__', 'ai');
  setStatus('ИИ ДУМАЕТ...');

  history.push({ role: 'user', content: userText });

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: history
      })
    });

    const data = await resp.json();

    if (data.error) {
      throw new Error(data.error.message || 'Ошибка API');
    }

    const aiText = data.content?.[0]?.text || 'Нет ответа';
    history.push({ role: 'assistant', content: aiText });

    speakText(aiText);
  } catch (err) {
    setActive('none'); setWave('none'); setStatus('');
    setTranscript('Ошибка подключения: ' + err.message, '');
  }
}

function speakText(text) {
  const synth = window.speechSynthesis;
  if (!synth) {
    setTranscript(text, 'ai');
    setActive('none'); setWave('none'); setStatus('');
    return;
  }

  // Очистить символы маркдауна на случай если пробрался
  const clean = text.replace(/[*#_~`]/g, '').replace(/\n+/g, '. ');

  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = 'ru-RU';
  utt.rate = 1.05;
  utt.pitch = 1;

  // Выбрать русский голос если доступен
  const voices = synth.getVoices();
  const ruVoice = voices.find(v => v.lang.startsWith('ru'));
  if (ruVoice) utt.voice = ruVoice;

  isSpeaking = true;
  setTranscript(text, 'ai');
  setStatus('ГОВОРИТ ИИ');

  utt.onend = () => {
    isSpeaking = false;
    setActive('none'); setWave('none');
    setStatus('Нажми микрофон чтобы ответить');
  };

  utt.onerror = () => {
    isSpeaking = false;
    setActive('none'); setWave('none'); setStatus('');
  };

  synth.speak(utt);
}

// Prewarm voices
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

/* ===== UTILS ===== */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// Stagger mode card animations
document.querySelectorAll('.mode-card').forEach((card, i) => {
  card.style.animationDelay = `${i * 0.08}s`;
});

// Init
renderTierList();