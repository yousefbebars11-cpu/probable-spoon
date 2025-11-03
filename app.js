const App = (() => {
  // تخزين محلي بسيط
  const store = {
    get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  };

  // بيانات افتراضية (Fallback) في حال عدم وجود bs_data
  const fallback = {
    series: [
      {id:"s1", title:"إمبراطور شيطاني", cover:"https://picsum.photos/300/400?1", genres:["أكشن","سحر"], status:"ongoing", lang:"cn", desc:"بطل يعود من السقوط ليحكم من جديد."},
      {id:"s2", title:"عودة المبارز", cover:"https://picsum.photos/300/400?2", genres:["أكشن","موريم"], status:"ongoing", lang:"kr", desc:"مبارز يتجسد ويستعيد مجده."},
      {id:"s3", title:"مدينة الزومبي", cover:"https://picsum.photos/300/400?3", genres:["رعب","زومبي","بقاء"], status:"completed", lang:"kr", desc:"بقاء في عالم منهار."},
    ],
    chapters: {
      s1: [
        {num:1, pages:["https://picsum.photos/1000/1400?11","https://picsum.photos/1000/1400?12"]},
        {num:2, pages:["https://picsum.photos/1000/1400?13","https://picsum.photos/1000/1400?14"]}
      ],
      s2: [
        {num:1, pages:["https://picsum.photos/1000/1400?21","https://picsum.photos/1000/1400?22"]}
      ],
      s3: [
        {num:1, pages:["https://picsum.photos/1000/1400?31","https://picsum.photos/1000/1400?32"]},
        {num:2, pages:["https://picsum.photos/1000/1400?33","https://picsum.photos/1000/1400?34"]},
        {num:3, pages:["https://picsum.photos/1000/1400?35","https://picsum.photos/1000/1400?36"]}
      ]
    },
    teams: [
      {id:"t1", name:"Brown Team", avatar:"https://picsum.photos/300/300?50", bio:"فريق ترجمة وتحرير."},
      {id:"t2", name:"Shadow Subs", avatar:"https://picsum.photos/300/300?51", bio:"تبييض وتحرير سريع."}
    ],
    news: [
      {id:"n1", title:"إطلاق النسخة التجريبية", date:"2025-10-01", body:"تم إطلاق نسخة واجهة القراءة التجريبية مع دعم RTL."},
      {id:"n2", title:"إضافة خاصية المفضلة", date:"2025-10-15", body:"يمكنك الآن حفظ السلاسل في المفضلة عبر التخزين المحلي."}
    ]
  };

  // قراءة البيانات: نحاول من localStorage (bs_data) أولاً
  function getData(){
    const d = store.get("bs_data", null);
    if (d && d.series && d.chapters){
      // حافظ على فرق/أخبار افتراضية إن لم تكن موجودة
      if (!d.teams) d.teams = fallback.teams;
      if (!d.news) d.news = fallback.news;
      return d;
    }
    return fallback;
  }

  const genresMaster = ["أكشن","إيسيكاي","مغامرات","رعب","زومبي","كوميديا","دراما","سحر","موريم","بقاء"];

  function renderCard(s){
    const g = (s.genres||[]).join("، ");
    return `
    <article class="card">
      <a href="series-detail.html?id=${encodeURIComponent(s.id)}">
        <div class="thumb"><img src="${s.cover}" alt="غلاف ${s.title}"></div>
        <div class="body">
          <h3>${s.title}</h3>
          <div class="meta">${g}</div>
        </div>
      </a>
    </article>`;
  }

  function paginate(arr, page=1, size=24){
    const start = (page-1)*size;
    return {items: arr.slice(start, start+size), total: arr.length, page, size, pages: Math.ceil(arr.length/size)};
  }

  function initAuthBadge(){
    const user = store.get("bs_user", null);
    const badge = document.getElementById("userBadge");
    const login = document.getElementById("loginLink");
    const reg = document.getElementById("registerLink");
    if (!badge || !login || !reg) return;
    if (user){
      badge.textContent = user.email;
      badge.classList.remove("hidden");
      login.style.display = "none";
      reg.style.display = "none";
    }
  }

  return {
    initHome(){
      initAuthBadge();
      const data = getData();
      const latest = document.getElementById("latestGrid");
      const popular = document.getElementById("popularGrid");
      if(latest) latest.innerHTML = data.series.map(renderCard).join("");
      if(popular) popular.innerHTML = [...data.series].reverse().map(renderCard).join("");
    },
    initSeries(){
      initAuthBadge();
      const data = getData();
      const genreSel = document.getElementById("genre");
      if (genreSel){
        const uniqueGenres = Array.from(new Set(data.series.flatMap(s=>s.genres||[]).concat(genresMaster)));
        genreSel.innerHTML = `<option value="">النوع</option>` + uniqueGenres.map(g => `<option value="${g}">${g}</option>`).join("");
      }
      const grid = document.getElementById("seriesGrid");
      const pager = document.getElementById("pager");
      const q = document.getElementById("q");
      const gSel = document.getElementById("genre");
      const sSel = document.getElementById("status");
      const lSel = document.getElementById("lang");

      function apply(page=1){
        let arr = [...data.series];
        const term = (q.value||"").trim();
        if (term) arr = arr.filter(x => (x.title||"").includes(term));
        const g = gSel.value; if (g) arr = arr.filter(x => (x.genres||[]).includes(g));
        const st = sSel.value; if (st) arr = arr.filter(x => x.status===st);
        const ln = lSel.value; if (ln) arr = arr.filter(x => x.lang===ln);

        const pg = paginate(arr, page, 18);
        grid.innerHTML = pg.items.map(renderCard).join("") || `<p class="muted">لا توجد نتائج.</p>`;
        pager.innerHTML = Array.from({length:Math.max(pg.pages,1)}, (_,i)=>`<button ${i+1===pg.page?'disabled':''} data-p="${i+1}">${i+1}</button>`).join("");
        pager.querySelectorAll("button").forEach(b => b.addEventListener("click", () => apply(parseInt(b.dataset.p))));
      }

      document.getElementById("apply").addEventListener("click", ()=>apply(1));
      document.getElementById("reset").addEventListener("click", ()=>{ q.value=""; gSel.value=""; sSel.value=""; lSel.value=""; apply(1); });
      apply(1);
    },
    initSeriesDetail(){
      initAuthBadge();
      const data = getData();
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      const s = data.series.find(x=>x.id===id) || data.series[0];
      document.title = `Brown Scan - ${s.title}`;
      document.getElementById("pageTitle").textContent = document.title;
      document.getElementById("cover").src = s.cover;
      document.getElementById("title").textContent = s.title;
      document.getElementById("genres").textContent = (s.genres||[]).join("، ");
      document.getElementById("stat").textContent = s.status==="ongoing"?"مستمرة":(s.status==="completed"?"مكتملة":"متوقفة");
      document.getElementById("lng").textContent = s.lang==="kr"?"مانهوا كورية":(s.lang==="cn"?"مانها صينية":"مانجا يابانية");
      document.getElementById("desc").textContent = s.desc||"";

      const list = document.getElementById("chapList");
      const arr = (data.chapters[id]||[]).slice().sort((a,b)=>b.num-a.num);
      list.innerHTML = arr.map(c => `<li><a href="reader.html?sid=${encodeURIComponent(id)}&c=${c.num}">الفصل ${c.num}</a></li>`).join("") || `<p class="muted">لم تُضف فصول بعد.</p>`;

      const favBtn = document.getElementById("favBtn");
      favBtn.addEventListener("click", ()=>{
        const favs = store.get("bs_favs", []);
        if (!favs.includes(id)) favs.push(id);
        store.set("bs_favs", favs);
        favBtn.textContent = "تمت الإضافة للمفضلة";
      });

      const first = arr.length ? arr[arr.length-1].num : 1;
      document.getElementById("readBtn").href = `reader.html?sid=${encodeURIComponent(id)}&c=${first}`;
    },
    initReader(){
      initAuthBadge();
      const data = getData();
      const p = new URLSearchParams(location.search);
      const sid = p.get("sid");
      let cnum = parseInt(p.get("c")||"1");
      const s = data.series.find(x=>x.id===sid) || data.series[0];
      document.getElementById("seriesLink").href = `series-detail.html?id=${encodeURIComponent(s.id)}`;

      const chapArr = (data.chapters[sid]||[]).slice().sort((a,b)=>a.num-b.num);
      const select = document.getElementById("chapterSelect");
      select.innerHTML = chapArr.map(c => `<option value="${c.num}">الفصل ${c.num}</option>`).join("");
      select.value = cnum;

      function loadChapter(num){
        const c = chapArr.find(x=>x.num===num) || chapArr[0];
        cnum = c.num;
        select.value = cnum;
        const pages = document.getElementById("pages");
        pages.innerHTML = c.pages.map(src => `<img loading="lazy" src="${src}" alt="صفحة">`).join("");
        store.set("bs_progress_"+sid, {chapter:cnum, page:1, ts:Date.now()});
        history.replaceState(null,"",`reader.html?sid=${encodeURIComponent(sid)}&c=${cnum}`);
        window.scrollTo({top:0, behavior:"smooth"});
      }
      loadChapter(cnum);

      document.getElementById("prevChap").addEventListener("click", (e)=>{ e.preventDefault(); const idx = chapArr.findIndex(x=>x.num===cnum); if (idx>0) loadChapter(chapArr[idx-1].num); });
      document.getElementById("nextChap").addEventListener("click", (e)=>{ e.preventDefault(); const idx = chapArr.findIndex(x=>x.num===cnum); if (idx<chapArr.length-1) loadChapter(chapArr[idx+1].num); });
      select.addEventListener("change", ()=> loadChapter(parseInt(select.value)));
    },
    initLogin(){
      const form = document.getElementById("loginForm");
      form.addEventListener("submit", (e)=>{
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const pass = document.getElementById("password").value;
        const remember = document.getElementById("remember").checked;
        const users = store.get("bs_users", []);
        const ok = users.find(u => u.email===email && u.pass===pass);
        if (!ok){ alert("بيانات غير صحيحة."); return; }
        store.set("bs_user", {email, remember});
        location.href = "index.html";
      });
      const reset = document.getElementById("resetPass");
      if (reset){
        reset.addEventListener("click", (e)=>{
          e.preventDefault();
          alert("هذه نسخة ثابتة تجريبية، لا يوجد بريد لاستعادة كلمة المرور.");
        });
      }
    },
    initRegister(){
      const form = document.getElementById("regForm");
      form.addEventListener("submit", (e)=>{
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const user = document.getElementById("user").value.trim();
        const pass = document.getElementById("password").value;
        if(!email || !user || !pass){ alert("اكمل البيانات."); return; }
        const users = store.get("bs_users", []);
        if (users.find(u=>u.email===email)){ alert("الحساب موجود."); return; }
        users.push({email, user, pass});
        store.set("bs_users", users);
        alert("تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.");
        location.href = "login.html";
      });
    },
    initTeams(){
      initAuthBadge();
      const data = getData();
      const grid = document.getElementById("teamsGrid");
      if (!grid) return;
      grid.innerHTML = data.teams.map(t => `
        <article class="card team-card">
          <div class="thumb"><img src="${t.avatar}" alt="شعار ${t.name}"></div>
          <div class="body">
            <h3>${t.name}</h3>
            <p class="desc">${t.bio}</p>
            <p class="meta"><a href="#" aria-disabled="true">انضم للفريق</a></p>
          </div>
        </article>
      `).join("");
    },
    initNews(){
      initAuthBadge();
      const data = getData();
      const list = document.getElementById("newsList");
      if (!list) return;
      const items = (data.news||[]).slice().sort((a,b)=> new Date(b.date) - new Date(a.date))
        .map(n => `
          <article class="card"><div class="body">
            <h3>${n.title}</h3>
            <p class="meta">${n.date}</p>
            <p class="desc">${n.body}</p>
          </div></article>
        `).join("");
      list.innerHTML = items || `<p class="muted">لا توجد أخبار حالياً.</p>`;
    }
  };
})();
