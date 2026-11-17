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
const params=new URLSearchParams(window.location.search);
const detailMode=params.get('mode')==='detail';
const detailId=params.get('id')||'';
let editingDetail=false;
let currentDetailItem=null;
const editTop=document.getElementById('detailEditTop');
const saveButton=document.getElementById('saveContentButton');
const duplicateButton=document.getElementById('duplicateForm');
const heading=document.getElementById('contentFormHeading');
const subtitle=document.getElementById('contentFormSubtitle');
function readLocalItems(){
 try{const items=JSON.parse(localStorage.getItem('noteAp.contents')||'[]');return Array.isArray(items)?items:[];}catch(error){return[];}
}
function setFormLocked(locked){
 [...form.elements].forEach(control=>{if(control.name)control.disabled=locked;});
 if(editTop){editTop.hidden=!detailMode;editTop.textContent=editingDetail?'Edit Aktif':'Edit';}
 if(saveButton)saveButton.hidden=detailMode&&!editingDetail;
 if(duplicateButton)duplicateButton.hidden=detailMode;
 document.getElementById('closeForm').textContent=detailMode?'Tutup Detail':'Tutup';
}
function loadDetailItem(){
 const item=readLocalItems().find(entry=>String(entry.id)===detailId);
 if(!item){showToast('Data konten tidak ditemukan di penyimpanan browser ini.');return;}
 currentDetailItem=item;
 const dateTime=[item.postingDate||'',item.postingTime||''].filter(Boolean).join('T');
 const values={
  title:item.title,platform:item.platform,format:item.format,duration:item.duration,
  pillar:item.pillar,status:item.status,postDateTime:dateTime,reference:item.reference,
  hook:item.hook,visualHook:item.visualHook,body:item.body,visualBody:item.visualBody,
  cta:item.cta,visualCta:item.visualCTA,caption:item.caption,notes:item.notes
 };
 Object.entries(values).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=String(value??'');});
 if(heading)heading.textContent='Detail Konten';
 if(subtitle)subtitle.textContent='Lihat seluruh informasi konten. Pilih Edit untuk mengubah data.';
 document.querySelector('.form-title-row .eyebrow').textContent='CONTENT DETAIL';
 document.getElementById('phaseName').textContent=item.status||'Ideation';
 const history=Array.isArray(item.history)?item.history:[];
 const historyList=document.getElementById('historyList');historyList.replaceChildren();
 history.forEach(entry=>{const li=document.createElement('li');const at=entry.at?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(entry.at))+' — ':'';li.textContent=at+(entry.type||entry.message||'Aktivitas');historyList.append(li);});
 document.getElementById('historyEmpty').hidden=history.length>0;
 const comments=Array.isArray(item.comments)?item.comments:[];
 const commentList=document.getElementById('commentList');commentList.replaceChildren();
 comments.forEach(entry=>{const p=document.createElement('p');p.textContent=typeof entry==='string'?entry:(entry.text||entry.comment||'');commentList.append(p);});
 document.getElementById('noComments').hidden=comments.length>0;
 editingDetail=false;
 setFormLocked(true);
}
if(detailMode)loadDetailItem();else setFormLocked(false);
if(editTop)editTop.addEventListener('click',()=>{
 if(!detailMode)return;
 if(!editingDetail){
  editingDetail=true;setFormLocked(false);
  if(heading)heading.textContent='Edit Konten';
  if(subtitle)subtitle.textContent='Perbarui informasi konten, lalu simpan perubahan.';
  editTop.textContent='Sedang Mengedit';
  form.querySelector('input[name="title"]')?.focus();
 }
});
function saveContentLocally(item,existingId=''){
 const key='noteAp.contents',items=readLocalItems(),now=new Date();
 if(existingId){
  const index=items.findIndex(entry=>String(entry.id)===String(existingId));
  if(index<0)throw new Error('Konten yang akan diperbarui tidak ditemukan.');
  const previous=items[index];
  const saved={...previous,...item,id:previous.id,createdAt:previous.createdAt||now.toISOString(),updatedAt:now.toISOString(),storage:previous.storage||'local'};
  items[index]=saved;
  localStorage.setItem(key,JSON.stringify(items));
  return {success:true,id:saved.id,message:'Konten berhasil diperbarui.'};
 }
 const id='NAP-'+now.getTime().toString(36).toUpperCase();
 const saved={...item,id,createdAt:now.toISOString(),updatedAt:now.toISOString(),storage:'local'};
 items.unshift(saved);localStorage.setItem(key,JSON.stringify(items));
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
 const now=new Date().toISOString();
 const item={
  title:values.title,platform:values.platform,format:values.format,duration:values.duration,
  pillar:values.pillar,status:values.status,postingDate:(values.postDateTime||'').split('T')[0],postingTime:(values.postDateTime||'').split('T')[1]||'',
  reference:values.reference,hook:values.hook||'',visualHook:values.visualHook||'',
  body:values.body||'',visualBody:values.visualBody||'',cta:values.cta||'',
  visualCTA:values.visualCta||'',caption:values.caption||'',notes:values.notes||'',
  approvals:currentDetailItem?.approvals||[],comments:currentDetailItem?.comments||[],
  history:detailMode&&currentDetailItem? [...(currentDetailItem.history||[]),{type:'Konten diperbarui',at:now}]:[{type:'Konten dibuat melalui Note AP',at:now}]
 };
 const submit=document.querySelector('button[type="submit"][form="contentForm"]')||form.querySelector('button[type="submit"]');
 if(submit){submit.disabled=true;submit.textContent='Menyimpan…';}
 try{
  let result,storage;
  if(String(config.API_URL||'').trim()&&!detailMode){
   result=await saveThroughAppsScript({action:'saveContentItem',item});
   storage='api';
   logActivity('Konten berhasil dikirim ke API Note AP (ID: '+result.id+')');
   showToast('Konten berhasil dikirim ke Note AP.');
  }else{
   result=saveContentLocally(item,detailMode?detailId:'');
   storage='local';
   logActivity((detailMode?'Konten diperbarui secara lokal (ID: ':'Konten disimpan secara lokal (ID: ')+result.id+')');
   showToast(detailMode?'Perubahan konten berhasil disimpan.':'Konten tersimpan di browser ini. Belum tersinkron ke Google Sheets.');
  }
  if(detailMode){
   currentDetailItem={...currentDetailItem,...item,id:result.id};
   editingDetail=false;
   loadDetailItem();
  }else{
   form.reset();
   if(window.parent&&window.parent!==window)window.parent.postMessage({type:'NOTE_AP_CONTENT_SAVED',id:result.id,storage},'*');
  }
 }catch(error){showToast(error.message||'Konten gagal disimpan.');}
 finally{if(submit){submit.disabled=false;submit.innerHTML='Simpan Konten <span>→</span>';}}
});
document.getElementById('closeForm').addEventListener('click',()=>{if(confirm('Tutup popup tambah konten? Perubahan yang belum disimpan akan hilang.')){if(typeof window.noteApContentModalClose==='function')window.noteApContentModalClose();else window.location.href='index.html';}});
document.getElementById('duplicateForm').addEventListener('click',()=>{const data=Object.fromEntries(new FormData(form).entries());form.reset();Object.entries(data).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value;});showToast('Isi form berhasil diduplikasi.');window.scrollTo({top:0,behavior:'smooth'});});
})();