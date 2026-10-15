'use strict';
const $ = id => document.getElementById(id);
const make = (tag, cls, content) => { const node=document.createElement(tag); if(cls) node.className=cls; if(content!==undefined) node.textContent=content; return node; };
const setText = (id, value) => { $(id).textContent=value; };
const pad = n => String(n).padStart(2,'0');
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const state = { data:null, open:false, busy:false, turning:false, angle:0, project:0, image:0, portrait:false, dragging:false, suppressClick:false };
const stage=$('stage');
const project = () => state.data.projects[state.project];
const hash = value => history.replaceState(null,'',location.pathname+location.search+value);
const announce = value => setText('live-status',value);
const modalOpen = () => [...document.querySelectorAll('dialog')].some(dialog=>dialog.open);
const syncModal = () => document.body.classList.toggle('modal-open',modalOpen());
const rotateBag = angle => { state.angle=angle; $('bag-rotator').style.setProperty('--ry',`${angle}deg`); };
const headline = { mazhazha:'BRAND, IN RHYTHM.', slow:'SLOW DOWN A LITTLE.', harmony:'A TASTE OF CULTURE.', paper:'STORIES ON PAPER.', azure:'MUSIC WITHOUT LIMITS.' };
const inventoryNames = { mazhazha:'品牌与数字设计',slow:'情绪品牌与包装',harmony:'海派文化礼盒',paper:'宣纸主题书籍',azure:'音乐节视觉设计' };

function populateArchive() {
  const {person,projects,decorations}=state.data;
  projects.forEach((p,i)=>{
    const row=make('tr'); row.append(make('td','',pad(i+1)),make('td','',inventoryNames[p.id]||p.title),make('td','',p.images.length)); $('bag-inventory').append(row);
    const button=make('button'); button.type='button'; button.dataset.project=p.id; button.append(make('span','',pad(i+1)),document.createTextNode(p.title));
    button.addEventListener('click',async()=>{ $('project-index').hidden=true; $('index-toggle').setAttribute('aria-expanded','false'); await changeBooklet(i-state.project); $('project-booklet').focus({preventScroll:true}); }); $('index-list').append(button);
    const image=new Image(); image.src=p.cover;
  });
  document.querySelectorAll('.decoration-image').forEach(image=>{ image.src=decorations.poster; image.draggable=false; });
  person.skills.forEach(skill=>$('profile-skills').append(make('span','',skill)));
  $('about-portrait').src=person.portrait;
  $('cover-portrait').src=person.portrait;
  $('cover-portrait').draggable=false;
  $('profile-portrait').src=person.portrait;
  $('profile-portrait').draggable=false;
  setText('about-bio',person.bio);
  person.experiences.forEach(item=>{const node=make('div');node.append(make('h4','',item.title),make('p','',item.description));$('about-experiences').append(node);});
  person.awards.forEach(item=>$('about-awards').append(make('p','',`${item.year?item.year+' · ':''}${item.name} · ${item.rank}`)));
  person.contacts.forEach(item=>{const a=make('a','',`${item.label} / ${item.value} ↗`);a.href=item.href;$('about-contacts').append(a);});
  setText('archive-count',`${pad(projects.length)} 个项目 / ${projects.reduce((count,p)=>count+p.images.length,0)} 页作品`);
  renderBooklet();
}

async function openArchive(immediate=false) {
  if(!state.data||state.open||state.busy)return;
  state.busy=true; $('bag-object').setAttribute('aria-expanded','true');
  if(!immediate&&!reduced.matches){
    stage.classList.add('stage-opening');
    rotateBag(Math.round((state.angle-180)/360)*360+180);
    await wait(650);stage.classList.add('is-untying');await wait(150);
    stage.classList.add('is-flap-open');await wait(450);
    stage.classList.add('is-pulling');await wait(650);
    stage.classList.add('is-laying-down');await wait(400);
  }
  $('bag-scene').hidden=true; $('spread-wrap').hidden=false; $('spread-wrap').classList.remove('closing');
  stage.classList.add('stage-open');stage.classList.remove('stage-opening');
  document.body.classList.add('archive-open'); $('close-archive').hidden=false;
  state.open=true;state.busy=false;hash('#archive');
  window.scrollTo({top:0,behavior:'instant'});$('more-about').focus({preventScroll:true});
  announce('资料已抽出。左侧是个人简介，右侧是可以翻阅的作品册。');
}

async function closeArchive() {
  if(state.busy||!state.open)return;
  state.busy=true;
  document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
  $('project-index').hidden=true;$('index-toggle').setAttribute('aria-expanded','false');
  $('spread-wrap').classList.add('closing');if(!reduced.matches)await wait(420);
  $('spread-wrap').hidden=true;$('bag-scene').hidden=false;
  stage.className='archive-stage';document.body.classList.remove('archive-open');$('close-archive').hidden=true;
  $('bag-object').setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'instant'});rotateBag(180);
  requestAnimationFrame(()=>requestAnimationFrame(()=>rotateBag(0)));
  if(!reduced.matches)await wait(550);
  state.open=false;state.busy=false;hash('');$('bag-object').focus({preventScroll:true});announce('作品和资料已收回档案袋。');
}

function renderBooklet() {
  const p=project();
  $('booklet-cover').src=p.cover;$('booklet-cover').alt=p.title;
  setText('booklet-number',`${pad(state.project+1)} / ${pad(state.data.projects.length)}`);
  setText('booklet-headline',headline[p.id]||'SELECTED WORK.');
  setText('booklet-category',p.category);
  setText('booklet-title',p.title.split(' · ')[0]);
  setText('booklet-subtitle',`${p.title.includes(' · ')?p.title.split(' · ').slice(1).join(' · ')+' / ':''}${p.category}`);
  setText('booklet-pages',`${pad(p.images.length)} PAGES`);
  setText('booklet-position',`${pad(state.project+1)} / ${pad(state.data.projects.length)}`);
  $('project-booklet').setAttribute('aria-label',`打开${p.title}作品册，${p.images.length}页`);
  [...$('index-list').children].forEach((button,index)=>button.setAttribute('aria-current',String(index===state.project)));
}
async function changeBooklet(delta) {
  if(!state.data||state.turning||state.busy)return;
  state.turning=true;
  const next=(state.project+delta+state.data.projects.length*2)%state.data.projects.length;
  if(next===state.project){state.turning=false;return;}
  const stack=document.querySelector('.project-stack');const cls=delta>=0?'turning-next':'turning-previous';
  stack.classList.add(cls);if(!reduced.matches)await wait(260);
  state.project=next;renderBooklet();if(!reduced.matches)await wait(300);
  stack.classList.remove(cls);state.turning=false;announce(`当前作品册：${project().title}`);
}

function openProject(index=state.project) {
  state.project=(index+state.data.projects.length)%state.data.projects.length;renderBooklet();
  const p=project();setText('project-breadcrumb',`李蕊的设计档案 / 作品 ${pad(state.project+1)}`);
  setText('detail-number',`SELECTED WORK / ${pad(state.project+1)}`);setText('project-title',p.title);
  setText('detail-category',p.category);setText('detail-description',p.description);setText('detail-position',`${pad(state.project+1)} / ${pad(state.data.projects.length)}`);
  const nav=document.createDocumentFragment();p.chapters.forEach((chapter,i)=>{const button=make('button','',`${pad(i+1)} ${chapter.title}`);button.type='button';button.addEventListener('click',()=>$(`chapter-${chapter.start}`).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'}));nav.append(button);});$('detail-chapters').replaceChildren(nav);
  const gallery=document.createDocumentFragment();
  p.images.forEach((src,i)=>{
    const chapter=p.chapters.find(item=>item.start===i+1);
    if(chapter){const heading=make('h3','gallery-chapter',`${pad(i+1)} / ${chapter.title}`);heading.id=`chapter-${chapter.start}`;gallery.append(heading);}
    const button=make('button','gallery-page');button.type='button';button.setAttribute('aria-label',`放大${p.title}第${i+1}页`);
    const image=make('img');image.src=src;image.alt=`${p.title} · 第 ${i+1} 页`;image.loading=i<2?'eager':'lazy';image.decoding='async';
    if(p.dimensions[i]){image.width=p.dimensions[i].width;image.height=p.dimensions[i].height;}
    button.append(image,make('span','',`${pad(i+1)} / ${pad(p.images.length)} ↗`));button.addEventListener('click',()=>openImage(i));gallery.append(button);
  });gallery.append(make('div','gallery-end','— END OF THIS FILE —'));$('project-gallery').replaceChildren(gallery);
  if(!$('project-dialog').open)$('project-dialog').showModal();
  $('project-gallery').scrollTop=0;document.querySelector('.project-detail-layout').scrollTop=0;document.querySelector('.project-information').scrollTop=0;
  syncModal();hash(`#work/${p.id}`);announce(`已打开${p.title}作品册`);
}

function openImage(index,portrait=false) {
  state.image=index;state.portrait=portrait;renderImage();
  if(!$('lightbox').open)$('lightbox').showModal();syncModal();
}
function renderImage() {
  $('previous-image').hidden=state.portrait;$('next-image').hidden=state.portrait;
  if(state.portrait){$('lightbox-image').src=state.data.person.portrait;$('lightbox-image').alt='李蕊的个人照片';setText('lightbox-caption','李蕊 / 个人照片');setText('lightbox-position','PERSONAL PORTRAIT');return;}
  const p=project();state.image=(state.image+p.images.length)%p.images.length;
  $('lightbox-image').src=p.images[state.image];$('lightbox-image').alt=`${p.title} · 第 ${state.image+1} 页`;
  setText('lightbox-caption',p.title);setText('lightbox-position',`${pad(state.image+1)} / ${pad(p.images.length)}`);
  $('previous-image').disabled=p.images.length===1;$('next-image').disabled=p.images.length===1;
}
function openAbout(contact=false) {
  $('about-dialog').showModal();syncModal();document.querySelector('.about-body').scrollTop=0;
  if(contact)requestAnimationFrame(()=>$('about-contact').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'}));
}

$('open-bag').addEventListener('click',()=>openArchive());
$('bag-object').addEventListener('click',()=>{if(!state.suppressClick)openArchive();});
$('bag-object').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openArchive();}else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();rotateBag(state.angle+(event.key==='ArrowLeft'?-180:180));}});
let pointerStart=null;
$('bag-object').addEventListener('pointerdown',event=>{if(state.open||state.busy||event.button>0)return;pointerStart={id:event.pointerId,x:event.clientX,y:event.clientY,angle:state.angle,moved:false};$('bag-object').setPointerCapture(event.pointerId);});
$('bag-object').addEventListener('pointermove',event=>{if(!pointerStart||event.pointerId!==pointerStart.id)return;const dx=event.clientX-pointerStart.x;if(Math.abs(dx)>7){pointerStart.moved=true;state.dragging=true;$('bag-object').classList.add('dragging');rotateBag(pointerStart.angle+dx*.7);}});
function endDrag(event){if(!pointerStart)return;state.suppressClick=pointerStart.moved;if(pointerStart.moved)rotateBag(Math.round(state.angle/180)*180);$('bag-object').classList.remove('dragging');if($('bag-object').hasPointerCapture(event.pointerId))$('bag-object').releasePointerCapture(event.pointerId);pointerStart=null;state.dragging=false;setTimeout(()=>{state.suppressClick=false;},180);}
$('bag-object').addEventListener('pointerup',endDrag);$('bag-object').addEventListener('pointercancel',endDrag);
['close-spread','close-archive'].forEach(id=>$(id).addEventListener('click',closeArchive));
$('home-link').addEventListener('click',event=>{event.preventDefault();if(state.open)closeArchive();else rotateBag(0);});
$('next-booklet').addEventListener('click',()=>changeBooklet(1));$('previous-booklet').addEventListener('click',()=>changeBooklet(-1));
$('project-booklet').addEventListener('click',()=>{if(!state.turning)openProject();});
$('index-toggle').addEventListener('click',()=>{const open=$('project-index').hidden;$('project-index').hidden=!open;$('index-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('click',event=>{if(!event.target.closest('.project-index')&&!event.target.closest('.index-tab')){$('project-index').hidden=true;$('index-toggle').setAttribute('aria-expanded','false');}});
document.querySelectorAll('.view-portrait').forEach(button=>button.addEventListener('click',()=>openImage(0,true)));
$('more-about').addEventListener('click',()=>openAbout());$('show-contact').addEventListener('click',()=>openAbout(true));
$('close-project').addEventListener('click',()=>$('project-dialog').close());$('close-lightbox').addEventListener('click',()=>$('lightbox').close());$('close-about').addEventListener('click',()=>$('about-dialog').close());
$('previous-project').addEventListener('click',()=>openProject(state.project-1));$('next-project').addEventListener('click',()=>openProject(state.project+1));
$('previous-image').addEventListener('click',()=>{state.image--;renderImage();});$('next-image').addEventListener('click',()=>{state.image++;renderImage();});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{syncModal();if(dialog.id==='project-dialog')hash(state.open?'#archive':'');});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!modalOpen()&&!$('project-index').hidden){$('project-index').hidden=true;$('index-toggle').setAttribute('aria-expanded','false');$('index-toggle').focus();return;}
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  const delta=event.key==='ArrowLeft'?-1:1;
  if($('lightbox').open&&!state.portrait){event.preventDefault();state.image+=delta;renderImage();}
  else if(state.open&&!modalOpen()&&!state.busy){event.preventDefault();changeBooklet(delta);}
});
async function load(){try{const response=await fetch('content.json',{cache:'no-store'});if(!response.ok)throw new Error('Content unavailable');state.data=await response.json();populateArchive();const initial=location.hash;if(initial==='#archive'||initial.startsWith('#work/')){await openArchive(true);const id=decodeURIComponent(initial.slice(6));const index=state.data.projects.findIndex(p=>p.id===id);if(initial.startsWith('#work/')&&index>=0)openProject(index);}}catch(error){console.error(error);$('load-error').hidden=false;}}
load();
