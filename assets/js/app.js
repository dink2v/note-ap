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
    if(event.data.mode!=='detail')closeContentModal();
    renderDashboard();
    if(!contentPage.hidden)renderContentList();
    if(!kanbanPage.hidden)renderKanban();
    renderCalendarPlanner();
    showToast(event.data.storage==='local'
      ? 'Konten tersimpan di browser ini (mode lokal).'
      : 'Konten berhasil dikirim ke Note AP.');
  });
  function openContentModal(event,postingDate){
    if(event)event.preventDefault();
    contentModal.classList.add('open');
    contentModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    const createUrl=new URL('./tambah-konten.html',document.baseURI);
    if(postingDate)createUrl.searchParams.set('date',postingDate);
    const target=createUrl.href;
    if(!contentModalFrame.getAttribute('src')||contentModalFrame.src!==target)contentModalFrame.src=target;
    else if(postingDate){try{contentModalFrame.contentWindow.postMessage({type:'NOTE_AP_SET_POSTING_DATE',date:postingDate},'*');}catch(error){}}
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
        style.textContent='.sidebar,.mobile-top,.form-breadcrumb,.form-title-row > a.secondary-btn,.page-footer{display:none!important}.main-area{margin-left:0!important}.content-form-wrap{max-width:none!important;padding:34px 38px 24px!important}@media(max-width:700px){.content-form-wrap{padding:28px 15px 20px!important}}html,body{background:transparent!important;background-color:transparent!important}.content-form-wrap{background:transparent!important;background-color:transparent!important}.form-panel{background:var(--panel,rgba(255,255,255,.72));border-color:var(--line,rgba(220,232,224,.8));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(20,55,36,.07)!important}.form-title-row #detailEditTop{display:inline-flex!important;align-items:center;justify-content:center;order:2;margin-left:auto;flex:0 0 auto;position:relative;z-index:2}.form-title-row>div{order:1;min-width:0}.form-title-row{gap:14px;align-items:flex-start!important}'
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
    if(page==='dashboard')renderDashboard();
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

  function readDashboardItems(){
    try{const rows=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');return Array.isArray(rows)?rows.filter(item=>item&&typeof item==='object'):[];}
    catch(error){return[];}
  }
  function renderDashboard(){
    const items=readDashboardItems();
    const today=new Date();today.setHours(0,0,0,0);
    const todayKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    const normalized=value=>String(value||'').trim().toLocaleLowerCase('id');
    const formatCount=(...formats)=>items.filter(item=>formats.includes(normalized(item.format))).length;
    const upcoming=items.filter(item=>item.postingDate&&String(item.postingDate)>=todayKey&&normalized(item.status)!=='published')
      .sort((a,b)=>String(a.postingDate).localeCompare(String(b.postingDate))||String(a.postingTime||'').localeCompare(String(b.postingTime||'')));
    const counts={
      reels:formatCount('reels','video'),
      feed:formatCount('feed'),
      carousel:formatCount('carousel'),
      published:items.filter(item=>normalized(item.status)==='published').length,
      scheduled:upcoming.length
    };
    [['reelsCount',counts.reels],['feedCount',counts.feed],['carouselCount',counts.carousel],['publishedCount',counts.published],['scheduledCount',counts.scheduled]]
      .forEach(([id,value])=>{const node=document.getElementById(id);if(node)node.textContent=String(value);});
    const totalLabel=document.getElementById('dashboardTotalLabel');
    if(totalLabel)totalLabel.textContent=items.length+' konten';
    const statusChart=document.getElementById('dashboardStatusChart');
    if(statusChart){
      const stages=['Ideation','Planning','Production','Editing','Review','Ready to Publish','Published'];
      statusChart.replaceChildren();
      if(!items.length){
        const empty=document.createElement('p');empty.className='dashboard-empty';empty.textContent='Belum ada data konten. Tambahkan konten untuk melihat ringkasan.';statusChart.append(empty);
      }else{
        stages.forEach(stage=>{
          const count=items.filter(item=>normalized(item.status)===normalized(stage)).length;
          const row=document.createElement('div');row.className='dashboard-stage-row';
          const label=document.createElement('div');label.className='dashboard-stage-label';
          const name=document.createElement('span');name.textContent=stage;
          const number=document.createElement('b');number.textContent=String(count);label.append(name,number);
          const track=document.createElement('div');track.className='dashboard-stage-track';
          const fill=document.createElement('span');fill.style.width=(count/items.length*100)+'%';fill.setAttribute('aria-label',count+' dari '+items.length+' konten');track.append(fill);
          row.append(label,track);statusChart.append(row);
        });
      }
    }
    const upcomingHost=document.getElementById('upcomingList');
    if(upcomingHost){
      upcomingHost.replaceChildren();
      if(!upcoming.length){
        const empty=document.createElement('p');empty.className='dashboard-empty';empty.textContent='Belum ada jadwal publikasi mendatang.';upcomingHost.append(empty);
      }else{
        upcoming.slice(0,5).forEach(item=>{
          const row=document.createElement('button');row.type='button';row.className='upcoming-item dashboard-upcoming-button';
          const date=new Date(String(item.postingDate)+'T00:00:00');
          const dateBox=document.createElement('span');dateBox.className='date-box';
          const day=document.createElement('b');day.textContent=String(date.getDate()).padStart(2,'0');
          const month=document.createElement('small');month.textContent=new Intl.DateTimeFormat('id-ID',{month:'short'}).format(date).toUpperCase();
          dateBox.append(day,month);
          const info=document.createElement('span');info.className='upcoming-info';
          const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
          const meta=document.createElement('small');meta.textContent=[item.platform,item.format,item.status].filter(Boolean).join(' · ');
          info.append(title,meta);
          const time=document.createElement('span');time.className='time';time.textContent=item.postingTime||'—';
          row.append(dateBox,info,time);row.addEventListener('click',()=>openContentDetail(item));upcomingHost.append(row);
        });
      }
    }
    renderDashboardNotifications(items,upcoming);
  }
  function renderDashboardNotifications(items,upcoming){
    const list=document.getElementById('notificationList'),dot=document.querySelector('#notificationBtn .notification-dot'),empty=document.getElementById('notificationEmpty');
    if(!list||!dot)return;
    let read=[];try{const value=JSON.parse(localStorage.getItem('noteAp.dashboard.readNotifications')||'[]');if(Array.isArray(value))read=value.map(String);}catch(error){}
    const notifications=[];
    const now=Date.now();
    items.filter(item=>['review','ready to publish'].includes(String(item.status||'').toLowerCase()))
      .slice(0,4).forEach(item=>notifications.push({
        id:'status:'+String(item.status||'').toLowerCase()+':'+item.id,title:String(item.status||'').toLowerCase()==='review'?'Konten menunggu review':'Konten siap dipublikasikan',
        detail:item.title||'Konten tanpa judul',meta:item.postingDate?formatContentDate(item.postingDate):'Perlu tindak lanjut',tone:item.status==='Review'?'amber':'green',item:item
      }));
    upcoming.slice(0,4).forEach(item=>{
      const days=Math.floor((new Date(String(item.postingDate)+'T00:00:00').getTime()-new Date(new Date().toDateString()).getTime())/86400000);
      if(days<=3)notifications.push({id:'due:'+item.id,title:days===0?'Konten dijadwalkan hari ini':'Jadwal publikasi mendekat',detail:item.title||'Konten tanpa judul',meta:formatContentDate(item.postingDate)+' · '+(item.postingTime||'Jam belum diatur'),tone:'teal',item:item});
    });
    notifications.sort((a,b)=>a.id.localeCompare(b.id));
    list.replaceChildren();
    if(!notifications.length){
      const message=document.createElement('article');message.className='notification-empty';message.textContent='Belum ada notifikasi. Semua aktivitas terpantau.';list.append(message);
      dot.style.display='none';if(empty)empty.hidden=true;return;
    }
    notifications.forEach(notice=>{
      const article=document.createElement('article');article.dataset.noticeId=notice.id;article.className='notification-item'+(read.includes(notice.id)?'':' unread');
      const icon=document.createElement('span');icon.className='notification-icon '+notice.tone;icon.textContent=notice.tone==='amber'?'◷':notice.tone==='green'?'✓':'▣';
      const copy=document.createElement('div');const title=document.createElement('b');title.textContent=notice.title;
      const detail=document.createElement('p');detail.textContent=notice.detail;
      const meta=document.createElement('small');meta.textContent=notice.meta;copy.append(title,detail,meta);
      article.append(icon,copy);
      if(!read.includes(notice.id)){const unread=document.createElement('span');unread.className='unread-dot';article.append(unread);}
      article.tabIndex=0;article.setAttribute('role','button');article.addEventListener('click',()=>openContentDetail(notice.item));
      list.append(article);
    });
    dot.style.display=notifications.some(notice=>!read.includes(notice.id))?'block':'none';
    if(empty)empty.hidden=true;
  }


  // NOTE AP CALENDAR PLANNER — shared noteAp.contents storage
  const calendarGrid=document.getElementById('noteApCalendarGrid');
  const calendarMonthLabel=document.getElementById('noteApCalendarMonth');
  const calendarItemModal=document.getElementById('calendarItemModal');
  const calendarItemForm=document.getElementById('calendarItemForm');
  let calendarCursor=new Date();
  let calendarViewMode='month';
  const calendarDateKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const calendarStatusKey=item=>String(item?.status||'').trim().toLocaleLowerCase('id');
  const calendarIsPublished=item=>calendarStatusKey(item)==='published';
  const calendarIsValidDate=value=>{
    const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!match)return false;
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    return date.getFullYear()===Number(match[1])&&date.getMonth()===Number(match[2])-1&&date.getDate()===Number(match[3]);
  };
  const calendarReadItems=()=>{try{const rows=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');return Array.isArray(rows)?rows.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)):[];}catch(error){return[];}};
  const calendarFormatClass=format=>{const value=String(format||'').toLowerCase();return value==='reels'?'reels':value==='carousel'?'carousel':value==='feed'?'feed':'other';};
  let calendarSuppressClickUntil=0;
  function moveCalendarContent(itemId,targetDate){
    const items=calendarReadItems(),index=items.findIndex(item=>String(item.id||'')===String(itemId||''));
    if(index<0){showToast('Konten tidak ditemukan. Jadwal tidak dipindahkan.');return;}
    if(!calendarIsValidDate(targetDate)){showToast('Tanggal tujuan tidak valid. Jadwal tidak dipindahkan.');return;}
    if(String(items[index].postingDate||'')===targetDate)return;
    const now=new Date().toISOString();items[index]={...items[index],postingDate:targetDate,updatedAt:now};
    try{localStorage.setItem('noteAp.contents',JSON.stringify(items));calendarSuppressClickUntil=Date.now()+700;renderDashboard();renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();showToast('Jadwal berhasil dipindahkan ke '+formatContentDate(targetDate)+'.');}
    catch(error){showToast('Jadwal gagal dipindahkan. Penyimpanan browser tidak dapat diperbarui.');}
  }
  function renderCalendarAgenda(items){
    const host=document.getElementById('calendarAgendaList');if(!host)return;
    const today=calendarDateKey(new Date());
    const upcoming=items.filter(item=>calendarIsValidDate(item.postingDate)&&String(item.postingDate)>=today&&!calendarIsPublished(item)).sort((a,b)=>String(a.postingDate).localeCompare(String(b.postingDate))||String(a.postingTime||'').localeCompare(String(b.postingTime||''))).slice(0,6);
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
    const monthKey=year+'-'+String(month+1).padStart(2,'0');
    const monthItems=items.filter(item=>calendarIsValidDate(item.postingDate)&&String(item.postingDate).startsWith(monthKey));
    const todayKey=calendarDateKey(new Date());
    const monthCount=monthItems.filter(item=>!calendarIsPublished(item)).length;
    const upcomingCount=items.filter(item=>calendarIsValidDate(item.postingDate)&&String(item.postingDate)>=todayKey&&!calendarIsPublished(item)).length;
    const publishedCount=monthItems.filter(calendarIsPublished).length;
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
    const weekdayLabels=calendarViewMode==='day'?[new Intl.DateTimeFormat('id-ID',{weekday:'short'}).format(calendarCursor)]:['Sen','Sel','Rab','Kam','Jum','Sab','Min'];weekdayLabels.forEach(day=>{const label=document.createElement('div');label.className='calendar-weekday';label.textContent=day;calendarGrid.append(label);});
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
      const add=document.createElement('button');add.type='button';add.className='calendar-day-add';add.textContent='+';add.title='Tambah jadwal pada '+key;add.setAttribute('aria-label','Tambah jadwal '+key);add.addEventListener('click',()=>openContentModal(null,key));head.append(add);cell.append(head);
      const dayItems=items.filter(item=>calendarIsValidDate(item.postingDate)&&String(item.postingDate)===key).sort((a,b)=>String(a.postingTime||'').localeCompare(String(b.postingTime||'')));
      dayItems.forEach(item=>{
        const event=document.createElement('button');event.type='button';event.draggable=true;event.className='calendar-event-chip '+calendarFormatClass(item.format);event.title='Seret ke tanggal lain untuk memindahkan jadwal. Klik untuk melihat detail: '+(item.title||'Tanpa judul');
        const title=document.createElement('b');title.textContent=item.title||'Tanpa judul';
        const meta=document.createElement('small');meta.textContent=[item.postingTime||'',item.format||item.platform||''].filter(Boolean).join(' · ');
        event.addEventListener('dragstart',dragEvent=>{dragEvent.dataTransfer.setData('text/noteap-content-id',String(item.id||''));dragEvent.dataTransfer.effectAllowed='move';event.classList.add('is-dragging');});
        event.addEventListener('dragend',()=>{event.classList.remove('is-dragging');calendarGrid.querySelectorAll('.is-drop-target').forEach(target=>target.classList.remove('is-drop-target'));});
        event.append(title,meta);event.addEventListener('click',()=>{if(Date.now()<calendarSuppressClickUntil)return;openCalendarContentDetail(item);});cell.append(event);
      });
      // Klik area kosong pada tanggal langsung membuka form Tambah Konten lengkap.
      // Tombol tambah dan kartu konten tetap menjalankan aksi masing-masing.
      cell.addEventListener('click',event=>{
        if(event.target.closest('button'))return;
        openContentModal(null,key);
      });
      calendarGrid.append(cell);
    }
    document.querySelectorAll('[data-calendar-view]').forEach(button=>{const active=button.dataset.calendarView===calendarViewMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    const hint=document.getElementById('calendarViewHint');if(hint)hint.textContent=calendarViewMode==='month'?'Klik tanggal atau tombol + untuk menambah konten. Di komputer, seret kartu untuk mengubah tanggal; di HP, buka kartu lalu pilih Edit.':calendarViewMode==='week'?'Tampilan satu minggu. Di komputer, seret kartu untuk menjadwalkan ulang; di HP, buka kartu lalu pilih Edit.':'Tampilan satu hari. Klik area kosong untuk menambah konten; buka kartu lalu pilih Edit untuk mengubah jadwal.';
  }
  let selectedCalendarContent=null;
  function openCalendarContentDetail(item){
    if(!item||typeof item!=='object')return;
    const latest=calendarReadItems().find(row=>String(row.id||'')===String(item.id||''));
    selectedCalendarContent=latest||item;
    const data=selectedCalendarContent;
    const modal=document.getElementById('calendarContentDetailModal');
    const body=document.getElementById('calendarContentDetailBody');
    const heading=document.getElementById('calendarContentDetailTitle');
    if(!modal||!body)return;
    if(heading)heading.textContent='DETAIL KONTEN';
    body.replaceChildren();
    const value=(...values)=>{const found=values.find(v=>v!==undefined&&v!==null&&String(v).trim()!=='');return found===undefined?'—':String(found);};
    const statusHeader=document.createElement('div');statusHeader.className='calendar-original-detail-status';
    const statusLabel=document.createElement('span');statusLabel.textContent='STATUS KONTEN';
    const statusValue=document.createElement('strong');statusValue.textContent=value(data.status);
    statusHeader.append(statusLabel,statusValue);body.append(statusHeader);
    const intro=document.createElement('div');intro.className='calendar-original-detail-intro';
    const title=document.createElement('h3');title.textContent=value(data.title);
    const identity=document.createElement('p');identity.textContent=[value(data.id),data.postingDate?formatContentDate(data.postingDate):'Tanggal belum ditentukan'].join('  ·  ');
    intro.append(title,identity);body.append(intro);
    const makeSection=(name,content)=>{const section=document.createElement('section');section.className='calendar-original-detail-section';const h=document.createElement('h3');h.textContent=name;section.append(h,content);body.append(section);};
    const info=document.createElement('div');info.className='calendar-original-detail-info';
    [['Kategori',value(data.category,data.contentCategory)],['Pilar',value(data.pillar)],['Platform',value(data.platform)],['Format',value(data.format)],['Tanggal Publish',data.postingDate?formatContentDate(data.postingDate):'Belum ditentukan'],['Status',value(data.status)],['Talent',value(data.talent)]].forEach(([label,text])=>{const row=document.createElement('div');row.className='calendar-original-detail-info-row';const key=document.createElement('span');key.textContent=label;const val=document.createElement('strong');val.textContent=text;row.append(key,val);info.append(row);});
    makeSection('Informasi Konten',info);
    const content=document.createElement('div');content.className='calendar-original-detail-copy';
    const addCopy=(label,text)=>{const wrap=document.createElement('div');wrap.className='calendar-original-detail-copy-item';const h=document.createElement('h4');h.textContent=label;const p=document.createElement('p');p.textContent=value(text);if(!text||!String(text).trim())p.classList.add('is-empty');wrap.append(h,p);content.append(wrap);};
    addCopy('Hook / Opening',data.hook);
    addCopy('Isi Konten / Slide',data.body);
    addCopy('Arahan Visual',[data.visualHook?'Visual Hook: '+data.visualHook:'',data.visualBody?'Visual Body: '+data.visualBody:'',(data.visualCTA||data.visualCta)?'Visual CTA: '+(data.visualCTA||data.visualCta):''].filter(Boolean).join('\n\n'));
    addCopy('CTA (Call to Action)',data.cta);
    makeSection('Isi Konten / Slide',content);
    const caption=document.createElement('p');caption.className='calendar-original-detail-plain';caption.textContent=value(data.caption);if(!data.caption)caption.classList.add('is-empty');
    makeSection('Caption',caption);
    const notes=document.createElement('p');notes.className='calendar-original-detail-plain';notes.textContent=value(data.notes);if(!data.notes)notes.classList.add('is-empty');
    makeSection('Catatan',notes);
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
    try{localStorage.setItem('noteAp.contents',JSON.stringify(items));closeCalendarItemModal();renderDashboard();renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();showToast(existingIndex>=0?'Jadwal konten berhasil diperbarui.':'Jadwal konten berhasil ditambahkan.');}
    catch(error){showToast('Jadwal gagal disimpan. Penyimpanan browser mungkin penuh.');}
  });
  document.querySelectorAll('[data-calendar-view]').forEach(button=>button.addEventListener('click',()=>{calendarViewMode=button.dataset.calendarView||'month';renderCalendarPlanner();}));
  document.getElementById('noteApCalendarPrev')?.addEventListener('click',()=>{if(calendarViewMode==='month')calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);else if(calendarViewMode==='week')calendarCursor.setDate(calendarCursor.getDate()-7);else calendarCursor.setDate(calendarCursor.getDate()-1);renderCalendarPlanner();});
  document.getElementById('noteApCalendarNext')?.addEventListener('click',()=>{if(calendarViewMode==='month')calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);else if(calendarViewMode==='week')calendarCursor.setDate(calendarCursor.getDate()+7);else calendarCursor.setDate(calendarCursor.getDate()+1);renderCalendarPlanner();});
  document.getElementById('noteApCalendarToday')?.addEventListener('click',()=>{calendarCursor=new Date();renderCalendarPlanner();});
  renderCalendarPlanner();
  window.addEventListener('storage',event=>{if(event.key==='noteAp.contents'){renderDashboard();renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();}});


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
    if(field.type==='textarea')return '<textarea rows="2" class="visit-inline-input visit-inline-textarea" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" placeholder="'+('Isi '+field.label.toLowerCase())+'">'+safe+'</textarea>';
    return '<input class="visit-inline-input" type="'+field.type+'" data-visit-id="'+escapeVisit(id)+'" data-visit-field="'+field.key+'" value="'+safe+'" placeholder="'+('Isi '+field.label.toLowerCase())+'">';
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
          const textarea=document.createElement('textarea');textarea.rows=2;textarea.className='visit-inline-input visit-inline-textarea';textarea.dataset.newVisitField=field.key;textarea.placeholder='Isi '+field.label.toLowerCase();
          td.append(textarea);
        }else{
          const input=document.createElement('input');input.className='visit-inline-input';input.type=field.type;input.dataset.newVisitField=field.key;input.placeholder='Isi '+field.label.toLowerCase();
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
  
  // Pengaturan ukuran tabel Visit: tarik batas header untuk lebar kolom,
  // tarik tepi bawah baris untuk tinggi baris. Preferensi disimpan di browser.
  (function enableVisitTableResizing(){
    const table=document.querySelector('.visit-main-table');
    if(!table)return;
    const storageKey='noteAp.visitTableDimensions.v1';
    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch(_){prefs={};}
    const header=table.tHead?.rows?.[0];
    if(!header)return;
    const ensureCols=()=>{
      let group=table.querySelector('colgroup[data-visit-resize-cols]');
      if(!group){
        group=document.createElement('colgroup');group.dataset.visitResizeCols='true';
        Array.from(header.cells).forEach((th,index)=>{
          const col=document.createElement('col');
          const saved=Number(prefs.widths?.[index]);
          if(saved>35)col.style.width=saved+'px';
          group.append(col);
        });
        table.insertBefore(group,table.firstChild);
      }
      return group;
    };
    const applyRowHeights=()=>{
      table.querySelectorAll('tbody tr').forEach((tr,index)=>{
        const key=tr.dataset.visitId||tr.dataset.extraVisitRow||('row-'+index);
        const height=Number(prefs.heights?.[key]);
        if(height>=42)tr.style.height=height+'px';
      });
    };
    ensureCols();applyRowHeights();
    let drag=null;
    table.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      const th=event.target.closest('th');
      if(th&&th.parentElement===header){
        const rect=th.getBoundingClientRect();
        if(rect.right-event.clientX>9)return;
        const index=th.cellIndex,cols=ensureCols(),col=cols.children[index];
        drag={type:'col',index,startX:event.clientX,startWidth:rect.width,col};
      }else{
        const td=event.target.closest('td');
        const tr=td?.parentElement;
        if(!td||!tr||td.cellIndex!==tr.cells.length-1)return;
        const rect=tr.getBoundingClientRect();
        if(rect.bottom-event.clientY>8)return;
        drag={type:'row',tr,startY:event.clientY,startHeight:rect.height,key:tr.dataset.visitId||tr.dataset.extraVisitRow||('row-'+Array.from(tr.parentElement.children).indexOf(tr))};
      }
      if(!drag)return;
      table.classList.add(drag.type==='col'?'is-resizing-col':'is-resizing-row');
      event.preventDefault();
    });
    document.addEventListener('pointermove',event=>{
      if(!drag)return;
      if(drag.type==='col'){
        const width=Math.max(54,Math.min(720,drag.startWidth+event.clientX-drag.startX));
        drag.col.style.width=width+'px';
        table.style.tableLayout='fixed';
        table.style.width='max-content';
        table.style.minWidth='100%';
        prefs.widths=prefs.widths||{};prefs.widths[drag.index]=Math.round(width);
      }else{
        const height=Math.max(42,Math.min(420,drag.startHeight+event.clientY-drag.startY));
        drag.tr.style.height=height+'px';
        prefs.heights=prefs.heights||{};prefs.heights[drag.key]=Math.round(height);
      }
    });
    const finish=()=>{
      if(!drag)return;
      table.classList.remove('is-resizing-col','is-resizing-row');
      try{localStorage.setItem(storageKey,JSON.stringify(prefs));}catch(_){}
      drag=null;
    };
    document.addEventListener('pointerup',finish);
    document.addEventListener('pointercancel',finish);
    const observer=new MutationObserver(applyRowHeights);
    if(table.tBodies[0])observer.observe(table.tBodies[0],{childList:true});
  })();

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
  const systemThemeMedia=window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme=theme=>{
    const selected=theme==='system'?'system':theme==='dark'?'dark':'light';
    const effective=selected==='system'?(systemThemeMedia.matches?'dark':'light'):selected;
    document.documentElement.dataset.theme=effective;
    document.documentElement.dataset.themePreference=selected;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',effective==='dark'?'#111a15':'#f7faf8');
  };
  systemThemeMedia.addEventListener?.('change',()=>{
    if((themeSelect?.value||savedSettings.theme||'light')==='system')applyTheme('system');
  });
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
  function writeKanban(items){localStorage.setItem('noteAp.contents',JSON.stringify(items));renderDashboard();}
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
    const ids=[...document.querySelectorAll('#notificationList .notification-item')].map(item=>item.dataset.noticeId).filter(Boolean);
    let read=[];try{read=JSON.parse(localStorage.getItem('noteAp.dashboard.readNotifications')||'[]');}catch(error){}
    localStorage.setItem('noteAp.dashboard.readNotifications',JSON.stringify([...new Set([...read,...ids])]));
    renderDashboard();showToast('Notifikasi ditandai sudah dibaca.');
  });
  document.getElementById('allNotifications').addEventListener('click',event=>{
    event.preventDefault();notificationPopover.hidden=true;notificationBtn.setAttribute('aria-expanded','false');showPage('konten');
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



  // GOOGLE CALENDAR LIVE INTEGRATION — Google Apps Script bridge.
  (function initGoogleCalendarIntegration(){
    const endpointInput=document.getElementById('gcalEndpoint');
    if(!endpointInput)return;
    const tokenInput=document.getElementById('gcalToken');
    const message=document.getElementById('gcalConnectionMessage');
    const badge=document.getElementById('gcalConnectionBadge');
    const configKey='noteAp.googleCalendar.config';
    const readConfig=()=>{try{return JSON.parse(localStorage.getItem(configKey)||'{}')||{};}catch(error){return{};}};
    const saveConfig=()=>{const config={endpoint:endpointInput.value.trim(),token:tokenInput.value.trim()};localStorage.setItem(configKey,JSON.stringify(config));return config;};
    const config=readConfig();
    endpointInput.value=config.endpoint||'';
    tokenInput.value=config.token||'';
    const setStatus=(text,ok)=>{message.textContent=text;badge.textContent=ok?'Terhubung':'Belum terhubung';badge.classList.toggle('pending',!ok);};
    const validConfig=()=>{const c=saveConfig();if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(c.endpoint)){setStatus('URL Apps Script tidak valid. Gunakan URL deployment Web App yang berakhiran /exec.',false);return null;}if(!c.token){setStatus('Token integrasi wajib diisi.',false);return null;}return c;};
    document.getElementById('gcalSaveConfig').addEventListener('click',()=>{const c=saveConfig();setStatus(c.endpoint&&c.token?'Konfigurasi tersimpan di browser ini. Lanjutkan dengan Tes Koneksi.':'Isi URL Apps Script dan token terlebih dahulu.',false);});
    document.getElementById('gcalTestConnection').addEventListener('click',()=>{
      const c=validConfig();if(!c)return;
      setStatus('Menghubungi Google Apps Script…',false);
      const callback='noteApGcalHealth_'+Date.now();
      const script=document.createElement('script');
      const cleanup=()=>{delete window[callback];script.remove();};
      const timeout=setTimeout(()=>{cleanup();setStatus('Tes koneksi timeout. Periksa URL deployment, akses Web App, dan token.',false);},15000);
      window[callback]=result=>{clearTimeout(timeout);cleanup();if(result&&result.ok){setStatus('Terhubung ke '+result.spreadsheetName+' · Kalender: '+result.calendarName,false);badge.textContent='Terhubung';badge.classList.remove('pending');}else setStatus('Koneksi gagal: '+(result&&result.error||'Respons tidak valid.'),false);};
      script.onerror=()=>{clearTimeout(timeout);cleanup();setStatus('Gagal memuat endpoint. Periksa URL deployment Apps Script.',false);};
      script.src=c.endpoint+'?action=health&token='+encodeURIComponent(c.token)+'&callback='+callback;
      document.head.append(script);
    });
    const syncButton=document.getElementById('gcalSyncNow');
    let syncInProgress=false,activeSyncRequestId='',syncRequestTimeout=null,syncRequestCounter=0;
    let syncFrame=document.getElementById('gcalSyncFrame');
    if(!syncFrame){syncFrame=document.createElement('iframe');syncFrame.id='gcalSyncFrame';syncFrame.name='gcalSyncFrame';syncFrame.hidden=true;document.body.append(syncFrame);}
    window.addEventListener('message',event=>{
      if(event.source!==syncFrame.contentWindow||!event.data||event.data.type!=='NOTEAP_GCAL_RESULT')return;
      const result=event.data.payload;
      if(!result||!syncInProgress||result.requestId!==activeSyncRequestId)return;
      clearTimeout(syncRequestTimeout);syncRequestTimeout=null;syncInProgress=false;activeSyncRequestId='';syncButton.disabled=false;
      if(!result.ok){setStatus('Sinkronisasi gagal: '+(result.error||'Respons tidak valid.'),false);return;}
      const existing=(()=>{try{return JSON.parse(localStorage.getItem('noteAp.contents')||'[]');}catch(error){return[];}})();
      const merged=new Map(existing.map(item=>[String(item.id),item]));
      (result.deletedIds||[]).forEach(id=>merged.delete(String(id)));
      (result.items||[]).forEach(item=>{const old=merged.get(String(item.id));if(!old||Date.parse(item.updatedAt||'')>=Date.parse(old.updatedAt||''))merged.set(String(item.id),item);});
      const finalItems=[...merged.values()];
      localStorage.setItem('noteAp.contents',JSON.stringify(finalItems));
      localStorage.setItem('noteAp.googleCalendar.lastSeenContentIds',JSON.stringify(finalItems.map(item=>String(item.id))));
      renderDashboard();renderCalendarPlanner();if(!contentPage.hidden)renderContentList();if(!kanbanPage.hidden)renderKanban();
      const c=result.counts||{};
      setStatus('Sinkronisasi berhasil · '+(c.created||0)+' dibuat · '+(c.updated||0)+' diperbarui · '+(c.imported||0)+' diimpor · '+(c.conflicts||0)+' konflik diselesaikan. Waktu: '+new Date(result.syncedAt).toLocaleString('id-ID'),true);
      showToast('Google Calendar dan Note AP berhasil disinkronkan.');
    });
    syncButton.addEventListener('click',()=>{
      if(syncInProgress)return;
      const c=validConfig();if(!c)return;
      let items=[];try{const value=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');if(Array.isArray(value))items=value;}catch(error){}
      let lastSeen=[];try{const value=JSON.parse(localStorage.getItem('noteAp.googleCalendar.lastSeenContentIds')||'[]');if(Array.isArray(value))lastSeen=value.map(String);}catch(error){}
      const currentIds=new Set(items.map(item=>String(item.id)));
      const deletedIds=lastSeen.filter(id=>!currentIds.has(id));
      const requestId='noteap-'+Date.now()+'-'+(++syncRequestCounter);
      activeSyncRequestId=requestId;syncInProgress=true;syncButton.disabled=true;
      const payload={action:'sync',token:c.token,items:items,deletedIds:deletedIds,requestId:requestId};
      const form=document.createElement('form');form.method='POST';form.action=c.endpoint;form.target=syncFrame.name;form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);form.append(input);
      document.body.append(form);setStatus('Sinkronisasi dua arah sedang berjalan…',false);
      syncRequestTimeout=setTimeout(()=>{if(activeSyncRequestId!==requestId)return;syncInProgress=false;activeSyncRequestId='';syncButton.disabled=false;syncRequestTimeout=null;setStatus('Sinkronisasi belum menerima respons. Periksa koneksi atau deployment Apps Script sebelum mencoba lagi.',false);},60000);
      form.submit();form.remove();
    });
    if(config.endpoint&&config.token)setStatus('Konfigurasi tersimpan. Tekan Tes Koneksi untuk memeriksa akses.',false);
    // Background refresh while the workspace is open; users can always sync manually.
    setInterval(()=>{const saved=readConfig();if(!document.hidden&&saved.endpoint&&saved.token)document.getElementById('gcalSyncNow').click();},5*60*1000);
    document.addEventListener('visibilitychange',()=>{const saved=readConfig();if(!document.hidden&&saved.endpoint&&saved.token)document.getElementById('gcalSyncNow').click();});
  })();

})();