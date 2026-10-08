(async () => {
  await window.contentReady;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const gallery = document.querySelector('.vibe');
  const community = document.querySelector('.community');
  const dialog = document.querySelector('dialog');
  const active = new Set();
  const seen = new WeakSet();
  let observer;
  let frame = 0;
  let enabled = false;
  let geometry;
  let motionScroll = null;
  let lastPaint = 0;
  let galleryPhase = 0;
  let galleryBoost = 0;
  let previousScroll = scrollY;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = 'cubic-bezier(.22,.61,.36,1)';

  function animate(node, frames, duration = 650, delay = 0, easing = ease) {
    if (!node || reduce.matches || document.hidden || !node.animate) return;
    const animation = node.animate(frames, {duration, delay, easing, fill:'backwards'});
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
    return animation;
  }
  function measure() {
    const h = hero.getBoundingClientRect();
    const g = gallery.getBoundingClientRect();
    const c = community.getBoundingClientRect();
    geometry = {heroTop:h.top + scrollY, heroHeight:h.height,
      communityTop:c.top + scrollY, communityHeight:c.height,
      galleryTop:g.top + scrollY, galleryHeight:g.height, viewport:innerHeight,
      topLoop:gallery.querySelector('.vibe-ribbon-top .vibe-set').getBoundingClientRect().width,
      bottomLoop:gallery.querySelector('.vibe-ribbon-bottom .vibe-set').getBoundingClientRect().width,
      width:Math.min(innerWidth,1600), mobile:innerWidth <= 650};
    schedule();
  }
  function paint(now) {
    frame = 0;
    if (!enabled || document.hidden || dialog.open || !geometry) return;
    const elapsed = Math.min(64, now - lastPaint || 16.7);
    lastPaint = now;
    if (motionScroll === null) motionScroll = scrollY;
    motionScroll += (scrollY - motionScroll) * (1 - Math.exp(-elapsed / 120));
    if (Math.abs(scrollY - motionScroll) < .1) motionScroll = scrollY;
    const {heroTop,heroHeight,galleryTop,galleryHeight,communityTop,communityHeight,viewport,width,mobile} = geometry;
    const progress = clamp((motionScroll - heroTop) / heroHeight);
    // Original unified collage motion, clipped by a stationary outer frame.
    hero.style.setProperty('--hero-photo-y', `${progress * (mobile ? 42 : 85)}px`);
    hero.style.setProperty('--hero-photo-scale', String(1 + progress * .025));
    hero.style.setProperty('--hero-copy-y', `${clamp((scrollY - heroTop) / heroHeight) * (mobile ? -12 : -34)}px`);
    // Keep a seamless automatic loop; scrolling adds speed in the same direction.
    const galleryVisible = scrollY + viewport > galleryTop && scrollY < galleryTop + galleryHeight;
    const galleryPlaying = galleryVisible && !gallery.hasAttribute('data-paused');
    if (galleryPlaying) {
      galleryBoost = Math.min(900, galleryBoost + Math.abs(scrollY - previousScroll) * 3);
      galleryPhase += elapsed / 1000 * (1 + galleryBoost / 45);
      galleryBoost *= Math.exp(-elapsed / 220);
      gallery.style.setProperty('--gallery-top-x', `${-(galleryPhase / 65 % 1) * geometry.topLoop}px`);
      gallery.style.setProperty('--gallery-bottom-x', `${-(galleryPhase / 80 % 1) * geometry.bottomLoop}px`);
    } else galleryBoost = 0;
    previousScroll = scrollY;
    const communityProgress = clamp((motionScroll + viewport - communityTop) / (viewport + communityHeight));
    const drift = (communityProgress - .5) * (mobile ? 16 : 36);
    community.style.setProperty('--photo-front-y', `${-drift}px`);
    community.style.setProperty('--photo-back-y', `${drift * .65}px`);
    if (motionScroll !== scrollY || galleryPlaying) schedule();
  }
  function schedule() {
    if (enabled && !frame) frame = requestAnimationFrame(paint);
  }
  const headings = '.events>h2,.vibe>h2,.menu-section>.section-title,.about>h2>span,.merch>.section-title,.community>.section-title';
  const cards = '.menu-card,.about-card,.product';
  const details = '.about-image,.about .ornament,.mascot,.about-proof,.merch-cover,.community-person,.about-intro,.merch-intro,.community-copy,.signup,.footer-contact,.footer-hours,.footer-nav,.social-block';
  // A moving stroke reveals the original textured artwork, including its loops.
  const lineRoutes = {
    'about-arm-left': 'M0 0 C3 28 8 30 26 39 S65 58 74 46 C83 34 48 35 53 77 C54 91 79 97 100 100',
    'about-arm-right': 'M0 100 C12 55 18 20 33 21 C43 20 49 34 45 56 C38 70 42 39 51 32 C69 15 85 1 100 0',
    'about-leg-left': 'M82 0 C94 0 90 23 81 24 C68 25 87 16 94 33 C105 52 101 72 83 85 C64 101 42 100 28 100 C12 100 4 95 0 91',
    'about-leg-right': 'M30 0 C13 15 0 32 1 53 C1 71 15 77 35 74 C50 72 49 66 39 72 C32 77 33 83 35 91 C39 106 77 97 100 91',
    'mobile-line-1': 'M6 0 C-4 12 0 19 15 32 C37 51 57 56 76 58 C100 62 107 55 81 52 C65 48 44 58 38 68 C36 74 57 90 100 100',
    'mobile-line-2': 'M0 100 C30 91 68 64 59 46 C52 35 50 48 59 56 C77 75 91 60 96 46 C101 28 97 9 99 0',
    'mobile-line-3': 'M100 0 C89 -4 80 13 77 14 C71 16 91 22 79 16 C57 8 26 20 11 31 C-13 51 8 70 22 81 C49 96 68 100 94 100',
    'mobile-line-4': 'M0 16 C35 -2 59 -5 78 8 C95 22 72 37 66 45 C60 52 87 35 75 41 C101 36 104 53 98 62 C83 82 67 95 56 100'
  };
  document.querySelectorAll('.mascot-limb,.mobile-about-line').forEach((img,index) => {
    const name = img.getAttribute('src').split('/').pop().replace('.svg','');
    const route = lineRoutes[name];
    if (!route) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    for (const attr of ['class','style','aria-hidden']) {
      if (img.hasAttribute(attr)) svg.setAttribute(attr,img.getAttribute(attr));
    }
    svg.classList.add('drawn-line');
    svg.setAttribute('viewBox','0 0 100 100');
    svg.setAttribute('preserveAspectRatio','none');
    svg.setAttribute('aria-hidden','true');
    const id = `line-reveal-${index}`;
    svg.innerHTML = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><path d="${route}" fill="none" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></mask></defs><image href="${img.getAttribute('src')}" width="100" height="100" preserveAspectRatio="none" mask="url(#${id})"/>`;
    img.replaceWith(svg);
  });
  function observe() {
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      entries.forEach(({target:node,isIntersecting}) => {
        if (!isIntersecting) return;
        observer.unobserve(node);
        if (seen.has(node)) return;
        seen.add(node);
        node.classList.remove('motion-pending');
        if (node.matches('.drawn-line')) {
          node.classList.add('line-started');
          animate(node.querySelector('path'),[{strokeDashoffset:1},{strokeDashoffset:0}],1700,0,'linear');
        } else if (node.matches(headings) || node.matches('.footer-wordmark')) {
          animate(node,[{opacity:0,clipPath:'inset(0 0 100% 0)',translate:'0 14px'},
            {opacity:1,clipPath:'inset(0 0 0% 0)',translate:'0 0'}],750);
        } else if (node.matches(cards)) {
          const siblings = [...node.parentElement.children].filter(item => item.matches(cards));
          const delay = innerWidth > 800 ? Math.min(siblings.indexOf(node) * 65,195) : 0;
          // Independent translate preserves the designed rotations on each card.
          animate(node,[{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],650,delay);
        } else {
          animate(node,[{opacity:0},{opacity:1}],550);
        }
      });
    }, {threshold:0, rootMargin:'0px 0px -24px 0px'});
    document.querySelectorAll(`${headings},${cards},${details},.footer-wordmark,.drawn-line`).forEach(node => {
      if (seen.has(node)) return;
      const rect = node.getBoundingClientRect();
      // Prepare offscreen content before it can be seen; restored scroll positions stay visible.
      if (!node.matches('.drawn-line')) {
        if (rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0) {
          seen.add(node);
          return;
        }
        node.classList.add('motion-pending');
      }
      observer.observe(node);
    });
  }
  function configure() {
    enabled = !reduce.matches;
    document.documentElement.classList.toggle('motion-ready',enabled);
    observer?.disconnect();
    active.forEach(animation => animation.cancel());
    active.clear();
    document.querySelectorAll('.motion-pending').forEach(node => node.classList.remove('motion-pending'));
    cancelAnimationFrame(frame); frame = 0;
    motionScroll = null;
    lastPaint = 0;
    previousScroll = scrollY;
    galleryBoost = 0;
    if (enabled) { measure(); observe(); }
  }
  configure();
  reduce.addEventListener('change',configure);
  window.addEventListener('scroll',schedule,{passive:true});
  gallery.querySelector('.vibe-motion')?.addEventListener('click', schedule);
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  let heroVisible = true;
  const updateNotesPlayback = () => hero.toggleAttribute('data-motion-paused', !heroVisible || document.hidden);
  const heroVisibility = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    updateNotesPlayback();
  });
  heroVisibility.observe(hero);
  document.addEventListener('visibilitychange',updateNotesPlayback);
  dialog.addEventListener('close',schedule);
  // CMS card heights, font loading and responsive changes can move later sections.
  const resize = new ResizeObserver(measure);
  document.querySelectorAll('main>section').forEach(node => resize.observe(node));
  document.fonts.ready.then(measure);

  // A single short opening gesture, only when arriving at the top of the page.
  const photo = hero.querySelector('.rave');
  try { await photo.decode(); } catch (_) { /* Keep content visible if an image fails. */ }
  if (enabled && scrollY < 20 && !location.hash) {
    animate(hero.querySelector('.description'),[{opacity:.3},{opacity:1}],700,100);
  }
})();
