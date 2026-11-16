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
    // Jangan reset iframe ke about:blank. Form tetap termuat sehingga tombol
    // Konten Baru berikutnya bisa dibuka tanpa menunggu navigasi ulang.
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
  function openContentModal(event){
    if(event)event.preventDefault();
    contentModal.classList.add('open');
    contentModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    // Iframe sudah dimuat sejak halaman utama dibuka; tombol hanya menampilkan modal.
    if(!contentModalFrame.getAttribute('src'))contentModalFrame.src=new URL('./tambah-konten.html',document.baseURI).href;
  }
  contentModalFrame.addEventListener('load',()=>{
    try{
      const child=contentModalFrame.contentWindow;
      const doc=child.document;
      if(!doc.getElementById('contentForm')){
        showToast('Form Konten tidak ditemukan. Coba buka halaman Tambah Konten secara langsung.');
        return;
      }
      child.noteApContentModalClose=closeContentModal;
      if(!doc.getElementById('noteap-modal-style')){
        const style=doc.createElement('style');
        style.id='noteap-modal-style';
        style.textContent='.sidebar,.mobile-top,.form-breadcrumb,.form-title-row .secondary-btn,.page-footer{display:none!important}.main-area{margin-left:0!important}.content-form-wrap{max-width:none!important;padding:34px 38px 24px!important}@media(max-width:700px){.content-form-wrap{padding:28px 15px 20px!important}}html,body{background:transparent!important;background-color:transparent!important}.content-form-wrap{background:transparent!important;background-color:transparent!important}.form-panel{background:rgba(255,255,255,.72)!important;border-color:rgba(220,232,224,.8)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(20,55,36,.07)!important}';
        doc.head.append(style);
      }
      if(!child.__noteApEscapeBound){
        child.addEventListener('keydown',event=>{if(event.key==='Escape')closeContentModal();});
        child.__noteApEscapeBound=true;
      }
    }catch(error){
      showToast('Form Konten gagal dimuat. Buka Tambah Konten secara langsung untuk mencoba lagi.');
    }
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
  let visitCurrentPage=0,visitSelectedId=null;
  let visitCalendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let visitCalendarSelected=[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-');
  const visitPageSize=4;
  const visitFields=[
    {key:'visitDate',label:'TGL VISIT',type:'date'},
    {key:'time',label:'JAM',type:'time'},
    {key:'location',label:'LOKASI',type:'text'},
    {key:'title',label:'JUDUL KONTEN',type:'text'},
    {key:'publishDate',label:'TGL PUBLISH',type:'date'},
    {key:'talent',label:'TALENT',type:'text'},
    {key:'props',label:'PROPERTI / PRODUK',type:'text'},
    {key:'status',label:'STATUS',type:'select'},
    {key:'notes',label:'KETERANGAN',type:'textarea'}
  ];
  const escapeVisit=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const visitStatusOptions=['PLANNED','ON PROGRESS','DONE','CANCELLED'];
  function sortedVisits(){return readVisits().sort((a,b)=>(a.visitDate||'').localeCompare(b.visitDate||'')||(a.time||'').localeCompare(b.time||''));}
  function makeVisitInput(field,value,id){
    const safe=escapeVisit(value||'');
    if(field.type==='select')return '<select class="visit-inline-input" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'">'+visitStatusOptions.map(status=>'<option value="'+status+'" '+(value===status?'selected':'')+'>'+status+'</option>').join('')+'</select>';
    if(field.type==='textarea')return '<textarea rows="2" class="visit-inline-input visit-inline-textarea" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" placeholder="Tambahkan keterangan">'+safe+'</textarea>';
    return '<input class="visit-inline-input" type="'+field.type+'" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" value="'+safe+'" placeholder="Isi '+field.label.toLowerCase()+'">';
  }
  function renderVisitTables(){
    const visits=sortedVisits();
    const pageCount=Math.max(1,Math.ceil(visits.length/visitPageSize));
    visitCurrentPage=Math.min(visitCurrentPage,pageCount-1);
    const pageItems=visits.slice(visitCurrentPage*visitPageSize,(visitCurrentPage+1)*visitPageSize);
    if(!pageItems.some(item=>item.id===visitSelectedId))visitSelectedId=pageItems[0]?.id||null;
    const body=document.getElementById('visitTableBody');body.replaceChildren();
    pageItems.forEach((v,index)=>{
      const tr=document.createElement('tr');tr.className='visit-select-row'+(v.id===visitSelectedId?' selected':'');tr.dataset.visitId=v.id;
      const numberCell=document.createElement('td');numberCell.textContent=String(visitCurrentPage*visitPageSize+index+1);tr.append(numberCell);
      const summaryFields=[{key:'visitDate',type:'date'},{key:'location',type:'text'},{key:'title',type:'text'},{key:'talent',type:'text'},{key:'status',type:'select'},{key:'notes',type:'text'}];
      summaryFields.forEach(field=>{const td=document.createElement('td');td.append(makeVisitInput(field,field.key==='talent'?splitTalentNames(v.talent).join(', '):v[field.key],v.id));tr.append(td);});
      tr.addEventListener('click',event=>{if(event.target.closest('input,select,textarea'))return;visitSelectedId=v.id;renderVisitTables();});
      body.append(tr);
    });
    document.getElementById('visitEmpty').hidden=visits.length>0;
    document.getElementById('visitPageInfo').textContent='Halaman '+(visitCurrentPage+1)+' dari '+pageCount;
    document.getElementById('visitPrevPage').disabled=visitCurrentPage===0;
    document.getElementById('visitNextPage').disabled=visitCurrentPage>=pageCount-1;
    const today=new Date(),todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    document.getElementById('visitTodayDate').textContent='Today · '+new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(today);
    const todayVisits=visits.filter(v=>v.visitDate===todayKey);
    const todayList=document.getElementById('visitTodayList');todayList.replaceChildren();
    const todayLabel=document.createElement('div');todayLabel.className='visit-today-label';todayLabel.textContent='Jadwal visit :';todayList.append(todayLabel);
    const todayEntries=todayVisits.length?todayVisits:[null];
    todayEntries.forEach(v=>{const item=document.createElement('div');item.className='visit-today-entry';[['Hari ini :',v?visitDateLabel(v.visitDate):'Tidak ada jadwal'],['Lokasi :',v?.location||'—'],['Jam :',v?.time||'—']].forEach(([label,value])=>{const row=document.createElement('div');row.className='visit-today-line';const key=document.createElement('b');key.textContent=label;const val=document.createElement('span');val.textContent=value;row.append(key,val);item.append(row);});todayList.append(item);});
    renderVisitCalendar(visits);
    renderSettingsVisitTable(visits);
  }
  function renderVisitCalendar(visits){
    const root=document.getElementById('visitCalendar');if(!root)return;
    root.replaceChildren();
    const year=visitCalendarMonth.getFullYear(),month=visitCalendarMonth.getMonth();
    const header=document.createElement('div');header.className='visit-calendar-header';
    const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','Bulan sebelumnya');prev.dataset.calendarMove='-1';
    const title=document.createElement('b');title.textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(visitCalendarMonth);
    const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','Bulan berikutnya');next.dataset.calendarMove='1';
    header.append(prev,title,next);root.append(header);
    const grid=document.createElement('div');grid.className='visit-calendar-grid';
    ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach(day=>{const cell=document.createElement('div');cell.className='visit-calendar-weekday';cell.textContent=day;grid.append(cell);});
    const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
    const counts={};visits.forEach(v=>{if(v.visitDate)counts[v.visitDate]=(counts[v.visitDate]||0)+1;});
    for(let i=0;i<first;i++){const blank=document.createElement('div');blank.className='visit-calendar-day is-blank';grid.append(blank);}
    for(let day=1;day<=days;day++){
      const key=[year,String(month+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
      const cell=document.createElement('button');cell.type='button';cell.className='visit-calendar-day'+(key===visitCalendarSelected?' is-selected':'')+(counts[key]?' has-visit':'');
      const num=document.createElement('span');num.textContent=day;cell.append(num);
      if(counts[key]){const marker=document.createElement('small');marker.textContent=counts[key]+' Visit';cell.append(marker);}
      cell.dataset.calendarDate=key;grid.append(cell);
    }
    root.append(grid);
    const selected=document.createElement('div');selected.className='visit-calendar-selected';
    const selectedDate=new Date(visitCalendarSelected+'T00:00:00');
    const heading=document.createElement('b');heading.textContent='Jadwal '+new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(selectedDate);selected.append(heading);
    const matches=visits.filter(v=>v.visitDate===visitCalendarSelected);
    if(!matches.length){const empty=document.createElement('p');empty.textContent='Belum ada Visit pada tanggal ini.';selected.append(empty);}
    matches.forEach(v=>{const row=document.createElement('div');row.className='visit-calendar-event';const time=document.createElement('b');time.textContent=v.time||'—';const detail=document.createElement('span');detail.textContent=(v.location||'Lokasi belum diisi')+' · '+(v.title||'Tanpa judul');row.append(time,detail);selected.append(row);});
    root.append(selected);
  }
  document.getElementById('visitCalendar').addEventListener('click',event=>{
    const move=event.target.closest('[data-calendar-move]');
    if(move){visitCalendarMonth=new Date(visitCalendarMonth.getFullYear(),visitCalendarMonth.getMonth()+Number(move.dataset.calendarMove),1);renderVisitCalendar(sortedVisits());return;}
    const day=event.target.closest('[data-calendar-date]');
    if(day){visitCalendarSelected=day.dataset.calendarDate;renderVisitCalendar(sortedVisits());}
  });
  function renderSettingsVisitTable(visits){
    const body=document.getElementById('settingsVisitBody');if(!body)return;body.replaceChildren();
    visits.forEach((v,index)=>{const tr=document.createElement('tr');[String(index+1),visitDateLabel(v.visitDate),v.time||'—',v.location||'—',v.title||'—',visitDateLabel(v.publishDate),splitTalentNames(v.talent).join(', ')||'—',v.props||'—',v.status||'PLANNED',v.notes||'—'].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});const action=document.createElement('td');action.className='visit-actions';const del=document.createElement('button');del.type='button';del.textContent='Hapus';del.addEventListener('click',()=>{if(!confirm('Hapus jadwal Visit ini?'))return;writeVisits(readVisits().filter(x=>x.id!==v.id));renderVisitTables();showToast('Jadwal Visit dihapus.');});action.append(del);tr.append(action);body.append(tr);});
    const empty=document.getElementById('settingsVisitEmpty');if(empty)empty.hidden=visits.length>0;
  }
  function splitTalentNames(value){if(Array.isArray(value))return value.map(x=>String(x).trim()).filter(Boolean);return String(value||'').split(/[,;\\n]/).map(x=>x.trim()).filter(Boolean);}
  function updateVisitField(id,field,value){
    const items=readVisits(),index=items.findIndex(item=>item.id===id);if(index<0)return;
    items[index][field]=value;items[index].updatedAt=new Date().toISOString();writeVisits(items);
    const focused=document.activeElement;renderVisitTables();
    if(focused?.dataset?.visitId===id&&focused?.dataset?.visitField===field){const replacement=document.querySelector('[data-visit-id="'+CSS.escape(id)+'"][data-visit-field="'+field+'"]');if(replacement){replacement.focus();if(replacement.setSelectionRange&&replacement.type==='text'){const end=replacement.value.length;replacement.setSelectionRange(end,end);}}}
    showToast('Perubahan Visit tersimpan.');
  }
  document.getElementById('visitTableBody').addEventListener('change',event=>{const input=event.target.closest('[data-visit-id][data-visit-field]');if(input)updateVisitField(input.dataset.visitId,input.dataset.visitField,input.value);});
  document.getElementById('visitTodayList').addEventListener('change',event=>{const input=event.target.closest('[data-visit-id][data-visit-field]');if(input)updateVisitField(input.dataset.visitId,input.dataset.visitField,input.value);});
  document.getElementById('visitPrevPage').addEventListener('click',()=>{visitCurrentPage=Math.max(0,visitCurrentPage-1);visitSelectedId=null;renderVisitTables();});
  document.getElementById('visitNextPage').addEventListener('click',()=>{const max=Math.max(0,Math.ceil(sortedVisits().length/visitPageSize)-1);visitCurrentPage=Math.min(max,visitCurrentPage+1);visitSelectedId=null;renderVisitTables();});

  function renderVisitEditorLegacy(){renderVisitTables();}
  const visitEditor=document.getElementById('visitEditor'),visitForm=document.getElementById('visitForm');
  function openVisitEditor(){renderVisitTables();}
  function closeVisitEditor(){}
  function populateVisitReferenceOptions(){}
  if(visitEditor)visitEditor.hidden=true;
  const addSettingVisitBtn=document.getElementById('addSettingVisitBtn');
  renderVisitTables();
  if(window.location.hash==='#visit')showPage('visit');
  if(window.location.hash==='#setelan')showPage('setelan');
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