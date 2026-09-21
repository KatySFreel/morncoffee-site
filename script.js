const dialog = document.querySelector('dialog');
const panelTitle = document.querySelector('#panel-title');
const panelContent = document.querySelector('#panel-content');
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
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
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
function note(scene, position, text) { scene.append(element('p', 'record-note note-' + position, text)); }
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
  const free = button.dataset.event === 'sunday';
  note(scene, 'top', free ? 'Free entry' : card.querySelectorAll('dd')[4].textContent);
  note(scene, 'left', free ? 'Sarah Klein is a resident of the London underground scene and a regular guest at Phonox and Corsica Studios.' : 'Music by ' + card.querySelectorAll('dd')[3].textContent + '.');
  note(scene, 'bottom-left', free ? 'Registration: Entry is free, but we ask you to register to understand the number of guests.' : 'Registration is required. Choose your ticket before the event.');
  note(scene, 'right', 'Drinks and food are paid separately');
  note(scene, 'top-right', 'Access to the coffee bar and food menu');
  note(scene, 'bottom-right', 'Photos/videos allowed for personal use');
  const status = statusFor(scene);
  action(scene, 'calendar', 'Add to Calendar', () => { status.textContent = 'The event year is awaiting confirmation. Calendar download will be available with the confirmed date.'; });
  action(scene, 'primary', 'Register', () => { status.textContent = 'Online registration is not open yet. Please contact hello@morncoffee.co.uk.'; });
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
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.product');
  const isShirt = button.dataset.product === 'cap-blue';
  const title = isShirt ? 'MORNCOFFEE Essential Tee' : card.querySelector('h3').textContent;
  const scene = openRecord(title, 'product');
  const center = element('div', 'record-center');
  const photo = element('img', 'record-product-image');
  photo.src = 'assets/' + button.dataset.product + '.webp';
  photo.alt = title;
  center.append(photo);
  scene.append(center, element('h3', 'record-product-title', title));
  if (isShirt) {
    note(scene, 'top', 'Basic organic cotton t-shirt. Minimalist logo on the front, “Feel the beat” print on the back.');
    note(scene, 'left', '100% Organic Cotton');
    note(scene, 'top-right', 'Unisex fit');
    note(scene, 'bottom-left', 'Colors: Black / Sand / Forest Green');
    note(scene, 'bottom-right', 'Sizes: S, M, L');
    options(scene, '', 'Size', ['S', 'M', 'L'].map(label => ({label})));
    options(scene, 'record-colors', 'Color', [{label:'',name:'Black',color:'#222'},{label:'',name:'Sand',color:'#ddc9a8'},{label:'',name:'Forest Green',color:'#254e39'}]);
  } else {
    note(scene, 'top', 'MORNCOFFEE — limited edition');
    note(scene, 'left', card.querySelector('.product-meta').textContent.trim());
    note(scene, 'bottom-right', 'Available at MORNCOFFEE');
  }
  const status = statusFor(scene);
  action(scene, 'primary', 'Order', () => { status.textContent = 'Online ordering is not open yet. Please contact hello@morncoffee.co.uk.'; });
  dialog.showModal();
}));
