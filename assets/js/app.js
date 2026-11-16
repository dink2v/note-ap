(() => {
  const date = new Date();
  const day = new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
  document.getElementById('todayDate').textContent = day + ' · Ringkasan aktivitas konten Apotek Prapatan';
  document.getElementById('todayLabel').textContent = 'WORKSPACE OVERVIEW';
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);}
  const contentModal=document.getElementById('contentModal');
  const contentModalDialog=contentModal.querySelector('.content-modal-dialog');
  let contentModalLoading=false;
  window.noteApContentModalClose=()=>{
    contentModal.classList.remove('open');
    contentModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    contentModalDialog.innerHTML='<div class="content-modal-loading">Menyiapkan form tambah konten...</div>';
  };
  async function openContentModal(){
    contentModal.classList.add('open');contentModal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
    if(contentModalLoading||contentModal.querySelector('#contentForm'))return;
    contentModalLoading=true;
    try{
      const response=await fetch('tambah-konten.html');if(!response.ok)throw new Error('Form tidak dapat dimuat');
      const markup=await response.text();const parsed=new DOMParser().parseFromString(markup,'text/html');
      const page=parsed.querySelector('.page-wrap');if(!page)throw new Error('Struktur form tidak ditemukan');
      contentModalDialog.innerHTML='<button type="button" class="content-modal-close" aria-label="Tutup popup">×</button>';
      contentModalDialog.append(page);
      const expand=parsed.querySelector('#expandOverlay');if(expand)contentModalDialog.append(expand);
      contentModalDialog.querySelector('.content-modal-close').addEventListener('click',window.noteApContentModalClose);
      const oldScript=document.getElementById('content-modal-script');if(oldScript)oldScript.remove();
      const script=document.createElement('script');script.id='content-modal-script';script.src='assets/js/tambah-konten.js';document.body.append(script);
    }catch(error){contentModalDialog.innerHTML='<button type="button" class="content-modal-close" aria-label="Tutup popup">×</button><div class="content-modal-loading">Form gagal dimuat. Silakan coba lagi.</div>';contentModalDialog.querySelector('.content-modal-close').addEventListener('click',window.noteApContentModalClose);showToast(error.message);}
    finally{contentModalLoading=false;}
  }
  document.getElementById('newContentBtn').addEventListener('click',openContentModal);
  contentModal.addEventListener('click',event=>{if(event.target===contentModal)window.noteApContentModalClose();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&contentModal.classList.contains('open'))window.noteApContentModalClose();});
  document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    document.querySelectorAll('.nav-link').forEach(item=>item.classList.remove('active'));
    link.classList.add('active');
    const page=link.dataset.page;
    if(page!=='dashboard') showToast('Halaman '+link.textContent.trim()+' sedang dalam tahap pengembangan.');
    document.getElementById('sidebar').classList.remove('open');
    if(page==='dashboard') window.location.hash='dashboard';
  }));
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