const $=s=>document.querySelector(s);
const sections={products:{name:'Магазин',description:'Карточки мерча, цены и варианты.'},menu:{name:'Меню',description:'Напитки, кофе и еда — всё в одном месте.'},events:{name:'События',description:'Афиши, даты, DJ и регистрация.'}};
const common=[['title','Название','text',true],['price','Цена (например £12 или Free)','text',false],['description','Описание','textarea',false]];
const fields={products:[...common,['sizes','Размеры через запятую (S, M, L)','text'],['colors','Цвета HEX через запятую (#4248ff, #ff6f3f)','text'],['url','Ссылка для заказа','url']],menu:[...common,['category','Категория','category',true]],events:[...common,['eventStatus','Статус события','eventStatus',true],['date','Дата на карточке (например November 12)','text',true],['weekday','День недели','text'],['time','Время','text',true],['place','Место','text',true],['dj','DJ / артист','text'],['registration','Статус регистрации','text'],['url','Ссылка на регистрацию','url']]};
let categoryFilter='all';
const categoryOptions={menu:{all:'Все',coffee:'Кофе',drinks:'Напитки',food:'Еда'},events:{all:'Все',past:'Прошедшие',current:'Текущие',planned:'Запланированные'}};
let content,token,section='products',editing=null,selectedImage='',busy=false,dirty=false,uploading=false;
function element(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function message(text){$('#status').textContent=text;}
async function request(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Token':token},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Не удалось сохранить');return d;}
async function persist(next){if(busy)throw Error('Дождитесь сохранения');busy=true;try{const result=await request('/api/content',next);content=result.content;render();message('Сохранено на компьютере · '+new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}));}finally{busy=false;}}
function render(){
 $('h1').textContent=sections[section].name;$('#subtitle').textContent=sections[section].description;
 document.querySelectorAll('[data-section]').forEach(button=>{button.querySelector('span').textContent=content[button.dataset.section].length;if(button.dataset.section===section)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
 const filterTabs=$('#category-tabs');filterTabs.replaceChildren();filterTabs.hidden=!categoryOptions[section];
 Object.entries(categoryOptions[section]||{}).forEach(([value,label])=>{const b=element('button','',label);b.type='button';b.setAttribute('aria-pressed',String(categoryFilter===value));b.onclick=()=>{categoryFilter=value;render();};filterTabs.append(b);});
 const list=$('#list');list.replaceChildren();const query=$('#search').value.toLowerCase(),filter=$('#filter').value;
 const rows=content[section].filter(row=>row.title.toLowerCase().includes(query)&&(categoryFilter==='all'||(section==='menu'?row.category:(row.eventStatus||'planned'))===categoryFilter)&&(filter==='all'||row.visible===(filter==='visible')));
 if(!rows.length){list.append(element('div','empty',content[section].length?'Ничего не найдено. Измените поиск или фильтр.':'Здесь пока пусто. Добавьте первую карточку.'));return;}
 rows.forEach(row=>{
  const card=element('article','row'),image=element('img');image.src='../'+row.image;image.alt='';const info=element('div','row-info');info.append(element('h3','',row.title),element('p','',[row.price,section==='menu'?({coffee:'Кофе',drinks:'Напитки',food:'Еда'}[row.category]):row.date].filter(Boolean).join(' · ')),element('span','badge'+(row.visible?'':' draft'),row.visible?'На сайте':'Черновик'));
  const actions=element('div','row-actions');
  const button=(label,fn,cls='')=>{const b=element('button',cls,label);b.type='button';b.onclick=fn;actions.append(b);return b;};
  button('Изменить',()=>openEditor(row));
  for(const [label,delta] of [['↑',-1],['↓',1]]){const b=button(label,async()=>{const next=structuredClone(content),i=next[section].findIndex(x=>x.id===row.id);[next[section][i],next[section][i+delta]]=[next[section][i+delta],next[section][i]];try{await persist(next);}catch(e){message(e.message);}});b.setAttribute('aria-label',(delta<0?'Выше: ':'Ниже: ')+row.title);const index=content[section].indexOf(row);b.disabled=index+delta<0||index+delta>=content[section].length;}
  button('Удалить',async()=>{if(!confirm(`Удалить «${row.title}»? Предыдущая версия сохранится в резервной копии.`))return;const next=structuredClone(content);next[section]=next[section].filter(x=>x.id!==row.id);try{await persist(next);}catch(e){message(e.message);}},'danger');
  card.append(image,info,actions);list.append(card);
 });
}
function setImage(path){selectedImage=path;$('#preview').hidden=!path;$('#image-placeholder').hidden=!!path;$('#image-placeholder').style.display=path?'none':'grid';if(path)$('#preview').src='../'+path;$('#asset').value=path;}
function openEditor(row){
 editing=row?.id||null;dirty=false;$('#form-error').textContent='';$('#upload-status').textContent='';$('#upload').value='';$('#editor-title').textContent=row?'Редактировать карточку':'Новая карточка';$('#editor-section').textContent=sections[section].name;$('#fields').replaceChildren();
 fields[section].forEach(([key,label,type,required])=>{const wrapper=element('label','',label+(required?' *':''));let input;
  if(type==='category'||type==='eventStatus'){input=element('select');for(const [value,name]of Object.entries(type==='category'?{coffee:'Кофе',drinks:'Напитки',food:'Еда'}:{planned:'Запланированное',current:'Текущее',past:'Прошедшее'})){const option=element('option','',name);option.value=value;input.append(option);}}
  else{input=element(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.maxLength=key==='title'?160:4000;}
  input.name=key;input.required=!!required;input.value=row?.[key]??(key==='category'?(categoryFilter==='all'?'coffee':categoryFilter):key==='eventStatus'?(categoryFilter==='all'?'planned':categoryFilter):'');wrapper.append(input);$('#fields').append(wrapper);
 });
 $('#visible').checked=row?.visible??true;setImage(row?.image||'');$('#editor').showModal();
}
function closeEditor(){if(busy||uploading)return;if(dirty&&!confirm('Закрыть без сохранения изменений?'))return;$('#editor').close();}
$('#close').onclick=closeEditor;$('#cancel').onclick=closeEditor;$('#editor').addEventListener('cancel',e=>{e.preventDefault();closeEditor();});$('#card-form').addEventListener('input',()=>dirty=true);
$('#add').onclick=()=>openEditor();document.querySelectorAll('[data-section]').forEach(button=>button.onclick=()=>{section=button.dataset.section;categoryFilter='all';$('#search').value='';$('#filter').value='all';render();});$('#search').oninput=render;$('#filter').onchange=render;
$('#asset').onchange=e=>{setImage(e.target.value);dirty=true;};
$('#upload').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;if(file.size>8_000_000){$('#upload-status').textContent='Файл больше 8 МБ';return;}
 uploading=true;$('#save').disabled=true;$('#upload-status').textContent='Загружаем изображение…';
 try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const result=await request('/api/upload',{data});const option=element('option','',file.name);option.value=result.image;$('#asset').append(option);setImage(result.image);dirty=true;$('#upload-status').textContent='Фото загружено. Сохраните карточку.';}catch(error){$('#upload-status').textContent=error.message||'Не удалось загрузить';}finally{uploading=false;$('#save').disabled=false;}
};
$('#card-form').onsubmit=async e=>{
 e.preventDefault();if(busy||uploading)return;if(!selectedImage){$('#form-error').textContent='Загрузите фото или выберите изображение из сайта.';return;}
 const row={id:editing||crypto.randomUUID(),image:selectedImage,visible:$('#visible').checked};new FormData(e.target).forEach((value,key)=>row[key]=String(value).trim());
 const next=structuredClone(content),index=next[section].findIndex(x=>x.id===editing);if(index<0)next[section].push(row);else next[section][index]=row;
 $('#save').disabled=true;$('#save').textContent='Сохраняем…';$('#form-error').textContent='';
 try{await persist(next);dirty=false;$('#editor').close();}catch(error){$('#form-error').textContent=error.message;}finally{$('#save').disabled=false;$('#save').textContent='Сохранить карточку';}
};
$('#backup').onclick=()=>{if(!content)return;const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const link=element('a');link.href=url;link.download='morncoffee-backup-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeunload',event=>{if(dirty&&$('#editor').open){event.preventDefault();event.returnValue='';}});
(async()=>{try{const [res,images]=await Promise.all([fetch('/api/content'),fetch('/api/assets')]);if(!res.ok||!images.ok)throw Error('Запустите python3 server.py и откройте http://127.0.0.1:4175/admin/');const data=await res.json();content=data.content;token=data.token;for(const path of await images.json()){const option=element('option','',path.split('/').pop());option.value=path;$('#asset').append(option);}$('#add').disabled=false;render();message('Каталог загружен');}catch(error){message(error.message||'Сервер недоступен. Запустите python3 server.py');}})();
// Close only when both press and release occur on the backdrop.
let editorBackdrop=false;
function outsideEditor(event){const r=$('#editor').getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;}
$('#editor').addEventListener('pointerdown',e=>editorBackdrop=outsideEditor(e));
$('#editor').addEventListener('click',e=>{if(editorBackdrop&&outsideEditor(e))closeEditor();editorBackdrop=false;});
