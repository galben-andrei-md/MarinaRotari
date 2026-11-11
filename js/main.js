/* Marina Rotari — logica site-ului
   Meniu mobil · animații la scroll · galerie foto (lightbox) · video · intro · efecte de mișcare */

(function(){
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $('#yr').textContent = new Date().getFullYear();

  /* split headings into masked letters / words (before reveal observer runs) */
  const split = (el, chars) => {
    if (!el) return;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
        const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        (chars ? [...part] : [part]).forEach(t => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = t; w.appendChild(s); });
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
    walk(el); el.classList.add('split');
  };
  split($('.hero h1'), true);
  $$('.sec-head h2, .about-text h2, .contact h2').forEach(h => split(h, false));
  $$('#menu li').forEach((li, i) => li.style.setProperty('--i', i));
  $$('.masonry').forEach(g => $$('button', g).forEach((b, i) => { if (i % 2) b.style.transitionDelay = '.12s'; }));

  /* header shadow on scroll */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* mobile menu */
  const burger = $('#burger');
  const setNav = open => { document.body.classList.toggle('nav-open', open); burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setNav(false)));

  /* active link */
  const links = $$('#menu a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }), {rootMargin:'-45% 0px -50% 0px'});
  ['brutarie','crosetat','croitorie','video','despre'].forEach(id => spy.observe(document.getElementById(id)));

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  $$('.rv').forEach(el => io.observe(el));
  io.observe($('.steps'));

  /* lightbox */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let items = [], idx = 0, lastFocus = null;
  const show = i => {
    idx = (i + items.length) % items.length;
    lbImg.src = items[idx].src; lbImg.alt = items[idx].cap;
    lbCap.textContent = items[idx].cap;
    lbCount.textContent = items.length > 1 ? (idx+1) + ' / ' + items.length : '';
    $('#lbPrev').hidden = $('#lbNext').hidden = items.length < 2;
    if (!reduce && lb.classList.contains('open') && lbImg.animate)
      lbImg.animate([{opacity:0, transform:'scale(.96)'}, {opacity:1, transform:'none'}], {duration:380, easing:'cubic-bezier(.2,.8,.2,1)'});
  };
  const open = (list, i) => { items = list; lastFocus = document.activeElement; show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; $('#lbClose').focus(); };
  const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; lastFocus && lastFocus.focus(); };
  $$('[data-gallery]').forEach(g => {
    const btns = $$('button', g);
    const list = btns.map(b => { const im = $('img', b); return {src: im.getAttribute('src').replace('/thumbs/', '/'), cap: ($('figcaption', b)||{}).textContent || im.alt}; });
    btns.forEach((b, i) => b.addEventListener('click', () => open(list, i)));
  });
  /* "vezi mai multe" for long galleries */
  $$('[data-limit]').forEach(g => {
    const lim = +g.dataset.limit, btns = $$('button', g);
    if (btns.length <= lim) return;
    btns.slice(lim).forEach(b => b.classList.add('is-extra'));
    const wrap = document.createElement('div'); wrap.className = 'more-btn';
    const more = document.createElement('a'); more.href = '#'; more.className = 'btn btn-ghost';
    const label = () => g.classList.contains('expanded') ? 'Arată mai puține' : 'Vezi încă ' + (btns.length - lim) + ' fotografii';
    more.textContent = label();
    more.addEventListener('click', e => {
      e.preventDefault();
      g.classList.toggle('expanded'); more.textContent = label();
      if (g.classList.contains('expanded')) {
        const extra = btns.slice(lim);
        extra.forEach((b, k) => { b.classList.remove('in'); b.style.transitionDelay = (k % 2) * 0.12 + 's'; });
        requestAnimationFrame(() => requestAnimationFrame(() => extra.forEach(b => b.classList.add('in'))));
      } else g.scrollIntoView({behavior:'smooth', block:'start'});
    });
    wrap.appendChild(more);
    const col = document.createElement('div');
    g.parentNode.insertBefore(col, g); col.append(g, wrap);
  });
  $$('[data-single]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open([{src:a.dataset.single, cap:a.dataset.caption}], 0); }));
  $('#lbClose').onclick = close;
  $('#lbPrev').onclick = () => show(idx-1);
  $('#lbNext').onclick = () => show(idx+1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx-1);
    if (e.key === 'ArrowRight') show(idx+1);
  });
  let tx = null;
  lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, {passive:true});
  lb.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); tx = null; });

  /* videos */
  const reels = $$('.reel');
  const stopAll = except => reels.forEach(r => { if (r !== except){ const v = $('video', r); v.pause(); v.controls = false; r.classList.remove('playing'); } });
  reels.forEach(r => {
    const v = $('video', r);
    $('.play', r).addEventListener('click', () => { stopAll(r); r.classList.add('playing'); v.controls = true; v.play(); });
    v.addEventListener('ended', () => { r.classList.remove('playing'); v.controls = false; v.load(); });
  });
  $$('.filter').forEach(f => f.addEventListener('click', () => {
    $$('.filter').forEach(x => x.classList.toggle('on', x === f));
    stopAll(null);
    reels.forEach(r => r.hidden = !(f.dataset.f === 'all' || r.dataset.cat === f.dataset.f));
    $('#reels').scrollTo({left:0, behavior:'smooth'});
  }));

  /* ================= MOTION LAYER ================= */
  const html = document.documentElement;

  /* intro loader (once per visit) */
  const loader = $('#loader');
  if (html.classList.contains('is-loading')) {
    const t0 = performance.now(); let done = false;
    const finish = () => {
      if (done) return; done = true;
      loader.classList.add('leaving'); html.classList.remove('is-loading');
      requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('out')));
      setTimeout(() => loader.remove(), 1200);
    };
    const heroImg = $('.arch.main img');
    const ready = [document.fonts ? document.fonts.ready : null, heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : null].filter(Boolean);
    Promise.all(ready).then(() => setTimeout(finish, Math.max(0, 1700 - (performance.now() - t0))));
    setTimeout(finish, 2600);
  } else if (loader) loader.remove();

  /* scroll: thread progress, parallax, velocity for the ribbon */
  const thread = $('.thread'), par = $$('[data-speed]');
  par.forEach(el => el._speed = parseFloat(el.dataset.speed));

  /* video posters load only when the video strip gets close */
  const pio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $$('video[data-poster]', e.target).forEach(v => { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); });
    pio.disconnect();
  }), {rootMargin: '600px 0px'});
  pio.observe($('#reels'));

  /* pause decorative CSS loops while their section is off-screen */
  const pauseIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('paused', !e.isIntersecting)));
  pauseIO.observe($('.hero')); pauseIO.observe($('.contact'));
  let lastY = scrollY, vel = 0, ticking = false;
  const scrollFx = () => {
    const y = scrollY, max = html.scrollHeight - innerHeight;
    thread.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    thread.classList.toggle('on', y > 40);
    if (!reduce) {
      /* read all positions first, then write: avoids forced layout per element */
      const vh = innerHeight;
      const reads = par.map(el => el.parentElement.getBoundingClientRect());
      par.forEach((el, k) => {
        const r = reads[k];
        if (r.bottom < -200 || r.top > vh + 200) return;
        const v = (-(r.top + r.height / 2 - vh / 2) * el._speed).toFixed(1);
        if (el._v !== v) { el._v = v; el.style.translate = '0 ' + v + 'px'; }
      });
    }
    ticking = false;
  };
  addEventListener('scroll', () => { vel += scrollY - lastY; lastY = scrollY; if (!ticking) { ticking = true; requestAnimationFrame(scrollFx); } }, {passive:true});
  addEventListener('resize', scrollFx); scrollFx();

  if (!reduce) {
    /* ribbon reacts to scroll speed & direction */
    const track = $('.ribbon-track'); track.style.animation = 'none';
    let x = 0, dir = 1, sm = 0, runR = false;
    const tickR = () => {
      if (!runR) return;
      if (vel) dir = vel > 0 ? 1 : -1;
      sm += (Math.min(Math.abs(vel), 80) - sm) * 0.1; vel = 0;
      const half = track.scrollWidth / 2;
      x -= (0.6 + sm * 0.4) * dir;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${(-Math.max(-12, Math.min(12, sm * 0.3 * dir))).toFixed(2)}deg)`;
      requestAnimationFrame(tickR);
    };
    new IntersectionObserver(([e]) => { runR = e.isIntersecting; vel = 0; if (runR) requestAnimationFrame(tickR); }).observe($('.ribbon'));

    /* flour dust drifting in the hero, pushed away by the pointer */
    const hero = $('.hero'), cv = document.createElement('canvas');
    cv.className = 'flour'; cv.setAttribute('aria-hidden', 'true'); hero.prepend(cv);
    const ctx = cv.getContext('2d'), cols = ['182,127,44', '163,70,90', '224,181,101', '255,255,255'];
    let W = 0, H = 0, mx = -999, my = -999, runF = false, parts = [];
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const mk = y => ({x: Math.random() * W, y: y == null ? Math.random() * H : y, r: Math.random() * 1.9 + .5, vy: -(Math.random() * .35 + .08), ph: Math.random() * 6.28, sw: Math.random() * .6 + .2, a: Math.random() * .45 + .15, c: cols[Math.random() * cols.length | 0], dx: 0, dy: 0});
    size(); parts = Array.from({length: W < 600 ? 26 : 55}, () => mk());
    addEventListener('resize', size);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mx = my = -999; });
    const draw = () => {
      if (!runF) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.ph += .012;
        const ex = p.x - mx, ey = p.y - my, d = Math.sqrt(ex * ex + ey * ey) + 1;
        if (d < 130) { const f = (1 - d / 130) * 1.6; p.dx += ex / d * f; p.dy += ey / d * f; }
        p.dx *= .92; p.dy *= .92;
        p.x += Math.sin(p.ph) * p.sw * .35 + p.dx; p.y += p.vy + p.dy;
        if (p.y < -10) Object.assign(p, mk(H + 10));
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    new IntersectionObserver(([e]) => { runF = e.isIntersecting; if (runF) requestAnimationFrame(draw); }).observe(hero);
  }

  if (fine && !reduce) {
    /* hero collage follows the mouse in depth layers */
    const art = $('.hero-art'); let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const step = () => {
      cx += (tx - cx) * .07; cy += (ty - cy) * .07;
      art.style.setProperty('--mx', cx.toFixed(3)); art.style.setProperty('--my', cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .002 ? requestAnimationFrame(step) : 0;
    };
    $('.hero').addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; if (!raf) raf = requestAnimationFrame(step); });

    /* 3D tilt with glare */
    $$('.step').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.setProperty('--rx', ((.5 - py) * 10).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - .5) * 12).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });

    /* magnetic buttons */
    $$('.btn-primary, .btn-rose').filter(el => !el.closest('.contact')).forEach(el => {
      let r = null;
      el.addEventListener('pointerenter', () => { r = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', e => { if (!r) return; el.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .35).toFixed(1)}px`; });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; r = null; });
    });

  }
})();
