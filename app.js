(() => {
  const M = window.MODELS, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const A = window.ASSET_BASE || 'assets/';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOVER = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPhone = () => innerWidth <= 760;
  const track = (event, data = {}) => window.dataLayer.push({ event, ...data });
  const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

  /* nav */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* entrada */
  requestAnimationFrame(() => document.body.classList.add('is-in'));

  /* ---------- galeria ---------- */
  const grid = $('#grid');
  grid.innerHTML = M.map((m, i) => `
    <button class="card is-big" type="button" data-i="${i}" style="--c:${m.accent}" aria-label="Abrir ${m.name} ao vivo">
      <div class="c-media">
        <img src="${A}thumbs/${m.id}.webp" alt="Site modelo ${m.name}, primeira tela" loading="eager" width="960" height="600">
        ${HOVER && !RM ? `<video muted playsinline loop preload="none" data-src="${A}video/${m.id}-d.mp4" aria-hidden="true"></video>` : ''}
        <span class="c-live"><span class="pulse" aria-hidden="true"></span>Abrir ao vivo</span>
      </div>
      <div class="c-body">
        <span class="c-num">${String(i + 1).padStart(2, '0')}</span>
        <p class="c-name">${m.name}</p>
        <p class="c-niche">${m.niche} · ${m.place}</p>
        <p class="c-sig">${m.sig}</p>
        <ul class="c-tags">${m.tags.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    </button>`).join('') + `
    <a class="card card-next" href="#sample" data-cta="gallery-next">
      <span class="cn-num">${String(M.length + 1).padStart(2, '0')}</span>
      <span class="cn-txt"><span class="cn-k">Próximo modelo</span><span class="cn-h">O próximo pode ser <em>o seu.</em></span><span class="cn-p">Clínica, ótica, imobiliária, restaurante, escritório… a gente adapta o formato para o seu segmento.</span></span>
      <span class="btn">Quero minha amostra grátis <span class="arr" aria-hidden="true">→</span></span>
    </a>`;

  $$('button.card').forEach(card => {
    card.addEventListener('click', () => openViewer(+card.dataset.i, card));
    const v = card.querySelector('video');
    if (!v) return;
    card.addEventListener('mouseenter', () => {
      if (!v.src) v.src = v.dataset.src;
      v.currentTime = 0; v.play().then(() => card.classList.add('is-playing')).catch(() => {});
    });
    card.addEventListener('mouseleave', () => { card.classList.remove('is-playing'); v.pause(); });
  });

  /* revelação ao rolar */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.card, .step, .sec-head, .contact-in, .plan, .why, .faq-list').forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', (el.classList.contains('card') ? (i % 3) * .08 : 0) + 's'); io.observe(el); });

  /* linha de progresso dos passos */
  const steps = $('#steps');
  const stepLine = () => {
    const r = steps.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .3)));
    $('#stepsFill').style.setProperty('--p', (p * 100).toFixed(1) + '%');
  };
  addEventListener('scroll', stepLine, { passive: true }); stepLine();

  /* ---------- destaque do hero: MacBook e iPhone mostram sempre o mesmo modelo ---------- */
  const FEAT = ['cruzenergy', 'reliv'];
  // cantos das telas (TL, TR, BR, BL) em % da imagem dos aparelhos
  const QUAD = { mac: [[26.0543, 4.8981], [80.8794, 11.017], [76.7939, 65.2349], [22.5863, 54.4441]],
                 phone: [[79.6062, 41.6833], [94.9301, 43.2011], [90.5163, 95.5065], [75.5603, 91.5726]] };
  const rig = $('#rig'), stage = $('#stage'), par = $('#hdPar');
  const SCR = $$('.scr').map(el => ({ el, kind: el.classList.contains('scr-m') ? 'm' : 'd', v: [...el.querySelectorAll('video')], cur: 0 }));
  const vq = k => { const w = par.clientWidth * (k === 'm' ? .155 : .55) * (devicePixelRatio || 1); return w > (k === 'm' ? 260 : 900) ? 'hd' : 'sd'; };
  const vsrc = (id, k) => `${A}hero/v/${id}-${k}-${vq(k)}.mp4`, psrc = (id, k) => `${A}hero/v/${id}-${k}.webp`;
  function homography(w, h, q) {
    const src = [[0, 0], [w, 0], [w, h], [0, h]], Mx = [], B = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = q[i];
      Mx.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u);
      Mx.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(Mx[r][c]) > Math.abs(Mx[p][c])) p = r;
      [Mx[c], Mx[p]] = [Mx[p], Mx[c]]; [B[c], B[p]] = [B[p], B[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = Mx[r][c] / Mx[c][c]; for (let k = c; k < 8; k++) Mx[r][k] -= f * Mx[c][k]; B[r] -= f * B[c]; }
    }
    const [a, b, c, d, e, f, g, hh] = B.map((v, i) => v / Mx[i][i]);
    return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
  }
  function mapScreens() {
    const W = par.clientWidth, H = par.clientHeight; if (!W) return;
    SCR.forEach(s => {
      const q = QUAD[s.kind === 'm' ? 'phone' : 'mac'].map(([x, y]) => [x / 100 * W, y / 100 * H]);
      s.el.style.transform = homography(s.el.offsetWidth, s.el.offsetHeight, q);
      s.el.classList.add('is-set');
    });
  }
  new ResizeObserver(mapScreens).observe(par); mapScreens();

  let fi = 0, ftimer, inView = true, vStarted = false, swapId = 0;
  const DUR = 7000;
  const live = () => SCR.map(s => s.v[s.cur]);
  const vOpen = () => document.getElementById('viewer').classList.contains('is-open');
  const playHero = () => { if (RM || !vStarted || !inView || vOpen()) return; live().forEach(v => v.play().catch(() => {})); };
  const ready = v => new Promise(r => { if (RM || v.readyState >= 2) return r(); const t = setTimeout(r, 900); v.addEventListener('loadeddata', () => { clearTimeout(t); r(); }, { once: true }); });
  function startVideos() {
    if (RM || vStarted) return; vStarted = true;
    SCR.forEach(s => { const v = s.v[s.cur]; v.preload = 'auto'; v.src = vsrc(FEAT[fi], s.kind); });
    playHero();
  }
  if (document.readyState === 'complete') setTimeout(startVideos, 300); else addEventListener('load', () => setTimeout(startVideos, 300), { once: true });
  async function setFeat(i, user) {
    fi = (i + FEAT.length) % FEAT.length;
    const id = FEAT[fi], my = ++swapId;
    $$('.feat-tab').forEach((t, k) => { t.classList.toggle('is-on', k === fi); t.setAttribute('aria-selected', k === fi); const b = t.querySelector('.ft-bar i'); b.style.animation = 'none'; b.offsetWidth; b.style.animation = ''; });
    const next = SCR.map(s => { const v = s.v[1 - s.cur]; v.poster = psrc(id, s.kind); if (!RM && vStarted) { v.preload = 'auto'; v.src = vsrc(id, s.kind); v.currentTime = 0; } else { v.removeAttribute('src'); v.load(); } return v; });
    await Promise.all(next.map(ready));
    if (my !== swapId) return;
    next.forEach(v => { if (!RM && vStarted && inView && !vOpen()) v.play().catch(() => {}); });
    SCR.forEach((s, k) => { const old = s.v[s.cur]; s.cur = 1 - s.cur; next[k].classList.add('is-on'); old.classList.remove('is-on'); setTimeout(() => { if (my === swapId) old.pause(); }, 650); });
    clearTimeout(ftimer);
    if (!RM) ftimer = setTimeout(() => setFeat(fi + 1), DUR);
    if (user) track('featured_select', { model: id });
  }
  $$('.feat-tab').forEach((t, k) => t.addEventListener('click', () => { clearTimeout(ftimer); setFeat(k, true); }));
  document.documentElement.style.setProperty('--dur', DUR + 'ms');
  if (RM) $$('.ft-bar').forEach(b => b.style.display = 'none');
  if (!RM) ftimer = setTimeout(() => setFeat(1), DUR);
  const openFeat = () => openViewer(M.findIndex(x => x.id === FEAT[fi]));
  $('#stageOpen').addEventListener('click', e => { e.stopPropagation(); openFeat(); });
  $('#heroLive').addEventListener('click', openFeat);
  rig.addEventListener('click', openFeat);
  if (HOVER && !RM) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      par.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      par.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => { par.style.removeProperty('--px'); par.style.removeProperty('--py'); });
    addEventListener('scroll', () => { if (scrollY < innerHeight * 1.2) par.style.setProperty('--sy', (scrollY * -.06).toFixed(1) + 'px'); }, { passive: true });
  }
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) playHero(); else live().forEach(v => v.pause()); }).observe(stage);

  /* ---------- visualizador ---------- */
  const V = $('#viewer'), dev = $('#dev'), frame = $('#vFrame'), vStage = $('#vStage');
  let cur = -1, mode = 'desktop', lastFocus = null;

  const modes = $('.v-modes'), modesHome = modes.parentNode, modesNext = modes.nextElementSibling, mbar = $('.v-mobilebar');
  function fit() {
    if (V.hidden) return;
    if (isPhone() && modes.parentNode !== mbar) mbar.prepend(modes);
    else if (!isPhone() && modes.parentNode !== modesHome) modesHome.insertBefore(modes, modesNext);
    const fill = isPhone() && mode === 'mobile';
    dev.classList.toggle('is-fill', fill);
    if (fill) { dev.style.transform = ''; return; }
    const cs = getComputedStyle(vStage);
    const sw = vStage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const sh = vStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (isPhone() ? 0 : 24);
    const w = mode === 'desktop' ? 1442 : 390 + 26, h = mode === 'desktop' ? 900 + 40 : 844 + 26;
    const s = Math.min(sw / w, sh / h, 1);
    dev.style.transform = `scale(${s.toFixed(4)})`;
    dev.style.margin = `${-(h * (1 - s)) / 2}px ${-(w * (1 - s)) / 2}px`;
  }

  function load(i) {
    cur = (i + M.length) % M.length;
    const m = M[cur];
    $('#vNum').textContent = String(cur + 1).padStart(2, '0');
    $('#vName').textContent = m.name;
    $('#vNiche').textContent = `${m.niche} · ${m.place}`;
    $('#vSig').textContent = m.sig;
    $('#vTags').innerHTML = m.tags.map(t => `<li>${t}</li>`).join('');
    $('#vLang').textContent = 'Modelo ao vivo';
    $('#vOpen').href = $('#vOpenM').href = m.url;
    $('#vUrl').textContent = host(m.live);
    $('#vPoster').src = `${A}thumbs/${m.id}${mode === 'mobile' ? '-m' : ''}.webp`;
    dev.classList.remove('is-ready');
    frame.src = m.live;
    try { history.replaceState(null, '', '#modelo/' + m.id); } catch (_) {}
    track('viewer_open', { model: m.id, mode });
  }
  frame.addEventListener('load', () => { if (frame.src && frame.src !== 'about:blank') dev.classList.add('is-ready'); });

  function setMode(md, reload) {
    mode = md;
    dev.dataset.mode = md;
    $$('.v-mode').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === md));
    $('#vHint').textContent = md === 'desktop' ? 'É o site real, no tamanho de um computador. Role dentro dele.' : 'É o site real, no tamanho de um celular. Role dentro dele.';
    fit();
    if (reload && cur > -1) load(cur);
  }
  $$('.v-mode').forEach(b => b.addEventListener('click', () => { if (b.dataset.mode !== mode) { setMode(b.dataset.mode, true); track('viewer_mode', { mode: b.dataset.mode }); } }));

  function openViewer(i, from) {
    lastFocus = from || document.activeElement;
    V.hidden = false; document.body.classList.add('v-lock');
    setMode(isPhone() ? 'mobile' : 'desktop');
    load(i);
    requestAnimationFrame(() => { V.classList.add('is-open'); fit(); $('#vClose').focus(); });
    live().forEach(v => v.pause()); clearTimeout(ftimer);
  }
  function closeViewer(toContact) {
    V.classList.remove('is-open');
    setTimeout(() => { V.hidden = true; frame.src = 'about:blank'; dev.classList.remove('is-ready'); }, RM ? 0 : 300);
    document.body.classList.remove('v-lock');
    try { history.replaceState(null, '', toContact ? '#sample' : location.pathname); } catch (_) {}
    if (toContact) { const id = M[cur] && M[cur].id; if (id && window.prefillModel) window.prefillModel(id); $('#sample').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); }
    else if (lastFocus) lastFocus.focus({ preventScroll: true });
    playHero(); clearTimeout(ftimer); if (!RM) ftimer = setTimeout(() => setFeat(fi + 1), DUR);
  }
  $('#vClose').addEventListener('click', () => closeViewer());
  $('#vPrev').addEventListener('click', () => load(cur - 1));
  $('#vNext').addEventListener('click', () => load(cur + 1));
  ['#vCta', '#vCtaM'].forEach(s => $(s).addEventListener('click', e => { e.preventDefault(); track('cta_click', { from: 'viewer', model: M[cur].id }); closeViewer(true); }));
  ['#vOpen', '#vOpenM'].forEach(s => $(s).addEventListener('click', () => track('open_full_site', { model: M[cur].id })));
  addEventListener('keydown', e => {
    if (V.hidden) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight' && document.activeElement !== frame) load(cur + 1);
    if (e.key === 'ArrowLeft' && document.activeElement !== frame) load(cur - 1);
    if (e.key === 'Tab') {
      const f = $$('#viewer button, #viewer a[href], #viewer iframe').filter(el => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('resize', fit);

  $$('[data-cta]').forEach(a => a.addEventListener('click', () => track('cta_click', { from: a.dataset.cta })));

  /* ---------- formulário da amostra grátis ---------- */
  const C = window.CONTACT || {}, form = $('#sampleForm'), sel = $('#fModel'), ok = $('#fOk');
  const wa = (C.whatsapp || '').replace(/\D/g, '');
  sel.innerHTML = '<option value="">Ainda não sei, me ajuda a escolher</option>' + M.map(m => `<option value="${m.id}">${m.name} (${m.niche})</option>`).join('');
  window.prefillModel = id => { sel.value = id; sel.classList.add('is-prefilled'); setTimeout(() => sel.classList.remove('is-prefilled'), 1600); };

  // máscara simples de telefone brasileiro
  const tel = form.querySelector('[name="phone"]');
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
      : d.length > 6 ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      : d.length > 2 ? d.replace(/(\d{2})(\d{0,5})/, '($1) $2') : d;
  });

  if (wa || C.email) {
    $('#direct').hidden = false;
    if (wa) $('#directWa').href = `https://wa.me/${wa}?text=${encodeURIComponent('Olá! Vim pela página da Marketing Vision e quero saber mais sobre a landing page.')}`;
    else { $('#directWa').remove(); $('#directOr').remove(); }
    if (C.email) $('#directMail').href = 'mailto:' + C.email; else { $('#directMail').remove(); $('#directOr') && $('#directOr').remove(); }
    $('#directWa') && ($('#directWa').target = '_blank');
  }
  let started = false;
  form.addEventListener('input', () => { if (!started) { started = true; track('sample_form_start'); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...form.querySelectorAll('[required]')].filter(el => !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) || (el.type === 'tel' && el.value.replace(/\D/g, '').length < 10));
    form.querySelectorAll('.f').forEach(f => f.classList.remove('is-bad'));
    bad.forEach(el => el.closest('.f').classList.add('is-bad'));
    $('#fErr').hidden = !bad.length;
    if (bad.length) { bad[0].focus(); track('sample_form_error', { fields: bad.map(b => b.name).join(',') }); return; }
    const d = Object.fromEntries(new FormData(form));
    const mm = M.find(m => m.id === d.model);
    const msg = [
      '*Pedido de amostra grátis*',
      `Negócio: ${d.business}`, `O que faz: ${d.niche}`, `Cidade/Estado: ${d.city}`,
      `WhatsApp: ${d.phone}`, `E-mail: ${d.email}`,
      `Modelo que gostou: ${mm ? mm.name : 'Ainda não sei'}`,
      d.link ? `Site/Instagram: ${d.link}` : '', d.notes ? `Observações: ${d.notes}` : ''
    ].filter(Boolean).join('\n');
    track('sample_form_submit', { model: d.model || 'none', niche: d.niche, city: d.city });
    if (wa) {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      $('#fOkTxt').textContent = 'Abrimos o WhatsApp com o seu pedido. É só enviar a mensagem para a gente começar a sua amostra.';
    } else if (C.email) {
      location.href = `mailto:${C.email}?subject=${encodeURIComponent('Pedido de amostra grátis: ' + d.business)}&body=${encodeURIComponent(msg)}`;
      $('#fOkTxt').textContent = 'Abrimos o seu e-mail com o pedido. É só enviar para a gente começar a sua amostra.';
    } else {
      $('#fOkTxt').textContent = 'Recebemos os dados do seu pedido. (Prévia: o WhatsApp da agência ainda não foi configurado nesta página.)';
    }
    form.hidden = true; ok.hidden = false; ok.focus && ok.setAttribute('tabindex', '-1'); ok.focus();
  });
  $('#fAgain').addEventListener('click', () => { ok.hidden = true; form.hidden = false; form.querySelector('input').focus(); });

  /* link direto: #modelo/<id> */
  const m0 = location.hash.match(/^#modelo\/(.+)$/);
  if (m0) { const k = M.findIndex(x => x.id === m0[1]); if (k > -1) openViewer(k); }
})();
