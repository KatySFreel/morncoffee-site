// Read-only catalog also works on static hosting; writes belong to the local CMS.
window.contentReady = (async () => {
  try {
    const response = await fetch('data/content.json', {cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    window.cmsContent = data;
    const visible = rows => rows.filter(row => row.visible);
    const text = (node, selector, value) => { node.querySelector(selector).textContent = value || ''; };
    const background = (node, path) => { node.style.backgroundImage = `url("${encodeURI(path)}")`; };
    const events = visible(data.events), eventList = document.querySelector('.event-cards');
    const eventTemplate = eventList.firstElementChild.cloneNode(true);
    eventList.replaceChildren();
    events.forEach((item,index) => {
      const card = eventTemplate.cloneNode(true);
      card.className = `event-card ${['event-sunday','event-shoreditch','event-solomun'][index%3]}`;
      const title = card.querySelector('h3');title.textContent=item.title;title.id=`event-title-${index}`;card.setAttribute('aria-labelledby',title.id);
      const photo=card.querySelector('.event-photo');photo.src=item.image;photo.alt=item.title;
      const values=[item.date,item.time,item.place,item.dj,item.price,item.registration];
      card.querySelectorAll('dd').forEach((dd,i)=>{dd.textContent=values[i]||'';if(i===0&&item.weekday){const badge=document.createElement('span');badge.className='day-badge';badge.textContent=item.weekday;dd.append(badge);}});
      const button=card.querySelector('button');button.dataset.event=item.id;button.setAttribute('aria-label',`Register for ${item.title}`);
      eventList.append(card);
    });
    document.querySelector('.events').classList.toggle('catalog-slider',events.length>3);
    const menuTemplate=document.querySelector('.menu-card').cloneNode(true);
    for(const category of ['coffee','drinks','food']){
      const panel=document.querySelector(`#menu-${category}`),items=visible(data.menu).filter(item=>item.category===category);
      panel.className='menu-grid';panel.replaceChildren();
      items.forEach(item=>{const card=menuTemplate.cloneNode(true);text(card,'h3',item.title);text(card,'p',item.description);text(card,'.price',item.price);const photo=card.querySelector('.menu-photo');photo.className='menu-photo';photo.setAttribute('aria-label',item.title);background(photo,item.image);const info=document.createElement('div');info.className='menu-card-info';const copy=document.createElement('div');copy.className='menu-card-copy';copy.append(card.querySelector('h3'),card.querySelector('p'));info.append(copy,card.querySelector('.price'));card.append(info);panel.append(card);});
      if(!items.length){const message=document.createElement('p');message.className='catalog-empty';message.textContent='New items coming soon.';panel.append(message);}
    }
    const products=visible(data.products),productList=document.querySelector('.merch-grid'),productTemplate=productList.firstElementChild.cloneNode(true);
    productList.replaceChildren();
    products.forEach((item,index)=>{
      const card=productTemplate.cloneNode(true);card.className=`product ${['cap-white','tote','cap-blue','tee'][index%4]}`;
      const button=card.querySelector('button');button.dataset.product=item.id;button.setAttribute('aria-label',`View ${item.title}`);
      text(card,'h3',item.title);text(card,'.product-meta>span',item.price);background(card.querySelector('.product-photo'),item.image);
      const swatches=card.querySelector('.swatches');swatches.replaceChildren();
      (item.colors||'').split(',').filter(Boolean).forEach(color=>{const swatch=document.createElement('span');swatch.className='swatch';swatch.style.backgroundColor=color.trim();swatch.title=color.trim();swatches.append(swatch);});
      productList.append(card);
    });
    document.querySelector('.merch').classList.add('catalog-cascade');
    setupCatalogLayout();
    if(!events.length)eventList.textContent='New events coming soon.';
    if(!products.length)productList.textContent='New merch coming soon.';
  } catch(error) { console.warn('Catalog unavailable; using the original page.', error); }
})();

function setupCatalogLayout(){
  const merch=document.querySelector('.merch');
  function arrangeMerch(){
    const cards=[...merch.querySelectorAll('.product')];
    const mobile=matchMedia('(max-width:650px)').matches,u=merch.clientWidth/100;
    const starts=mobile?[180.717,292.149,405.776,512.76]:[46.184,62.83333,46.20756,62.79712];
    let groupBase=0,maxBottom=0;
    cards.forEach((card,index)=>{
      if(index&&index%4===0)groupBase=maxBottom/u+8-Math.min(...starts);
      const top=(starts[index%4]+groupBase)*u;card.style.setProperty('--card-top',top+'px');
      maxBottom=Math.max(maxBottom,top+card.offsetHeight+card.offsetWidth*.14);
    });
    const floor=mobile?688.8:107.75;
    merch.style.height=Math.max(floor*u,maxBottom+(mobile?70:22)*u)+'px';
  }
  const observer=new ResizeObserver(arrangeMerch);observer.observe(merch);merch.querySelectorAll('.product').forEach(c=>observer.observe(c));document.fonts.ready.then(arrangeMerch);arrangeMerch();
}
