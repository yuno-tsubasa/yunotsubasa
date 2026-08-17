(()=>{"use strict";
const STORE="yunotsubasa_sheet_connection_v1",TTL=180*24*60*60*1000,CFG=window.YUNOTSUBASA_EDIT_CONFIG;
let birds=[],conn=null,token="",headers=[];
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const BASE_FIELDS=["脚環番号","個体名","性別","羽色","作出年","作出者","父","母","父方祖父","父方祖母","母方祖父","母方祖母","競翔成績","血統・特徴","価格","状態","鳩画像URL","目画像URL","血統書画像URL","備考"];

function idFrom(v){
  const text=String(v||"").trim();
  const m=text.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if(m) return m[1];
  if(/^[A-Za-z0-9_-]{20,}$/.test(text)) return text;
  return "";
}
function getConn(){try{const x=JSON.parse(localStorage.getItem(STORE)||"null");if(!x||Date.now()>x.expiresAt){localStorage.removeItem(STORE);return null}return x}catch{return null}}
function saveConn(id,name){const x={sheetId:id,sheetName:name||"鳩データベース",expiresAt:Date.now()+TTL};localStorage.setItem(STORE,JSON.stringify(x));return x}
function gvizURL(){
  return `https://docs.google.com/spreadsheets/d/${conn.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(conn.sheetName)}&_=${Date.now()}`;
}

function parseGViz(text){
  const start=text.indexOf('{');
  const end=text.lastIndexOf('}');
  if(start<0||end<0) throw new Error('Google Sheets response parse error');

  const json=JSON.parse(text.slice(start,end+1));
  headers=(json.table.cols||[]).map(c=>c.label||'');

  return (json.table.rows||[]).map((row,index)=>{
    const obj={_row:index+2};
    headers.forEach((h,i)=>{
      const cell=row.c&&row.c[i] ? row.c[i] : null;
      obj[h]=cell ? (cell.f ?? cell.v ?? '') : '';
    });
    return obj;
  });
}

function driveThumb(u){const t=String(u||""),m=t.match(/\/d\/([A-Za-z0-9_-]+)/)||t.match(/[?&]id=([A-Za-z0-9_-]+)/);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`:t}

async function load(){
  conn=getConn();
  if(!conn) return showSetup();

  $("#loading").hidden=false;
  $("#error").hidden=true;

  try{
    const r=await fetch(gvizURL(),{
      method:"GET",
      cache:"no-store",
      credentials:"omit"
    });

    if(!r.ok) throw new Error(`HTTP ${r.status}`);

    const text=await r.text();
    birds=parseGViz(text).filter(b=>
      b["脚環番号"] ||
      b["個体名"] ||
      Object.values(b).some(v=>String(v||"").trim()!=="")
    );

    $("#loading").hidden=true;
    render();

  }catch(err){
    console.error("Spreadsheet load failed:",err);
    $("#loading").hidden=true;
    $("#error").hidden=false;
    $("#error").textContent=
      "スプレッドシートを読み込めませんでした。URL、シート名「"+conn.sheetName+"」、共有設定を確認してください。";
    throw err;
  }
}

function render(){const q=$("#keyword").value.trim().toLowerCase(),sex=$("#sexFilter").value,status=$("#statusFilter").value;const a=birds.filter(b=>(!q||Object.values(b).join(" ").toLowerCase().includes(q))&&(!sex||b["性別"]===sex)&&(!status||b["状態"]===status));$("#resultCount").textContent=`${a.length}件`;$("#birdList").innerHTML=a.map(b=>`<article class="bird"><div class="ring">${esc(b["脚環番号"])}</div><div class="name">${esc(b["個体名"])}</div><div class="meta">${esc([b["性別"],b["羽色"],b["作出年"],b["状態"]].filter(Boolean).join(" ／ "))}</div>${(b["鳩画像URL"]||b["目画像URL"])?`<div class="thumbs">${b["鳩画像URL"]?`<img class="thumb" src="${esc(driveThumb(b["鳩画像URL"]))}">`:"<div></div>"}${b["目画像URL"]?`<img class="thumb" src="${esc(driveThumb(b["目画像URL"]))}">`:"<div></div>"}</div>`:""}<button class="edit-button" data-row="${b._row}">編集する</button></article>`).join("");$("#empty").hidden=a.length!==0;document.querySelectorAll(".edit-button").forEach(x=>x.onclick=()=>openEdit(Number(x.dataset.row)))}
function field(n,v=""){if(["鳩画像URL","目画像URL","血統書画像URL"].includes(n))return "";const ta=["競翔成績","血統・特徴","備考"].includes(n),wide=ta?"wide":"";if(n==="性別")return `<label class="field"><span>${n}</span><select name="${n}"><option value="">未選択</option>${["♂","♀","不明"].map(x=>`<option ${x===v?"selected":""}>${x}</option>`).join("")}</select></label>`;if(n==="状態")return `<label class="field"><span>${n}</span><select name="${n}">${["販売中","商談中","売約済","非売品"].map(x=>`<option ${x===v?"selected":""}>${x}</option>`).join("")}</select></label>`;return `<label class="field ${wide}"><span>${n}</span>${ta?`<textarea name="${n}">${esc(v)}</textarea>`:`<input name="${n}" value="${esc(v)}">`}</label>`}
function setPreview(id,u){const i=$(id);if(u){i.src=driveThumb(u);i.classList.add("show")}else{i.removeAttribute("src");i.classList.remove("show")}}
function localPreview(fi,pi){$(fi).onchange=()=>{const f=$(fi).files[0];if(!f)return;const u=URL.createObjectURL(f);$(pi).src=u;$(pi).classList.add("show")}}
function openEdit(row=0){const b=row?birds.find(x=>x._row===row):{};$("#editTitle").textContent=row?"登録鳩を編集":"新規登録";$("#editForm").dataset.row=row;$("#editFields").innerHTML=`<div class="edit-grid">${BASE_FIELDS.map(n=>field(n,b?.[n]||"")).join("")}</div>`;$("#deleteButton").style.display=row?"block":"none";$("#editMessage").textContent="";setPreview("#bodyPreview",b?.["鳩画像URL"]);setPreview("#eyePreview",b?.["目画像URL"]);setPreview("#pedigreePreview",b?.["血統書画像URL"]);$("#bodyImageFile").value="";$("#eyeImageFile").value="";$("#pedigreeImageFile").value="";$("#editModal").showModal()}
function auth(){const c=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:"https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",callback:r=>{if(r.error)return;token=r.access_token;$("#authStatus").textContent="編集可能";$("#googleLoginButton").textContent="Google認証済み"}});c.requestAccessToken({prompt:""})}
function col(n){let s="";while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
async function ensureHeaders(){const miss=BASE_FIELDS.filter(x=>!headers.includes(x));if(!miss.length)return;const all=[...headers,...miss],range=`${conn.sheetName}!A1:${col(all.length)}1`;const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${conn.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,{method:"PUT",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({values:[all]})});if(!r.ok)throw new Error(await r.text());headers=all}
async function resizeImage(file,maxSide=1800,quality=.86){const b=await createImageBitmap(file),scale=Math.min(1,maxSide/Math.max(b.width,b.height)),w=Math.round(b.width*scale),h=Math.round(b.height*scale),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(b,0,0,w,h);return await new Promise(res=>c.toBlob(res,"image/jpeg",quality))}
async function uploadDrive(file,folder,prefix,maxSide=1800,quality=.86){if(!file)return "";const blob=await resizeImage(file,maxSide,quality),boundary="----yuno"+Math.random().toString(16).slice(2),meta={name:`${prefix}_${Date.now()}.jpg`,mimeType:"image/jpeg",parents:[folder]},body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,JSON.stringify(meta),`\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`,blob,`\r\n--${boundary}--`]);const r=await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":`multipart/related; boundary=${boundary}`},body});if(!r.ok)throw new Error(await r.text());const f=await r.json();const p=await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}/permissions`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({type:"anyone",role:"reader"})});if(!p.ok)throw new Error(await p.text());return `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`}
async function updateRow(row,data){const vals=headers.map(h=>data[h]??""),range=`${conn.sheetName}!A${row}:${col(headers.length)}${row}`,r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${conn.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,{method:"PUT",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({values:[vals]})});if(!r.ok)throw new Error(await r.text())}
async function appendRow(data){const vals=headers.map(h=>data[h]??""),range=`${conn.sheetName}!A:${col(headers.length)}`,r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${conn.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({values:[vals]})});if(!r.ok)throw new Error(await r.text())}
async function deleteRow(row){const meta=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${conn.sheetId}?fields=sheets.properties`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),sh=meta.sheets.find(s=>s.properties.title===conn.sheetName);if(!sh)throw 0;const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${conn.sheetId}:batchUpdate`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId:sh.properties.sheetId,dimension:"ROWS",startIndex:row-1,endIndex:row}}}]})});if(!r.ok)throw new Error(await r.text())}
function showSetup(){$("#setupPanel").hidden=false;$("#dataPanel").hidden=true;const c=getConn();if(c){$("#sheetUrl").value=`https://docs.google.com/spreadsheets/d/${c.sheetId}/edit`;$("#sheetName").value=c.sheetName}}
function showData(){$("#setupPanel").hidden=true;$("#dataPanel").hidden=false}

$("#connectButton").onclick=async()=>{
  const button=$("#connectButton");
  const msg=$("#setupMessage");
  const id=idFrom($("#sheetUrl").value);
  if(!id){
    msg.textContent="GoogleスプレッドシートのURLを確認してください。";
    msg.className="message error";
    return;
  }
  try{
    button.disabled=true;
    button.textContent="接続しています…";
    msg.textContent="";
    conn=saveConn(id,$("#sheetName").value.trim());
    showData();
    await load();
  }catch(err){
    console.error(err);
    showSetup();
    msg.textContent="接続に失敗しました。URLと共有設定を確認してください。";
    msg.className="message error";
  }finally{
    button.disabled=false;
    button.textContent="接続する";
  }
};
$("#settingsButton").onclick=showSetup;
["#sheetUrl","#sheetName"].forEach(sel=>{
  $(sel).addEventListener("keydown",ev=>{
    if(ev.key==="Enter"){
      ev.preventDefault();
      $("#connectButton").click();
    }
  });
});$("#googleLoginButton").onclick=auth;$("#searchButton").onclick=render;$("#keyword").oninput=render;$("#sexFilter").oninput=render;$("#statusFilter").oninput=render;
$("#clearButton").onclick=()=>{$("#keyword").value="";$("#sexFilter").value="";$("#statusFilter").value="";render()};
$("#newButton").onclick=()=>openEdit();$("#closeEdit").onclick=()=>$("#editModal").close();
localPreview("#bodyImageFile","#bodyPreview");localPreview("#eyeImageFile","#eyePreview");localPreview("#pedigreeImageFile","#pedigreePreview");

$("#editForm").onsubmit=async e=>{e.preventDefault();if(!token){$("#editMessage").textContent="先にGoogle認証をしてください。";return}const row=Number(e.currentTarget.dataset.row||0),old=row?birds.find(x=>x._row===row):{},data=Object.fromEntries(new FormData(e.currentTarget).entries());data["鳩画像URL"]=old?.["鳩画像URL"]||"";data["目画像URL"]=old?.["目画像URL"]||"";data["血統書画像URL"]=old?.["血統書画像URL"]||"";try{$("#saveButton").disabled=true;$("#saveButton").textContent="保存しています…";await ensureHeaders();if($("#bodyImageFile").files[0])data["鳩画像URL"]=await uploadDrive($("#bodyImageFile").files[0],CFG.birdImageFolderId,"body",1800,.86);if($("#eyeImageFile").files[0])data["目画像URL"]=await uploadDrive($("#eyeImageFile").files[0],CFG.birdImageFolderId,"eye",1800,.86);if($("#pedigreeImageFile").files[0])data["血統書画像URL"]=await uploadDrive($("#pedigreeImageFile").files[0],CFG.pedigreeFolderId,"pedigree",3000,.92);row?await updateRow(row,data):await appendRow(data);$("#editModal").close();await load()}catch(err){console.error(err);$("#editMessage").textContent="保存に失敗しました。Sheets API / Drive API と権限を確認してください。"}finally{$("#saveButton").disabled=false;$("#saveButton").textContent="保存する"}}
$("#deleteButton").onclick=async()=>{const row=Number($("#editForm").dataset.row||0);if(!row||!token)return;if(!confirm("この鳩を削除しますか？"))return;try{await deleteRow(row);$("#editModal").close();await load()}catch{$("#editMessage").textContent="削除に失敗しました。"}}

conn=getConn();if(conn){showData();load()}else showSetup();
})();