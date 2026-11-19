/**
 * SakuraEntropia — blog-centric logic
 * All articles (preface + posts) as Zhihu-style foldable cards.
 */
const BLOG_POSTS = [
  {"id": "q1", "code": "08b", "file": "润色版_08b_EROI：努力—回报率指标体系.md", "title": "EROI：努力—回报率指标体系"},
  {"id": "q2", "code": "08c", "file": "润色版_08c_不可预见性分级定义（Ver 1.0）.md", "title": "不可预见性分级定义（Ver 1.0）"},
  {"id": "q3", "code": "08g", "file": "润色版_08g_成就谱系坍塌.md", "title": "成就谱系坍塌"},
  {"id": "q4", "code": "08h", "file": "润色版_08h_艺术渲染完备性（ARC）.md", "title": "艺术渲染完备性（ARC）"},
  {"id": "q5", "code": "08i", "file": "润色版_08i_第十艺术假说.md", "title": "第十艺术假说"},
  {"id": "q6", "code": "08j", "file": "润色版_08j_下一個牛顿，可能在生物学里.md", "title": "下一個牛顿，可能在生物学里"},
  {"id": "q7", "code": "08k", "file": "润色版_08k_GTA6之后，再无GTA：通用世界引擎的终局与重生.md", "title": "GTA6之后，再无GTA：通用世界引擎的终局与重生"},
  {"id": "q8", "code": "08l", "file": "润色版_08l_元宇宙需要的东西.md", "title": "元宇宙需要的东西"},
  {"id": "q9", "code": "08m", "file": "润色版_08m_第十艺术元宇宙构想.md", "title": "第十艺术元宇宙构想"},
  {"id": "q10", "code": "08n", "file": "润色版_08n_ENTROPIA DESIGN PHILOSOPHY.md", "title": "ENTROPIA DESIGN PHILOSOPHY"},
  {"id": "q11", "code": "08o", "file": "润色版_08o_《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处.md", "title": "《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处"},
  {"id": "q12", "code": "08p", "file": "润色版_08p_从生存到自由：人类生存范式的五次跃迁.md", "title": "从生存到自由：人类生存范式的五次跃迁"},
  {"id": "q13", "code": "08r", "file": "润色版_08r_太空新国家假说：文明为什么需要新的大陆.md", "title": "太空新国家假说：文明为什么需要新的大陆"},
  {"id": "q14", "code": "08u", "file": "润色版_08u_统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲.md", "title": "统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲"},
  {"id": "q15", "code": "08w", "file": "润色版_08w_社会流动性的齐奥尔科夫斯基约束.md", "title": "社会流动性的齐奥尔科夫斯基约束"},
  {"id": "q16", "code": "08x", "file": "润色版_08x_制作委员会：问题很大，但为什么不能简单“取缔”.md", "title": "制作委员会：问题很大，但为什么不能简单“取缔”"}
];

(function () {
  let theme = localStorage.getItem('sakura_theme') || 'dark';
  const cache = new Map();
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function applyTheme(t) {
    document.body.dataset.theme = t;
    const m = document.getElementById('ico-moon'), s = document.getElementById('ico-sun');
    if (m) m.style.display = t === 'dark' ? '' : 'none';
    if (s) s.style.display = t === 'light' ? '' : 'none';
  }

  function switchTab(id) {
    document.querySelectorAll('section.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + id));
    document.querySelectorAll('.nav-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    if (id === 'model' && window.resizeCanvas) setTimeout(window.resizeCanvas, 60);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.switchTab = switchTab;

  function cardHTML(kind, p) {
    const title = kind === 'preface' ? '序言：关于人类和现有社会系统的一些思考' : esc(p.title);
    const meta = kind === 'preface'
      ? '<span class="tag">序言</span><span>2026-11-19</span><span>约 3.7 万字</span>'
      : `<span class="tag">随笔</span><span>${p.code}</span><span>2026-11-19</span>`;
    return `
    <article class="card" id="card-${kind}">
      <button class="card-head" data-id="${kind}">
        <div class="card-text"><h3 class="card-title">${title}</h3><div class="card-meta">${meta}</div></div>
        <span class="chev">▾</span>
      </button>
      <div class="card-preview">
        <div class="card-inner prose"><div class="loading"><div class="spinner"></div></div></div>
        <div class="fade"></div>
        <button class="expand-btn">展开全文 ▾</button>
      </div>
    </article>`;
  }

  function renderList() {
    const list = document.getElementById('post-list');
    if (!list) return;
    list.innerHTML = cardHTML('preface', null) + BLOG_POSTS.map(p => cardHTML(p.id, p)).join('');
  }

  async function loadContent(id) {
    if (cache.has(id)) return cache.get(id);
    let raw;
    if (id === 'preface') {
      raw = window.ESSAY_ZH;
    } else {
      const p = BLOG_POSTS.find(x => x.id === id);
      const r = await fetch('https://raw.githubusercontent.com/SakuraEntropia/SakuraEntropia/main/docs/posts/' + encodeURIComponent(p.file));
      if (!r.ok) return null;
      raw = await r.text();
    }
    const html = marked.parse(raw);
    cache.set(id, html);
    return html;
  }

  function openCard(id, open) {
    const card = document.getElementById('card-' + id);
    const pv = card.querySelector('.card-preview');
    pv.classList.toggle('open', open);
    card.querySelector('.chev').textContent = open ? '▴' : '▾';
    card.querySelector('.expand-btn').textContent = open ? '收起 ▴' : '展开全文 ▾';
    if (!open) { if (lastOpen === id) { lastOpen = null; clearTOC(); } return; }
    lastOpen = id;
    const inner = card.querySelector('.card-inner');
    loadContent(id).then(html => {
      if (html === null) { inner.innerHTML = '<p class="err">加载失败，请稍后再试。</p>'; return; }
      if (html === undefined) return; // preface: app handled elsewhere? never — always html
      inner.innerHTML = html;
      if (lastOpen === id) buildTOC(id);
      if (window.renderMathInElement) {
        renderMathInElement(inner, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      }
    });
  }


  let lastOpen = null;

  function buildTOC(id) {
    const nav = document.getElementById('toc-nav');
    const ttitle = document.getElementById('toc-title');
    if (!nav) return;
    const card = document.getElementById('card-' + id);
    const inner = card.querySelector('.card-inner');
    const hs = Array.from(inner.querySelectorAll('h1, h2, h3'));
    ttitle.textContent = card.querySelector('.card-title').textContent;
    if (!hs.length) { nav.innerHTML = '<p class="toc-hint">本文无小节标题</p>'; return; }
    let h1c = 0, h2c = 0, h3c = 0;
    nav.innerHTML = hs.map(h => {
      const lvl = h.tagName.toLowerCase();
      if (lvl === 'h1') { h1c++; h.id = h.id || ('s' + h1c); }
      if (lvl === 'h2') { h2c++; h.id = h.id || ('s' + h1c + '-' + h2c); }
      if (lvl === 'h3') { h3c++; h.id = h.id || ('s' + h1c + '-' + h2c + '-' + h3c); }
      const label = h.textContent.trim().slice(0, 40);
      return `<a class="toc-link toc-${lvl}" href="#${h.id}">${label.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</a>`;
    }).join('');
    nav.querySelectorAll('.toc-link').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function clearTOC() {
    const nav = document.getElementById('toc-nav');
    const ttitle = document.getElementById('toc-title');
    if (nav) nav.innerHTML = '<p class="toc-hint">展开一篇文章后，这里显示它的目录。</p>';
    if (ttitle) ttitle.textContent = '';
  }
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(theme);
    renderList();
    clearTOC();

    document.getElementById('theme-btn')?.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sakura_theme', theme);
      applyTheme(theme);
      if (window.drawModel) window.drawModel();
    });

    document.getElementById('back-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      const b = document.getElementById('back-top');
      if (b) b.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    document.getElementById('post-list')?.addEventListener('click', e => {
      const head = e.target.closest('.card-head');
      const btn = e.target.closest('.expand-btn');
      if (!head && !btn) return;
      const card = (head || btn).closest('.card');
      const id = head ? head.dataset.id : card.id.replace('card-', '');
      const open = card.querySelector('.card-preview').classList.contains('open');
      openCard(id, !open);
    });

    if (window.initModelSimulation) window.initModelSimulation();
    if (window.initWagerSimulator) window.initWagerSimulator();
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        throwOnError: false
      });
    }
  });
})();
