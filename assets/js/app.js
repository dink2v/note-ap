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
    renderCalendarPlanner();
    showToast(event.data.storage==='local'
      ? 'Konten tersimpan di browser ini (mode lokal).'
      : 'Konten berhasil dikirim ke Note AP.');
  });
  function openContentModal(event){
    if(event)event.preventDefault();
    contentModal.classList.add('open');
    contentModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    const createUrl=new URL('./tambah-konten.html',document.baseURI).href;
    if(!contentModalFrame.getAttribute('src')||contentModalFrame.src!==createUrl)contentModalFrame.src=createUrl;
  }
  function openContentDetail(item){
    if(!item)return;
    contentModal.classList.add('open');
    contentModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    const detailUrl=new URL('./tambah-konten.html',document.baseURI);
    detailUrl.searchParams.set('mode','detail');
    detailUrl.searchParams.set('id',String(item.id||''));
    contentModalFrame.src=detailUrl.href;
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
        style.textContent='.sidebar,.mobile-top,.form-breadcrumb,.form-title-row > a.secondary-btn,.page-footer{display:none!important}.main-area{margin-left:0!important}.content-form-wrap{max-width:none!important;padding:34px 38px 24px!important}@media(max-width:700px){.content-form-wrap{padding:28px 15px 20px!important}}html,body{background:transparent!important;background-color:transparent!important}.content-form-wrap{background:transparent!important;background-color:transparent!important}.form-panel{background:rgba(255,255,255,.72)!important;border-color:rgba(220,232,224,.8)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(20,55,36,.07)!important}.form-title-row #detailEditTop{display:inline-flex!important;align-items:center;justify-content:center;order:2;margin-left:auto;flex:0 0 auto;position:relative;z-index:2}.form-title-row>div{order:1;min-width:0}.form-title-row{gap:14px;align-items:flex-start!important}'
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
  // Hindari render Visit sebelum konstanta dan data Visit selesai diinisialisasi.
  let visitDataReady=false;
  const settingsPage=document.getElementById('settingsPage');
  const helpPage=document.getElementById('helpPage');
  const pageElements={
    dashboard:dashboardPage,kalender:calendarPage,konten:contentPage,
    kanban:kanbanPage,visit:visitPage,setelan:settingsPage,bantuan:helpPage
  };
  function showPage(page){
    if(!Object.prototype.hasOwnProperty.call(pageElements,page))page='dashboard';
    Object.entries(pageElements).forEach(([key,element])=>{
      if(element)element.hidden=key!==page;
    });
    document.querySelectorAll('.nav-link').forEach(item=>{
      const active=item.dataset.page===page;
      item.classList.toggle('active',active);
      item.setAttribute('aria-current',active?'page':'false');
    });
    const todayLabel=document.getElementById('todayLabel');
    const todayDate=document.getElementById('todayDate');
    if(todayLabel)todayLabel.textContent=page==='kalender'?'CONTENT SCHEDULING':page==='visit'?'PRODUCTION VISIT':page==='konten'?'CONTENT MANAGEMENT':'WORKSPACE OVERVIEW';
    if(todayDate)todayDate.textContent=page==='kalender'
      ?'Lihat dan atur jadwal dari data konten yang sama dengan menu Konten dan Kanban.'
      :page==='visit'?'Catat dan pantau jadwal kunjungan produksi, lokasi, talent, serta status pengerjaan.'
      :page==='konten'?'Kelola seluruh ide, proses, dan publikasi konten Instagram dan TikTok.'
      :'Ringkasan aktivitas konten Apotek Prapatan';
    if(page==='konten')renderContentList();
    if(page==='kanban')renderKanban();
    if((page==='visit'||page==='setelan')&&visitDataReady)renderVisitTables();
    if(page==='bantuan')renderChat();
    const nextHash='#'+page;
    if(window.location.hash!==nextHash)window.location.hash=page;
    document.getElementById('sidebar')?.classList.remove('open');
  }
  document.querySelectorAll('.nav-link[data-page]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    showPage(link.dataset.page);
  }));
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||link.matches('.nav-link[data-page]'))return;
    const page=link.getAttribute('href').slice(1);
    if(Object.prototype.hasOwnProperty.call(pageElements,page)){
      event.preventDefault();
      showPage(page);
    }
  });
  window.addEventListener('hashchange',()=>{
    const page=window.location.hash.replace(/^#/,'')||'dashboard';
    if(Object.prototype.hasOwnProperty.call(pageElements,page)){
      const active=Object.entries(pageElements).find(([key,element])=>key===page&&element&&!element.hidden);
      if(!active)showPage(page);
    }
  });
  document.getElementById('newContentListBtn').addEventListener('click',openContentModal);
  const contentSearch=document.getElementById('contentSearch'),contentPlatform=document.getElementById('contentPlatform'),contentStatus=document.getElementById('contentStatus'),contentDateFrom=document.getElementById('contentDateFrom'),contentDateTo=document.getElementById('contentDateTo');
  [contentSearch,contentPlatform,contentStatus,contentDateFrom,contentDateTo].forEach(input=>input.addEventListener('input',renderContentList));
  document.getElementById('resetContentFilters').addEventListener('click',()=>{[contentSearch,contentPlatform,contentStatus,contentDateFrom,contentDateTo].forEach(input=>input.value='');renderContentList();});

  // Render halaman awal setelah kontrol Konten dan filter selesai diinisialisasi.
  const initialPage=window.location.hash.replace(/^#/,'')||'dashboard';
  showPage(Object.prototype.hasOwnProperty.call(pageElements,initialPage)?initialPage:'dashboard');
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
      tr.classList.add('content-row-clickable');
      tr.tabIndex=0;
      tr.setAttribute('role','button');
      tr.setAttribute('aria-label','Buka detail konten: '+(item.title||'Tanpa judul'));
      tr.title='Klik untuk melihat dan mengedit detail konten';
      tr.addEventListener('click',()=>openContentDetail(item));
      tr.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();openContentDetail(item);}
      });
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


  // NOTE AP CALENDAR PLANNER — shared noteAp.contents storage
  const calendarGrid=document.getElementById('noteApCalendarGrid');
  const calendarMonthLabel=document.getElementById('noteApCalendarMonth');
  const calendarItemModal=document.getElementById('calendarItemModal');
  const calendarItemForm=document.getElementById('calendarItemForm');
  let calendarCursor=new Date();calendarCursor.setDate(1);
  let calendarViewMode='month';
  const calendarDateKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const calendarReadItems=()=>{try{const rows=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');return Array.isArray(rows)?rows.filter(item=>item&&typeof item==='object'):[];}catch(error){return[];}};
  const calendarFormatClass=format=>{const value=String(format||'').toLowerCase();return value==='reels'?'reels':value==='carousel'?'carousel':value==='feed'?'feed':'other';};
  let calendarSuppressClickUntil=0;
  function moveCalendarContent(itemId,targetDate){
    const items=calendarReadItems(),index=items.findIndex(item=>String(item.id||'')===String(itemId||''));
    if(index<0){showToast('Konten tidak ditemukan. Jadwal tidak dipindahkan.');return;}
    if(!targetDate||String(items[index].postingDate||'')===targetDate)return;
    const now=new Date().toISOString();items[index]={...items[index],postingDate:targetDate,updatedAt:now};
    try{localStorage.setItem('noteAp.contents',JSON.stringify(items));calendarSuppressClickUntil=Date.now()+700;renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();showToast('Jadwal berhasil dipindahkan ke '+formatContentDate(targetDate)+'.');}
    catch(error){showToast('Jadwal gagal dipindahkan. Penyimpanan browser tidak dapat diperbarui.');}
  }
  function renderCalendarAgenda(items){
    const host=document.getElementById('calendarAgendaList');if(!host)return;
    const today=calendarDateKey(new Date());
    const upcoming=items.filter(item=>item.postingDate&&String(item.postingDate)>=today).sort((a,b)=>String(a.postingDate).localeCompare(String(b.postingDate))||String(a.postingTime||'').localeCompare(String(b.postingTime||''))).slice(0,6);
    host.replaceChildren();
    if(!upcoming.length){const empty=document.createElement('p');empty.className='calendar-agenda-empty';empty.textContent='Belum ada jadwal mendatang.';host.append(empty);return;}
    upcoming.forEach(item=>{
      const row=document.createElement('button');row.type='button';row.className='calendar-agenda-item';
      const date=new Date(String(item.postingDate)+'T00:00:00');
      const dateBox=document.createElement('span');dateBox.className='calendar-agenda-date';dateBox.innerHTML='<b>'+String(date.getDate()).padStart(2,'0')+'</b><small>'+new Intl.DateTimeFormat('id-ID',{month:'short'}).format(date).toUpperCase()+'</small>';
      const copy=document.createElement('span');copy.className='calendar-agenda-copy';
      const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
      const meta=document.createElement('small');meta.textContent=[item.postingTime||'Jam belum diatur',item.platform||'',item.format||''].filter(Boolean).join(' · ');
      copy.append(title,meta);row.append(dateBox,copy);row.addEventListener('click',()=>openCalendarContentDetail(item));host.append(row);
    });
  }
  function renderCalendarPlanner(){
    if(!calendarGrid||!calendarMonthLabel)return;
    const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
    const items=calendarReadItems();
    const monthCount=items.filter(item=>String(item.postingDate||'').startsWith(year+'-'+String(month+1).padStart(2,'0'))).length;
    const todayKey=calendarDateKey(new Date());
    const upcomingCount=items.filter(item=>item.postingDate&&String(item.postingDate)>=todayKey&&item.status!=='Published').length;
    const publishedCount=items.filter(item=>item.status==='Published'&&String(item.postingDate||'').startsWith(year+'-'+String(month+1).padStart(2,'0'))).length;
    const statMonth=document.getElementById('calendarStatMonth'),statUpcoming=document.getElementById('calendarStatUpcoming'),statPublished=document.getElementById('calendarStatPublished');
    if(statMonth)statMonth.textContent=String(monthCount);
    if(statUpcoming)statUpcoming.textContent=String(upcomingCount);
    if(statPublished)statPublished.textContent=String(publishedCount);
    renderCalendarAgenda(items);
    const monthName=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'});
    if(calendarViewMode==='month')calendarMonthLabel.textContent=monthName.format(calendarCursor);
    else if(calendarViewMode==='week'){
      const weekStart=new Date(calendarCursor);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
      const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
      calendarMonthLabel.textContent=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(weekStart)+' – '+new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(weekEnd);
    }else calendarMonthLabel.textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(calendarCursor);
    calendarGrid.className='note-ap-calendar-grid view-'+calendarViewMode;
    calendarGrid.replaceChildren();
    ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].slice(0,calendarViewMode==='day'?1:7).forEach(day=>{const label=document.createElement('div');label.className='calendar-weekday';label.textContent=day;calendarGrid.append(label);});
    let startDate,dayCount;
    if(calendarViewMode==='month'){const first=new Date(year,month,1),offset=(first.getDay()+6)%7;startDate=new Date(year,month,1-offset);dayCount=42;}
    else if(calendarViewMode==='week'){startDate=new Date(calendarCursor);startDate.setDate(startDate.getDate()-((startDate.getDay()+6)%7));dayCount=7;}
    else{startDate=new Date(calendarCursor);dayCount=1;}
    for(let index=0;index<dayCount;index++){
      const date=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()+index),key=calendarDateKey(date);
      const cell=document.createElement('section');cell.className='calendar-day-cell'+(calendarViewMode==='month'&&date.getMonth()!==month?' outside-month':'');
      cell.dataset.calendarDate=key;
      cell.addEventListener('dragover',event=>{if(event.dataTransfer?.types.includes('text/noteap-content-id')){event.preventDefault();event.dataTransfer.dropEffect='move';cell.classList.add('is-drop-target');}});
      cell.addEventListener('dragleave',event=>{if(!cell.contains(event.relatedTarget))cell.classList.remove('is-drop-target');});
      cell.addEventListener('drop',event=>{event.preventDefault();cell.classList.remove('is-drop-target');const id=event.dataTransfer?.getData('text/noteap-content-id');if(id)moveCalendarContent(id,key);});
      if(key===todayKey)cell.classList.add('is-today');
      const head=document.createElement('div');head.className='calendar-day-head';
      const number=document.createElement('span');number.className='calendar-day-number';number.textContent=String(date.getDate());head.append(number);
      const add=document.createElement('button');add.type='button';add.className='calendar-day-add';add.textContent='+';add.title='Tambah jadwal pada '+key;add.setAttribute('aria-label','Tambah jadwal '+key);add.addEventListener('click',()=>openCalendarItemModal(null,key));head.append(add);cell.append(head);
      const dayItems=items.filter(item=>String(item.postingDate||'')===key).sort((a,b)=>String(a.postingTime||'').localeCompare(String(b.postingTime||'')));
      dayItems.forEach(item=>{
        const event=document.createElement('button');event.type='button';event.draggable=true;event.className='calendar-event-chip '+calendarFormatClass(item.format);event.title='Seret ke tanggal lain untuk memindahkan jadwal. Klik untuk melihat detail: '+(item.title||'Tanpa judul');
        const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
        const meta=document.createElement('small');meta.textContent=[item.postingTime||'',item.format||item.platform||''].filter(Boolean).join(' · ');
        event.addEventListener('dragstart',dragEvent=>{dragEvent.dataTransfer.setData('text/noteap-content-id',String(item.id||''));dragEvent.dataTransfer.effectAllowed='move';event.classList.add('is-dragging');});
        event.addEventListener('dragend',()=>{event.classList.remove('is-dragging');calendarGrid.querySelectorAll('.is-drop-target').forEach(target=>target.classList.remove('is-drop-target'));});
        event.append(title,meta);event.addEventListener('click',()=>{if(Date.now()<calendarSuppressClickUntil)return;openCalendarContentDetail(item);});cell.append(event);
      });
      cell.addEventListener('dblclick',event=>{if(event.target===cell||event.target===head||event.target===number)openCalendarItemModal(null,key);});
      calendarGrid.append(cell);
    }
    document.querySelectorAll('[data-calendar-view]').forEach(button=>{const active=button.dataset.calendarView===calendarViewMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    const hint=document.getElementById('calendarViewHint');if(hint)hint.textContent=calendarViewMode==='month'?'Ringkasan satu bulan. Seret kartu ke tanggal lain untuk menjadwalkan ulang.':calendarViewMode==='week'?'Fokus jadwal satu minggu dengan ruang lebih lega.':'Fokus satu hari dan seluruh konten yang dijadwalkan.';
  }
  let selectedCalendarContent=null;
  function openCalendarContentDetail(item){
    selectedCalendarContent=item;
    const modal=document.getElementById('calendarContentDetailModal');
    const body=document.getElementById('calendarContentDetailBody');
    if(!modal||!body||!item)return;
    const sections=[
      {title:'Informasi Konten',fields:[['Judul Konten',item.title],['Platform',item.platform],['Format',item.format],['Durasi / Slide',item.duration],['Pilar Konten',item.pillar],['Status',item.status],['Tanggal Posting',formatContentDate(item.postingDate)],['Jam Posting',item.postingTime],['Referensi',item.reference]]},
      {title:'Materi & Arahan Visual',fields:[['Hook / Opening',item.hook],['Visual Hook',item.visualHook],['Body / Naskah',item.body],['Visual Body',item.visualBody],['CTA',item.cta],['Visual CTA',item.visualCTA]]},
      {title:'Caption & Catatan',fields:[['Caption',item.caption],['Catatan',item.notes]]}
    ];
    body.replaceChildren();
    sections.forEach(section=>{
      const group=document.createElement('section');group.className='calendar-detail-section';
      const heading=document.createElement('h3');heading.textContent=section.title;group.append(heading);
      const grid=document.createElement('div');grid.className='calendar-detail-grid';
      section.fields.forEach(([label,value])=>{
        if(value===undefined||value===null||String(value).trim()==='')return;
        const field=document.createElement('div');field.className='calendar-detail-field';
        const name=document.createElement('b');name.textContent=label;
        const content=document.createElement('p');content.textContent=String(value);
        field.append(name,content);grid.append(field);
      });
      if(grid.childElementCount)group.append(grid);else{const empty=document.createElement('p');empty.textContent='Belum diisi.';group.append(empty);}
      body.append(group);
    });
    modal.hidden=false;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('calendar-item-open');
  }
  function closeCalendarContentDetail(){
    const modal=document.getElementById('calendarContentDetailModal');
    if(!modal)return;
    modal.classList.remove('open');modal.setAttribute('aria-hidden','true');modal.hidden=true;document.body.classList.remove('calendar-item-open');
  }
  document.getElementById('calendarContentDetailClose')?.addEventListener('click',closeCalendarContentDetail);
  document.getElementById('calendarContentDetailDone')?.addEventListener('click',closeCalendarContentDetail);
  document.getElementById('calendarContentDetailEdit')?.addEventListener('click',()=>{
    if(!selectedCalendarContent)return;
    // Ambil ulang data terbaru berdasarkan ID agar form edit selalu memakai
    // sumber data Konten yang sama, bukan salinan detail kalender yang lama.
    const latestItem=calendarReadItems().find(item=>String(item.id||'')===String(selectedCalendarContent.id||''));
    if(!latestItem){
      showToast('Konten tidak ditemukan. Data tidak diubah.');
      return;
    }
    selectedCalendarContent=latestItem;
    closeCalendarContentDetail();
    openContentDetail(latestItem);
  });
  document.getElementById('calendarContentDetailModal')?.addEventListener('click',event=>{if(event.target.id==='calendarContentDetailModal')closeCalendarContentDetail();});
  function openCalendarItemModal(item,dateValue){
    if(!calendarItemModal||!calendarItemForm)return;
    calendarItemForm.reset();
    const data=item||{};
    calendarItemForm.elements.itemId.value=String(data.id||'');
    calendarItemForm.elements.title.value=String(data.title||'');
    calendarItemForm.elements.platform.value=String(data.platform||'');
    calendarItemForm.elements.format.value=String(data.format||'');
    calendarItemForm.elements.pillar.value=String(data.pillar||'');
    calendarItemForm.elements.status.value=String(data.status||'Ideation');
    calendarItemForm.elements.postingDate.value=String(data.postingDate||dateValue||calendarDateKey(new Date()));
    calendarItemForm.elements.postingTime.value=String(data.postingTime||'');
    document.getElementById('calendarItemTitle').textContent=item?'Edit Jadwal Konten':'Tambah Jadwal Konten';
    document.getElementById('calendarItemSave').textContent=item?'Simpan Perubahan':'Simpan Jadwal';
    calendarItemModal.hidden=false;calendarItemModal.classList.add('open');calendarItemModal.setAttribute('aria-hidden','false');
    document.body.classList.add('calendar-item-open');calendarItemForm.elements.title.focus();
  }
  function closeCalendarItemModal(){
    if(!calendarItemModal)return;
    calendarItemModal.classList.remove('open');calendarItemModal.setAttribute('aria-hidden','true');calendarItemModal.hidden=true;document.body.classList.remove('calendar-item-open');
  }
  document.getElementById('calendarItemClose')?.addEventListener('click',closeCalendarItemModal);
  document.getElementById('calendarItemCancel')?.addEventListener('click',closeCalendarItemModal);
  calendarItemModal?.addEventListener('click',event=>{if(event.target===calendarItemModal)closeCalendarItemModal();});
  calendarItemForm?.addEventListener('submit',event=>{
    event.preventDefault();if(!calendarItemForm.reportValidity())return;
    const values=Object.fromEntries(new FormData(calendarItemForm).entries()),items=calendarReadItems(),existingIndex=items.findIndex(item=>String(item.id||'')===String(values.itemId||''));
    const now=new Date().toISOString();
    const updated={...(existingIndex>=0?items[existingIndex]:{}),title:values.title.trim(),platform:values.platform,format:values.format,pillar:values.pillar.trim(),status:values.status,postingDate:values.postingDate,postingTime:values.postingTime,updatedAt:now};
    if(existingIndex>=0)items[existingIndex]=updated;
    else{updated.id='NAP-'+Date.now().toString(36).toUpperCase();updated.createdAt=now;updated.duration='';updated.reference='';updated.hook='';updated.visualHook='';updated.body='';updated.visualBody='';updated.cta='';updated.visualCTA='';updated.caption='';updated.notes='';updated.approvals=[];updated.comments=[];updated.history=[{type:'Jadwal konten dibuat dari Kalender Note AP',at:now}];updated.storage='local';items.unshift(updated);}
    try{localStorage.setItem('noteAp.contents',JSON.stringify(items));closeCalendarItemModal();renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();showToast(existingIndex>=0?'Jadwal konten berhasil diperbarui.':'Jadwal konten berhasil ditambahkan.');}
    catch(error){showToast('Jadwal gagal disimpan. Penyimpanan browser mungkin penuh.');}
  });
  document.querySelectorAll('[data-calendar-view]').forEach(button=>button.addEventListener('click',()=>{calendarViewMode=button.dataset.calendarView||'month';renderCalendarPlanner();}));
  document.getElementById('noteApCalendarPrev')?.addEventListener('click',()=>{if(calendarViewMode==='month')calendarCursor.setMonth(calendarCursor.getMonth()-1);else if(calendarViewMode==='week')calendarCursor.setDate(calendarCursor.getDate()-7);else calendarCursor.setDate(calendarCursor.getDate()-1);renderCalendarPlanner();});
  document.getElementById('noteApCalendarNext')?.addEventListener('click',()=>{if(calendarViewMode==='month')calendarCursor.setMonth(calendarCursor.getMonth()+1);else if(calendarViewMode==='week')calendarCursor.setDate(calendarCursor.getDate()+7);else calendarCursor.setDate(calendarCursor.getDate()+1);renderCalendarPlanner();});
  document.getElementById('noteApCalendarToday')?.addEventListener('click',()=>{calendarCursor=new Date();renderCalendarPlanner();});
  renderCalendarPlanner();
  window.addEventListener('storage',event=>{if(event.key==='noteAp.contents'){renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();}});


  const visitKey='noteAp.visits';
  const readVisits=()=>{
    try{
      const value=JSON.parse(localStorage.getItem(visitKey)||'[]');
      if(!Array.isArray(value))return[];
      return value.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map((item,index)=>({
        ...item,
        id:String(item.id||'VIS-IMPORTED-'+(index+1)),
        visitDate:String(item.visitDate??''),
        time:String(item.time??''),
        location:String(item.location??''),
        title:String(item.title??''),
        publishDate:String(item.publishDate??''),
        props:String(item.props??''),
        status:String(item.status??''),
        notes:String(item.notes??'')
      }));
    }catch(error){return[];}
  };
  const writeVisits=items=>{
    try{localStorage.setItem(visitKey,JSON.stringify(items));return true;}
    catch(error){showToast('Data Visit gagal disimpan. Periksa ruang penyimpanan browser.');return false;}
  };
  const visitDateLabel=value=>value?formatContentDate(String(value)):'—';
  let visitCurrentPage=0,visitSelectedId=null;
  let visitSelectMode=false;
  const visitSelectedIds=new Set();
  let visitViewMode='list';
  let visitCalendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let visitCalendarSelected=[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-');
  const visitPageSize=4;
  let visitExtraRows=0;
  const visitHiddenEmptyRowsByMonth=new Map();
  const visitFields=[
    {key:'visitDate',label:'TGL VISIT',type:'date'},
    {key:'time',label:'JAM',type:'time'},
    {key:'location',label:'LOKASI',type:'text'},
    {key:'title',label:'JUDUL KONTEN',type:'textarea'},
    {key:'talent',label:'TALENT',type:'text'},
    {key:'props',label:'PROPERTI / PRODUK',type:'text'},
    {key:'status',label:'STATUS',type:'select'},
    {key:'notes',label:'KETERANGAN',type:'textarea'}
  ];
  const escapeVisit=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const visitStatusOptions=['PLANNED','ON PROGRESS','DONE','CANCELLED'];
  function sortedVisits(){return readVisits().sort((a,b)=>String(a.visitDate||'').localeCompare(String(b.visitDate||''))||String(a.time||'').localeCompare(String(b.time||'')));}
  function getTalentOptions(){
    let configured=[];
    try{const saved=JSON.parse(localStorage.getItem('noteAp.talents')||'[]');if(Array.isArray(saved))configured=saved.map(item=>typeof item==='string'?item:item?.name).filter(Boolean);}catch(error){}
    const fromVisits=readVisits().flatMap(item=>splitTalentNames(item.talent));
    return [...new Set([...configured,'Kak Edi','Kak Sofia','Kak Dayu',...fromVisits].map(name=>String(name).trim()).filter(Boolean))];
  }
  function rememberTalentOptions(names){
    let saved=[];
    try{const current=JSON.parse(localStorage.getItem('noteAp.talents')||'[]');if(Array.isArray(current))saved=current.map(item=>typeof item==='string'?item:item?.name).filter(Boolean);}catch(error){}
    const merged=[...new Set([...saved,...names].map(name=>String(name||'').trim()).filter(Boolean))];
    try{localStorage.setItem('noteAp.talents',JSON.stringify(merged));}catch(error){}
  }
  function makeTalentSelect(value,id,isNew=false){
    const selected=splitTalentNames(value),options=getTalentOptions();
    const dataAttrs=isNew?'data-new-visit-field="talent"':'data-visit-id="'+escapeVisit(id)+'" data-visit-field="talent"';
    const summary=selected.length?selected.join(', '):'Pilih Talent';
    const optionRows=options.map(name=>'<label class="visit-talent-option"><input type="checkbox" '+dataAttrs+' value="'+escapeVisit(name)+'" '+(selected.includes(name)?'checked':'')+'><span>'+escapeVisit(name)+'</span><i aria-hidden="true"></i></label>').join('');
    return '<details class="visit-multiselect"><summary aria-label="Pilih talent" title="Klik untuk memilih satu atau beberapa talent"><span class="visit-talent-summary">'+escapeVisit(summary)+'</span></summary><div class="visit-multiselect-menu"><div class="visit-talent-menu-head"><div><b>Pilih Talent</b><small>Pilih satu atau beberapa orang</small></div><span class="visit-talent-count">'+selected.length+' dipilih</span></div><div class="visit-talent-search-wrap"><span aria-hidden="true">⌕</span><input class="visit-talent-search" type="search" placeholder="Cari nama talent..." aria-label="Cari nama talent" autocomplete="off"></div><div class="visit-talent-options">'+optionRows+'</div><div class="visit-talent-empty" hidden>Talent tidak ditemukan.</div><div class="visit-talent-menu-foot"><span>✓ Pilihan tersimpan otomatis</span><small>Centang untuk memilih</small></div></div></details>';
  }
  function makeVisitInput(field,value,id){
    const safe=escapeVisit(value||'');
    if(field.key==='talent')return makeTalentSelect(value,id,false);
    if(field.type==='select')return '<select class="visit-inline-input" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'">'+visitStatusOptions.map(status=>'<option value="'+status+'" '+(value===status?'selected':'')+'>'+status+'</option>').join('')+'</select>';
    if(field.type==='textarea')return '<textarea rows="2" class="visit-inline-input visit-inline-textarea" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" placeholder="'+(field.key==='location'?'Lokasi':'Isi '+field.label.toLowerCase())+'">'+safe+'</textarea>';
    return '<input class="visit-inline-input" type="'+field.type+'" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" value="'+safe+'" placeholder="'+(field.key==='location'?'Lokasi':'Isi '+field.label.toLowerCase())+'">';
  }
  function setVisitViewMode(mode){
    visitViewMode=mode;
    const list=document.getElementById('visitListPanel'),grid=document.getElementById('visitGridPanel');
    const pagination=document.querySelector('.visit-main-card .visit-pagination');
    const listBtn=document.getElementById('visitListViewBtn'),gridBtn=document.getElementById('visitGridViewBtn');
    if(list)list.hidden=mode!=='list';
    if(grid)grid.hidden=mode!=='grid';
    if(pagination)pagination.hidden=mode!=='list';
    if(listBtn)listBtn.classList.toggle('active',mode==='list');
    if(gridBtn)gridBtn.classList.toggle('active',mode==='grid');
    if(mode==='grid')renderVisitCalendar(sortedVisits());
  }
  document.getElementById('visitListViewBtn')?.addEventListener('click',()=>setVisitViewMode('list'));
  document.getElementById('visitAddScheduleBtn')?.addEventListener('click',()=>{setVisitViewMode('list');visitExtraRows++;renderVisitTables();const rows=document.querySelectorAll('#visitTableBody tr');const lastRow=rows[rows.length-1];const dateInput=lastRow?.querySelector('[data-new-visit-field="visitDate"]');if(dateInput){dateInput.focus();dateInput.scrollIntoView({behavior:'smooth',block:'nearest'});}showToast('Baris jadwal baru ditambahkan. Silakan isi kolom-kolomnya.');});
  document.getElementById('visitGridViewBtn')?.addEventListener('click',()=>setVisitViewMode('grid'));
  document.getElementById('visitSelectBtn')?.addEventListener('click',()=>{
    visitSelectMode=!visitSelectMode;
    if(!visitSelectMode)visitSelectedIds.clear();
    renderVisitTables();
  });
  document.getElementById('visitCancelSelectBtn')?.addEventListener('click',()=>{
    visitSelectMode=false;visitSelectedIds.clear();renderVisitTables();
  });
  document.getElementById('visitDeleteSelectedBtn')?.addEventListener('click',()=>{
    const monthKey=[visitCalendarMonth.getFullYear(),String(visitCalendarMonth.getMonth()+1).padStart(2,'0')].join('-');
    const before=readVisits();
    const monthVisits=sortedVisits().filter(item=>!item.visitDate||item.visitDate.slice(0,7)===monthKey);
    const pageItems=monthVisits.slice(visitCurrentPage*visitPageSize,(visitCurrentPage+1)*visitPageSize);
    const pageIds=new Set(pageItems.map(item=>item.id));
    const targets=before.filter(item=>pageIds.has(item.id)&&visitSelectedIds.has(item.id));
    const emptyPrefix='VISIT_EMPTY|'+monthKey+'|'+visitCurrentPage+'|';
    const emptyKeys=[...visitSelectedIds].filter(id=>id.startsWith(emptyPrefix));
    const total=targets.length+emptyKeys.length;
    if(!total){visitSelectedIds.clear();renderVisitTables();return;}
    if(!confirm('Hapus '+total+' baris yang dipilih? Tindakan ini tidak dapat dibatalkan.'))return;
    const targetRecords=new Set(targets);
    const remaining=before.filter(item=>!targetRecords.has(item));
    if(!writeVisits(remaining))return;
    const after=readVisits();
    if(JSON.stringify(after)!==JSON.stringify(remaining)){
      showToast('Penghapusan belum terverifikasi. Data pilihan tetap dipertahankan agar bisa dicoba lagi.');
      return;
    }
    if(total){
      // Kurangi jumlah slot yang tampil sebanyak seluruh baris terpilih,
      // termasuk ketika yang dihapus hanya jadwal tersimpan.
      visitHiddenEmptyRowsByMonth.set(monthKey,(visitHiddenEmptyRowsByMonth.get(monthKey)||0)+total);
    }
    const removed=targets.length+emptyKeys.length;
    visitSelectedIds.clear();visitSelectMode=false;visitSelectedId=null;
    visitCurrentPage=0;
    renderVisitTables();renderVisitCalendar(sortedVisits());
    showToast(removed+' baris Visit berhasil dihapus.');
  });
  document.getElementById('visitTableBody')?.addEventListener('toggle',event=>{
    const picker=event.target;
    if(!picker.matches?.('.visit-multiselect'))return;
    const menu=picker.querySelector('.visit-multiselect-menu');
    if(!picker.open||!menu)return;
    const rect=picker.querySelector('summary').getBoundingClientRect();
    const width=Math.min(260,window.innerWidth-28);
    const left=Math.max(14,Math.min(rect.left+(rect.width-width)/2,window.innerWidth-width-14));
    const below=window.innerHeight-rect.bottom-14,above=rect.top-14;
    const openUp=below<250&&above>below;
    const available=Math.max(150,(openUp?above:below)-8);
    Object.assign(menu.style,{position:'fixed',left:left+'px',right:'auto',top:openUp?'auto':(rect.bottom+7)+'px',bottom:openUp?(window.innerHeight-rect.top+7)+'px':'auto',width:width+'px',maxHeight:available+'px',overflow:'auto',transform:'none',zIndex:'9999'});
    const options=menu.querySelector('.visit-talent-options');
    if(options)options.style.maxHeight=Math.max(70,available-145)+'px';
    const search=menu.querySelector('.visit-talent-search');
    if(search)requestAnimationFrame(()=>search.focus());
  },true);
  document.getElementById('visitTableBody')?.addEventListener('input',event=>{
    const search=event.target.closest('.visit-talent-search');
    if(!search)return;
    const menu=search.closest('.visit-multiselect-menu');
    const query=search.value.trim().toLocaleLowerCase('id');
    let visible=0;
    menu.querySelectorAll('.visit-talent-option').forEach(option=>{
      const match=option.textContent.trim().toLocaleLowerCase('id').includes(query);
      option.hidden=!match;
      if(match)visible++;
    });
    const empty=menu.querySelector('.visit-talent-empty');
    if(empty)empty.hidden=visible>0;
  });
  document.getElementById('visitTableBody')?.addEventListener('change',event=>{
    const checkbox=event.target.closest('[data-visit-select-id]');
    if(!checkbox)return;
    if(checkbox.checked)visitSelectedIds.add(checkbox.dataset.visitSelectId);
    else visitSelectedIds.delete(checkbox.dataset.visitSelectId);
    renderVisitTables();
  });
  function renderVisitTables(){
    const body=document.getElementById('visitTableBody');
    if(!body)return;
    const allVisits=sortedVisits();
    const monthKey=[visitCalendarMonth.getFullYear(),String(visitCalendarMonth.getMonth()+1).padStart(2,'0')].join('-');
    const visits=allVisits.filter(item=>!item.visitDate||item.visitDate.slice(0,7)===monthKey);
    const pageCount=Math.max(1,Math.ceil(visits.length/visitPageSize));
    visitCurrentPage=Math.min(visitCurrentPage,pageCount-1);
    const pageItems=visits.slice(visitCurrentPage*visitPageSize,(visitCurrentPage+1)*visitPageSize);
    if(!pageItems.some(item=>item.id===visitSelectedId))visitSelectedId=pageItems[0]?.id||null;
    body.replaceChildren();
    pageItems.forEach((v,index)=>{
      const tr=document.createElement('tr');tr.className='visit-select-row'+(v.id===visitSelectedId?' selected':'');tr.dataset.visitId=v.id;
      const numberCell=document.createElement('td');
      if(visitSelectMode){
        const check=document.createElement('input');check.type='checkbox';check.className='visit-row-select';check.dataset.visitSelectId=v.id;check.checked=visitSelectedIds.has(v.id);check.setAttribute('aria-label','Pilih jadwal nomor '+(visitCurrentPage*visitPageSize+index+1));numberCell.append(check);
      }
      const numberLabel=document.createElement('span');numberLabel.className='visit-row-number';numberLabel.textContent=String(visitCurrentPage*visitPageSize+index+1);numberCell.append(numberLabel);
tr.append(numberCell);
      tr.classList.toggle('is-visit-checked',visitSelectedIds.has(v.id));
      const visitTableFields=visitFields;
      visitTableFields.forEach(field=>{const td=document.createElement('td');td.innerHTML=makeVisitInput(field,v[field.key],v.id);tr.append(td);});
      tr.addEventListener('click',event=>{if(event.target.closest('input,select,textarea,.visit-multiselect,.visit-multiselect *'))return;visitSelectedId=v.id;renderVisitTables();});
      body.append(tr);
    });
    // Batasi jumlah baris yang tampil menjadi tepat empat per halaman.
    // Baris kosong mengisi sisa slot setelah data tersimpan.
    const baseEmptySlots=Math.max(0,visitPageSize-pageItems.length);
    const hiddenEmptyRows=visitHiddenEmptyRowsByMonth.get(monthKey)||0;
    const emptySlots=Math.max(0,baseEmptySlots+visitExtraRows-hiddenEmptyRows);
    const visibleSelectionIds=new Set([...pageItems.map(item=>item.id),...Array.from({length:emptySlots},(_,slot)=>'VISIT_EMPTY|'+monthKey+'|'+visitCurrentPage+'|'+slot)]);
    for(const id of [...visitSelectedIds]){if(!visibleSelectionIds.has(id))visitSelectedIds.delete(id);}
    for(let slot=0;slot<emptySlots;slot++){
      const tr=document.createElement('tr');tr.className='visit-select-row visit-placeholder-row';
      if(slot>=baseEmptySlots)tr.dataset.extraVisitRow='true';
      const number=document.createElement('td');
      const emptySelectId='VISIT_EMPTY|'+monthKey+'|'+visitCurrentPage+'|'+slot;
      if(visitSelectMode){
        const check=document.createElement('input');check.type='checkbox';check.className='visit-row-select';check.dataset.visitSelectId=emptySelectId;check.checked=visitSelectedIds.has(emptySelectId);check.setAttribute('aria-label','Pilih baris kosong nomor '+(visitCurrentPage*visitPageSize+pageItems.length+slot+1));number.append(check);
      }
      const numberLabel=document.createElement('span');numberLabel.className='visit-row-number';numberLabel.textContent=String(visitCurrentPage*visitPageSize+pageItems.length+slot+1);number.append(numberLabel);
      tr.classList.toggle('is-visit-checked',visitSelectedIds.has(emptySelectId));
tr.append(number);
      const fields=visitFields;
      fields.forEach(field=>{
        const td=document.createElement('td');
        if(field.key==='talent'){
          td.innerHTML=makeTalentSelect([],null,true);
        }else if(field.type==='select'){
          const select=document.createElement('select');select.className='visit-inline-input';select.dataset.newVisitField=field.key;
          const blank=document.createElement('option');blank.value='';blank.textContent='Pilih status';select.append(blank);
          visitStatusOptions.forEach(status=>{const option=document.createElement('option');option.value=status;option.textContent=status;select.append(option);});
          td.append(select);
        }else if(field.type==='textarea'){
          const textarea=document.createElement('textarea');textarea.rows=2;textarea.className='visit-inline-input visit-inline-textarea';textarea.dataset.newVisitField=field.key;textarea.placeholder=field.key==='location'?'Lokasi':'Isi '+field.label.toLowerCase();
          td.append(textarea);
        }else{
          const input=document.createElement('input');input.className='visit-inline-input';input.type=field.type;input.dataset.newVisitField=field.key;input.placeholder=field.key==='location'?'Lokasi':'Isi '+field.label.toLowerCase();
          td.append(input);
        }
        tr.append(td);
      });
      body.append(tr);
    }
    renderVisitMonthNav();
    const selectBtn=document.getElementById('visitSelectBtn');
    const deleteBtn=document.getElementById('visitDeleteSelectedBtn');
    const cancelBtn=document.getElementById('visitCancelSelectBtn');
    if(selectBtn){selectBtn.textContent=visitSelectMode?'Mode Select Aktif':'Select';selectBtn.setAttribute('aria-pressed',String(visitSelectMode));}
    if(deleteBtn){deleteBtn.hidden=!visitSelectMode;deleteBtn.disabled=visitSelectedIds.size===0;deleteBtn.textContent='Hapus Terpilih ('+visitSelectedIds.size+')';}
    if(cancelBtn)cancelBtn.hidden=!visitSelectMode;
    const pageInfo=document.getElementById('visitPageInfo');if(pageInfo)pageInfo.textContent='Halaman '+(visitCurrentPage+1)+' dari '+pageCount;
    const today=new Date(),todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const todayDate=document.getElementById('visitTodayDate');if(todayDate)todayDate.textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(today);
    const todayVisits=visits.filter(v=>v.visitDate===todayKey);
    const todayList=document.getElementById('visitTodayList');if(!todayList)return;todayList.replaceChildren();
    const todayLabel=document.createElement('div');todayLabel.className='visit-today-label';todayLabel.textContent='Jadwal visit :';todayList.append(todayLabel);
    const todayEntries=todayVisits.length?todayVisits:[null];
    todayEntries.forEach(v=>{const item=document.createElement('div');item.className='visit-today-entry';[['Hari ini :',v?visitDateLabel(v.visitDate):'Tidak ada jadwal'],['Lokasi :',v?.location||'—'],['Jam :',v?.time||'—']].forEach(([label,value])=>{const row=document.createElement('div');row.className='visit-today-line';const key=document.createElement('b');key.textContent=label;const val=document.createElement('span');val.textContent=value;row.append(key,val);item.append(row);});todayList.append(item);});
    if(visitViewMode==='grid')renderVisitCalendar(allVisits);
    renderSettingsVisitTable(allVisits);
  }
  function renderVisitCalendar(visits){
    const root=document.getElementById('visitCalendar');if(!root)return;
    root.replaceChildren();
    const year=visitCalendarMonth.getFullYear(),month=visitCalendarMonth.getMonth();
    const grid=document.createElement('div');grid.className='visit-calendar-grid';
    const weekdayRow=document.createElement('div');weekdayRow.className='visit-calendar-week-row visit-calendar-weekday-row';
    ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].forEach(day=>{const label=document.createElement('div');label.className='visit-calendar-weekday';label.textContent=day;weekdayRow.append(label);});
    grid.append(weekdayRow);
    const first=new Date(year,month,1),offset=(first.getDay()+6)%7;
    const startDate=new Date(year,month,1-offset);
    const visitsByDate={};
    visits.filter(item=>item.visitDate).forEach(item=>{(visitsByDate[item.visitDate]||(visitsByDate[item.visitDate]=[])).push(item);});
    const statusClass=value=>{
      const status=String(value||'').toUpperCase();
      return status==='PLANNED'?'planned':status==='ON PROGRESS'?'progress':status==='DONE'?'done':status==='CANCELLED'?'cancelled':'other';
    };
    const openVisitFromCalendar=item=>{
      const monthItems=sortedVisits().filter(entry=>!entry.visitDate||entry.visitDate.slice(0,7)===[item.visitDate.slice(0,4),item.visitDate.slice(5,7)].join('-'));
      const itemIndex=monthItems.findIndex(entry=>entry.id===item.id);
      visitCalendarMonth=new Date(Number(item.visitDate.slice(0,4)),Number(item.visitDate.slice(5,7))-1,1);
      visitCalendarSelected=item.visitDate;
      visitCurrentPage=Math.max(0,Math.floor(itemIndex/visitPageSize));
      visitSelectedId=item.id;
      setVisitViewMode('list');
      renderVisitTables();
    };
    let weekRow=null;
    for(let index=0;index<42;index++){
      if(index%7===0){weekRow=document.createElement('div');weekRow.className='visit-calendar-week-row';grid.append(weekRow);}
      const date=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate()+index);
      const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
      const dayVisits=(visitsByDate[key]||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
      const cell=document.createElement('section');
      cell.className='visit-calendar-day-cell'+(date.getMonth()!==month?' outside-month':'');
      if(key===visitCalendarSelected)cell.classList.add('is-selected');
      if(key===calendarDateKey(new Date()))cell.classList.add('is-today');
      const head=document.createElement('div');head.className='visit-calendar-day-head';
      const number=document.createElement('span');number.className='visit-calendar-day-number';number.textContent=String(date.getDate());head.append(number);
      const add=document.createElement('button');add.type='button';add.className='visit-calendar-day-add';add.textContent='+';add.title='Tambah Visit pada '+key;add.setAttribute('aria-label','Tambah Visit '+key);
      add.addEventListener('click',event=>{event.stopPropagation();addVisitFromCalendar(key);});
      head.append(add);cell.append(head);
      dayVisits.slice(0,3).forEach(item=>{
        const event=document.createElement('button');event.type='button';event.className='visit-calendar-event-chip '+statusClass(item.status);
        event.title='Buka jadwal: '+(item.title||'Tanpa judul');
        const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
        const meta=document.createElement('small');meta.textContent=[item.time||'',item.location||'',item.status||''].filter(Boolean).join(' · ');
        event.append(title,meta);event.addEventListener('click',click=>{click.stopPropagation();openVisitFromCalendar(item);});cell.append(event);
      });
      if(dayVisits.length>3){const more=document.createElement('small');more.className='visit-calendar-more';more.textContent='+'+(dayVisits.length-3)+' Visit lainnya';cell.append(more);}
      cell.addEventListener('click',()=>{
        if(date.getMonth()!==month||date.getFullYear()!==year){
          visitCalendarMonth=new Date(date.getFullYear(),date.getMonth(),1);
          visitCalendarSelected=key;renderVisitTables();return;
        }
        visitCalendarSelected=key;renderVisitCalendar(visits);
      });
      weekRow.append(cell);
    }
    root.append(grid);
    const selected=document.createElement('div');selected.className='visit-calendar-selected';
    const selectedDate=new Date(visitCalendarSelected+'T00:00:00');
    const heading=document.createElement('b');heading.textContent='Jadwal '+new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(selectedDate);selected.append(heading);
    const matches=(visitsByDate[visitCalendarSelected]||[]).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
    if(!matches.length){
      const empty=document.createElement('p');empty.textContent='Belum ada jadwal Visit pada tanggal ini.';selected.append(empty);
      const addSelected=document.createElement('button');addSelected.type='button';addSelected.className='visit-calendar-add-selected';addSelected.textContent='＋ Tambah Jadwal Visiting';
      addSelected.addEventListener('click',()=>addVisitFromCalendar(visitCalendarSelected));selected.append(addSelected);
    }
    matches.forEach(item=>{
      const row=document.createElement('button');row.type='button';row.className='visit-calendar-selected-event '+statusClass(item.status);
      const time=document.createElement('b');time.textContent=item.time||'—';
      const detail=document.createElement('span');detail.textContent=[item.title||'Tanpa judul',item.location||'Lokasi belum diisi',item.status||'Status belum diisi'].join(' · ');
      row.append(time,detail);row.addEventListener('click',()=>openVisitFromCalendar(item));selected.append(row);
    });
    root.append(selected);
  }
  function addVisitFromCalendar(dateKey){
    const date=new Date(dateKey+'T00:00:00');
    visitCalendarMonth=new Date(date.getFullYear(),date.getMonth(),1);
    visitCalendarSelected=dateKey;visitCurrentPage=0;visitSelectedId=null;
    setVisitViewMode('list');renderVisitTables();
    const dateInput=document.querySelector('#visitTableBody [data-new-visit-field="visitDate"]');
    if(!dateInput){showToast('Tidak menemukan baris kosong untuk jadwal Visit.');return;}
    dateInput.value=dateKey;
    dateInput.dispatchEvent(new Event('change',{bubbles:true}));
    const created=readVisits().slice(-1)[0];
    if(created?.id){
      const timeInput=document.querySelector('[data-visit-id="'+CSS.escape(created.id)+'"][data-visit-field="time"]');
      timeInput?.focus();
    }
  }
  function renderVisitMonthNav(){
    const label=document.getElementById('visitMonthLabel');
    if(label)label.textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(visitCalendarMonth);
  }
  function moveVisitMonth(offset){
    visitCalendarMonth=new Date(visitCalendarMonth.getFullYear(),visitCalendarMonth.getMonth()+offset,1);
    visitCalendarSelected=[visitCalendarMonth.getFullYear(),String(visitCalendarMonth.getMonth()+1).padStart(2,'0'),'01'].join('-');
    visitCurrentPage=0;
    visitSelectedIds.clear();
    renderVisitTables();
  }
  document.getElementById('visitTodayMonth')?.addEventListener('click',()=>{
    const today=new Date();visitCalendarMonth=new Date(today.getFullYear(),today.getMonth(),1);
    visitCalendarSelected=calendarDateKey(today);visitCurrentPage=0;visitSelectedIds.clear();renderVisitTables();
  });
  document.getElementById('visitPrevMonth')?.addEventListener('click',()=>moveVisitMonth(-1));
  document.getElementById('visitNextMonth')?.addEventListener('click',()=>moveVisitMonth(1));
  document.getElementById('visitCalendar')?.addEventListener('click',event=>{
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
  document.getElementById('visitTableBody')?.addEventListener('change',event=>{
    const talentInput=event.target.closest('.visit-multiselect input[type="checkbox"]');
    if(talentInput){
      const wrapper=talentInput.closest('.visit-multiselect');
      const row=talentInput.closest('tr');
      const selected=[...wrapper.querySelectorAll('input[type="checkbox"]:checked')].map(item=>item.value);
      rememberTalentOptions(selected);
      let visitId=talentInput.dataset.visitId;
      if(!visitId){
        const record={id:'VIS-'+Date.now().toString(36).toUpperCase(),visitDate:'',time:'',location:'',title:'',publishDate:'',talent:selected,props:'',status:'',notes:'',createdAt:new Date().toISOString()};
        const all=readVisits();all.push(record);writeVisits(all);
        visitId=record.id;
        if(row?.dataset.extraVisitRow==='true')visitExtraRows=Math.max(0,visitExtraRows-1);
        if(row)row.dataset.visitId=visitId;
        row?.querySelectorAll('[data-new-visit-field]').forEach(control=>{
          const field=control.dataset.newVisitField;
          control.dataset.visitId=visitId;
          control.dataset.visitField=field;
          delete control.dataset.newVisitField;
        });
        visitSelectedId=visitId;
      }else{
        const all=readVisits(),record=all.find(item=>item.id===visitId);
        if(record){record.talent=selected;record.updatedAt=new Date().toISOString();writeVisits(all);}
      }
      const summary=wrapper.querySelector('.visit-talent-summary');
      if(summary)summary.textContent=selected.length?selected.join(', '):'Pilih Talent';
      const count=wrapper.querySelector('.visit-talent-count');
      if(count)count.textContent=selected.length+' dipilih';
      showToast('Pilihan talent berhasil diperbarui.');
      return;
    }
    const input=event.target.closest('[data-new-visit-field]');
    if(input){
      const field=input.dataset.newVisitField;
      const value=input.value;
      if(!value)return;
      const row=input.closest('tr');
      const talent=[...(row?.querySelectorAll('.visit-multiselect input[type="checkbox"]:checked')||[])].map(item=>item.value);
      const record={id:'VIS-'+Date.now().toString(36).toUpperCase(),visitDate:'',time:'',location:'',title:'',publishDate:'',talent,props:'',status:'',notes:'',createdAt:new Date().toISOString()};
      record[field]=value;
      const all=readVisits();all.push(record);writeVisits(all);
      if(row?.dataset.extraVisitRow==='true')visitExtraRows=Math.max(0,visitExtraRows-1);
      visitCurrentPage=0;visitSelectedId=record.id;renderVisitTables();showToast('Data Visit baru tersimpan. Lanjutkan isi kolom lainnya.');
      return;
    }
    const existing=event.target.closest('[data-visit-id][data-visit-field]');
    if(existing){
      updateVisitField(existing.dataset.visitId,existing.dataset.visitField,existing.value);
    }
  });
  document.getElementById('visitTodayList')?.addEventListener('change',event=>{const input=event.target.closest('[data-visit-id][data-visit-field]');if(input)updateVisitField(input.dataset.visitId,input.dataset.visitField,input.value);});
  document.getElementById('visitPrevPage')?.addEventListener('click',()=>{visitCurrentPage=Math.max(0,visitCurrentPage-1);visitSelectedId=null;renderVisitTables();});
  document.getElementById('visitNextPage')?.addEventListener('click',()=>{
    const monthKey=[visitCalendarMonth.getFullYear(),String(visitCalendarMonth.getMonth()+1).padStart(2,'0')].join('-');
    const monthVisits=sortedVisits().filter(item=>!item.visitDate||String(item.visitDate).slice(0,7)===monthKey);
    const max=Math.max(0,Math.ceil(monthVisits.length/visitPageSize)-1);
    visitCurrentPage=Math.min(max,visitCurrentPage+1);visitSelectedId=null;renderVisitTables();
  });

  function renderVisitEditorLegacy(){renderVisitTables();}
  const visitEditor=document.getElementById('visitEditor'),visitForm=document.getElementById('visitForm');
  function openVisitEditor(){renderVisitTables();}
  function closeVisitEditor(){}
  function populateVisitReferenceOptions(){}
  if(visitEditor)visitEditor.hidden=true;
  const addSettingVisitBtn=document.getElementById('addSettingVisitBtn');
  visitDataReady=true;
  renderVisitTables();
  setVisitViewMode('list');
  if(window.location.hash==='#visit')showPage('visit');
  if(window.location.hash==='#setelan')showPage('setelan');
  window.addEventListener('storage',event=>{if(event.key==='noteAp.contents'){if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();}if(event.key==='noteAp.visits'){if(!visitPage.hidden||!settingsPage.hidden)renderVisitTables();}});


  // Settings navigation and local preferences
  const settingsTabs=[...document.querySelectorAll('[data-settings-tab]')];
  function openSettingsTab(name){
    settingsTabs.forEach(button=>button.classList.toggle('active',button.dataset.settingsTab===name));
    document.querySelectorAll('[data-settings-panel]').forEach(panel=>{
      const active=panel.dataset.settingsPanel===name;panel.hidden=!active;panel.classList.toggle('active',active);
    });
  }
  settingsTabs.forEach(button=>button.addEventListener('click',()=>openSettingsTab(button.dataset.settingsTab)));
  const readSettings=()=>{try{return JSON.parse(localStorage.getItem('noteAp.settings')||'{}')}catch{return{}}};
  const savedSettings=readSettings();
  ['AppName','OrgName','Description','Timezone'].forEach(key=>{
    const el=document.getElementById('setting'+key);if(el&&savedSettings[key[0].toLowerCase()+key.slice(1)])el.value=savedSettings[key[0].toLowerCase()+key.slice(1)];
  });
  // Content references: local-first CRUD, ready for later Sheets sync.
  const referenceKey='noteAp.references';
  const referenceDefaults={
    pillars:['Edukasi Kesehatan','Promosi','Informasi Produk','Awareness'],
    platforms:['Instagram','TikTok'],
    formats:['Feed','Carousel','Reels'],
    stages:['Ideation','Planning','Production','Editing','Review','Ready to Publish','Published']
  };
  const referenceLabels={pillars:'Pilar Konten',platforms:'Platform',formats:'Format Konten',stages:'Tahapan Workflow'};
  function readReferences(){
    try{
      const saved=JSON.parse(localStorage.getItem(referenceKey)||'null');
      if(saved&&typeof saved==='object')return Object.fromEntries(Object.keys(referenceDefaults).map(key=>[key,Array.isArray(saved[key])?saved[key]:referenceDefaults[key].map(name=>({id:key+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,active:true}))]));
    }catch{}
    return Object.fromEntries(Object.entries(referenceDefaults).map(([key,names])=>[key,names.map((name,index)=>({id:key+'-'+index+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,active:true}))]));
  }
  let references=readReferences();
  function saveReferences(){localStorage.setItem(referenceKey,JSON.stringify(references));}
  function renderReferences(){
    const host=document.getElementById('referenceCategoryGrid');if(!host)return;
    host.innerHTML=Object.entries(referenceLabels).map(([key,label])=>{
      const items=references[key]||[];
      return '<section class="reference-category-card"><header><div><b>'+label+'</b><small>'+items.filter(item=>item.active!==false).length+' aktif · '+items.length+' total</small></div></header>'+
        (items.length?'<div class="reference-item-list">'+items.map(item=>'<div class="reference-item '+(item.active===false?'is-inactive':'')+'"><span>'+escapeHtml(item.name)+'</span><div class="reference-item-actions"><button type="button" data-reference-action="toggle" data-category="'+key+'" data-id="'+item.id+'">'+(item.active===false?'Aktifkan':'Nonaktifkan')+'</button><button type="button" data-reference-action="edit" data-category="'+key+'" data-id="'+item.id+'">Edit</button><button type="button" class="danger" data-reference-action="delete" data-category="'+key+'" data-id="'+item.id+'">Hapus</button></div></div>').join(''):'<p class="reference-empty">Belum ada referensi.</p>')+'</section>';
    }).join('');
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  document.getElementById('referenceAddForm')?.addEventListener('submit',event=>{
    event.preventDefault();
    const category=document.getElementById('referenceCategory').value;
    const input=document.getElementById('referenceName');
    const name=input.value.trim();
    if(!name)return;
    if((references[category]||[]).some(item=>item.name.toLowerCase()===name.toLowerCase())){showToast('Referensi tersebut sudah ada.');return;}
    references[category].push({id:'ref-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,active:true});
    saveReferences();renderReferences();input.value='';showToast('Referensi berhasil ditambahkan.');
  });
  document.getElementById('referenceCategoryGrid')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-reference-action]');if(!button)return;
    const {referenceAction:action,category,id}=button.dataset;
    const item=(references[category]||[]).find(entry=>entry.id===id);if(!item)return;
    if(action==='toggle'){item.active=item.active===false;saveReferences();renderReferences();showToast(item.active?'Referensi diaktifkan.':'Referensi dinonaktifkan.');}
    if(action==='edit'){
      const next=prompt('Ubah nama referensi:',item.name);if(next===null)return;
      const name=next.trim();if(!name){showToast('Nama referensi tidak boleh kosong.');return;}
      if(references[category].some(entry=>entry.id!==id&&entry.name.toLowerCase()===name.toLowerCase())){showToast('Nama referensi sudah digunakan.');return;}
      item.name=name;saveReferences();renderReferences();showToast('Referensi berhasil diperbarui.');
    }
    if(action==='delete'){
      if(!confirm('Hapus referensi "'+item.name+'"?'))return;
      references[category]=references[category].filter(entry=>entry.id!==id);saveReferences();renderReferences();showToast('Referensi berhasil dihapus.');
    }
  });
  renderReferences();
  const themeSelect=document.getElementById('settingTheme');
  const languageSelect=document.getElementById('settingLanguage');
  const languageCodes='aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' ');
  if(languageSelect){
    const displayNames=new Intl.DisplayNames(['id'],{type:'language'});
    const labels={id:'Bahasa Indonesia',en:'English'};
    const fragment=document.createDocumentFragment();
    languageCodes.forEach(code=>{
      const option=document.createElement('option');option.value=code;
      option.textContent=labels[code]||displayNames.of(code)||code;
      fragment.append(option);
    });
    languageSelect.replaceChildren(fragment);
  }
  const applyTheme=theme=>{
    const selected=theme==='system'?'system':theme==='dark'?'dark':'light';
    document.documentElement.dataset.theme=selected;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',selected==='dark'?'#111a15':'#f7faf8');
  };
  const applyLanguage=language=>{
    const lang=language==='en'?'en':'id';
    document.documentElement.lang=lang;
    const translations={
      id:{dashboard:'Dashboard',calendar:'Kalender',content:'Konten',kanban:'Kanban',visit:'Visit',settings:'Setelan',help:'Bantuan',workspace:'WORKSPACE',preferences:'PREFERENSI',welcome:'Halo, Apotek Prapatan 👋',overview:'WORKSPACE OVERVIEW',calendarTitle:'Kalender Konten',contentTitle:'Konten',settingsTitle:'Setelan',appearanceTitle:'Tampilan & Bahasa',appearanceDesc:'Atur kenyamanan tampilan workspace.',theme:'Tema aplikasi',language:'Bahasa aplikasi',save:'Simpan Preferensi'},
      en:{dashboard:'Dashboard',calendar:'Calendar',content:'Content',kanban:'Kanban',visit:'Visits',settings:'Settings',help:'Help',workspace:'WORKSPACE',preferences:'PREFERENCES',welcome:'Hello, Apotek Prapatan 👋',overview:'WORKSPACE OVERVIEW',calendarTitle:'Content Calendar',contentTitle:'Content',settingsTitle:'Settings',appearanceTitle:'Appearance & Language',appearanceDesc:'Customize your workspace experience.',theme:'App theme',language:'App language',save:'Save Preferences'}
    };
    const t=translations[lang];
    const navMap={'dashboard':'dashboard','kalender':'calendar','konten':'content','kanban':'kanban','visit':'visit','setelan':'settings','bantuan':'help'};
    document.querySelectorAll('.nav-link').forEach(link=>{
      const key=navMap[link.dataset.page];if(!key)return;
      const icon=link.querySelector('span');const label=t[key];
      link.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){node.textContent=label; }});
      if(!link.querySelector('.nav-label-text')){const textNode=[...link.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(textNode)textNode.textContent=label;}
    });
    const navLabels=document.querySelectorAll('.nav-label');if(navLabels[0])navLabels[0].textContent=t.workspace;if(navLabels[1])navLabels[1].textContent=t.preferences;
    const welcome=document.querySelector('.welcome-row h1');if(welcome)welcome.textContent=t.welcome;
    const titleMap={dashboard:'',kalender:t.calendarTitle,konten:t.contentTitle,setelan:t.settingsTitle};
    const settingsHeading=document.querySelector('.settings-heading h1');if(settingsHeading)settingsHeading.textContent=t.settingsTitle;
    const appearanceHeading=document.querySelector('[data-settings-panel="appearance"] .settings-panel-head h2');if(appearanceHeading)appearanceHeading.textContent=t.appearanceTitle;
    const appearanceDesc=document.querySelector('[data-settings-panel="appearance"] .settings-panel-head p');if(appearanceDesc)appearanceDesc.textContent=t.appearanceDesc;
    const prefLabels=document.querySelectorAll('[data-settings-panel="appearance"] .settings-preference-row b');if(prefLabels[0])prefLabels[0].textContent=t.theme;if(prefLabels[1])prefLabels[1].textContent=t.language;
    const save=document.getElementById('saveAppearanceSettings');if(save)save.textContent=t.save;
    document.querySelectorAll('.settings-nav-item').forEach(button=>{const key=button.dataset.settingsTab;if(key==='appearance'){const b=button.querySelector('b');if(b)b.textContent=lang==='en'?'Appearance & Language':'Tampilan & Bahasa';}});
  };
  const saveAppearancePreference=(theme,language)=>{
    const value={...readSettings(),theme,language};
    localStorage.setItem('noteAp.settings',JSON.stringify(value));
  };
  if(themeSelect){
    themeSelect.value=savedSettings.theme||'light';
    applyTheme(themeSelect.value);
    themeSelect.addEventListener('change',()=>{
      applyTheme(themeSelect.value);
      saveAppearancePreference(themeSelect.value,languageSelect?.value||'id');
      showToast('Tema langsung diterapkan dan tersimpan di browser ini.');
    });
  }
  if(languageSelect){
    languageSelect.value=savedSettings.language||'id';
    applyLanguage(languageSelect.value);
    languageSelect.addEventListener('change',()=>{
      applyLanguage(languageSelect.value);
      saveAppearancePreference(themeSelect?.value||'light',languageSelect.value);
      showToast(languageSelect.value==='en'
        ? 'Language changed and saved in this browser.'
        : (languageSelect.value==='id'
          ? 'Bahasa diubah dan tersimpan di browser ini.'
          : 'Pilihan bahasa tersimpan. Terjemahan bahasa ini belum tersedia; antarmuka tetap Bahasa Indonesia.'));
    });
  }
  document.getElementById('saveGeneralSettings')?.addEventListener('click',()=>{
    const value={...readSettings(),appName:document.getElementById('settingAppName').value.trim(),orgName:document.getElementById('settingOrgName').value.trim(),description:document.getElementById('settingDescription').value.trim(),timezone:document.getElementById('settingTimezone').value};
    localStorage.setItem('noteAp.settings',JSON.stringify(value));showToast('Pengaturan umum tersimpan di browser ini.');
  });
  document.getElementById('exportNoteApData')?.addEventListener('click',()=>{
    const keys=['noteAp.contents','noteAp.visits','noteAp.talents','noteAp.settings','noteAp.references'];
    const payload={app:'Note AP',schemaVersion:1,exportedAt:new Date().toISOString(),data:{}};
    keys.forEach(key=>{const raw=localStorage.getItem(key);if(raw!==null){try{payload.data[key]=JSON.parse(raw)}catch{payload.data[key]=raw}}});
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='note-ap-backup-'+new Date().toISOString().slice(0,10)+'.json';link.click();URL.revokeObjectURL(url);
    showToast('Backup lokal berhasil disiapkan.');
  });
  document.getElementById('importNoteApData')?.addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      const payload=JSON.parse(await file.text());
      if(payload.app!=='Note AP'||!payload.data||typeof payload.data!=='object')throw new Error('Format backup tidak sesuai.');
      if(!confirm('Pulihkan backup? Data lokal Note AP yang ada akan ditimpa untuk bagian yang tercantum di backup.'))return;
      ['noteAp.contents','noteAp.visits','noteAp.talents','noteAp.settings','noteAp.references'].forEach(key=>{
        if(Object.prototype.hasOwnProperty.call(payload.data,key))localStorage.setItem(key,JSON.stringify(payload.data[key]));
      });
      showToast('Backup berhasil dipulihkan. Halaman akan dimuat ulang.');
      setTimeout(()=>location.reload(),700);
    }catch(error){showToast(error.message||'File backup tidak dapat dibaca.');}
    finally{event.target.value='';}
  });

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


  // Chat preview: messages are stored locally until a shared backend is connected.
  const chatStorageKey='noteAp.chats';
  const chatSeed=[
    {id:'admin',type:'private',name:'Admin Note AP',subtitle:'Chat pribadi · Admin',avatar:'A',messages:[{id:'welcome-admin',sender:'other',name:'Admin Note AP',text:'Halo! Selamat datang di ruang bantuan Note AP. Tulis pertanyaan atau kendala yang ingin disampaikan di sini.',at:new Date().toISOString()}]},
    {id:'team',type:'group',name:'Grup Tim Note AP',subtitle:'Grup · Seluruh anggota tim',avatar:'T',messages:[{id:'welcome-team',sender:'other',name:'Admin Note AP',text:'Selamat datang di grup tim. Gunakan ruang ini untuk koordinasi ide, jadwal, dan produksi konten.',at:new Date().toISOString()}]}
  ];
  let chatRooms;
  try{chatRooms=JSON.parse(localStorage.getItem(chatStorageKey)||'null');}catch(error){chatRooms=null;}
  if(!Array.isArray(chatRooms)||!chatRooms.length)chatRooms=chatSeed;
  let activeChatId='admin',chatFilter='all';
  const chatList=document.getElementById('chatConversationList');
  const chatMessages=document.getElementById('chatMessages');
  const chatTime=value=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
  const persistChats=()=>{try{localStorage.setItem(chatStorageKey,JSON.stringify(chatRooms));}catch(error){showToast('Pesan tidak dapat disimpan pada browser ini.');}};
  function renderChatList(){
    chatList.replaceChildren();
    const visible=chatRooms.filter(room=>chatFilter==='all'||room.type===chatFilter);
    document.getElementById('chatConversationCount').textContent=chatRooms.length+' ruang';
    visible.forEach(room=>{
      const last=room.messages[room.messages.length-1];
      const button=document.createElement('button');button.type='button';button.className='chat-conversation'+(room.id===activeChatId?' active':'');
      const avatar=document.createElement('span');avatar.className='chat-list-avatar';avatar.textContent=room.avatar;
      const body=document.createElement('span');body.className='chat-list-body';
      const title=document.createElement('b');title.textContent=room.name;
      const preview=document.createElement('small');preview.textContent=last?(last.sender==='me'?'Kamu: ':'')+last.text:'Belum ada pesan';
      const meta=document.createElement('span');meta.className='chat-list-meta';meta.textContent=last?chatTime(last.at):'';
      body.append(title,preview);button.append(avatar,body,meta);
      button.addEventListener('click',()=>{activeChatId=room.id;renderChat();});
      chatList.append(button);
    });
  }
  function renderChat(){
    const room=chatRooms.find(item=>item.id===activeChatId)||chatRooms[0];
    if(!room)return;
    activeChatId=room.id;
    document.getElementById('chatThreadAvatar').textContent=room.avatar;
    document.getElementById('chatThreadName').textContent=room.name;
    document.getElementById('chatThreadSubtitle').textContent=room.subtitle;
    chatMessages.replaceChildren();
    room.messages.forEach(message=>{
      const wrap=document.createElement('article');wrap.className='chat-message '+(message.sender==='me'?'mine':'theirs');
      if(message.sender!=='me'){const sender=document.createElement('b');sender.className='chat-message-sender';sender.textContent=message.name||'Anggota';wrap.append(sender);}
      const bubble=document.createElement('p');bubble.textContent=message.text;
      const time=document.createElement('small');time.textContent=chatTime(message.at);
      wrap.append(bubble,time);chatMessages.append(wrap);
    });
    if(!room.messages.length){const empty=document.createElement('p');empty.className='chat-empty';empty.textContent='Belum ada pesan. Mulai percakapan di sini.';chatMessages.append(empty);}
    chatMessages.scrollTop=chatMessages.scrollHeight;
    renderChatList();
  }
  document.querySelectorAll('[data-chat-filter]').forEach(button=>button.addEventListener('click',()=>{
    chatFilter=button.dataset.chatFilter;
    document.querySelectorAll('[data-chat-filter]').forEach(item=>item.classList.toggle('active',item===button));
    const first=chatRooms.find(room=>chatFilter==='all'||room.type===chatFilter);
    if(first)activeChatId=first.id;
    renderChat();
  }));
  document.getElementById('chatComposer').addEventListener('submit',event=>{
    event.preventDefault();
    const input=document.getElementById('chatMessageInput'),value=input.value.trim();
    if(!value)return;
    const room=chatRooms.find(item=>item.id===activeChatId);
    if(!room)return;
    room.messages.push({id:'msg-'+Date.now(),sender:'me',name:'Kamu',text:value,at:new Date().toISOString()});
    persistChats();input.value='';renderChat();
  });
  renderChat();
  if(window.location.hash==='#chat') showPage('bantuan');
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

  // NOTE AP COMMAND CENTER — pencarian dan aksi lintas halaman
  const commandOverlay=document.getElementById('commandOverlay');
  const commandInput=document.getElementById('commandInput');
  const commandResults=document.getElementById('commandResults');
  const commandLauncher=document.getElementById('commandLauncher');
  let commandItems=[],commandActive=0;
  const commandPages=[
    {title:'Dashboard',detail:'Ringkasan workspace',icon:'▦',run:()=>showPage('dashboard')},
    {title:'Kalender',detail:'Jadwal publikasi konten',icon:'▦',run:()=>showPage('kalender')},
    {title:'Konten',detail:'Cari dan kelola semua konten',icon:'▤',run:()=>showPage('konten')},
    {title:'Kanban',detail:'Pantau tahapan workflow',icon:'▥',run:()=>showPage('kanban')},
    {title:'Visit',detail:'Data kunjungan dan aktivitas',icon:'↗',run:()=>showPage('visit')},
    {title:'Setelan',detail:'Preferensi dan referensi',icon:'⚙',run:()=>showPage('setelan')},
    {title:'Bantuan',detail:'Panduan dan chat tim',icon:'?',run:()=>showPage('bantuan')}
  ];
  function getCommandItems(query=''){
    let contents=[];try{const data=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');if(Array.isArray(data))contents=data;}catch(error){}
    const q=query.trim().toLocaleLowerCase('id');
    const actions=[
      {title:'Buat konten baru',detail:'Mulai ide atau jadwal konten',icon:'＋',group:'Tindakan',run:()=>openContentModal()},
      {title:'Lihat konten yang perlu dikerjakan',detail:'Buka daftar konten',icon:'◷',group:'Tindakan',run:()=>showPage('konten')},
      {title:'Buka Content Board',detail:'Pindahkan konten antar tahapan',icon:'⇄',group:'Tindakan',run:()=>showPage('kanban')}
    ];
    const pages=commandPages.map(item=>({...item,group:'Halaman'}));
    const found=contents.filter(item=>String(item.title||'').toLocaleLowerCase('id').includes(q)).slice(0,6).map(item=>({
      title:item.title||'Konten tanpa judul',detail:[item.platform,item.status,item.postingDate].filter(Boolean).join(' · '),icon:'▤',group:'Konten',
      run:()=>{showPage('konten');const search=document.getElementById('contentSearch');if(search){search.value=item.title||'';search.dispatchEvent(new Event('input',{bubbles:true}));}}
    }));
    const all=[...actions,...pages,...found];
    return q?all.filter(item=>(item.title+' '+(item.detail||'')).toLocaleLowerCase('id').includes(q)):all;
  }
  function renderCommandResults(){
    commandItems=getCommandItems(commandInput.value);commandActive=0;commandResults.replaceChildren();
    if(!commandItems.length){const empty=document.createElement('div');empty.className='command-empty';empty.textContent='Tidak ada hasil. Coba kata kunci lain.';commandResults.append(empty);return;}
    let previous='';
    commandItems.forEach((item,index)=>{
      if(item.group!==previous){const group=document.createElement('div');group.className='command-group-label';group.textContent=item.group;commandResults.append(group);previous=item.group;}
      const button=document.createElement('button');button.type='button';button.className='command-result';button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===commandActive));
      const icon=document.createElement('span');icon.className='command-result-icon';icon.textContent=item.icon;
      const copy=document.createElement('span');copy.className='command-result-copy';
      const title=document.createElement('b');title.textContent=item.title;
      const detail=document.createElement('small');detail.textContent=item.detail||'';
      copy.append(title,detail);const arrow=document.createElement('span');arrow.className='command-result-arrow';arrow.textContent='↵';
      button.append(icon,copy,arrow);button.addEventListener('click',()=>runCommand(index));commandResults.append(button);
    });
  }
  function runCommand(index){const item=commandItems[index];if(!item)return;closeCommandCenter();item.run();showToast(item.group==='Konten'?'Konten ditemukan di daftar.':item.title+' dibuka.');}
  function closeCommandCenter(){commandOverlay.hidden=true;commandOverlay.setAttribute('aria-hidden','true');document.body.classList.remove('command-open');}
  function openCommandCenter(){commandOverlay.hidden=false;commandOverlay.setAttribute('aria-hidden','false');document.body.classList.add('command-open');commandInput.value='';renderCommandResults();setTimeout(()=>commandInput.focus(),30);}
  commandLauncher.addEventListener('click',openCommandCenter);
  commandOverlay.addEventListener('click',event=>{if(event.target===commandOverlay)closeCommandCenter();});
  commandInput.addEventListener('input',renderCommandResults);
  commandInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(!commandItems.length)return;commandActive=(commandActive+(event.key==='ArrowDown'?1:-1)+commandItems.length)%commandItems.length;commandResults.querySelectorAll('.command-result').forEach((button,index)=>button.setAttribute('aria-selected',String(index===commandActive)));commandResults.querySelectorAll('.command-result')[commandActive]?.scrollIntoView({block:'nearest'});}
    if(event.key==='Enter'){event.preventDefault();runCommand(commandActive);}
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();commandOverlay.hidden?openCommandCenter():closeCommandCenter();}
    if(event.key==='Escape'&&!commandOverlay.hidden)closeCommandCenter();
  });



  // GOOGLE CALENDAR DEMO — sandbox storage only; never touches noteAp.contents or Sheets.
  (function initCalendarIntegrationDemo(){
    const root=document.getElementById('calendarIntegrationDemo');
    if(!root)return;
    const keys={note:'noteAp.calendarDemo.noteEvents',google:'noteAp.calendarDemo.googleEvents',config:'noteAp.calendarDemo.config',history:'noteAp.calendarDemo.history'};
    const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value===null?fallback:value;}catch(error){return fallback;}};
    const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
    const today=new Date();
    const dateKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    const plusDays=(days)=>{const date=new Date();date.setDate(date.getDate()+days);return dateKey(date);};
    let noteEvents=read(keys.note,null),googleEvents=read(keys.google,null),history=read(keys.history,null);
    if(!Array.isArray(noteEvents))noteEvents=[{id:'demo-note-1',title:'Edukasi Kesehatan: Jaga Imunitas',date:plusDays(1),time:'09:00',googleEventId:null}];
    if(!Array.isArray(googleEvents))googleEvents=[{id:'demo-google-1',title:'Briefing Tim Konten',date:plusDays(2),time:'10:00',sourceNoteId:null}];
    if(!Array.isArray(history))history=[];
    const nowIso=()=>new Date().toISOString();
    const getUpdatedAt=item=>{const value=Date.parse(item.updatedAt||item.createdAt||'');return Number.isFinite(value)?value:0;};
    [...noteEvents,...googleEvents].forEach(item=>{if(!item.updatedAt)item.updatedAt=item.createdAt||nowIso();});
    const account=document.getElementById('calendarDemoAccount');
    const calendarId=document.getElementById('calendarDemoCalendarId');
    const noteList=document.getElementById('calendarDemoNoteList');
    const googleList=document.getElementById('calendarDemoGoogleList');
    const dateLabel=value=>{if(!value)return'Tanggal belum diatur';const d=new Date(value+'T00:00:00');return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(d);};
    const save=()=>{write(keys.note,noteEvents);write(keys.google,googleEvents);write(keys.history,history.slice(0,12));};
    const log=message=>{history.unshift(new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date())+' · '+message);history=history.slice(0,12);save();renderHistory();};
    const makeId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    function renderList(host,items,source){
      host.replaceChildren();
      if(!items.length){const empty=document.createElement('div');empty.className='calendar-demo-empty';empty.textContent='Belum ada jadwal demo.';host.append(empty);return;}
      items.slice().sort((a,b)=>(a.date+' '+a.time).localeCompare(b.date+' '+b.time)).forEach(item=>{
        const row=document.createElement('article');row.className='calendar-demo-event';
        const copy=document.createElement('div');copy.className='calendar-demo-event-copy';
        const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
        const meta=document.createElement('small');meta.textContent=dateLabel(item.date)+' · '+(item.time||'—');
        copy.append(title,meta);
        const actions=document.createElement('div');actions.className='calendar-demo-event-actions';
        const edit=document.createElement('button');edit.type='button';edit.textContent='Edit';edit.addEventListener('click',()=>{
          const nextTitle=prompt('Judul acara:',item.title||'');if(nextTitle===null)return;
          const nextDate=prompt('Tanggal (YYYY-MM-DD):',item.date||'');if(nextDate===null)return;
          const nextTime=prompt('Jam (HH:MM):',item.time||'09:00');if(nextTime===null)return;
          if(!nextTitle.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)||!/^\d{2}:\d{2}$/.test(nextTime)){alert('Judul, tanggal, atau jam tidak valid.');return;}
          item.title=nextTitle.trim();item.date=nextDate;item.time=nextTime;item.updatedAt=nowIso();save();render();log('Jadwal '+(source==='note'?'Note AP':'Google Calendar')+' diperbarui di sandbox.');
        });
        const remove=document.createElement('button');remove.type='button';remove.textContent='Hapus';remove.addEventListener('click',()=>{
          if(!confirm('Hapus jadwal demo ini?'))return;
          if(source==='note')noteEvents=noteEvents.filter(row=>row.id!==item.id);else googleEvents=googleEvents.filter(row=>row.id!==item.id);
          save();render();log('Satu jadwal demo dihapus dari '+(source==='note'?'Note AP':'Google Calendar')+'.');
        });
        actions.append(edit,remove);row.append(copy,actions);host.append(row);
      });
    }
    function renderHistory(){
      const list=document.getElementById('calendarDemoHistory');list.replaceChildren();
      (history.length?history:['Demo siap digunakan. Belum ada sinkronisasi.']).forEach(message=>{const li=document.createElement('li');li.textContent=message;list.append(li);});
    }
    function render(){
      renderList(noteList,noteEvents,'note');renderList(googleList,googleEvents,'google');
      document.getElementById('calendarDemoNoteCount').textContent=noteEvents.length+' jadwal';
      document.getElementById('calendarDemoGoogleCount').textContent=googleEvents.length+' acara';
      renderHistory();
    }
    const config=read(keys.config,{});
    account.value=config.account||'';calendarId.value=config.calendarId||'';
    document.getElementById('calendarDemoSaveConfig').addEventListener('click',()=>{
      write(keys.config,{account:account.value.trim(),calendarId:calendarId.value.trim()});
      log('Konfigurasi akun dan Calendar ID demo disimpan di browser ini.');
    });
    function addFromForm(form,target){
      form.addEventListener('submit',event=>{
        event.preventDefault();const data=new FormData(form);
        const item={id:makeId(target),title:String(data.get('title')||'').trim(),date:String(data.get('date')||''),time:String(data.get('time')||'09:00'),updatedAt:nowIso()};
        if(!item.title||!item.date||!item.time)return;
        if(target==='note'){item.googleEventId=null;noteEvents.push(item);}else{item.sourceNoteId=null;googleEvents.push(item);}
        save();form.reset();const time=form.querySelector('[name="time"]');if(time)time.value=target==='note'?'09:00':'10:00';render();log('Jadwal baru ditambahkan ke '+(target==='note'?'Note AP':'Google Calendar')+' demo.');
      });
    }
    addFromForm(document.getElementById('calendarDemoNoteForm'),'note');
    addFromForm(document.getElementById('calendarDemoGoogleForm'),'google');
    document.getElementById('calendarDemoPush').addEventListener('click',()=>{
      let changed=0,noteWins=0,googleWins=0;
      noteEvents.forEach(item=>{
        let event=googleEvents.find(row=>row.sourceNoteId===item.id||row.id===item.googleEventId);
        if(event){
          if(getUpdatedAt(event)>getUpdatedAt(item)){
            item.title=event.title;item.date=event.date;item.time=event.time;item.updatedAt=event.updatedAt||nowIso();googleWins++;
          }else{
            event.title=item.title;event.date=item.date;event.time=item.time;event.updatedAt=item.updatedAt||nowIso();noteWins++;
          }
        }else{
          event={id:makeId('gcal'),title:item.title,date:item.date,time:item.time,sourceNoteId:item.id,updatedAt:item.updatedAt||nowIso()};googleEvents.push(event);
        }
        item.googleEventId=event.id;event.sourceNoteId=item.id;changed++;
      });
      save();render();log('Sinkronisasi selesai: '+changed+' jadwal diproses · Note AP menang '+noteWins+' · Google Calendar menang '+googleWins+' (berdasarkan perubahan terakhir).');
    });
    document.getElementById('calendarDemoPull').addEventListener('click',()=>{
      let added=0,updated=0,noteWins=0;
      googleEvents.forEach(event=>{
        let item=noteEvents.find(row=>row.id===event.sourceNoteId||row.googleEventId===event.id);
        if(item){
          if(getUpdatedAt(event)>getUpdatedAt(item)){item.title=event.title;item.date=event.date;item.time=event.time;item.updatedAt=event.updatedAt||nowIso();updated++;}
          else{event.title=item.title;event.date=item.date;event.time=item.time;event.updatedAt=item.updatedAt||nowIso();noteWins++;}
        }else{
          item={id:makeId('note'),title:event.title,date:event.date,time:event.time,googleEventId:event.id,updatedAt:event.updatedAt||nowIso()};
          noteEvents.push(item);event.sourceNoteId=item.id;added++;
        }
      });
      save();render();log('Sinkronisasi selesai: '+added+' jadwal ditambahkan · '+updated+' jadwal mengikuti Google Calendar · '+noteWins+' jadwal mengikuti Note AP (berdasarkan perubahan terakhir).');
    });
    document.getElementById('calendarDemoReset').addEventListener('click',()=>{
      if(!confirm('Reset seluruh data demo Google Calendar? Data konten utama Note AP tidak akan disentuh.'))return;
      Object.values(keys).forEach(key=>localStorage.removeItem(key));
      noteEvents=[{id:'demo-note-1',title:'Edukasi Kesehatan: Jaga Imunitas',date:plusDays(1),time:'09:00',googleEventId:null,updatedAt:nowIso()}];
      googleEvents=[{id:'demo-google-1',title:'Briefing Tim Konten',date:plusDays(2),time:'10:00',sourceNoteId:null,updatedAt:nowIso()}];
      history=[];account.value='';calendarId.value='';save();write(keys.config,{});render();log('Sandbox demo direset ke data contoh awal.');
    });
    const noteDate=document.querySelector('#calendarDemoNoteForm [name="date"]');
    const googleDate=document.querySelector('#calendarDemoGoogleForm [name="date"]');
    if(noteDate)noteDate.value=plusDays(3);if(googleDate)googleDate.value=plusDays(4);
    save();render();
  })();

})();