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
  function showPage(page){
    const isCalendar=page==='kalender';
    dashboardPage.hidden=isCalendar;
    calendarPage.hidden=!isCalendar;
    document.querySelectorAll('.nav-link').forEach(item=>item.classList.toggle('active',item.dataset.page===page));
    document.getElementById('todayLabel').textContent=isCalendar?'CONTENT SCHEDULING':'WORKSPACE OVERVIEW';
    document.getElementById('todayDate').textContent=isCalendar?'Kalender terhubung dengan Google Calendar · Asia/Jakarta':'Ringkasan aktivitas konten Apotek Prapatan';
    window.location.hash=isCalendar?'kalender':'dashboard';
  }
  document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    const page=link.dataset.page;
    document.getElementById('sidebar').classList.remove('open');
    if(page==='dashboard'||page==='kalender'){showPage(page);return;}
    showToast('Halaman '+link.textContent.trim()+' sedang dalam tahap pengembangan.');
  }));
  document.querySelectorAll('a[href="#kalender"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    showPage('kalender');
  }));
  if(window.location.hash==='#kalender') showPage('kalender');
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