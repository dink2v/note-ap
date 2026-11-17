(() => {
const form=document.getElementById('contentForm'),toast=document.getElementById('toast');
let timer,expandedField=null;
const config=window.NOTE_AP_CONFIG||{};
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),3500);}
function logActivity(message){const li=document.createElement('li');li.textContent=new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date())+' — '+message;document.getElementById('historyList').prepend(li);document.getElementById('historyEmpty').hidden=true;}
const menuToggle=document.getElementById('menuToggle');if(menuToggle)menuToggle.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
document.addEventListener('click',event=>{const side=document.getElementById('sidebar');if(side&&innerWidth<=700&&side.classList.contains('open')&&!side.contains(event.target)&&!event.target.closest('#menuToggle'))side.classList.remove('open');});
const overlay=document.getElementById('expandOverlay'),expanded=document.getElementById('expandedText');
document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>{expandedField=form.elements[button.dataset.expand];document.getElementById('expandTitle').textContent=button.parentElement.querySelector('span').textContent;expanded.value=expandedField.value;overlay.hidden=false;expanded.focus();}));
function closeExpand(apply){if(apply&&expandedField)expandedField.value=expanded.value;overlay.hidden=true;expandedField=null;}
document.getElementById('closeExpand').addEventListener('click',()=>closeExpand(false));document.getElementById('applyExpand').addEventListener('click',()=>closeExpand(true));
document.getElementById('approvePhase').addEventListener('click',()=>showToast('Approval akan tersedia setelah modul kolaborasi diaktifkan.'));
document.getElementById('sendComment').addEventListener('click',()=>showToast('Komentar dapat ditambahkan setelah konten tersimpan.'));
function saveContentLocally(item){
 const key='noteAp.contents';
 let items=[];
 try{items=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(items))items=[];}catch(error){items=[];}
 const now=new Date();
 const id='NAP-'+now.getTime().toString(36).toUpperCase();
 const saved={...item,id,createdAt:now.toISOString(),updatedAt:now.toISOString(),storage:'local'};
 items.unshift(saved);
 localStorage.setItem(key,JSON.stringify(items));
 return {success:true,id,message:'Konten disimpan di browser ini.'};
}
function saveThroughAppsScript(payload){
 return new Promise((resolve,reject)=>{
  const endpoint=String(config.API_URL||'').trim();
  if(!endpoint){reject(new Error('URL Google Apps Script belum dikonfigurasi.'));return;}
  const frame=document.createElement('iframe');
  const frameName='noteap_api_'+Date.now();
  frame.name=frameName;frame.hidden=true;document.body.appendChild(frame);
  const cleanup=()=>{window.removeEventListener('message',onMessage);setTimeout(()=>frame.remove(),1000);};
  const onMessage=event=>{
   if(event.source!==frame.contentWindow||!event.data||event.data.source!=='NOTE_AP_API')return;
   cleanup();
   const result=event.data.payload||{};
   if(result.success)resolve(result);else reject(new Error(result.message||'Gagal menyimpan konten.'));
  };
  window.addEventListener('message',onMessage);
  const postForm=document.createElement('form');
  postForm.method='POST';postForm.action=endpoint;postForm.target=frameName;postForm.style.display='none';
  const field=document.createElement('input');field.type='hidden';field.name='payload';field.value=JSON.stringify(payload);
  postForm.appendChild(field);document.body.appendChild(postForm);postForm.submit();postForm.remove();
  setTimeout(()=>{cleanup();reject(new Error('Server tidak merespons. Periksa URL dan deployment Apps Script.'));},30000);
 });
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const values=Object.fromEntries(new FormData(form).entries());
 const item={
  title:values.title,platform:values.platform,format:values.format,duration:values.duration,
  pillar:values.pillar,status:values.status,postingDate:(values.postDateTime||'').split('T')[0],postingTime:(values.postDateTime||'').split('T')[1]||'',
  reference:values.reference,hook:values.hook||'',visualHook:values.visualHook||'',
  body:values.body||'',visualBody:values.visualBody||'',cta:values.cta||'',
  visualCTA:values.visualCta||'',caption:values.caption||'',notes:values.notes||'',
  approvals:[],comments:[],history:[{type:'Konten dibuat melalui Note AP',at:new Date().toISOString()}]
 };
 const submit=document.querySelector('button[type="submit"][form="contentForm"]')||form.querySelector('button[type="submit"]');
 if(submit){submit.disabled=true;submit.textContent='Menyimpan…';}
 try{
  let result,storage;
  if(String(config.API_URL||'').trim()){
   result=await saveThroughAppsScript({action:'saveContentItem',item});
   storage='api';
   logActivity('Konten berhasil dikirim ke API Note AP (ID: '+result.id+')');
   showToast('Konten berhasil dikirim ke Note AP.');
  }else{
   result=saveContentLocally(item);
   storage='local';
   logActivity('Konten disimpan secara lokal (ID: '+result.id+')');
   showToast('Konten tersimpan di browser ini. Belum tersinkron ke Google Sheets.');
  }
  form.reset();
  if(window.parent&&window.parent!==window)window.parent.postMessage({type:'NOTE_AP_CONTENT_SAVED',id:result.id,storage},'*');
 }catch(error){showToast(error.message||'Konten gagal disimpan.');}
 finally{if(submit){submit.disabled=false;submit.innerHTML='Simpan Konten <span>→</span>';}}
});
document.getElementById('closeForm').addEventListener('click',()=>{if(confirm('Tutup popup tambah konten? Perubahan yang belum disimpan akan hilang.')){if(typeof window.noteApContentModalClose==='function')window.noteApContentModalClose();else window.location.href='index.html';}});
document.getElementById('duplicateForm').addEventListener('click',()=>{const data=Object.fromEntries(new FormData(form).entries());form.reset();Object.entries(data).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value;});showToast('Isi form berhasil diduplikasi.');window.scrollTo({top:0,behavior:'smooth'});});
document.getElementById('editForm').addEventListener('click',()=>{form.querySelector('input,select,textarea').focus();showToast('Silakan edit informasi konten.');});
const pageParams=new URLSearchParams(window.location.search);
if(pageParams.get('mode')==='detail'){
 const title=document.querySelector('.form-title-row h1');
 const titleRow=document.querySelector('.form-title-row');
 const editButton=document.getElementById('editForm');
 if(title)title.textContent='Detail Konten';
 if(titleRow&&editButton){
  editButton.textContent='Edit';
  editButton.id='detailEditTop';
  editButton.classList.add('detail-edit-top');
  titleRow.insertBefore(editButton,titleRow.querySelector(':scope > a.secondary-btn'));
 }
}
})();