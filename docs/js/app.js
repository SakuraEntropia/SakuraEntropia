/**
 * SakuraEntropia — App Logic
 */

let lang  = localStorage.getItem('sakura_lang')  || 'en';
let theme = localStorage.getItem('sakura_theme') || 'dark';
let headings = [];
let activeTab = 'essay';

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(theme);
  document.getElementById('theme-btn')?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sakura_theme', theme);
    applyTheme(theme);
    if (window.drawModel) window.drawModel();
  });

  document.getElementById('lang-btn')?.addEventListener('click', toggleLanguage);
  document.getElementById('search-btn')?.addEventListener('click', openSearch);
  document.getElementById('search-close')?.addEventListener('click', closeSearch);
  document.getElementById('search-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('search-overlay')) closeSearch();
  });
  document.getElementById('search-input')?.addEventListener('input', onSearch);
  document.getElementById('back-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  document.getElementById('toc-filter')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#toc-nav .toc-link').forEach(a => {
      a.style.display = a.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  if (window.initModelSimulation) window.initModelSimulation();
  if (window.initWagerSimulator)  window.initWagerSimulator();

  renderEssay();
});

// ── Theme ──
function applyTheme(t) {
  document.body.dataset.theme = t;
  document.getElementById('ico-moon').style.display = t === 'dark' ? '' : 'none';
  document.getElementById('ico-sun').style.display  = t === 'light' ? '' : 'none';
}

// ── Language ──
function toggleLanguage() {
  lang = lang === 'en' ? 'zh' : 'en';
  localStorage.setItem('sakura_lang', lang);
  document.getElementById('lang-btn').textContent = lang === 'en' ? 'EN / 中' : '中 / EN';
  renderEssay();
  document.dispatchEvent(new CustomEvent('langchange'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.toggleLanguage = toggleLanguage;

// ── Tab switching ──
function switchTab(id) {
  activeTab = id;
  document.querySelectorAll('section.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + id));
  document.querySelectorAll('.nav-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.getElementById('sidebar').style.display = id === 'essay' ? '' : 'none';
  if (id === 'model' && window.resizeCanvas) setTimeout(window.resizeCanvas, 60);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

// ── Markdown + KaTeX rendering ──
function renderEssay() {
  const article = document.getElementById('article');
  if (!article) return;
  const raw = lang === 'en' ? window.ESSAY_EN : window.ESSAY_ZH;
  if (!raw) { article.innerHTML = '<p style="color:var(--fg-muted)">Failed to load essay data.</p>'; return; }

  updateHero(lang);
  article.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  // Defer so spinner shows
  setTimeout(() => {
    article.innerHTML = renderMd(raw);
    setupTOC();
    if (window.renderMathInElement) {
      renderMathInElement(article, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
    updateStats(raw, lang);
  }, 20);
}

function renderMd(raw) {
  const store = [];
  let s = raw
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, f) => { store.push({ t:'dd', f }); return `%%M${store.length-1}%%`; })
    .replace(/\\\[([\s\S]*?)\\\]/g,   (_, f) => { store.push({ t:'db', f }); return `%%M${store.length-1}%%`; })
    .replace(/\\\(([\s\S]*?)\\\)/g,   (_, f) => { store.push({ t:'i',  f }); return `%%M${store.length-1}%%`; });
  let html = marked.parse(s);
  store.forEach((m, i) => {
    const rep = m.t === 'dd' ? `$$${m.f}$$` : m.t === 'db' ? `\\[${m.f}\\]` : `\\(${m.f}\\)`;
    html = html.replace(`%%M${i}%%`, rep);
  });
  return html;
}

function updateHero(l) {
  if (l === 'en') {
    const t = document.getElementById('essay-title');
    const s = document.getElementById('essay-sub');
    if (t) t.textContent = 'Preface: Some Thoughts on Humans and Existing Social Systems';
    if (s) s.textContent = 'On the distribution of historical agency, the cost of mediocrity, and the mechanics of persistence.';
    document.title = 'SakuraEntropia-祝人类文明的未来充满诅咒和祝福';
  } else {
    const t = document.getElementById('essay-title');
    const s = document.getElementById('essay-sub');
    if (t) t.textContent = '序言：关于人类和现有社会系统的一些思考';
    if (s) s.textContent = '关于历史能动性的分布、平庸的代价与在智能时代坚持的机制。';
    document.title = 'SakuraEntropia-祝人类文明的未来充满诅咒和祝福';
  }
  const btn = document.querySelector('.cta-primary');
  if (btn) btn.textContent = l === 'en' ? '切换中文' : 'Switch to English';
}

function updateStats(raw, l) {
  const sw = document.getElementById('stat-words');
  const st = document.getElementById('stat-time');
  if (l === 'en') {
    const wc = raw.split(/\s+/).filter(Boolean).length;
    if (sw) sw.textContent = wc.toLocaleString() + ' words';
    if (st) st.textContent = '~' + Math.ceil(wc / 220) + ' min';
  } else {
    const cc = raw.length;
    if (sw) sw.textContent = cc.toLocaleString() + ' 字';
    if (st) st.textContent = '~' + Math.ceil(cc / 450) + ' 分钟';
  }
}

// ── TOC ──
function slugify(t) {
  return t.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
}

function setupTOC() {
  const article = document.getElementById('article');
  const toc = document.getElementById('toc-nav');
  if (!article || !toc) return;
  toc.innerHTML = '';
  headings = [];
  article.querySelectorAll('h2, h3').forEach((h, i) => {
    const text = h.textContent.trim();
    const id = slugify(text) || 'h' + i;
    h.id = id;
    const a = document.createElement('a');
    a.className = 'toc-link ' + (h.tagName === 'H3' ? 'h3' : 'h2');
    a.href = '#' + id;
    a.textContent = text;
    a.title = text;
    a.addEventListener('click', e => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth' });
    });
    toc.appendChild(a);
    headings.push({ el: h, link: a });
  });
}

// ── Scroll / Progress / TOC spy ──
function onScroll() {
  const doc = document.documentElement;
  const pct = Math.min(100, Math.round((doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100));
  const pb = document.getElementById('progress-bar');
  const badge = document.getElementById('pct-badge');
  if (pb) pb.style.width = pct + '%';
  if (badge) badge.textContent = pct + '%';

  const bt = document.getElementById('back-top');
  if (bt) bt.classList.toggle('visible', doc.scrollTop > 400);

  // Spy
  const scrollY = window.scrollY + 100;
  let active = headings[0];
  headings.forEach(item => { if (item.el.offsetTop <= scrollY) active = item; });
  headings.forEach(item => item.link.classList.toggle('active', item === active));
}

// ── Search ──
function openSearch() {
  const o = document.getElementById('search-overlay');
  if (o) { o.hidden = false; document.getElementById('search-input')?.focus(); }
}
function closeSearch() {
  const o = document.getElementById('search-overlay');
  if (o) { o.hidden = true; }
}

function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!q) { container.innerHTML = ''; return; }

  const raw = lang === 'en' ? window.ESSAY_EN : window.ESSAY_ZH;
  const paras = raw.split(/\n\n+/);
  const matches = [];

  for (const p of paras) {
    if (p.toLowerCase().includes(q)) {
      const lines = p.split('\n');
      const heading = lines[0].startsWith('#') ? lines[0].replace(/#+\s*/, '') : '—';
      const idx = p.toLowerCase().indexOf(q);
      const snip = p.substring(Math.max(0, idx - 40), Math.min(p.length, idx + q.length + 70)).replace(/\n/g, ' ');
      matches.push({ heading, snip });
      if (matches.length >= 7) break;
    }
  }

  if (!matches.length) {
    container.innerHTML = '<p style="padding:16px;text-align:center;font-size:.82rem;color:var(--fg-dim)">No results.</p>';
    return;
  }
  container.innerHTML = matches.map((m, i) =>
    `<div class="sr-item" data-i="${i}">
      <div class="sr-title">${esc(m.heading)}</div>
      <div class="sr-snip">…${esc(m.snip)}…</div>
    </div>`
  ).join('');

  container.querySelectorAll('.sr-item').forEach(item => {
    item.addEventListener('click', () => {
      closeSearch();
      const idx = parseInt(item.dataset.i);
      const h = matches[idx].heading;
      switchTab('essay');
      setTimeout(() => {
        const target = Array.from(document.querySelectorAll('#article h1,#article h2,#article h3'))
          .find(el => el.textContent.includes(h));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  });
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
