// لوحة مشرف ثابتة — تخزين محلي فقط
const Admin = (() => {
  const state = {
    data: null,
    editing: null, // { type:'series'|'chapter', id?, sid?, num? }
  };

  function $(sel){ return document.querySelector(sel); }
  function el(tag, attrs={}, html=""){
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=> e.setAttribute(k,v));
    if (html) e.innerHTML = html;
    return e;
  }

  function saveLocal(){
    localStorage.setItem("bs_data", JSON.stringify(state.data));
  }
  function loadLocal(){
    try{
      const raw = localStorage.getItem("bs_data");
      if (raw){ state.data = JSON.parse(raw); }
    }catch(_){}
  }

  function ensureAuth(){
    const ok = sessionStorage.getItem("bs_admin")==="ok";
    if (ok){
      $("#authSection").classList.add("hidden");
      $("#panel").classList.remove("hidden");
      renderTables();
      return;
    }
    $("#adminLogin").addEventListener("click", ()=>{
      const email = $("#adminEmail").value.trim();
      const pass = $("#adminPass").value;
      if (!email || !pass){ alert("أدخل البريد وكلمة المرور."); return; }
      // نسخة تجريبية: نقبل أي بيانات
      sessionStorage.setItem("bs_admin","ok");
      $("#authSection").classList.add("hidden");
      $("#panel").classList.remove("hidden");
      renderTables();
    });
  }

  function seedIfEmpty(){
    if (state.data && state.data.series && state.data.chapters) return;
    state.data = {
      series: [
        {id:"s1", title:"إمبراطور شيطاني", cover:"https://picsum.photos/300/400?1", genres:["أكشن","سحر"], status:"ongoing", lang:"cn", desc:"بطل يعود من السقوط ليحكم من جديد."}
      ],
      chapters: { s1: [{num:1,pages:["https://picsum.photos/1000/1400?11","https://picsum.photos/1000/1400?12"]}] }
    };
    saveLocal();
  }

  function renderTables(){
    const sBody = $("#seriesTable tbody");
    sBody.innerHTML = (state.data.series||[]).map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${s.title}</td>
        <td>${(s.genres||[]).join("، ")}</td>
        <td>${s.status||"-"}</td>
        <td>${s.lang||"-"}</td>
        <td>
          <button class="btn" data-act="edit-series" data-id="${s.id}">تعديل</button>
          <button class="btn danger" data-act="del-series" data-id="${s.id}">حذف</button>
        </td>
      </tr>
    `).join("");

    const cBody = $("#chaptersTable tbody");
    const rows = [];
    Object.entries(state.data.chapters||{}).forEach(([sid, arr])=>{
      (arr||[]).forEach(c=>{
        rows.push(`
          <tr>
            <td>${sid}</td>
            <td>${c.num}</td>
            <td>${(c.pages||[]).length}</td>
            <td>
              <button class="btn" data-act="edit-chapter" data-sid="${sid}" data-num="${c.num}">تعديل</button>
              <button class="btn danger" data-act="del-chapter" data-sid="${sid}" data-num="${c.num}">حذف</button>
            </td>
          </tr>
        `);
      });
    });
    cBody.innerHTML = rows.join("");

    sBody.querySelectorAll("button").forEach(b => b.addEventListener("click", onTableAction));
    cBody.querySelectorAll("button").forEach(b => b.addEventListener("click", onTableAction));
  }

  function onTableAction(e){
    const btn = e.currentTarget;
    const act = btn.dataset.act;
    if (act === "edit-series"){
      const id = btn.dataset.id;
      const s = state.data.series.find(x=>x.id===id);
      openSeriesEditor(s);
    } else if (act === "del-series"){
      const id = btn.dataset.id;
      if (!confirm("حذف السلسلة سيحذف فصولها أيضاً. تأكيد؟")) return;
      state.data.series = state.data.series.filter(x=>x.id!==id);
      delete state.data.chapters[id];
      saveLocal(); renderTables();
    } else if (act === "edit-chapter"){
      openChapterEditor(btn.dataset.sid, parseInt(btn.dataset.num));
    } else if (act === "del-chapter"){
      const sid = btn.dataset.sid; const num = parseInt(btn.dataset.num);
      if (!confirm("حذف الفصل؟")) return;
      state.data.chapters[sid] = (state.data.chapters[sid]||[]).filter(c=>c.num!==num);
      saveLocal(); renderTables();
    }
  }

  function openSeriesEditor(s){
    state.editing = {type:"series", id: s?.id || null};
    $("#editorTitle").textContent = s ? "تعديل سلسلة" : "إضافة سلسلة جديدة";
    const body = $("#editorBody");
    const genres = (s?.genres||[]).join(", ");
    body.innerHTML = `
      <div class="form-grid">
        <div>
          <label>المعرف (لاتيني فريد)</label>
          <input type="text" id="e_id" value="${s?.id||""}" ${s?"readonly":""} placeholder="مثال: murim-king">
        </div>
        <div>
          <label>العنوان</label>
          <input type="text" id="e_title" value="${s?.title||""}">
        </div>
        <div>
          <label>رابط الغلاف</label>
          <input type="text" id="e_cover" value="${s?.cover||""}" placeholder="https://.../cover.webp">
        </div>
        <div>
          <label>الأنواع (افصل بفاصلة)</label>
          <input type="text" id="e_genres" value="${genres}">
        </div>
        <div>
          <label>الحالة</label>
          <select id="e_status">
            <option value="">—</option>
            <option value="ongoing" ${s?.status==="ongoing"?"selected":""}>مستمرة</option>
            <option value="completed" ${s?.status==="completed"?"selected":""}>مكتملة</option>
            <option value="hiatus" ${s?.status==="hiatus"?"selected":""}>متوقفة</option>
          </select>
        </div>
        <div>
          <label>اللغة/النوع</label>
          <select id="e_lang">
            <option value="">—</option>
            <option value="kr" ${s?.lang==="kr"?"selected":""}>مانهوا كورية</option>
            <option value="cn" ${s?.lang==="cn"?"selected":""}>مانها صينية</option>
            <option value="jp" ${s?.lang==="jp"?"selected":""}>مانجا يابانية</option>
          </select>
        </div>
      </div>
      <label>نبذة</label>
      <textarea id="e_desc">${s?.desc||""}</textarea>
    `;
    $("#saveEntity").onclick = saveSeries;
    $("#cancelEdit").onclick = ()=>{ state.editing=null; $("#editorBody").innerHTML=""; };
  }

  function saveSeries(){
    const id = document.getElementById("e_id").value.trim();
    const title = document.getElementById("e_title").value.trim();
    if (!id || !title){ alert("المعرف والعنوان إجباريان."); return; }
    const cover = document.getElementById("e_cover").value.trim();
    const genres = document.getElementById("e_genres").value.split(",").map(x=>x.trim()).filter(Boolean);
    const status = document.getElementById("e_status").value;
    const lang = document.getElementById("e_lang").value;
    const desc = document.getElementById("e_desc").value.trim();

    if (state.editing?.id){
      const s = state.data.series.find(x=>x.id===state.editing.id);
      Object.assign(s, {title, cover, genres, status, lang, desc});
    } else {
      if (state.data.series.find(x=>x.id===id)){ alert("المعرف مستخدم."); return; }
      state.data.series.push({id, title, cover, genres, status, lang, desc});
      if (!state.data.chapters[id]) state.data.chapters[id] = [];
    }
    saveLocal(); renderTables();
    alert("تم الحفظ.");
  }

  function openChapterEditor(sid, num){
    state.editing = {type:"chapter", sid: sid || (state.data.series[0]?.id||""), num};
    $("#editorTitle").textContent = num ? `تعديل فصل (${state.editing.sid} - ${num})` : "إضافة فصل جديد";
    const sOpts = state.data.series.map(s=>`<option value="${s.id}" ${s.id===state.editing.sid?"selected":""}>${s.title}</option>`).join("");
    const chap = (sid && num) ? (state.data.chapters[sid]||[]).find(c=>c.num===num) : null;
    const pagesText = chap ? (chap.pages||[]).join("\n") : "";

    const body = $("#editorBody");
    body.innerHTML = `
      <div class="form-grid">
        <div>
          <label>السلسلة</label>
          <select id="c_sid">${sOpts}</select>
        </div>
        <div>
          <label>رقم الفصل</label>
          <input type="number" id="c_num" value="${chap?chap.num:""}" placeholder="1">
        </div>
      </div>
      <label>روابط الصفحات (سطر لكل صورة)</label>
      <textarea id="c_pages" placeholder="https://.../p1.webp\nhttps://.../p2.webp\n...">${pagesText}</textarea>
    `;
    $("#saveEntity").onclick = saveChapter;
    $("#cancelEdit").onclick = ()=>{ state.editing=null; $("#editorBody").innerHTML=""; };
  }

  function saveChapter(){
    const sid = document.getElementById("c_sid").value;
    const num = parseInt(document.getElementById("c_num").value);
    if (!sid || !num){ alert("اختر السلسلة واكتب رقم الفصل."); return; }
    const pages = document.getElementById("c_pages").value.split("\n").map(x=>x.trim()).filter(Boolean);
    if (!Array.isArray(state.data.chapters[sid])) state.data.chapters[sid] = [];
    const exist = state.data.chapters[sid].find(c=>c.num===num);
    if (exist){ exist.pages = pages; } else { state.data.chapters[sid].push({num, pages}); }
    state.data.chapters[sid].sort((a,b)=>a.num-b.num);
    saveLocal(); renderTables();
    alert("تم حفظ الفصل.");
  }

  function bindUI(){
    $("#btnAddSeries").addEventListener("click", ()=> openSeriesEditor(null));
    $("#btnAddChapter").addEventListener("click", ()=> openChapterEditor(state.data.series[0]?.id || "", null));
    $("#btnExport").addEventListener("click", ()=>{
      const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = el("a", {href:url, download:"data.json"});
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
    $("#fileImport").addEventListener("change", async (e)=>{
      const f = e.target.files[0]; if(!f) return;
      const txt = await f.text();
      try{
        const obj = JSON.parse(txt);
        if (!obj.series || !obj.chapters) throw new Error("بنية غير صحيحة");
        state.data = obj; saveLocal(); renderTables(); alert("تم الاستيراد.");
      }catch(err){ alert("فشل الاستيراد: "+err.message); }
    });
  }

  function init(){
    loadLocal();
    seedIfEmpty();
    ensureAuth();
    bindUI();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", Admin.init);
