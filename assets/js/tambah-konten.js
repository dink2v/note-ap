(() => {
const form=document.getElementById('contentForm'),toast=document.getElementById('toast');let timer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),2800);}
document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.addEventListener('click',event=>{const side=document.getElementById('sidebar');if(innerWidth<=700&&side.classList.contains('open')&&!side.contains(event.target)&&!event.target.closest('#menuToggle'))side.classList.remove('open');});
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form).entries());const items=JSON.parse(localStorage.getItem('noteap_preview_contents')||'[]');items.push({...data,id:'PREVIEW-'+Date.now(),createdAt:new Date().toISOString()});localStorage.setItem('noteap_preview_contents',JSON.stringify(items));showToast('Tersimpan di preview browser ini. Belum masuk Google Sheets.');form.reset();window.scrollTo({top:0,behavior:'smooth'});});
})();