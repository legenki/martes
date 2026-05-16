// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// TEXTURE TAB
// ═══════════════════════════════════════════════════════════════
(function initTextures() {
  const BASE_THUMB = 'textures/thumb/thumb-';
  const BASE_FULL  = 'textures/full/';
  const TOTAL      = 360;
  const PER_PAGE   = 6;   // canvas 2×3 grid

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function pad(n) { return String(n).padStart(3, '0'); }

  const grid      = document.getElementById('texGrid');
  const paginEl   = document.getElementById('texPagination');
  const searchEl  = document.getElementById('texSearch');
  const countEl   = document.getElementById('texCount');
  const btnNum    = document.getElementById('texSortNum');
  const btnRand   = document.getElementById('texSortRandom');

  let masterOrder = Array.from({length: TOTAL}, (_, i) => i + 1); // 1–360
  let filtered    = [...masterOrder];
  let currentPage = 1;

  function totalPages() { return Math.ceil(filtered.length / PER_PAGE); }

  // ── render grid for current page ────────────────────────────
  function renderGrid() {
    const start = (currentPage - 1) * PER_PAGE;
    const slice = filtered.slice(start, start + PER_PAGE);

    function download(p) {
      const a = Object.assign(document.createElement('a'), {
        href: `${BASE_FULL}${p}.jpg`,
        download: `texture-${p}.jpg`
      });
      document.body.appendChild(a); a.click(); a.remove();
    }

    grid.innerHTML = '';
    slice.forEach((n, idx) => {
      const p = pad(n);
      const item = document.createElement('div');
      item.className = 'tex-item';

      const img = document.createElement('img');
      img.loading = idx < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.alt = `Texture #${p}`;
      img.src = `${BASE_THUMB}${p}.jpg`;

      const numEl = document.createElement('div');
      numEl.className = 'tex-num';
      numEl.textContent = `#${p}`;

      const dlBtn = document.createElement('button');
      dlBtn.className = 'tex-dl-btn';
      dlBtn.title = `Download #${p}`;
      dlBtn.setAttribute('aria-label', `Download texture ${p}`);
      dlBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2v6M3 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      dlBtn.addEventListener('click', e => { e.stopPropagation(); download(p); });

      item.addEventListener('click', () => download(p));
      item.appendChild(img);
      item.appendChild(numEl);
      item.appendChild(dlBtn);
      grid.appendChild(item);
    });

    grid.scrollTop = 0;
    renderPagination();
    countEl.textContent = filtered.length === TOTAL
      ? `${TOTAL} textures`
      : `${filtered.length} / ${TOTAL}`;
  }

  // ── pagination bar ───────────────────────────────────────────
  function renderPagination() {
    const tp = totalPages();
    paginEl.innerHTML = '';
    if (tp <= 1) return;

    function btn(label, page, isActive, isDisabled, ariaLabel) {
      const b = document.createElement('button');
      b.className = 'tex-pg-btn' + (isActive ? ' active' : '');
      b.textContent = label;
      b.disabled = isDisabled;
      if (ariaLabel) b.setAttribute('aria-label', ariaLabel);
      if (isActive)  b.setAttribute('aria-current', 'page');
      if (!isDisabled && !isActive) {
        b.addEventListener('click', () => { currentPage = page; renderGrid(); });
      }
      return b;
    }
    function ellipsis() {
      const s = document.createElement('span');
      s.className = 'tex-pg-ellipsis';
      s.textContent = '…';
      return s;
    }

    // Prev
    paginEl.appendChild(btn('‹', currentPage - 1, false, currentPage === 1, 'Previous page'));

    // Page numbers with smart ellipsis
    const pages = [];
    for (let i = 1; i <= tp; i++) {
      if (i === 1 || i === tp || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      }
    }
    let prev = 0;
    pages.forEach(p => {
      if (prev && p - prev > 1) paginEl.appendChild(ellipsis());
      paginEl.appendChild(btn(p, p, p === currentPage, p === currentPage));
      prev = p;
    });

    // Next
    paginEl.appendChild(btn('›', currentPage + 1, false, currentPage === tp, 'Next page'));
  }

  // ── filter + sort ────────────────────────────────────────────
  function applyFilter() {
    const q = searchEl.value.trim();
    filtered = q
      ? masterOrder.filter(n => pad(n).includes(q) || String(n).includes(q))
      : [...masterOrder];
    currentPage = 1;
    renderGrid();
  }

  // ── sort buttons ─────────────────────────────────────────────
  btnNum.addEventListener('click', () => {
    masterOrder = Array.from({length: TOTAL}, (_, i) => i + 1);
    btnNum.classList.add('active');
    btnRand.classList.remove('active');
    applyFilter();
  });
  btnRand.addEventListener('click', () => {
    masterOrder = shuffle(Array.from({length: TOTAL}, (_, i) => i + 1));
    btnRand.classList.add('active');
    btnNum.classList.remove('active');
    applyFilter();
  });

  // ── search ───────────────────────────────────────────────────
  let searchTimer;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilter, 180);
  });

  // ── lazy init: called by core.js when Textures tab is opened ─
  let built = false;
  window.initTexturesGrid = function() {
    if (!built) { built = true; renderGrid(); }
  };
})();
