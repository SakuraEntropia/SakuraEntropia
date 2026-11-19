
const BLOG_POSTS = [{"id": "q1", "code": "08b", "file": "润色版_08b_EROI：努力—回报率指标体系.md", "title": "EROI：努力—回报率指标体系"}, {"id": "q2", "code": "08c", "file": "润色版_08c_不可预见性分级定义（Ver 1.0）.md", "title": "不可预见性分级定义（Ver 1.0）"}, {"id": "q3", "code": "08g", "file": "润色版_08g_成就谱系坍塌.md", "title": "成就谱系坍塌"}, {"id": "q4", "code": "08h", "file": "润色版_08h_艺术渲染完备性（ARC）.md", "title": "艺术渲染完备性（ARC）"}, {"id": "q5", "code": "08i", "file": "润色版_08i_第十艺术假说.md", "title": "第十艺术假说"}, {"id": "q6", "code": "08j", "file": "润色版_08j_下一個牛顿，可能在生物学里.md", "title": "下一個牛顿，可能在生物学里"}, {"id": "q7", "code": "08k", "file": "润色版_08k_GTA6之后，再无GTA：通用世界引擎的终局与重生.md", "title": "GTA6之后，再无GTA：通用世界引擎的终局与重生"}, {"id": "q8", "code": "08l", "file": "润色版_08l_元宇宙需要的东西.md", "title": "元宇宙需要的东西"}, {"id": "q9", "code": "08m", "file": "润色版_08m_第十艺术元宇宙构想.md", "title": "第十艺术元宇宙构想"}, {"id": "q10", "code": "08n", "file": "润色版_08n_ENTROPIA DESIGN PHILOSOPHY.md", "title": "ENTROPIA DESIGN PHILOSOPHY"}, {"id": "q11", "code": "08o", "file": "润色版_08o_《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处.md", "title": "《我的叔叔于勒》：为什么有些人走遍世界，也没有真正的容身之处"}, {"id": "q12", "code": "08p", "file": "润色版_08p_从生存到自由：人类生存范式的五次跃迁.md", "title": "从生存到自由：人类生存范式的五次跃迁"}, {"id": "q13", "code": "08r", "file": "润色版_08r_太空新国家假说：文明为什么需要新的大陆.md", "title": "太空新国家假说：文明为什么需要新的大陆"}, {"id": "q14", "code": "08u", "file": "润色版_08u_统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲.md", "title": "统计学反出生主义：为何在这个时代，不生是对生命最大的慈悲"}, {"id": "q15", "code": "08w", "file": "润色版_08w_社会流动性的齐奥尔科夫斯基约束.md", "title": "社会流动性的齐奥尔科夫斯基约束"}, {"id": "q16", "code": "08x", "file": "润色版_08x_制作委员会：问题很大，但为什么不能简单“取缔”.md", "title": "制作委员会：问题很大，但为什么不能简单“取缔”"}];
(function(){
  const list = document.getElementById('post-list');
  if (!list) return;
  const cache = new Map();
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const curLang = () => (localStorage.getItem('sakura_lang') || 'en');

  function prefaceTitle(){ return curLang() === 'zh' ? '序言：关于人类和现有社会系统的一些思考' : 'Preface: Some Thoughts on Humans and Existing Social Systems'; }

  list.innerHTML = [
    `<article class="card" id="card-preface">
      <button class="card-head" data-id="preface">
        <div class="card-text"><h3 class="card-title" id="preface-title">${esc(prefaceTitle())}</h3>
        <div class="card-meta"><span class="tag">序言</span><span>2026-11-19</span><span>约 3.7 万字（中）</span></div></div>
        <span class="chev">▾</span>
      </button>
      <div class="card-preview">
        <div class="card-inner" data-preview="1">
          <article id="article" class="prose"><div class="loading"><div class="spinner"></div></div></article>
        </div>
        <div class="fade"></div>
        <button class="expand-btn">展开全文 ▾</button>
      </div>
    </article>`,
    ...BLOG_POSTS.map(p => `
    <article class="card" id="card-${p.id}">
      <button class="card-head" data-id="${p.id}">
        <div class="card-text"><h3 class="card-title">${esc(p.title)}</h3>
        <div class="card-meta"><span class="tag">随笔</span><span>${p.code}</span><span>2026-11-19</span></div></div>
        <span class="chev">▾</span>
      </button>
      <div class="card-preview">
        <div class="card-inner"><div class="loading"><div class="spinner"></div></div></div>
        <div class="fade"></div>
        <button class="expand-btn">展开全文 ▾</button>
      </div>
    </article>`)
  ].join('');

  async function loadContent(id){
    if (cache.has(id)) return cache.get(id);
    let raw;
    if (id === 'preface') {
      raw = curLang() === 'zh' ? window.ESSAY_ZH : window.ESSAY_EN;
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

  function openCard(id, open){
    const card = document.getElementById(id === 'preface' ? 'card-preface' : 'card-' + id);
    const pv = card.querySelector('.card-preview');
    pv.classList.toggle('open', open);
    card.querySelector('.chev').textContent = open ? '▴' : '▾';
    card.querySelector('.expand-btn').textContent = open ? '收起 ▴' : '展开全文 ▾';
    if (!open) return;
    const inner = card.querySelector('.card-inner');
    loadContent(id).then(html => {
      if (id !== 'preface' && html) {
        inner.innerHTML = html;
        if (window.renderMathInElement) renderMathInElement(inner, { delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}], throwOnError:false });
      }
    });
  }

  list.addEventListener('click', e => {
    const head = e.target.closest('.card-head');
    const btn = e.target.closest('.expand-btn');
    if (!head && !btn) return;
    const card = (head||btn).closest('.card');
    const id = head ? head.dataset.id : (card.id === 'card-preface' ? 'preface' : card.id.replace('card-',''));
    const isOpen = card.querySelector('.card-preview').classList.contains('open');
    openCard(id, !isOpen);
  });

  // open preface when TOC or search result clicked
  document.addEventListener('click', e => {
    if (e.target.closest('.toc-link') || e.target.closest('.sr-item')) openCard('preface', true);
  });

  // lang change: refresh preface head + content if open
  document.addEventListener('langchange', () => {
    document.getElementById('preface-title').textContent = prefaceTitle();
    cache.delete('preface');
  });
})();
