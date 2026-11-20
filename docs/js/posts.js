/**
 * SakuraEntropia — blog logic
 * All articles (preface + posts) as Zhihu-style foldable cards,
 * with a per-article TOC sidebar.
 */
const POSTS = [
  { id: 'p1',  code: '08b', date: '2026-09-04', file: '润色版_08b_EROI：努力—回报率指标体系.md', title: 'EROI：努力—回报率指标体系' },
  { id: 'p2',  code: '08c', date: '2026-06-23', file: '润色版_08c_不可预见性分级定义（Ver 1.0）.md', title: '不可预见性分级定义（Ver 1.0）' },
  { id: 'p3',  code: '08g', date: '2026-08-13', file: '润色版_08g_成就谱系坍塌.md', title: '成就谱系坍塌' },
  { id: 'p4',  code: '08h', date: '2026-08-19', file: '润色版_08h_艺术渲染完备性（ARC）.md', title: '艺术渲染完备性（ARC）' },
  { id: 'p5',  code: '08i', date: '2026-08-29', file: '润色版_08i_第十艺术假说.md', title: '第十艺术假说' },
  { id: 'p6',  code: '08j', date: '2026-08-29', file: '润色版_08j_下一個牛顿，可能在生物学里.md', title: '下一個牛顿，可能在生物学里' },
  { id: 'p7',  code: '08k', date: '2026-08-30', file: '润色版_08k_GTA6之后，再无GTA：通用世界引擎的终局与重生.md', title: 'GTA6之后，再无GTA：通用世界引擎的终局与重生' },
  { id: 'p8',  code: '08l', date: '2026-08-30', file: '润色版_08l_元宇宙需要的东西.md', title: '元宇宙需要的东西' },
  { id: 'p9',  code: '08m', date: '2026-08-30', file: '润色版_08m_第十艺术元宇宙构想.md', title: '第十艺术元宇宙构想' },
  { id: 'p10', code: '08n', date: '2026-09-10', file: '润色版_08n_ENTROPIA DESIGN PHILOSOPHY.md', title: 'ENTROPIA DESIGN PHILOSOPHY' },
  { id: 'p11', code: '08o', date: '2026-09-11', file: '润色版_08o_《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处.md', title: '《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处' },
  { id: 'p12', code: '08p', date: '日期待核实', file: '润色版_08p_从生存到自由：人类生存范式的五次跃迁.md', title: '从生存到自由：人类生存范式的五次跃迁' },
  { id: 'p13', code: '08r', date: '2026-09-10', file: '润色版_08r_太空新国家假说：文明为什么需要新的大陆.md', title: '太空新国家假说：文明为什么需要新的大陆' },
  { id: 'p14', code: '08u', date: '日期待核实', file: '润色版_08u_统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲.md', title: '统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲' },
  { id: 'p15', code: '08w', date: '2026-07-20', file: '润色版_08w_社会流动性的齐奥尔科夫斯基约束.md', title: '社会流动性的齐奥尔科夫斯基约束' },
  { id: 'p16', code: '08x', date: '日期待核实', file: '润色版_08x_制作委员会：问题很大，但为什么不能简单“取缔”.md', title: '制作委员会：问题很大，但为什么不能简单“取缔”' }
];

const PREFACE_TITLE = '序言：关于人类和现有社会系统的一些思考';
const RAW_BASE = 'https://raw.githubusercontent.com/SakuraEntropia/SakuraEntropia/main/docs/posts/';

(function () {
  const cache = new Map();
  let lastOpen = null;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ── Theme ─────────────────────────────────────────────── */
  let theme = localStorage.getItem('sakura_theme') || 'dark';
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    $('ico-moon') && ($('ico-moon').style.display = t === 'dark' ? '' : 'none');
    $('ico-sun') && ($('ico-sun').style.display = t === 'light' ? '' : 'none');
  }
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sakura_theme', theme);
    applyTheme(theme);
    if (window.drawModel) window.drawModel();
  }

  /* ── Tabs ──────────────────────────────────────────────── */
  function switchTab(name) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    if (name === 'toys' && window.resizeCanvas) setTimeout(window.resizeCanvas, 80);
    window.scrollTo({ top: 0 });
  }
  window.switchTab = switchTab;

  /* ── Cards ─────────────────────────────────────────────── */
  function cardHTML(entry) {
    const isPreface = entry.kind === 'preface';
    const title = isPreface ? PREFACE_TITLE : esc(entry.title);
    const meta = isPreface
      ? '<span class="tag">序言</span><span>更新于 2026-11-20</span><span>约 3.7 万字</span>'
      : `<span class="tag">随笔</span><span>${entry.code}</span><span>${entry.date}</span>`;
    return `
      <article class="card" id="card-${entry.id}" data-id="${entry.id}">
        <button class="card-head" data-id="${entry.id}" aria-expanded="false">
          <span class="card-text">
            <h3 class="card-title">${title}</h3>
            <span class="card-meta">${meta}</span>
          </span>
          <span class="chev">▾</span>
        </button>
        <div class="card-body">
          <div class="card-inner prose"><div class="loading"><span class="spinner"></span>加载中…</div></div>
          <div class="card-fade"></div>
          <button class="expand-btn">展开全文 ▾</button>
        </div>
      </article>`;
  }

  function renderList() {
    const list = $('post-list');
    if (!list) return;
    const all = [{ id: 'preface', kind: 'preface' }].concat(POSTS);
    list.innerHTML = all.map(cardHTML).join('');
  }

  /* ── Content loading ───────────────────────────────────── */
  async function loadContent(id) {
    if (cache.has(id)) return cache.get(id);
    let raw;
    if (id === 'preface') {
      raw = window.ESSAY_ZH;
      if (!raw) return null;
    } else {
      const post = POSTS.find(p => p.id === id);
      const res = await fetch(RAW_BASE + encodeURIComponent(post.file));
      if (!res.ok) return null;
      raw = await res.text();
    }
    const html = marked.parse(raw);
    cache.set(id, html);
    return html;
  }

  function renderMath(el) {
    if (!window.renderMathInElement) return;
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  function setOpen(card, open) {
    card.classList.toggle('open', open);
    const head = card.querySelector('.card-head');
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.querySelector('.chev').textContent = open ? '▴' : '▾';
    card.querySelector('.expand-btn').textContent = open ? '收起 ▴' : '展开全文 ▾';
  }

  async function ensureContent(card) {
    if (card.dataset.loaded) return;
    const id = card.dataset.id;
    const inner = card.querySelector('.card-inner');
    const html = await loadContent(id);
    if (html === null) {
      inner.innerHTML = '<p class="err">加载失败，请刷新页面重试。</p>';
    } else {
      inner.innerHTML = html;
      renderMath(inner);
      card.dataset.loaded = '1';
    }
  }

  async function openCard(card) {
    const id = card.dataset.id;
    setOpen(card, true);
    lastOpen = id;
    await ensureContent(card);
    buildTOC(id);
  }

  function closeCard(card) {
    setOpen(card, false);
    const id = card.dataset.id;
    if (lastOpen === id) {
      lastOpen = null;
      clearTOC();
    }
  }

  /* ── TOC sidebar ───────────────────────────────────────── */
  function buildTOC(id) {
    const nav = $('toc-nav');
    const label = $('toc-article');
    const card = document.getElementById('card-' + id);
    if (!nav || !card) return;
    label.textContent = card.querySelector('.card-title').textContent;
    const heads = Array.from(card.querySelectorAll('.card-inner h1, .card-inner h2, .card-inner h3'));
    if (!heads.length) {
      nav.innerHTML = '<p class="toc-hint">本文没有小节标题。</p>';
      return;
    }
    let h1 = 0, h2 = 0, h3 = 0;
    nav.innerHTML = heads.map(h => {
      const tag = h.tagName.toLowerCase();
      const labelText = h.textContent.trim().slice(0, 42);
      if (tag === 'h1') { h1++; h.id = h.id || `s${h1}`; }
      else if (tag === 'h2') { h2++; h.id = h.id || `s${h1}-${h2}`; }
      else { h3++; h.id = h.id || `s${h1}-${h2}-${h3}`; }
      return `<a class="toc-link toc-${tag}" href="#${h.id}">${esc(labelText)}</a>`;
    }).join('');
    nav.querySelectorAll('.toc-link').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (!target) return;
        const y = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  function clearTOC() {
    const nav = $('toc-nav');
    const label = $('toc-article');
    if (nav) nav.innerHTML = '<p class="toc-hint">展开一篇文章后，这里显示它的目录。</p>';
    if (label) label.textContent = '';
  }

  /* ── Events ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(theme);
    renderList();
    clearTOC();

    $('theme-btn') && $('theme-btn').addEventListener('click', toggleTheme);

    document.querySelector('.tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (btn) switchTab(btn.dataset.tab);
    });

    $('post-list').addEventListener('click', (e) => {
      const head = e.target.closest('.card-head');
      const expand = e.target.closest('.expand-btn');
      if (!head && !expand) return;
      const card = e.target.closest('.card');
      if (!card) return;
      if (card.classList.contains('open')) closeCard(card);
      else openCard(card);
    });

    $('back-top') && $('back-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      $('back-top') && $('back-top').classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          ensureContent(en.target);
        });
      }, { rootMargin: '240px 0px' });
      document.querySelectorAll('.card').forEach((card) => io.observe(card));
    } else {
      document.querySelectorAll('.card').forEach((card) => ensureContent(card));
    }

    if (window.initModelSimulation) window.initModelSimulation();
    if (window.initWagerSimulator) window.initWagerSimulator();
    renderMath(document.body);
  });
})();
