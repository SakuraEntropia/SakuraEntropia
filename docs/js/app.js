/**
 * SakuraEntropia - Main Application Engine
 * Handles markdown rendering, KaTeX math parsing, TOC generation,
 * scroll-spy, theme switching, language toggling, and search.
 */

// State
let currentLang = localStorage.getItem('sakura_lang') || 'en';
let currentTheme = localStorage.getItem('sakura_theme') || 'dark';
let currentFontSize = parseFloat(localStorage.getItem('sakura_font_size') || '17');
let currentTab = 'essay';
let headingsList = [];

// DOM Elements
let articleBody, tocContainer, progressBar, readingPctBadge;

document.addEventListener('DOMContentLoaded', () => {
  articleBody = document.getElementById('article-body');
  tocContainer = document.getElementById('toc-container');
  progressBar = document.getElementById('progress-bar');
  readingPctBadge = document.getElementById('current-reading-pct');

  initTheme();
  initLanguage();
  initFontSize();
  initScrollAndProgress();
  initSearch();
  initMobileMenu();

  // Initialize interactive simulation widgets
  if (window.initModelSimulation) window.initModelSimulation();
  if (window.initWagerSimulator) window.initWagerSimulator();

  // Render initial essay content
  renderEssay(currentLang);
});

// ============================================================================
// Markdown & Math Rendering
// ============================================================================

/**
 * Protects LaTeX blocks from Marked.js markdown parsing (e.g. avoiding underscores turning into <em>)
 */
function renderMarkdownWithMath(rawMarkdown) {
  const mathTokens = [];
  
  // 1. Replace display math $$...$$
  let protectedMd = rawMarkdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const token = `%%MATH_DISP_${mathTokens.length}%%`;
    mathTokens.push({ token, type: 'disp-dollar', formula });
    return token;
  });

  // 2. Replace display math \[...\]
  protectedMd = protectedMd.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    const token = `%%MATH_DISP_BRACKET_${mathTokens.length}%%`;
    mathTokens.push({ token, type: 'disp-bracket', formula });
    return token;
  });

  // 3. Replace inline math \(...\)
  protectedMd = protectedMd.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    const token = `%%MATH_INLINE_PAREN_${mathTokens.length}%%`;
    mathTokens.push({ token, type: 'inline-paren', formula });
    return token;
  });

  // 4. Parse with marked
  let html = marked.parse(protectedMd);

  // 5. Restore math tokens
  mathTokens.forEach(({ token, type, formula }) => {
    let mathFormatted = '';
    if (type === 'disp-dollar') {
      mathFormatted = `$$${formula}$$`;
    } else if (type === 'disp-bracket') {
      mathFormatted = `\\[${formula}\\]`;
    } else if (type === 'inline-paren') {
      mathFormatted = `\\(${formula}\\)`;
    }
    html = html.replace(token, mathFormatted);
  });

  return html;
}

function renderEssay(lang) {
  if (!articleBody) return;

  const rawText = lang === 'en' ? window.ESSAY_EN : window.ESSAY_ZH;
  if (!rawText) {
    articleBody.innerHTML = `<div class="loading-spinner"><p>Failed to load essay data.</p></div>`;
    return;
  }

  // Update Hero Titles & Meta
  updateHeroMeta(lang, rawText);

  // Render Markdown to HTML
  const html = renderMarkdownWithMath(rawText);
  articleBody.innerHTML = html;

  // Process Headings and assign IDs
  setupHeadingsAndTOC();

  // KaTeX Auto-Render pass
  if (window.renderMathInElement) {
    try {
      renderMathInElement(articleBody, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn("KaTeX rendering notice:", e);
    }
  }

  // Update word and formula statistics
  updateStats(lang, rawText);
}

function updateHeroMeta(lang, text) {
  const essayTitle = document.getElementById('essay-title');
  const essaySub = document.getElementById('essay-subtitle');
  const heroAltLang = document.getElementById('hero-alt-lang');

  if (lang === 'en') {
    if (essayTitle) essayTitle.textContent = "Preface: Some Thoughts on Humans and Existing Social Systems";
    if (essaySub) essaySub.textContent = "A living essay on the distribution of historical agency, the cost of mediocrity, and the mechanics of persistence in the age of intelligence.";
    if (heroAltLang) heroAltLang.textContent = "中文版";
  } else {
    if (essayTitle) essayTitle.textContent = "序言：关于人类和现有社会系统的一些思考";
    if (essaySub) essaySub.textContent = "一篇关于历史能动性分布、平庸的代价与智能时代坚持机制的持续更新随笔。";
    if (heroAltLang) heroAltLang.textContent = "English Version";
  }
}

function updateStats(lang, text) {
  const statsWords = document.getElementById('stats-words');
  const statsTime = document.getElementById('stats-time');

  if (lang === 'en') {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readMin = Math.ceil(wordCount / 220);
    if (statsWords) statsWords.textContent = `${wordCount.toLocaleString()} words`;
    if (statsTime) statsTime.textContent = `~${readMin} min`;
  } else {
    const charCount = text.length;
    const readMin = Math.ceil(charCount / 450);
    if (statsWords) statsWords.textContent = `${charCount.toLocaleString()} 字`;
    if (statsTime) statsTime.textContent = `~${readMin} 分钟`;
  }
}

// ============================================================================
// Table of Contents & Scroll-Spy
// ============================================================================

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setupHeadingsAndTOC() {
  if (!articleBody || !tocContainer) return;

  const headings = articleBody.querySelectorAll('h2, h3');
  headingsList = [];
  tocContainer.innerHTML = '';

  headings.forEach((h, idx) => {
    const rawText = h.textContent.trim();
    const slug = slugify(rawText) || `section-${idx + 1}`;
    h.id = slug;

    const isH3 = h.tagName.toLowerCase() === 'h3';
    const link = document.createElement('a');
    link.href = `#${slug}`;
    link.className = `toc-link ${isH3 ? 'h3' : 'h2'}`;
    link.textContent = rawText;
    link.title = rawText;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, null, `#${slug}`);

      // Close mobile drawer if open
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    });

    tocContainer.appendChild(link);
    headingsList.push({ element: h, link: link });
  });

  // Filter functionality
  const tocFilter = document.getElementById('toc-filter');
  if (tocFilter) {
    tocFilter.value = '';
    tocFilter.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      tocContainer.querySelectorAll('.toc-link').forEach(link => {
        const matches = link.textContent.toLowerCase().includes(q);
        link.style.display = matches ? 'block' : 'none';
      });
    });
  }

  updateActiveTOC();
}

function updateActiveTOC() {
  if (headingsList.length === 0) return;

  const scrollY = window.scrollY + 120;
  let activeItem = headingsList[0];

  for (let i = 0; i < headingsList.length; i++) {
    const { element } = headingsList[i];
    if (element.offsetTop <= scrollY) {
      activeItem = headingsList[i];
    } else {
      break;
    }
  }

  headingsList.forEach(item => item.link.classList.remove('active'));
  if (activeItem && activeItem.link) {
    activeItem.link.classList.add('active');
  }
}

// ============================================================================
// Scroll, Reading Progress & Back to Top
// ============================================================================

function initScrollAndProgress() {
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = height > 0 ? Math.min(100, Math.round((winScroll / height) * 100)) : 0;

    if (progressBar) progressBar.style.width = `${pct}%`;
    if (readingPctBadge) readingPctBadge.textContent = `${pct}%`;

    // Active TOC tracking
    updateActiveTOC();

    // Back to top button visibility
    if (backToTopBtn) {
      if (winScroll > 360) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ============================================================================
// Theme Switcher
// ============================================================================

function initTheme() {
  document.body.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', currentTheme);
      localStorage.setItem('sakura_theme', currentTheme);
      updateThemeIcon(currentTheme);

      // Redraw canvas with new palette
      if (window.drawModel) window.drawModel();
    });
  }
}

function updateThemeIcon(theme) {
  const iconDark = document.getElementById('theme-icon-dark');
  const iconLight = document.getElementById('theme-icon-light');
  if (iconDark && iconLight) {
    if (theme === 'dark') {
      iconDark.style.display = 'block';
      iconLight.style.display = 'none';
    } else {
      iconDark.style.display = 'none';
      iconLight.style.display = 'block';
    }
  }
}

// ============================================================================
// Language Switcher
// ============================================================================

function initLanguage() {
  updateLanguageUI(currentLang);

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('sakura_lang', currentLang);
  updateLanguageUI(currentLang);
  renderEssay(currentLang);

  // Smooth scroll back to top of essay
  const articleContent = document.getElementById('tab-essay');
  if (articleContent) {
    articleContent.scrollIntoView({ behavior: 'smooth' });
  }
}

function updateLanguageUI(lang) {
  const langInd = document.getElementById('lang-indicator');
  const langAlt = document.querySelector('.lang-alt');

  if (lang === 'en') {
    if (langInd) langInd.textContent = 'EN';
    if (langAlt) langAlt.textContent = '中文';
    document.title = "SakuraEntropia | The Distribution of Historical Agency";
  } else {
    if (langInd) langInd.textContent = '中文';
    if (langAlt) langAlt.textContent = 'EN';
    document.title = "SakuraEntropia | 历史能动性的分布与存在系统";
  }
}

// ============================================================================
// Font Size Control
// ============================================================================

function initFontSize() {
  applyFontSize(currentFontSize);

  const decBtn = document.getElementById('font-dec-btn');
  const incBtn = document.getElementById('font-inc-btn');

  if (decBtn) {
    decBtn.addEventListener('click', () => {
      if (currentFontSize > 14) {
        currentFontSize -= 1;
        applyFontSize(currentFontSize);
      }
    });
  }

  if (incBtn) {
    incBtn.addEventListener('click', () => {
      if (currentFontSize < 24) {
        currentFontSize += 1;
        applyFontSize(currentFontSize);
      }
    });
  }
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--reading-font-size', `${size / 16}rem`);
  localStorage.setItem('sakura_font_size', size.toString());
}

// ============================================================================
// Tab Navigation
// ============================================================================

function switchTab(tabId) {
  currentTab = tabId;

  // Update nav button states
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update tab panel visibility
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // Sidebar behavior: only show TOC on 'essay' tab
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.style.display = tabId === 'essay' ? 'flex' : 'none';
  }

  // Trigger canvas redraw on switching to model
  if (tabId === 'model' && window.resizeCanvas) {
    setTimeout(window.resizeCanvas, 50);
  }

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

// ============================================================================
// Global Search
// ============================================================================

function initSearch() {
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const closeBtn = document.getElementById('search-close-btn');
  const searchInput = document.getElementById('global-search-input');
  const resultsContainer = document.getElementById('search-results');

  function openSearch() {
    if (searchModal) {
      searchModal.style.display = 'flex';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      if (resultsContainer) resultsContainer.innerHTML = '';
    }
  }

  function closeSearch() {
    if (searchModal) searchModal.style.display = 'none';
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  // Close on clicking backdrop
  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  // Ctrl+K / Cmd+K shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // Search input execution
  if (searchInput && resultsContainer) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        resultsContainer.innerHTML = '';
        return;
      }

      const activeText = currentLang === 'en' ? window.ESSAY_EN : window.ESSAY_ZH;
      const paragraphs = activeText.split(/\n\n+/);
      const matches = [];

      paragraphs.forEach((p, pIdx) => {
        const pLower = p.toLowerCase();
        if (pLower.includes(q)) {
          // Find preceding heading
          const lines = p.split('\n');
          let heading = "Essay Content";
          if (lines[0].startsWith('#')) {
            heading = lines[0].replace(/#+\s*/, '');
          }

          const matchIdx = pLower.indexOf(q);
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(p.length, matchIdx + q.length + 60);
          const snippet = (start > 0 ? '...' : '') + p.substring(start, end) + (end < p.length ? '...' : '');

          matches.push({ heading, snippet, rawP: p });
          if (matches.length >= 8) return; // Limit to 8 items
        }
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No matching passages found.</div>`;
        return;
      }

      resultsContainer.innerHTML = matches.map((m, idx) => `
        <div class="search-result-item" data-idx="${idx}">
          <div class="result-title">${escapeHtml(m.heading)}</div>
          <div class="result-snippet">${escapeHtml(m.snippet)}</div>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-item').forEach((item, idx) => {
        item.addEventListener('click', () => {
          const match = matches[idx];
          closeSearch();
          switchTab('essay');
          
          // Jump to matched heading or text
          const targetHeading = Array.from(articleBody.querySelectorAll('h1, h2, h3'))
            .find(h => h.textContent.includes(match.heading));
          if (targetHeading) {
            targetHeading.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });
    });
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================================
// Mobile Menu
// ============================================================================

function initMobileMenu() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');

  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}
