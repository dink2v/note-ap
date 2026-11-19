(() => {
const form=document.getElementById('contentForm'),toast=document.getElementById('toast');
let timer,expandedField=null,detailItem=null,detailMode=false,editMode=false;
const config=window.NOTE_AP_CONFIG||{},pageParams=new URLSearchParams(window.location.search);
const CONTENT_KEY='noteAp.contents';
const themeMedia=window.matchMedia('(prefers-color-scheme: dark)');
function applyStoredTheme(){
 try{
  const prefs=JSON.parse(localStorage.getItem('noteAp.settings')||'{}');
  const preference=prefs.theme==='dark'||prefs.theme==='system'?prefs.theme:'light';
  const effective=preference==='system'?(themeMedia.matches?'dark':'light'):preference;
  document.documentElement.dataset.theme=effective;
  document.documentElement.dataset.themePreference=preference;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',effective==='dark'?'#111a15':'#f7faf8');
 }catch(error){document.documentElement.dataset.theme='light';}
}
applyStoredTheme();
themeMedia.addEventListener?.('change',()=>{try{const prefs=JSON.parse(localStorage.getItem('noteAp.settings')||'{}');if(prefs.theme==='system')applyStoredTheme();}catch(error){}});
window.addEventListener('storage',event=>{if(event.key==='noteAp.settings')applyStoredTheme();});
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('show'),3500);}
function readItems(){try{const value=JSON.parse(localStorage.getItem(CONTENT_KEY)||'[]');return Array.isArray(value)?value:[];}catch(error){return[];}}
function writeItems(items){localStorage.setItem(CONTENT_KEY,JSON.stringify(items));}
function logActivity(message){const li=document.createElement('li');li.textContent=new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date())+' — '+message;document.getElementById('historyList').prepend(li);document.getElementById('historyEmpty').hidden=true;}
const menuToggle=document.getElementById('menuToggle');if(menuToggle)menuToggle.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
document.addEventListener('click',event=>{const side=document.getElementById('sidebar');if(side&&innerWidth<=700&&side.classList.contains('open')&&!side.contains(event.target)&&!event.target.closest('#menuToggle'))side.classList.remove('open');});
const overlay=document.getElementById('expandOverlay'),expanded=document.getElementById('expandedText');
document.querySelectorAll('[data-expand]').forEach(button=>button.addEventListener('click',()=>{if(detailMode&&!editMode)return;expandedField=form.elements[button.dataset.expand];document.getElementById('expandTitle').textContent=button.parentElement.querySelector('span').textContent;expanded.value=expandedField.value;overlay.hidden=false;expanded.focus();}));
function closeExpand(apply){if(apply&&expandedField)expandedField.value=expanded.value;overlay.hidden=true;expandedField=null;}
document.getElementById('closeExpand').addEventListener('click',()=>closeExpand(false));document.getElementById('applyExpand').addEventListener('click',()=>closeExpand(true));
document.getElementById('approvePhase').addEventListener('click',()=>showToast('Approval akan tersedia setelah modul kolaborasi diaktifkan.'));
document.getElementById('sendComment').addEventListener('click',()=>showToast('Komentar dapat ditambahkan setelah konten tersimpan.'));
function saveThroughAppsScript(payload){
 return new Promise((resolve,reject)=>{
  const endpoint=String(config.API_URL||'').trim();
  if(!endpoint){reject(new Error('URL Google Apps Script belum dikonfigurasi.'));return;}
  const frame=document.createElement('iframe'),frameName='noteap_api_'+Date.now();
  frame.name=frameName;frame.hidden=true;document.body.appendChild(frame);
  let settled=false;
  const cleanup=()=>{window.removeEventListener('message',onMessage);setTimeout(()=>frame.remove(),1000);};
  const onMessage=event=>{
   if(event.source!==frame.contentWindow||!event.data||event.data.source!=='NOTE_AP_API')return;
   settled=true;cleanup();const result=event.data.payload||{};
   if(result.success)resolve(result);else reject(new Error(result.message||'Gagal menyimpan konten.'));
  };
  window.addEventListener('message',onMessage);
  const postForm=document.createElement('form');postForm.method='POST';postForm.action=endpoint;postForm.target=frameName;postForm.style.display='none';
  const field=document.createElement('input');field.type='hidden';field.name='payload';field.value=JSON.stringify(payload);
  postForm.appendChild(field);document.body.appendChild(postForm);postForm.submit();postForm.remove();
  setTimeout(()=>{if(!settled){cleanup();reject(new Error('Server tidak merespons. Periksa URL dan deployment Apps Script.'));}},30000);
 });
}
function setFormLocked(locked){
 // Kunci/buka setiap field secara eksplisit, termasuk seluruh field di
 // panel 01 Informasi Konten dan panel Materi serta Caption.
 form.querySelectorAll('input,select,textarea').forEach(element=>{
  element.disabled=Boolean(locked);
  element.toggleAttribute('disabled',Boolean(locked));
  element.readOnly=false;
  element.setAttribute('aria-disabled',String(Boolean(locked)));
 });
 form.querySelectorAll('fieldset').forEach(element=>{
  element.disabled=Boolean(locked);
  element.toggleAttribute('disabled',Boolean(locked));
 });
 form.querySelectorAll('button[data-expand]').forEach(button=>{
  button.disabled=Boolean(locked);
 });
 const save=document.querySelector('button[type="submit"][form="contentForm"]');
 if(save){save.disabled=Boolean(locked);save.hidden=Boolean(locked);}
 form.dataset.editable=String(!locked);
}
function fillForm(item){
 const legacyDateTime=String(item.postDateTime||'');
 const date=item.postingDate||legacyDateTime.split('T')[0]||'';
 const time=item.postingTime||legacyDateTime.split('T')[1]||'';
 const dateTime=date?date+'T'+(time||'00:00'):'';
 const values={title:item.title,platform:item.platform,format:item.format,duration:item.duration,pillar:item.pillar,status:item.status,postDateTime:dateTime,reference:item.reference,hook:item.hook,visualHook:item.visualHook,body:item.body,visualBody:item.visualBody,cta:item.cta,visualCta:item.visualCTA??item.visualCta,caption:item.caption,notes:item.notes};
 Object.entries(values).forEach(([name,value])=>{const field=form.elements[name];if(field&&value!=null)field.value=String(value);});
 const comments=Array.isArray(item.comments)?item.comments:[];
 const commentList=document.getElementById('commentList');commentList.replaceChildren();
 comments.forEach(comment=>{const node=document.createElement('p');node.textContent=typeof comment==='string'?comment:(comment.text||comment.message||JSON.stringify(comment));commentList.append(node);});
 document.getElementById('noComments').hidden=comments.length>0;
 const history=Array.isArray(item.history)?item.history:[];
 const historyList=document.getElementById('historyList');historyList.replaceChildren();
 history.forEach(entry=>{const li=document.createElement('li');const when=entry.at?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(entry.at))+' — ':'';li.textContent=when+(entry.type||entry.message||String(entry));historyList.append(li);});
 document.getElementById('historyEmpty').hidden=history.length>0;
 document.getElementById('phaseName').textContent=item.status||'Ideation';
 document.getElementById('approvalState').textContent=(item.approvals&&item.approvals.length)?'Tercatat':'Pending';
}
function makeItemFromForm(){
 const values=Object.fromEntries(new FormData(form).entries());
 const postDateTime=values.postDateTime||'';
 return {title:values.title,platform:values.platform,format:values.format,duration:values.duration,pillar:values.pillar,status:values.status,postingDate:postDateTime.split('T')[0],postingTime:postDateTime.split('T')[1]||'',reference:values.reference,hook:values.hook||'',visualHook:values.visualHook||'',body:values.body||'',visualBody:values.visualBody||'',cta:values.cta||'',visualCTA:values.visualCta||'',caption:values.caption||'',notes:values.notes||''};
}
function postSaved(id,storage,mode){if(window.parent&&window.parent!==window)window.parent.postMessage({type:'NOTE_AP_CONTENT_SAVED',id,storage,mode:mode||'create'},'*');}
const applyCalendarPostingDate=date=>{
 const field=form.elements.postDateTime;
 if(!field||detailMode||!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return;
 const current=String(field.value||'');
 const time=current.includes('T')?current.split('T')[1]:'00:00';
 field.value=String(date)+'T'+(time||'00:00');
};
const initialCalendarDate=pageParams.get('date');
 if(initialCalendarDate&&!form.elements.postDateTime.value)applyCalendarPostingDate(initialCalendarDate);
 window.addEventListener('message',event=>{
  if(event.data?.type==='NOTE_AP_SET_POSTING_DATE'&&!detailMode)applyCalendarPostingDate(event.data.date);
 });
 form.addEventListener('submit',async event=>{
 event.preventDefault();
 
 if(!form.reportValidity())return;
 const submit=document.querySelector('button[type="submit"][form="contentForm"]')||form.querySelector('button[type="submit"]');
 if(submit){submit.disabled=true;submit.textContent='Menyimpan…';}
 try{
  if(detailMode){
   const items=readItems(),index=items.findIndex(row=>String(row.id)===String(detailItem.id));
   if(index<0)throw new Error('Data konten tidak ditemukan di penyimpanan browser ini. Data tidak diubah.');
   const now=new Date().toISOString(),updated={...items[index],...makeItemFromForm(),updatedAt:now};
   updated.history=[...(Array.isArray(items[index].history)?items[index].history:[]),{type:'Konten diperbarui melalui Detail Konten',at:now}];
   items[index]=updated;writeItems(items);detailItem=updated;fillForm(updated);editMode=false;setFormLocked(true);const topEdit=document.getElementById('detailEditTop');if(topEdit){topEdit.textContent='Edit Konten';topEdit.classList.remove('is-editing');topEdit.setAttribute('aria-label','Aktifkan mode edit konten');}showToast('Perubahan berhasil disimpan. Detail kembali ke mode baca.');postSaved(updated.id,'local','detail');
  }else{
   const item=makeItemFromForm(),now=new Date(),id='NAP-'+now.getTime().toString(36).toUpperCase();
   const saved={...item,id,createdAt:now.toISOString(),updatedAt:now.toISOString(),storage:'local',approvals:[],comments:[],history:[{type:'Konten dibuat melalui Note AP',at:now.toISOString()}]};
   if(String(config.API_URL||'').trim()){
    const result=await saveThroughAppsScript({action:'saveContentItem',item:saved});
    logActivity('Konten berhasil dikirim ke API Note AP (ID: '+(result.id||id)+')');showToast('Konten berhasil dikirim ke Note AP.');postSaved(result.id||id,'api');
   }else{
    const items=readItems();items.unshift(saved);writeItems(items);logActivity('Konten disimpan secara lokal (ID: '+id+')');showToast('Konten tersimpan di browser ini. Belum tersinkron ke Google Sheets.');postSaved(id,'local');
   }
   form.reset();
  }
 }catch(error){showToast(error.message||'Konten gagal disimpan.');}
 finally{if(submit){submit.disabled=detailMode&&!editMode;submit.innerHTML='Simpan Konten <span>→</span>';}}
});
document.getElementById('closeForm').addEventListener('click',()=>{if(confirm('Tutup popup konten? Perubahan yang belum disimpan akan hilang.')){if(typeof window.noteApContentModalClose==='function')window.noteApContentModalClose();else window.location.href='index.html';}});
document.getElementById('duplicateForm').addEventListener('click',()=>{
 const data={};
  // FormData mengabaikan field disabled. Saat Detail masih mode lihat, baca value
  // langsung dari elemen agar Duplicate tetap menyalin seluruh isi konten.
  [...form.elements].forEach(element=>{if(element.name&&'value'in element)data[element.name]=element.value;});
  form.reset();Object.entries(data).forEach(([key,value])=>{if(form.elements[key])form.elements[key].value=value;});
 if(detailMode){detailMode=false;editMode=true;detailItem=null;setFormLocked(false);document.querySelector('.form-title-row h1').textContent='Tambah Konten Baru';document.getElementById('detailEditTop')?.remove();const bottom=document.querySelector('.form-bottom-actions > div');const save=document.querySelector('button[type="submit"][form="contentForm"]');const edit=document.createElement('button');edit.type='button';edit.className='secondary-btn';edit.id='editForm';edit.textContent='Edit';bottom.insertBefore(edit,save);edit.addEventListener('click',()=>form.querySelector('input,select,textarea').focus());}
 showToast('Isi form berhasil diduplikasi.');window.scrollTo({top:0,behavior:'smooth'});
});
const editButton=document.getElementById('editForm');
if(pageParams.get('mode')==='detail'){
 detailMode=true;
 const title=document.querySelector('.form-title-row h1');
 const titleRow=document.querySelector('.form-title-row');
 if(title)title.textContent='Detail Konten';
 const breadcrumb=document.querySelector('.form-breadcrumb b');
 if(breadcrumb)breadcrumb.textContent='Detail Konten';
 const subtitle=document.querySelector('.form-title-row .muted');
 if(subtitle)subtitle.textContent='Tinjau informasi, materi, arahan visual, caption, dan riwayat konten.';
 const id=pageParams.get('id');
 detailItem=readItems().find(item=>String(item.id)===String(id));
 if(detailItem){
  fillForm(detailItem);
  // Detail dibuka dalam mode baca. Pengguna harus menekan Edit Konten
  // sebelum field dapat diubah; setelah disimpan, kembali ke mode baca.
  editMode=false;
  setFormLocked(true);
  const topEdit=document.createElement('button');
  topEdit.type='button';
  topEdit.id='detailEditTop';
  topEdit.className='secondary-btn detail-edit-top';
  topEdit.textContent='Edit Konten';
  topEdit.setAttribute('aria-label','Aktifkan mode edit konten');
  titleRow?.appendChild(topEdit);
  editButton?.remove();
  topEdit.addEventListener('click',()=>{
   if(!editMode){
    editMode=true;
    setFormLocked(false);
    topEdit.textContent='Sedang Mengedit';
    topEdit.classList.add('is-editing');
    topEdit.setAttribute('aria-label','Mode edit konten aktif');
    showToast('Mode edit aktif. Ubah kolom yang diperlukan lalu klik Simpan Konten.');
   }
   const firstField=form.elements.namedItem('title');
   if(firstField){firstField.focus();firstField.select?.();}
  });
 }else{
  setFormLocked(true);
  if(editButton)editButton.disabled=true;
  showToast('Data konten tidak ditemukan di browser ini.');
  const message=document.createElement('p');
  message.className='muted';
  message.textContent='Data konten ini tidak ditemukan pada penyimpanan browser yang sedang digunakan.';
  form.prepend(message);
 }
}else if(editButton){
 editButton.addEventListener('click',()=>{form.querySelector('input,select,textarea').focus();showToast('Silakan edit informasi konten.');});
}
})();