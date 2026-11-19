/**
 * SakuraEntropia — Re:LU Canon tab
 * Password-gated, client-side decryption of an AES-GCM bundle
 * produced from the private relu-canon repository.
 */
(function () {
  const BUNDLE_URL = 'canon/bundle.json';
  let unlocked = false;

  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function gunzip(bytes) {
    if (!('DecompressionStream' in window)) {
      throw new Error('当前浏览器不支持 DecompressionStream，请换 Chrome/Safari 新版。');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function decryptBundle(bundle, password) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(bundle.salt), iterations: 250000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64(bundle.iv), tagLength: 128 },
      key,
      (() => {
        const ct = b64(bundle.ct);
        const tag = b64(bundle.tag);
        const buf = new Uint8Array(ct.length + tag.length);
        buf.set(ct, 0);
        buf.set(tag, ct.length);
        return buf;
      })()
    );
    return new Uint8Array(plain);
  }

  function setMsg(text, ok) {
    const el = document.getElementById('canon-msg');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('ok', !!ok);
  }

  async function unlock(password) {
    const form = document.getElementById('canon-form');
    const btn = form.querySelector('button');
    btn.disabled = true;
    setMsg('正在解密…', true);
    try {
      const res = await fetch(BUNDLE_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('数据集文件缺失（' + res.status + '）。');
      const bundle = await res.json();
      const gz = await decryptBundle(bundle, password);
      const html = await gunzip(gz);
      const blob = new Blob([html], { type: 'text/html' });
      const frame = document.getElementById('canon-frame');
      frame.src = URL.createObjectURL(blob);
      document.getElementById('canon-gate').hidden = true;
      document.getElementById('canon-view').hidden = false;
      unlocked = true;
      setMsg('');
    } catch (err) {
      setMsg(err && err.message ? err.message : '密码错误或数据集损坏。');
    } finally {
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('canon-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (unlocked) return;
      const val = document.getElementById('canon-password').value.trim();
      if (!val) { setMsg('请输入密码。'); return; }
      unlock(val);
    });
  });
})();
