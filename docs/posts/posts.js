
const POSTS = [
  { id:"preface", kind:"preface",
    title:{ zh:"序言：关于人类和现有社会系统的一些思考", en:"Preface: Some Thoughts on Humans and Existing Social Systems" },
    date:"2026-11-19" },
  {"id": "p1", "file": "润色版_08b_EROI：努力—回报率指标体系.md", "title": "EROI：努力—回报率指标体系", "chars": 4356}, {"id": "p2", "file": "润色版_08g_成就谱系坍塌.md", "title": "成就谱系坍塌", "chars": 2095}, {"id": "p3", "file": "润色版_08o_《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处.md", "title": "《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处", "chars": 1816}, {"id": "p4", "file": "润色版_08p_从生存到自由：人类生存范式的五次跃迁.md", "title": "从生存到自由：人类生存范式的五次跃迁", "chars": 3864}, {"id": "p5", "file": "润色版_08r_太空新国家假说：文明为什么需要新的大陆.md", "title": "太空新国家假说：文明为什么需要新的大陆", "chars": 4521}, {"id": "p6", "file": "润色版_08u_统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲.md", "title": "统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲", "chars": 2428}, {"id": "p7", "file": "润色版_08w_社会流动性的齐奥尔科夫斯基约束.md", "title": "社会流动性的齐奥尔科夫斯基约束", "chars": 3445}, {"id": "p8", "file": "润色版_08x_制作委员会：问题很大，但为什么不能简单“取缔”.md", "title": "制作委员会：问题很大，但为什么不能简单“取缔”", "chars": 3417}];
let lang = localStorage.getItem('blog_lang') || 'zh';
let theme = localStorage.getItem('blog_theme') || 'dark';
let openId = null;
const cache = new Map();

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function applyTheme(t){
  document.body.dataset.theme = t;
  document.getElementById('ico-moon').style.display = t==='dark' ? '' : 'none';
  document.getElementById('ico-sun').style.display  = t==='light' ? '' : 'none';
}

function metaLine(p){
  if (p.kind === 'preface') {
    const n = lang==='zh' ? '约 36937 字' : '约 14284 词';
    return `<span class="tag">序言</span><span>${p.date}</span><span>${n}</span><span>${lang==='zh' ? '中 / <a class="lnk">EN</a>' : '<a class="lnk">中</a> / EN'}</span>`;
  }
  return `<span class="tag">随笔</span><span>${p.date}</span><span>约 ${p.chars} 字</span><span>中文</span>`;
}

function cardHTML(p){
  return `<article class="card" id="card-${p.id}">
    <button class="card-head" data-id="${p.id}">
      <div class="card-text">
        <h2 class="card-title">${esc(p.kind==='preface' ? p.title[lang] : p.title)}</h2>
        <div class="card-meta">${metaLine(p)}</div>
      </div>
      <span class="chev">▾</span>
    </button>
    <div class="card-body" hidden><div class="card-inner"><div class="loading"><div class="spinner"></div></div></div></div>
  </article>`;
}

function renderList(){
  const list = document.getElementById('list');
  list.innerHTML = POSTS.map(cardHTML).join('');
  list.querySelectorAll('.card-head').forEach(h => h.addEventListener('click', () => toggle(h.dataset.id)));
}

function openCard(id, show){
  const card = document.getElementById('card-'+id);
  const body = card.querySelector('.card-body');
  if (openId && openId !== id) {
    const ob = document.getElementById('card-'+openId).querySelector('.card-body');
    ob.hidden = true; document.getElementById('card-'+openId).querySelector('.chev').textContent = '▾';
  }
  body.hidden = !show;
  card.querySelector('.chev').textContent = show ? '▴' : '▾';
  openId = show ? id : null;
  if (!show) return;
  const inner = body.querySelector('.card-inner');
  load(id).then(html => {
    inner.innerHTML = html;
    if (window.renderMathInElement) {
      renderMathInElement(inner, { delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}], throwOnError:false });
    }
  });
}

async function load(id){
  if (cache.has(id)) return cache.get(id);
  let raw;
  if (id === 'preface') {
    raw = lang === 'zh' ? window.ESSAY_ZH : window.ESSAY_EN;
  } else {
    const p = POSTS.find(x => x.id === id);
    const r = await fetch('https://raw.githubusercontent.com/SakuraEntropia/SakuraEntropia/main/docs/posts/' + encodeURIComponent(p.file));
    raw = await r.text();
  }
  const html = marked.parse(raw);
  cache.set(id, html);
  return html;
}

function toggle(id){
  if (openId === id) { openCard(id, false); return; }
  openCard(id, true);
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(theme);
  renderList();
  document.getElementById('theme-btn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('blog_theme', theme);
    applyTheme(theme);
  });
  document.getElementById('lang-btn').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('blog_lang', lang);
    document.getElementById('lang-btn').textContent = lang === 'en' ? '中' : 'EN';
    document.getElementById('page-title').textContent = lang === 'zh' ? '全部文章' : 'All posts';
    if (openId === 'preface') { cache.delete('preface'); openCard('preface', true); }
    renderList(); openId = null;
  });
  // default open: preface
  openCard('preface', true);
});
