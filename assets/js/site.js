
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const state = { theme: localStorage.getItem('ares-theme') || 'green', modalOpen: false };

  async function loadPartial(targetId, url){
    const el = document.getElementById(targetId);
    if(!el) return;
    const res = await fetch(url, { cache: 'no-cache' });
    el.innerHTML = await res.text();
  }

  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('ares-theme', theme);
    const select = document.getElementById('theme-select');
    if(select) select.value = theme;
  }

  function formatDateTime(date = new Date()){
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(date);
  }

  function updateFooterClock(){
    const clock = document.getElementById('footer-clock');
    if(clock) clock.textContent = new Date().toLocaleTimeString();
  }

  function bytesToSize(bytes){
    if(bytes === 0) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
  }

  function activateNav(){
    const current = location.pathname.replace(/\/$/, '') || '/index.html';
    $$('#primary-nav a').forEach(a => {
      if(a.getAttribute('href') === current) a.style.borderColor = 'var(--accent)';
    });
    const select = document.getElementById('theme-select');
    if(select){
      select.value = state.theme;
      select.addEventListener('change', e => setTheme(e.target.value));
    }
    const menu = document.getElementById('menu-toggle');
    const nav = document.getElementById('primary-nav');
    if(menu && nav){
      menu.addEventListener('click', ()=>{
        const isOpen = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', String(isOpen));
      });
    }
  }

  function ensureModalRoot(){
    let root = document.getElementById('modal-root');
    if(root) return root;
    root = document.createElement('div');
    root.id = 'modal-root';
    root.className = 'modal-root';
    document.body.appendChild(root);
    return root;
  }

  function openModal(title, html, opts={}){
    const root = ensureModalRoot();
    root.innerHTML = `
      <div class="modal-backdrop" data-close="1"></div>
      <section class="modal" role="dialog" aria-modal="true" aria-label="${title.replace(/"/g,'&quot;')}">
        <div class="modal-header">
          <strong class="panel-title">${title}</strong>
          <button class="close-btn" type="button">Close</button>
        </div>
        <div class="modal-content markdown ${opts.extraClass || ''}">${html}</div>
      </section>`;
    root.classList.add('open');
    state.modalOpen = true;
    root.addEventListener('click', onModalClick, { once: false });
    const closeBtn = root.querySelector('.close-btn');
    if(closeBtn) closeBtn.focus();
  }

  function closeModal(){
    const root = ensureModalRoot();
    root.classList.remove('open');
    root.innerHTML = '';
    state.modalOpen = false;
  }

  function onModalClick(e){
    if(e.target.matches('[data-close], .close-btn')) closeModal();
  }

  async function fetchText(url){
    const res = await fetch(url, { cache: 'no-cache' });
    if(!res.ok) throw new Error('Failed to load ' + url);
    return await res.text();
  }
  async function fetchJson(url){
    const res = await fetch(url, { cache: 'no-cache' });
    if(!res.ok) throw new Error('Failed to load ' + url);
    return await res.json();
  }

  async function initHome(){
    const out = document.getElementById('typewriter');
    if(!out) return;
    let ip = 'Unavailable';
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      if(resp.ok){ const data = await resp.json(); ip = data.ip || ip; }
    } catch(_) {}
    const info = [
      '> BOOTSTRAP_SEQUENCE: OK',
      `> CLIENT_IP: ${ip}`,
      `> BROWSER: ${navigator.userAgent}`,
      `> PLATFORM: ${navigator.platform || 'Unknown'}`,
      `> LANGUAGE: ${navigator.language || 'Unknown'}`,
      `> LOCAL_TIME: ${formatDateTime()}`,
      '> STATUS: GRID LINK ESTABLISHED',
      '> LOAD PATHS: /news /projects /about /tools'
    ].join('\n');
    let i = 0;
    const cursor = '<span class="cursor" aria-hidden="true"></span>';
    const tick = () => {
      out.innerHTML = info.slice(0, i).replace(/\n/g, '<br>') + cursor;
      if(i < info.length){
        i += 1;
        setTimeout(tick, i % 7 === 0 ? 40 : 16);
      }
    };
    tick();
    const statTime = document.getElementById('home-time');
    if(statTime) statTime.textContent = formatDateTime();
    const statBrowser = document.getElementById('home-browser');
    if(statBrowser) statBrowser.textContent = navigator.userAgent.split(' ').slice(0, 3).join(' ');
    const statViewport = document.getElementById('home-viewport');
    if(statViewport) statViewport.textContent = `${window.innerWidth}×${window.innerHeight}`;
  }

  async function loadListPage(kind){
    const container = document.getElementById(kind + '-list');
    if(!container) return;
    const searchInput = document.getElementById(kind + '-search');
    const data = await fetchJson(`/content/${kind}/index.json`);
    let activeTag = 'all';
    const allTags = Array.from(new Set(data.flatMap(item => item.tags || [])));
    const chips = document.getElementById(kind + '-chips');
    if(chips){
      chips.innerHTML = ['all', ...allTags].map(tag => `<button class="filter-chip" data-tag="${tag}">${tag}</button>`).join('');
      chips.addEventListener('click', e => {
        const btn = e.target.closest('[data-tag]');
        if(!btn) return;
        activeTag = btn.dataset.tag;
        render();
      });
    }

    function filtered(){
      const q = (searchInput?.value || '').toLowerCase().trim();
      return data.filter(item => {
        const hay = [item.title, item.summary, ...(item.tags || [])].join(' ').toLowerCase();
        const tagOk = activeTag === 'all' || (item.tags || []).includes(activeTag);
        return tagOk && (!q || hay.includes(q));
      });
    }

    function render(){
      const items = filtered();
      container.innerHTML = items.map(item => `
        <article class="list-item" data-id="${item.id}">
          <div class="status-inline"><span>${item.date}</span><span>${(item.tags || []).join(' • ')}</span></div>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
        </article>`).join('') || '<div class="center-stack muted">No results.</div>';
    }

    container.addEventListener('click', async e => {
      const card = e.target.closest('[data-id]');
      if(!card) return;
      location.hash = card.dataset.id;
    });
    searchInput?.addEventListener('input', render);
    render();

    async function maybeOpenFromHash(){
      const id = location.hash.replace(/^#/, '');
      if(!id) return;
      const item = data.find(x => x.id === id);
      if(!item) return;
      const md = await fetchText(item.file);
      openModal(item.title, window.SimpleMarkdown.parse(md));
    }
    window.addEventListener('hashchange', maybeOpenFromHash);
    await maybeOpenFromHash();
  }

  async function initAboutPage(){
    const launch = document.getElementById('open-about');
    const open = async ()=>{
      const md = await fetchText('/content/about.md');
      openModal('About', window.SimpleMarkdown.parse(md));
    };
    launch?.addEventListener('click', open);
    await open();
  }

  function randomLowercaseUnique(n){
    const alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const out = [];
    while(out.length < n){
      const idx = Math.floor(Math.random() * alpha.length);
      out.push(alpha.splice(idx, 1)[0]);
    }
    return out;
  }

  function generatePassword(){
    const chars = [];
    for(let i=0;i<3;i++) chars.push(...randomLowercaseUnique(6));
    const indexes = [...Array(chars.length).keys()];
    const first = indexes.splice(Math.floor(Math.random()*indexes.length),1)[0];
    const second = indexes.splice(Math.floor(Math.random()*indexes.length),1)[0];
    chars[first] = String(Math.floor(Math.random()*10));
    chars[second] = chars[second].toUpperCase();
    return `${chars.slice(0,6).join('')}-${chars.slice(6,12).join('')}-${chars.slice(12,18).join('')}`;
  }

  function downloadCsv(filename, rows){
    const csv = rows.map(row => row.map(value => {
      const v = value == null ? '' : String(value);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function initPasswordTool(){
    const output = document.getElementById('password-output');
    const genBtn = document.getElementById('generate-password');
    const csvBtn = document.getElementById('download-password-csv');
    if(!output || !genBtn || !csvBtn) return;
    const setPw = ()=> output.textContent = generatePassword();
    genBtn.addEventListener('click', setPw);
    csvBtn.addEventListener('click', ()=>{
      const username = document.getElementById('username')?.value || '';
      const website = document.getElementById('website')?.value || '';
      const password = output.textContent || generatePassword();
      downloadCsv('credentials.csv', [
        ['username','website','password','generated_at'],
        [username, website, password, new Date().toISOString()]
      ]);
    });
    setPw();
  }

  async function initDownloads(){
    const list = document.getElementById('downloads-list');
    if(!list) return;
    const data = await fetchJson('/content/downloads/downloads.json');
    list.innerHTML = data.map(item => `
      <article class="download-item">
        <div class="status-inline"><span>${item.date}</span><span>${bytesToSize(item.size)}</span></div>
        <h3>${item.title}</h3>
        <p>${item.notes || ''}</p>
        <div class="download-meta">SHA256: <code>${item.sha256 || 'n/a'}</code></div>
        <div><a class="btn" href="${item.url}" download>Download</a></div>
      </article>`).join('');
  }

  async function initGallery(){
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    const data = await fetchJson('/content/gallery/gallery.json');
    grid.innerHTML = data.map(item => `
      <article class="gallery-card" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}">
        <h3>${item.title}</h3>
        <p>${item.summary || ''}</p>
      </article>`).join('');
    grid.addEventListener('click', async e => {
      const card = e.target.closest('[data-id]');
      if(!card) return;
      const item = data.find(x => x.id === card.dataset.id);
      if(!item) return;
      const md = await fetchText(item.notesFile);
      const detail = `<img src="${item.image}" alt="${item.title}" style="width:100%;border-radius:14px;border:1px solid var(--line);filter:saturate(0) hue-rotate(55deg) brightness(0.75) contrast(1.15) sepia(0.25);margin-bottom:12px;">${window.SimpleMarkdown.parse(md)}`;
      openModal(item.title, detail);
    });
  }

  async function initMarkdownPanel(endpoint, targetId){
    const target = document.getElementById(targetId);
    if(!target) return;
    const md = await fetchText(endpoint);
    target.innerHTML = window.SimpleMarkdown.parse(md);
  }

  async function init(){
    setTheme(state.theme);
    await loadPartial('header-slot', '/partials/header.html');
    await loadPartial('footer-slot', '/partials/footer.html');
    activateNav();
    updateFooterClock();
    setInterval(updateFooterClock, 1000);
    const page = document.body.dataset.page;
    if(page === 'home') await initHome();
    if(page === 'news') await loadListPage('news');
    if(page === 'projects') await loadListPage('projects');
    if(page === 'about') await initAboutPage();
    if(page === 'tool-password') initPasswordTool();
    if(page === 'tool-downloads') await initDownloads();
    if(page === 'tool-gallery') await initGallery();
    if(page === 'tool-contact') await initMarkdownPanel('/content/contact.md', 'contact-panel');
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && state.modalOpen) closeModal();
    });
  }

  window.AresSite = { openModal, closeModal };
  document.addEventListener('DOMContentLoaded', init);
})();
