(()=>{"use strict";
const CFG=window.YUNOTSUBASA_ADMIN;
const FIELDS=["管理ID","脚環番号","個体名","性別","羽色","作出年","作出者","父","母","父方祖父","父方祖母","母方祖父","母方祖母","競翔成績","血統・特徴","価格","状態","鳩画像URL","血統書画像URL","備考"];
let birds=[],current=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function csvURL(){return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CFG.sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(CFG.sheetName)}&_=${Date.now()}`}
function parseCSV(t){let rows=[],row=[],cell="",q=false;for(let i=0;i<t.length;i++){let c=t[i],n=t[i+1];if(c=='"'){if(q&&n=='"'){cell+='"';i++}else q=!q}else if(c==","&&!q){row.push(cell);cell=""}else if((c=="\n"||c=="\r")&&!q){if(c=="\r"&&n=="\n")i++;row.push(cell);rows.push(row);row=[];cell=""}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows}
async function load(){try{let r=await fetch(csvURL());if(!r.ok)throw 0;let rows=parseCSV(await r.text()),h=rows.shift()||[];birds=rows.filter(x=>x.some(Boolean)).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]||""])));render()}catch(e){$("#birds").innerHTML='<div class="empty">データを読み込めませんでした。スプレッドシートの公開設定を確認してください。</div>'}}
function render(){let q=$("#q").value.trim().toLowerCase();let a=birds.filter(b=>Object.values(b).join(" ").toLowerCase().includes(q));$("#count").textContent=`${a.length}件`;$("#birds").innerHTML=a.length?a.map(b=>`<article class="card"><div class="ring">${esc(b["脚環番号"])}</div><div class="name">${esc(b["個体名"])}</div><div class="meta">${esc([b["性別"],b["羽色"],b["作出年"],b["状態"]].filter(Boolean).join(" ／ "))}</div><button class="edit" data-ring="${esc(b["脚環番号"])}">編集内容を確認</button></article>`).join(""):'<div class="empty">該当する鳩はありません。</div>';$$(".edit").forEach(x=>x.onclick=()=>openEdit(x.dataset.ring))}
function field(name,val=""){let textarea=["競翔成績","血統・特徴","備考"].includes(name);let type=name.includes("URL")?"url":"text";return `<label class="field"><span class="label">${esc(name)}</span>${textarea?`<textarea name="${esc(name)}">${esc(val)}</textarea>`:`<input type="${type}" name="${esc(name)}" value="${esc(val)}">`}</label>`}
function openEdit(ring=null){current=ring?birds.find(b=>b["脚環番号"]===ring):null;$("#formTitle").textContent=current?"登録内容":"新規登録";$("#fields").innerHTML=FIELDS.filter(x=>x!=="管理ID").map(x=>field(x,current?.[x]||"")).join("");show("edit")}
function show(v){$("#listView").hidden=v!=="list";$("#editView").hidden=v!=="edit";$$(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.view===v));scrollTo(0,0)}
$$(".tabs button").forEach(b=>b.onclick=()=>b.dataset.view==="edit"?openEdit():show("list"));
$("#backList").onclick=()=>show("list");$("#q").oninput=render;
$("#birdForm").onsubmit=e=>{e.preventDefault();alert("このGitHub管理画面は表示・入力確認用です。データの登録・修正はスプレッドシート側で行ってください。");};
load();
})();