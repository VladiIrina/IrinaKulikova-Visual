// Portfolio data is generated from content/projects/*.json by build.js.
const lightbox = document.querySelector('#project-lightbox');
const galleryImage = document.querySelector('#gallery-image');
const galleryCaption = document.querySelector('#gallery-caption');
const grid = document.querySelector('#portfolio-grid');
const loading = document.querySelector('#portfolio-loading');
const filterButtons = document.querySelectorAll('.portfolio-filters .filter');
let projects = [];
let activeProject = null;
let galleryIndex = 0;

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
}

function renderCard(project, index) {
  const cover = project.cover || (project.gallery && project.gallery[0]) || '';
  const gallery = Array.isArray(project.gallery) ? project.gallery : [];
  const isTour = project.category === 'tour';
  const isAnimation = project.category === 'animation';
  const tourUrl = project.tour_url || '';
  const media = (src, title, index=0) => /\.(mp4|webm|mov)(\?|$)/i.test(src)
    ? `<video src="${escapeHtml(src)}" muted loop autoplay playsinline preload="metadata" aria-label="${escapeHtml(title)}"></video>`
    : `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">`;
  const coverInner = isTour && tourUrl
    ? `<a class="project-cover" href="${escapeHtml(tourUrl)}" target="_blank" rel="noopener" aria-label="Открыть 3D-тур ${escapeHtml(project.title)}">
         ${media(cover, project.title)}
         <span class="project-cover-label">Открыть 3D-тур →</span>
       </a>`
    : `<button class="project-cover" type="button" data-project="${escapeHtml(project.id)}" data-index="0" aria-label="Открыть проект ${escapeHtml(project.title)}">
         ${media(cover, project.title)}
         <span class="project-cover-label">${isAnimation ? 'Смотреть анимацию →' : 'Смотреть проект →'}</span>
       </button>`;

  const thumbs = !isTour && gallery.length > 1 ? `<div class="project-thumbs">${gallery.slice(0,6).map((src,i)=>
    `<button type="button" data-project="${escapeHtml(project.id)}" data-index="${i}" aria-label="Кадр ${i+1}">${media(src, `Кадр ${i+1}`)}</button>`).join('')}</div>` : '';
  const tourLink = tourUrl ? `<a class="tour-open-link" href="${escapeHtml(tourUrl)}" target="_blank" rel="noopener">${isTour ? 'ОТКРЫТЬ 3D-ТУР →' : 'ОТКРЫТЬ 3D-ТУР →'}</a>` : '';

  return `<article class="work-card work-large project-featured ${isTour ? 'altair-tour-card' : ''}" data-project="${escapeHtml(project.id)}" data-category="${escapeHtml(project.category)}" data-interior-type="${escapeHtml(project.interior_type || '')}">
    ${coverInner}
    <div class="work-meta"><span>${String(index+1).padStart(2,'0')}</span><span>${escapeHtml(project.meta || '')}</span></div>
    <div class="project-info">
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.location || '')}</p>
      <p class="project-description">${escapeHtml(project.description || '')}</p>
      ${tourLink}
    </div>
    ${thumbs}
  </article>`;
}

function renderProjects() {
  if (!grid) return;
  grid.innerHTML = projects.map(renderCard).join('');
  bindProjectButtons();
  applyPortfolioFilter(document.querySelector('.portfolio-filters .filter.active')?.dataset.filter || 'all');
  initReveal();
}

function applyPortfolioFilter(selected) {
  document.querySelectorAll('#portfolio-grid [data-category]').forEach(card => {
    const [kind, subtype] = String(selected || 'all').split(':');
    const matches = selected === 'all'
      || card.dataset.category === selected
      || (kind === 'interior' && card.dataset.category === 'interior' && card.dataset.interiorType === subtype);
    card.hidden = !matches;
  });

  const subfilters = document.querySelector('.portfolio-subfilters');
  if (subfilters) subfilters.hidden = selected !== 'interior' && !String(selected).startsWith('interior:');
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.portfolio-subfilters .filter').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    applyPortfolioFilter(button.dataset.filter);
    if (button.dataset.filter !== 'interior') {
      const allSub = document.querySelector('.portfolio-subfilters .filter[data-filter="interior"]');
      if (allSub) allSub.classList.add('active');
    }
  });
});

document.querySelectorAll('.portfolio-subfilters .filter').forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'interior'));
    document.querySelectorAll('.portfolio-subfilters .filter').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const value = button.dataset.filter === 'interior' ? 'interior' : `interior:${button.dataset.filter}`;
    applyPortfolioFilter(value);
  });
});

function showGallery(projectId, index=0) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.gallery || !project.gallery.length) return;
  activeProject = projectId;
  galleryIndex = (index + project.gallery.length) % project.gallery.length;
  const src = project.gallery[galleryIndex];
  const figure = lightbox.querySelector('figure');
  galleryImage.style.display = 'none';
  const existingVideo = figure.querySelector('.gallery-video');
  if (existingVideo) existingVideo.remove();
  if (/\.(mp4|webm|mov)(\?|$)/i.test(src)) {
    const video = document.createElement('video');
    video.className = 'gallery-video';
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('aria-label', `${project.title} — видео ${galleryIndex + 1}`);
    figure.insertBefore(video, galleryCaption);
  } else {
    galleryImage.src = src;
    galleryImage.alt = `${project.title} — кадр ${galleryIndex + 1}`;
    galleryImage.style.display = 'block';
  }
  galleryCaption.textContent = `${project.title} · ${galleryIndex + 1} / ${project.gallery.length}`;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeGallery(){
  const video = lightbox?.querySelector('.gallery-video');
  if(video){
    video.pause();
    video.remove();
  }
  galleryImage.style.display='block';
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function bindProjectButtons(){
  document.querySelectorAll('#portfolio-grid [data-project][data-index]').forEach(el=>{
    el.addEventListener('click',()=>showGallery(el.dataset.project, Number(el.dataset.index || 0)));
  });
}

document.querySelector('.gallery-close')?.addEventListener('click', closeGallery);
document.querySelector('.gallery-prev')?.addEventListener('click', ()=>{
  const p=projects.find(x=>x.id===activeProject); if(p) showGallery(activeProject,galleryIndex-1);
});
document.querySelector('.gallery-next')?.addEventListener('click', ()=>{
  const p=projects.find(x=>x.id===activeProject); if(p) showGallery(activeProject,galleryIndex+1);
});
lightbox?.addEventListener('click',e=>{if(e.target===lightbox) closeGallery();});
document.addEventListener('keydown',e=>{
  if(!lightbox?.classList.contains('open')) return;
  if(e.key==='Escape') closeGallery();
  if(e.key==='ArrowLeft') showGallery(activeProject,galleryIndex-1);
  if(e.key==='ArrowRight') showGallery(activeProject,galleryIndex+1);
});

function initReveal(){
  const items=document.querySelectorAll('.work-card, .service, .about-photo, .about-copy, .personal-copy, .personal-gallery, .tour-copy, .contact-side');
  if(!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('is-visible'));return;}
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}
  }),{threshold:.08});
  items.forEach(el=>{if(!el.classList.contains('is-visible')){el.classList.add('reveal');io.observe(el);}});
}

fetch('data/projects.json', {cache:'no-store'})
  .then(r=>{if(!r.ok) throw new Error('projects.json not found'); return r.json();})
  .then(data=>{
    projects = Array.isArray(data) ? data : [];
    projects.sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999));
    if(loading) loading.remove();
    renderProjects();
  })
  .catch(err=>{
    console.error(err);
    if(loading) loading.textContent='Не удалось загрузить проекты. Запустите сайт через HTTP/HTTPS-сервер.';
  });

initReveal();
