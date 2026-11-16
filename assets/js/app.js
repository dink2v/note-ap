(() => {
  const date = new Date();
  const day = new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
  document.getElementById('todayDate').textContent = day + ' · Ringkasan aktivitas konten Apotek Prapatan';
  document.getElementById('todayLabel').textContent = 'WORKSPACE OVERVIEW';
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);}
  const contentModal=document.getElementById('contentModal');
  const contentModalFrame=document.getElementById('contentModalFrame');
  const closeContentModal=()=>{
    contentModal.classList.remove('open');
    contentModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    contentModalFrame.src='about:blank';
  };
  window.noteApContentModalClose=closeContentModal;
  window.addEventListener('message',event=>{
    if(event.source!==contentModalFrame.contentWindow||!event.data||event.data.type!=='NOTE_AP_CONTENT_SAVED')return;
    closeContentModal();
    if(!contentPage.hidden)renderContentList();
    if(!kanbanPage.hidden)renderKanban();
    showToast(event.data.storage==='local'
      ? 'Konten tersimpan di browser ini (mode lokal).'
      : 'Konten berhasil dikirim ke Note AP.');
  });
  function openContentModal(){
    contentModal.classList.add('open');
    contentModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    if(contentModalFrame.src==='about:blank') contentModalFrame.src=new URL('tambah-konten.html',window.location.href).href;
  }
  contentModalFrame.addEventListener('load',()=>{
    try{
      const child=contentModalFrame.contentWindow;
      child.noteApContentModalClose=closeContentModal;
      const doc=child.document;
      if(!doc.getElementById('noteap-modal-style')){
        const style=doc.createElement('style');
        style.id='noteap-modal-style';
        style.textContent='.sidebar,.mobile-top,.form-breadcrumb,.form-title-row .secondary-btn,.page-footer{display:none!important}.main-area{margin-left:0!important}.content-form-wrap{max-width:none!important;padding:34px 38px 24px!important}@media(max-width:700px){.content-form-wrap{padding:28px 15px 20px!important}}html,body{background:transparent!important;background-color:transparent!important}.content-form-wrap{background:transparent!important;background-color:transparent!important}.form-panel{background:rgba(255,255,255,.52)!important;border-color:rgba(220,232,224,.65)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(20,55,36,.07)!important}';
        doc.head.append(style);
      }
      child.addEventListener('keydown',event=>{if(event.key==='Escape')closeContentModal();});
    }catch(error){showToast('Form berhasil dimuat, tetapi kontrol popup terganggu.');}
  });
  document.getElementById('newContentBtn').addEventListener('click',openContentModal);
  document.getElementById('newContentCalendarBtn').addEventListener('click',openContentModal);
  document.getElementById('contentModalClose').addEventListener('click',closeContentModal);
  contentModal.addEventListener('click',event=>{if(event.target===contentModal)closeContentModal();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&contentModal.classList.contains('open'))closeContentModal();});
  const dashboardPage=document.getElementById('dashboardPage');
  const calendarPage=document.getElementById('calendarPage');
  const contentPage=document.getElementById('contentPage');
  const kanbanPage=document.getElementById('kanbanPage');
  const visitPage=document.getElementById('visitPage');
  const settingsPage=document.getElementById('settingsPage');
  function showPage(page){
    const isCalendar=page==='kalender',isContent=page==='konten',isKanban=page==='kanban',isVisit=page==='visit',isSettings=page==='setelan';
    dashboardPage.hidden=isCalendar||isContent||isKanban||isVisit||isSettings;
    calendarPage.hidden=!isCalendar;
    contentPage.hidden=!isContent;
    kanbanPage.hidden=!isKanban;
    visitPage.hidden=!isVisit;
    settingsPage.hidden=!isSettings;
    document.querySelectorAll('.nav-link').forEach(item=>item.classList.toggle('active',item.dataset.page===page));
    document.getElementById('todayLabel').textContent=isCalendar?'CONTENT SCHEDULING':isContent?'CONTENT MANAGEMENT':'WORKSPACE OVERVIEW';
    document.getElementById('todayDate').textContent=isCalendar?'Kalender terhubung dengan Google Calendar · Asia/Jakarta':isContent?'Kelola dan pantau seluruh konten Instagram dan TikTok.':'Ringkasan aktivitas konten Apotek Prapatan';
    if(isContent)renderContentList();
    if(isKanban)renderKanban();
    if(isVisit||isSettings)renderVisitTables();
    window.location.hash=isCalendar?'kalender':isContent?'konten':isKanban?'kanban':isVisit?'visit':isSettings?'setelan':'dashboard';
  }
  document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    const page=link.dataset.page;
    document.getElementById('sidebar').classList.remove('open');
    if(page==='dashboard'||page==='kalender'||page==='konten'||page==='kanban'||page==='visit'||page==='setelan'){showPage(page);return;}
    showToast('Halaman '+link.textContent.trim()+' sedang dalam tahap pengembangan.');
  }));
  document.querySelectorAll('a[href="#kalender"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    showPage('kalender');
  }));
  if(window.location.hash==='#kalender') showPage('kalender');
  if(window.location.hash==='#konten') showPage('konten');
  if(window.location.hash==='#kanban') showPage('kanban');
  if(window.location.hash==='#visit') showPage('visit');
  if(window.location.hash==='#setelan') showPage('setelan');
  document.getElementById('newContentListBtn').addEventListener('click',openContentModal);
  const contentSearch=document.getElementById('contentSearch'),contentPlatform=document.getElementById('contentPlatform'),contentStatus=document.getElementById('contentStatus'),contentDateFrom=document.getElementById('contentDateFrom'),contentDateTo=document.getElementById('contentDateTo');
  [contentSearch,contentPlatform,contentStatus,contentDateFrom,contentDateTo].forEach(input=>input.addEventListener('input',renderContentList));
  document.getElementById('resetContentFilters').addEventListener('click',()=>{[contentSearch,contentPlatform,contentStatus,contentDateFrom,contentDateTo].forEach(input=>input.value='');renderContentList();});
  function renderContentList(){
    let items=[];try{const stored=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');if(Array.isArray(stored))items=stored;}catch(error){}
    const query=contentSearch.value.trim().toLocaleLowerCase('id');
    const filtered=items.filter(item=>{
      const date=String(item.postingDate||'');
      return (!query||String(item.title||'').toLocaleLowerCase('id').includes(query))
        &&(!contentPlatform.value||item.platform===contentPlatform.value)
        &&(!contentStatus.value||item.status===contentStatus.value)
        &&(!contentDateFrom.value||date>=contentDateFrom.value)
        &&(!contentDateTo.value||date<=contentDateTo.value);
    }).sort((a,b)=>String(a.postingDate||'').localeCompare(String(b.postingDate||'')));
    const body=document.getElementById('contentTableBody');body.replaceChildren();
    filtered.forEach(item=>{
      const tr=document.createElement('tr');
      [item.title||'Tanpa judul',item.platform||'—',formatContentDate(item.postingDate),item.postingTime||'—',item.status||'—',item.format||'—'].forEach((value,index)=>{
        const td=document.createElement('td');td.textContent=value;
        if(index===4){const badge=document.createElement('span');badge.className='status-chip';badge.textContent=value;td.replaceChildren(badge);}
        if(index===1)td.className='platform-cell';
        tr.append(td);
      });
      body.append(tr);
    });
    document.getElementById('contentResultCount').textContent=filtered.length+' konten';
    document.getElementById('contentEmpty').hidden=filtered.length>0;
    document.querySelector('.content-table').hidden=filtered.length===0;
  }
  function formatContentDate(value){if(!value)return'—';const date=new Date(value+'T00:00:00');return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(date);}

  const visitKey='noteAp.visits';
  const readVisits=()=>{try{const v=JSON.parse(localStorage.getItem(visitKey)||'[]');return Array.isArray(v)?v:[];}catch(e){return[];}};
  const writeVisits=items=>localStorage.setItem(visitKey,JSON.stringify(items));
  const visitDateLabel=value=>value?formatContentDate(value):'—';
  function renderVisitTables(){
    const visits=readVisits().sort((a,b)=>(a.visitDate||'').localeCompare(b.visitDate||''));
    const draw=(bodyId,emptyId)=>{
      const body=document.getElementById(bodyId);body.replaceChildren();
      visits.forEach(v=>{
        const tr=document.createElement('tr');
        [visitDateLabel(v.visitDate),v.time||'—',v.location||'—',v.title||'—',visitDateLabel(v.publishDate),v.talent||'—',v.props||'—',v.status||'—',v.notes||'—'].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});
        const action=document.createElement('td');action.className='visit-actions';
        const edit=document.createElement('button');edit.type='button';edit.textContent='Edit';edit.addEventListener('click',()=>openVisitEditor(v.id));
        const del=document.createElement('button');del.type='button';del.textContent='Hapus';del.addEventListener('click',()=>{if(!confirm('Hapus jadwal Visit ini?'))return;writeVisits(readVisits().filter(x=>x.id!==v.id));renderVisitTables();showToast('Jadwal Visit dihapus.');});
        action.append(edit,del);tr.append(action);body.append(tr);
      });
      document.getElementById(emptyId).hidden=visits.length>0;
    };
    draw('visitTableBody','visitEmpty');draw('settingsVisitBody','settingsVisitEmpty');
  }
  const visitEditor=document.getElementById('visitEditor'),visitForm=document.getElementById('visitForm');
  function openVisitEditor(id){
    visitForm.reset();visitForm.dataset.editId=id||'';
    const item=id?readVisits().find(v=>v.id===id):null;
    document.getElementById('visitEditorTitle').textContent=item?'Edit Jadwal Visit':'Tambah Jadwal Visit';
    if(item)Object.entries(item).forEach(([key,value])=>{if(visitForm.elements[key])visitForm.elements[key].value=value||'';});
    const titles=[...new Set(readKanban().map(x=>x.title).filter(Boolean))];
    const datalist=document.getElementById('visitContentTitles');datalist.replaceChildren();
    titles.forEach(title=>{const option=document.createElement('option');option.value=title;datalist.append(option);});
    visitEditor.hidden=false;visitEditor.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function closeVisitEditor(){visitEditor.hidden=true;visitForm.reset();visitForm.dataset.editId='';}
  document.getElementById('addVisitBtn').addEventListener('click',()=>{showPage('setelan');openVisitEditor();});
  document.getElementById('addSettingVisitBtn').addEventListener('click',()=>openVisitEditor());
  document.getElementById('closeVisitEditor').addEventListener('click',closeVisitEditor);
  document.getElementById('cancelVisitEdit').addEventListener('click',closeVisitEditor);
  visitForm.addEventListener('submit',event=>{
    event.preventDefault();if(!visitForm.reportValidity())return;
    const data=Object.fromEntries(new FormData(visitForm).entries()),items=readVisits(),id=visitForm.dataset.editId;
    if(id){const index=items.findIndex(v=>v.id===id);if(index>=0)items[index]={...items[index],...data,updatedAt:new Date().toISOString()};}
    else items.push({id:'VIS-'+Date.now().toString(36).toUpperCase(),...data,createdAt:new Date().toISOString()});
    writeVisits(items);closeVisitEditor();renderVisitTables();showToast('Jadwal Visit berhasil disimpan.');
  });

  window.addEventListener('storage',event=>{if(event.key==='noteAp.contents'){if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();}if(event.key==='noteAp.visits'){if(!visitPage.hidden||!settingsPage.hidden)renderVisitTables();}});


  const kanbanStages=['Ideation','Planning','Production','Editing','Review','Ready to Publish','Published'];
  function readKanban(){try{const value=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');return Array.isArray(value)?value:[];}catch(error){return[];}}
  function writeKanban(items){localStorage.setItem('noteAp.contents',JSON.stringify(items));}
  function renderKanban(){
    const items=readKanban();
    document.querySelectorAll('.kanban-column').forEach(column=>{
      const stage=column.dataset.stage,cards=column.querySelector('.kanban-cards');
      const rows=items.filter(item=>item.status===stage);
      column.querySelector('.stage-count').textContent=rows.length;
      cards.replaceChildren();
      rows.forEach(item=>{
        const card=document.createElement('article');card.className='kanban-card';card.draggable=true;card.dataset.id=item.id;
        const top=document.createElement('div');top.className='kanban-card-top';
        const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';top.append(title);
        const grip=document.createElement('span');grip.className='kanban-grip';grip.textContent='⠿';grip.title='Seret untuk memindahkan';top.append(grip);card.append(top);
        const tags=document.createElement('div');tags.className='kanban-tags';
        const platform=document.createElement('span');platform.className='kanban-tag '+(item.platform==='TikTok'?'tiktok':'instagram');platform.textContent=item.platform==='TikTok'?'♪ TikTok':'◎ Instagram';tags.append(platform);
        const pillar=document.createElement('span');pillar.className='kanban-tag pillar';pillar.textContent=item.pillar||item.format||'Konten';tags.append(pillar);card.append(tags);
        const actions=document.createElement('div');actions.className='kanban-card-actions';
        const duplicate=document.createElement('button');duplicate.type='button';duplicate.textContent='▢ Duplicate';duplicate.addEventListener('click',()=>{const all=readKanban();const original=all.find(x=>x.id===item.id);if(!original)return;const copy={...original,id:'NAP-'+Date.now().toString(36).toUpperCase(),title:(original.title||'Konten')+' (Salinan)',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};all.unshift(copy);writeKanban(all);renderKanban();if(!contentPage.hidden)renderContentList();showToast('Konten berhasil diduplikasi.');});
        const edit=document.createElement('button');edit.type='button';edit.textContent='✎ Edit';edit.addEventListener('click',()=>{const next=prompt('Ubah judul konten:',item.title||'');if(next===null||!next.trim())return;const all=readKanban(),target=all.find(x=>x.id===item.id);if(!target)return;target.title=next.trim();target.updatedAt=new Date().toISOString();writeKanban(all);renderKanban();if(!contentPage.hidden)renderContentList();showToast('Judul konten diperbarui.');});
        actions.append(duplicate,edit);
        const date=document.createElement('small');date.className='kanban-date';date.textContent=item.postingDate?formatContentDate(item.postingDate):'';actions.append(date);card.append(actions);
        card.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',item.id);event.dataTransfer.effectAllowed='move';card.classList.add('dragging');});
        card.addEventListener('dragend',()=>card.classList.remove('dragging'));
        cards.append(card);
      });
    });
  }
  document.getElementById('addKanbanIdea').addEventListener('click',openContentModal);
  document.querySelectorAll('.kanban-add-slot').forEach(button=>button.addEventListener('click',openContentModal));
  document.querySelectorAll('.kanban-column').forEach(column=>{
    column.addEventListener('dragover',event=>{event.preventDefault();column.classList.add('drop-target');});
    column.addEventListener('dragleave',event=>{if(!column.contains(event.relatedTarget))column.classList.remove('drop-target');});
    column.addEventListener('drop',event=>{event.preventDefault();column.classList.remove('drop-target');const id=event.dataTransfer.getData('text/plain'),items=readKanban(),item=items.find(x=>x.id===id);if(!item)return;item.status=column.dataset.stage;item.updatedAt=new Date().toISOString();writeKanban(items);renderKanban();if(!contentPage.hidden)renderContentList();showToast('Status konten dipindahkan ke '+item.status+'.');});
  });

  document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.addEventListener('click',event=>{
    const sidebar=document.getElementById('sidebar');
    if(window.innerWidth<=700 && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !event.target.closest('#menuToggle')) sidebar.classList.remove('open');
  });

  const notificationBtn=document.getElementById('notificationBtn');
  const notificationPopover=document.getElementById('notificationPopover');
  const notificationList=document.getElementById('notificationList');
  const notificationDot=notificationBtn.querySelector('.notification-dot');
  const emptyNotice=document.getElementById('notificationEmpty');
  notificationBtn.addEventListener('click',event=>{
    event.stopPropagation();
    const isOpen=notificationBtn.getAttribute('aria-expanded')==='true';
    notificationBtn.setAttribute('aria-expanded',String(!isOpen));
    notificationPopover.hidden=isOpen;
  });
  document.addEventListener('click',event=>{
    if(!event.target.closest('.notification-wrap')){
      notificationPopover.hidden=true;
      notificationBtn.setAttribute('aria-expanded','false');
    }
  });
  document.getElementById('markAllRead').addEventListener('click',()=>{
    notificationList.querySelectorAll('.notification-item').forEach(item=>{
      item.classList.remove('unread');
      const dot=item.querySelector('.unread-dot');
      if(dot) dot.remove();
    });
    notificationDot.style.display='none';
    emptyNotice.hidden=false;
    showToast('Semua notifikasi ditandai sudah dibaca.');
  });
  document.getElementById('allNotifications').addEventListener('click',event=>{
    event.preventDefault();
    notificationPopover.hidden=true;
    notificationBtn.setAttribute('aria-expanded','false');
    showToast('Halaman Notifikasi akan dibuat pada tahap berikutnya.');
  });
})();