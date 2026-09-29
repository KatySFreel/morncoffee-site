(async () => {
await window.contentReady;
const dialog = document.querySelector('dialog');
// Move the existing navigation outside the hero's container, which would
// otherwise contain position:fixed. Keep only one copy and one keyboard order.
const siteNav = document.querySelector('.header nav');
siteNav.classList.add('site-nav');
document.body.insertBefore(siteNav, document.querySelector('main'));
const siteBrand = document.querySelector('.header .brand');
siteBrand.classList.add('site-brand');
document.body.insertBefore(siteBrand, siteNav);
const menuToggle = document.createElement('button');
menuToggle.className = 'mobile-menu-toggle';
menuToggle.type = 'button';
menuToggle.setAttribute('aria-label', 'Open menu');
menuToggle.setAttribute('aria-expanded', 'false');
siteNav.id = 'site-navigation';
menuToggle.setAttribute('aria-controls', siteNav.id);
menuToggle.innerHTML = '<span></span><span></span><span></span>';
document.body.insertBefore(menuToggle, siteNav);
function closeMobileMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  siteNav.classList.remove('is-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  siteNav.classList.toggle('is-open', open);
});
siteNav.addEventListener('click', event => {
  if (event.target.closest('a')) closeMobileMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
    closeMobileMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) closeMobileMenu();
});
const footer = document.querySelector('.footer');
function syncNavigation() {
  const atFooter = footer.getBoundingClientRect().top < window.innerHeight;
  siteNav.toggleAttribute('data-at-footer', atFooter);
  siteNav.inert = atFooter;
  siteBrand.toggleAttribute('data-at-footer', atFooter);
  siteBrand.inert = atFooter;
  menuToggle.toggleAttribute('data-at-footer', atFooter);
  menuToggle.inert = atFooter;
  if (atFooter) closeMobileMenu();
}
syncNavigation();
new IntersectionObserver(syncNavigation).observe(footer);
window.addEventListener('resize', syncNavigation, {passive:true});
const vibeSection = document.querySelector('.vibe');
const motionButton = document.querySelector('.vibe-motion');
motionButton.addEventListener('click', () => {
  const paused = vibeSection.toggleAttribute('data-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Play photo animation' : 'Pause photo animation');
  motionButton.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
});
const panelTitle = document.querySelector('#panel-title');
const panelContent = document.querySelector('#panel-content');
// Concept actions explain the demo instead of placing orders or collecting email.
const creatorEmail = 'katy.slivko17@gmail.com';
function conceptContact() {
  const contact = document.createElement('a');
  contact.className = 'concept-contact';
  contact.href = `mailto:${creatorEmail}`;
  contact.textContent = creatorEmail;
  return contact;
}
function showConceptNotice() {
  closeMobileMenu();
  if (dialog.open) {
    let status = panelContent.querySelector('.record-status,.concept-inline-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'concept-inline-status';
      status.setAttribute('role', 'status');
      panelContent.append(status);
    }
    status.replaceChildren('This is a concept website :) For design & development:', document.createElement('br'), conceptContact());
    requestAnimationFrame(() => {
      if (!dialog.open || !status.isConnected) return;
      const mobile = window.matchMedia('(max-width:650px)').matches;
      const scroller = mobile ? panelContent : dialog;
      const messageRect = status.getBoundingClientRect();
      const viewportRect = scroller.getBoundingClientRect();
      const top = mobile
        ? scroller.scrollHeight - scroller.clientHeight
        : scroller.scrollTop + messageRect.top - viewportRect.top - (scroller.clientHeight - messageRect.height) / 2;
      scroller.scrollTo({top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    });
    return;
  }
  const scene = openRecord('This is a concept website :)', 'concept');
  const center = element('div', 'record-center');
  center.append(element('h3', '', 'This is a concept website :)'));
  center.append(element('p', 'concept-description', 'For website design and development, get in touch with Katya Safonova.'));
  const contact = conceptContact();
  contact.classList.add('record-action', 'primary');
  contact.textContent = 'Get in touch';
  scene.append(center, contact);
  const links = element('dl', 'event-details creator-details');
  const profiles = [
    ['Instagram', 'safonovadsgn', 'https://www.instagram.com/safonovadsgn/', 'left'],
    ['Pinterest', 'safonovadsgn', 'https://www.pinterest.com/safonovadsgn/', 'top-right'],
    ['Behance', 'bcc4d681', 'https://www.behance.net/bcc4d681', 'bottom-right']
  ];
  profiles.forEach(([name, handle, url]) => {
    const row = element('div', '');
    const value = element('dd', '');
    const link = element('a', 'creator-link', handle);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${name}: ${handle} (opens in a new tab)`);
    value.append(link);
    row.append(element('dt', '', name), value);
    links.append(row);
  });
  center.append(links);
  dialog.showModal();
  dialog.querySelector('.close').focus({preventScroll:true});
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('.record-action,[data-social],[data-legal],.instagram-link,#newsletter button,a[href^="https://"],a[href^="http://"],a[href^="mailto:"],a[href^="tel:"]');
  if (!trigger || trigger.matches('.concept-contact,.footer-credit,.creator-link')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showConceptNotice();
}, true);
document.querySelector('#newsletter').noValidate = true;
document.addEventListener('submit', event => {
  if (event.target.id !== 'newsletter') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showConceptNotice();
}, true);
function showPanel(title, message, image) {
  dialog.className = "";
  panelTitle.textContent = title;
  panelContent.replaceChildren();
  if (image) {
    const photo = document.createElement('img');
    photo.src = image;
    photo.alt = title;
    photo.className = 'product-dialog-image';
    panelContent.append(photo);
  }
  const paragraph = document.createElement('p');
  paragraph.textContent = message;
  panelContent.append(paragraph);
  dialog.showModal();
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let closingPanel = false;
async function closePanel() {
  if (!dialog.open || closingPanel) return;
  closingPanel = true;
  if (!reducedMotion.matches) {
    const exit = dialog.animate([{opacity:1},{opacity:0}], {duration:160,easing:'ease-in'});
    await exit.finished.catch(() => {});
  }
  dialog.close();
  closingPanel = false;
}
document.querySelector('.close').addEventListener('click', closePanel);
dialog.addEventListener('cancel', event => { event.preventDefault(); closePanel(); });
function onPopupBackground(event) {
  if (event.target.closest('.close')) return false;
  if (dialog.classList.contains('record-popup') && window.matchMedia('(max-width:650px)').matches) {
    if (panelContent.contains(event.target)) return false;
    const rect = dialog.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(dialog, '::before').width) / 2;
    return Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2) > radius;
  }
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  return outside || (dialog.classList.contains('record-popup') && !event.target.closest('.record-scene, .close'));
}
let pressedPopupBackground=false;
dialog.addEventListener('pointerdown',event=>pressedPopupBackground=onPopupBackground(event));
dialog.addEventListener('click', event => {
  if (pressedPopupBackground && onPopupBackground(event)) closePanel();
  pressedPopupBackground=false;
});
const tabs = [...document.querySelectorAll('[data-category]')];
function selectTab(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    }
  });
});
document.querySelector('#newsletter').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#newsletter-status').textContent = 'Newsletter signup is not connected yet. Your email has not been sent.';
});
document.querySelectorAll('[data-social]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.social, 'The official profile link will be added soon.')));
document.querySelectorAll('[data-legal]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.legal, 'This document will be available before online registration and purchases open.')));

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}
function openRecord(title, kind) {
  dialog.className = 'record-popup';
  panelTitle.textContent = title;
  const scene = element('div', 'record-scene ' + kind + '-record');
  const disc = element('div', 'record-disc');
  disc.setAttribute('aria-hidden', 'true');
  scene.append(disc);
  panelContent.replaceChildren(scene);
  return scene;
}
function note(scene, position, text) {
  const label = element('p', 'record-note note-' + position, text);
  if (text === 'MORNCOFFEE — limited edition') {
    label.replaceChildren('MORNCOFFEE —', document.createElement('br'), 'limited edition');
  }
  scene.append(label);
}
function action(scene, className, text, handler) {
  const button = element('button', 'record-action ' + className, text);
  button.type = 'button';
  button.addEventListener('click', handler);
  scene.append(button);
}
function statusFor(scene) {
  const status = element('p', 'record-status');
  status.setAttribute('role', 'status');
  scene.append(status);
  return status;
}
function prepareMobileSheet(scene, kind) {
  const heading = element('p', 'sheet-eyebrow', kind === 'event' ? 'MORNCOFFEE / EVENT' : 'MORNCOFFEE / MERCH');
  scene.prepend(heading);
  const description = element('div', 'sheet-description');
  scene.querySelectorAll('.record-note').forEach(item => {
    if (kind === 'event' && item.classList.contains('note-top')) return;
    description.append(item);
  });
  scene.append(description);
  const footer = element('div', 'sheet-actions');
  const price = scene.querySelector('.record-product-price');
  if (price) footer.append(price);
  footer.append(scene.querySelector('.record-action.primary'));
  const calendar = scene.querySelector('.record-action.calendar');
  if (calendar) footer.append(calendar);
  footer.append(scene.querySelector('.record-status'));
  scene.append(footer);
}
function arrangeProductNotes(scene, variant) {
  const notes = [...scene.querySelectorAll('.record-note')];
  const layouts = {
    1: [[0, 28, 25, -5]],
    2: variant % 4 >= 2
      ? [[73, 27, 27, 4], [0, 65, 26, -5]]
      : [[0, 27, 27, -4], [74, 65, 26, 5]],
    3: [[34, -1, 32, 2], [0, 32, 24, -5], [77, 66, 23, 4]],
  };
  const slots = layouts[notes.length] || [[34, -1, 32, 2], [0, 29, 22, -4], [81, 27, 19, 5], [0, 65, 22, -5], [81, 65, 19, 4]];
  notes.forEach((note, index) => {
    const [x, y, width, tilt] = slots[index % slots.length];
    note.classList.add('arranged-note');
    note.style.setProperty('--note-x', `${x}%`);
    note.style.setProperty('--note-y', `${y}%`);
    note.style.setProperty('--note-width', `${width}%`);
    note.style.setProperty('--note-tilt', `${tilt}deg`);
  });
}
document.querySelectorAll('[data-event]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.event-card');
  const title = card.querySelector('h3').textContent;
  const scene = openRecord(title, 'event');
  const center = element('div', 'record-center');
  center.append(element('h3', '', title));
  const details = card.querySelector('.event-details').cloneNode(true);
  details.lastElementChild.remove();
  center.append(details);
  scene.append(center);
  const record = window.cmsContent?.events.find(item => item.id === button.dataset.event);
  const free = (record?.price || '').toLowerCase() === 'free';
  note(scene, 'top', free ? 'Free entry' : card.querySelectorAll('dd')[4].textContent);
  note(scene, 'left', record?.description || (card.querySelectorAll('dd')[3].textContent ? 'Music by ' + card.querySelectorAll('dd')[3].textContent + '.' : 'Join us at MORNCOFFEE.'));
  note(scene, 'bottom-left', free ? 'Registration: Entry is free, but we ask you to register to understand the number of guests.' : 'Registration is required. Choose your ticket before the event.');
  note(scene, 'right', 'Drinks and food are paid separately');
  note(scene, 'top-right', 'Access to the coffee bar and food menu');
  note(scene, 'bottom-right', 'Photos/videos allowed for personal use');
  const status = statusFor(scene);
  action(scene, 'calendar', 'Add to Calendar', () => { status.textContent = 'The event year is awaiting confirmation. Calendar download will be available with the confirmed date.'; });
  action(scene, 'primary', 'Register', () => { if (record?.url) { window.open(record.url, '_blank', 'noopener,noreferrer'); return; } status.textContent = 'Online registration is not open yet. Please contact hello@morncoffee.co.uk.'; });
  prepareMobileSheet(scene, 'event');
  dialog.showModal();
}));
function options(scene, className, label, values, onSelect) {
  const group = element('div', 'record-options ' + className);
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);
  values.forEach((value, index) => {
    const button = element('button', '', value.label);
    button.type = 'button';
    button.setAttribute('aria-label', value.name || value.label);
    button.setAttribute('aria-pressed', String(index === 0));
    if (value.color) button.style.setProperty('--swatch', value.color);
    button.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      onSelect?.(value);
    });
    group.append(button);
  });
  scene.append(group);
}
document.querySelectorAll('.product').forEach(card => card.addEventListener('click', event => {
  if (!event.target.closest('button,a')) card.querySelector('[data-product]')?.click();
}));
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.product');
  const record = window.cmsContent?.products.find(item => item.id === button.dataset.product);
  const isShirt = !!(record?.sizes || record?.colors);
  const title = record?.title || card.querySelector('h3').textContent;
  const scene = openRecord(title, 'product');
  const center = element('div', 'record-center');
  const photo = element('img', 'record-product-image');
  photo.src = record?.image || 'assets/' + button.dataset.product + '.webp';
  photo.alt = title;
  center.append(photo);
  scene.append(center, element('h3', 'record-product-title', title));
  if (isShirt) {
    const originalTee=record?.id==='cap-blue';
    note(scene, 'top', originalTee && (!record.description || record.description==='MORNCOFFEE — limited edition') ? 'Basic organic cotton t-shirt. Minimalist logo on the front, "Feel the beat" print on the back.' : record?.description || 'MORNCOFFEE — limited edition');
    if(originalTee) note(scene, 'left', '100% Organic Cotton');
    if(originalTee){
      note(scene, 'top-right', 'Unisex fit');
      const thumbs=element('div','record-thumbnails');
      thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','Product photos');
      // The design supplies one photograph. Use detail views until other shots are supplied.
      const views=[{src:photo.src,label:'Full product',scale:1,position:'50% 50%'},{src:photo.src,label:'Print detail',scale:1.8,position:'50% 40%'},{src:photo.src,label:'Fabric detail',scale:2.4,position:'50% 25%'}];
      views.forEach((view,index)=>{
        const button=element('button','product-photo-choice');button.type='button';button.setAttribute('aria-label',view.label);button.setAttribute('aria-pressed',String(index===0));
        const crop=element('span','photo-choice-crop'),thumb=element('img');thumb.src=view.src;thumb.alt='';thumb.style.transform=`scale(${view.scale})`;thumb.style.transformOrigin=view.position;crop.append(thumb);button.append(crop);
        button.addEventListener('click',()=>{photo.src=view.src;photo.style.transform=`scale(${view.scale})`;photo.style.transformOrigin=view.position;thumbs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});thumbs.append(button);
      });
      const gallery = element('div', 'record-product-gallery');
      center.before(gallery);
      gallery.append(center, thumbs);
    }
    if (record.sizes) options(scene, '', 'Size', record.sizes.split(',').map(label => ({label:label.trim()})));
    options(scene, 'record-colors', 'Color', (record.colors || '').split(',').filter(Boolean).map(color => ({label:'',name:color.trim(),color:color.trim()})));
  } else {
    note(scene, 'top', record?.description || 'MORNCOFFEE — limited edition');
    note(scene, 'bottom-right', 'Available at MORNCOFFEE');
  }
  const priceTag=element('p','record-product-price',record?.price || card.querySelector('.product-meta>span').textContent.trim());
  scene.append(priceTag);
  const status = statusFor(scene);
  action(scene, 'primary', 'Order', () => { if (record?.url) { window.open(record.url, '_blank', 'noopener,noreferrer'); return; } status.textContent = 'Online ordering is not open yet. Please contact hello@morncoffee.co.uk.'; });
  prepareMobileSheet(scene, 'product');
  const gallery = scene.querySelector('.record-product-gallery');
  if (gallery) gallery.append(...scene.querySelectorAll('.record-options'));
  arrangeProductNotes(scene, [...document.querySelectorAll('[data-product]')].indexOf(button));
  dialog.showModal();
}));


})();

// Instagram destination is intentionally unset until the profile is supplied.
document.querySelector('.instagram-link')?.addEventListener('click',e=>e.preventDefault());
function scallopedCards(){
 const observer=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{
  const w=target.offsetWidth,h=target.offsetHeight;if(!w||!h)return;
  const isAbout=target.classList.contains('about-card');
  const base=innerWidth>800?Math.min(innerWidth,1600)*(isAbout?.01715:.0215):26;
  const n=Math.max(6,Math.round(w/base)),step=w/n,r=step*.38,gap=(step-2*r)/2;
  let path='M0 0';
  for(let i=0;i<n;i++)path+=` L${i*step+gap} 0 A${r} ${r} 0 0 0 ${i*step+gap+2*r} 0`;
  path+=` L${w} 0 L${w} ${h}`;
  for(let i=n-1;i>=0;i--)path+=` L${i*step+gap+2*r} ${h} A${r} ${r} 0 0 0 ${i*step+gap} ${h}`;
  path+=` L0 ${h} Z`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path fill="black" d="${path}"/></svg>`;
  target.style.maskImage=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
 }));document.querySelectorAll('.ticket,.about-card').forEach(x=>observer.observe(x));
}
window.contentReady.then(scallopedCards);
function clipGalleryPhotos(){
 const section=document.querySelector('.vibe'),ribbon=section.querySelector('.vibe-ribbon-bottom');
 ribbon.querySelectorAll('.vibe-set').forEach(set=>{const layer=document.createElement('div');layer.className='vibe-photo-layer';set.querySelectorAll('img:not([src$="better-together.svg"])').forEach(img=>{img.style.removeProperty('--photo-bottom-cut');layer.append(img);});set.prepend(layer);});
 const update=()=>ribbon.style.setProperty('--photo-layer-height',Math.max(0,section.getBoundingClientRect().bottom-ribbon.getBoundingClientRect().top)+'px');
 new ResizeObserver(update).observe(section);update();
}
clipGalleryPhotos();
