const c=window.YUNOTSUBASA_CONFIG,
k=document.getElementById('keyword'),
sf=document.getElementById('sexFilter'),
st=document.getElementById('statusFilter'),
yf=document.getElementById('yearFilter'),
g=document.getElementById('birdGrid'),
m=document.getElementById('detailModal'),
zm=document.getElementById('imageZoomModal'),
zt=document.getElementById('imageZoomTarget');
let rows=[];

const e=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));

function img(u){
  let x=String(u||'').match(/(?:\/d\/|id=)([-\w]{20,})/);
  return x?`https://drive.google.com/thumbnail?id=${x[1]}&sz=w2000`:u||'';
}

function parse(t){
  let j=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1)),
      h=j.table.cols.map(x=>x.label||'');
  return j.table.rows.map(r=>Object.fromEntries(h.map((x,i)=>[x,r.c&&r.c[i]?(r.c[i].f??r.c[i].v??''):''])));
}

async function load(){
  try{
    let r=await fetch(`https://docs.google.com/spreadsheets/d/${c.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(c.sheetName)}`);
    rows=parse(await r.text()).filter(x=>x['脚環番号']||x['個体名']);
    [...new Set(rows.map(x=>x['作出年']).filter(Boolean))].sort().reverse().forEach(y=>yf.add(new Option(y,y)));
    document.getElementById('loading').hidden=true;
    render();
  }catch(x){
    document.getElementById('loading').hidden=true;
    document.getElementById('error').hidden=false;
  }
}

function render(){
  let q=k.value.toLowerCase(),
      a=rows.filter(x=>
        (!q||Object.values(x).join(' ').toLowerCase().includes(q))&&
        (!sf.value||x['性別']==sf.value)&&
        (!st.value||x['状態']==st.value)&&
        (!yf.value||String(x['作出年'])==yf.value)
      );

  document.getElementById('resultCount').textContent=`${a.length}羽を表示`;

  g.innerHTML=a.map(x=>`
    <article class="card">
      <button data-r="${e(x['脚環番号'])}">
        <div class="photo">${x['鳩画像URL']?`<img src="${e(img(x['鳩画像URL']))}" alt="鳩本体写真">`:'NO PHOTO'}</div>
        <div class="body">
          <div class="ring">${e(x['脚環番号'])}</div>
          <div>${e(x['個体名'])}</div>
          <div class="tags">${e([x['性別'],x['羽色'],x['作出年'],x['状態']].filter(Boolean).join(' ／ '))}</div>
        </div>
      </button>
    </article>
  `).join('');

  g.querySelectorAll('button').forEach(b=>b.onclick=()=>detail(rows.find(x=>String(x['脚環番号'])===b.dataset.r)));
}

function zoom(src,alt){
  zt.src=src;
  zt.alt=alt||'拡大画像';
  zm.showModal();
}

function imageBlock(title,url,alt){
  if(!url)return '';
  const src=e(img(url));
  return `<section class="detail-image-block">
    <h3>${e(title)}</h3>
    <button class="zoomable-image" type="button" data-src="${src}" data-alt="${e(alt)}" aria-label="${e(title)}を拡大表示">
      <img src="${src}" alt="${e(alt)}">
      <span>タップして拡大</span>
    </button>
  </section>`;
}

function detail(x){
  document.getElementById('modalContent').innerHTML=`
    <div class="detail">
      <h2>${e(x['脚環番号'])} ${e(x['個体名'])}</h2>
      <p>性別：${e(x['性別'])}　羽色：${e(x['羽色'])}　作出年：${e(x['作出年'])}</p>

      <div class="detail-images">
        ${imageBlock('鳩本体写真',x['鳩画像URL'],'鳩本体写真')}
        ${imageBlock('目の写真',x['目画像URL'],'鳩の目の写真')}
      </div>

      <p><b>父：</b>${e(x['父'])}<br><b>母：</b>${e(x['母'])}</p>
      <p><b>競翔成績：</b>${e(x['競翔成績'])}</p>
      <p><b>血統・特徴：</b>${e(x['血統・特徴'])}</p>

      ${imageBlock('血統書',x['血統書画像URL'],'血統書')}
    </div>`;

  document.querySelectorAll('.zoomable-image').forEach(b=>{
    b.onclick=()=>zoom(b.dataset.src,b.dataset.alt);
  });

  m.showModal();
}

[k,sf,st,yf].forEach(x=>x.oninput=render);

document.getElementById('resetButton').onclick=()=>{
  k.value=sf.value=st.value=yf.value='';
  render();
};
document.getElementById('modalClose').onclick=()=>m.close();
document.getElementById('imageZoomClose').onclick=()=>zm.close();
zm.addEventListener('click',ev=>{if(ev.target===zm)zm.close()});

load();