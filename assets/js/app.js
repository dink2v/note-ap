(() => {
  const date = new Date();
  const day = new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
  document.getElementById('todayDate').textContent = day + ' · Ringkasan aktivitas konten Apotek Prapatan';
  document.getElementById('todayLabel').textContent = 'WORKSPACE OVERVIEW';
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);}
  document.getElementById('newContentBtn').addEventListener('click',()=>showToast('Form Konten Baru akan dibuat pada tahap modul Konten.'));
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
})();