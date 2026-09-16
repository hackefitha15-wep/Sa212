// ===== تعريف المنصات =====
// type: "image" = فحص تلقائي عبر صورة البروفايل (تجاوز CORS)
// type: "link"  = رابط مباشر للتحقق اليدوي (المتصفح لا يستطيع فحصه)
const platforms = [
  {name:"GitHub",     type:"image", probe:u=>`https://github.com/${u}.png`,
   url:u=>`https://github.com/${u}`},
  {name:"Instagram",  type:"image", probe:u=>`https://www.instagram.com/${u}/picture/`,
   url:u=>`https://www.instagram.com/${u}/`},
  {name:"TikTok",     type:"link",  url:u=>`https://www.tiktok.com/@${u}`},
  {name:"Twitter / X",type:"link",  url:u=>`https://x.com/${u}`},
  {name:"Telegram",   type:"image", probe:u=>`https://t.me/i/userpic/320/${u}.jpg`,
   url:u=>`https://t.me/${u}`},
  {name:"Reddit",     type:"link",  url:u=>`https://www.reddit.com/user/${u}/`},
  {name:"YouTube",    type:"link",  url:u=>`https://www.youtube.com/@${u}`},
  {name:"Pinterest",  type:"image", probe:u=>`https://pinterest.com/${u}.jpg`,
   url:u=>`https://pinterest.com/${u}/`},
  {name:"SoundCloud", type:"link",  url:u=>`https://soundcloud.com/${u}`},
  {name:"Spotify",    type:"link",  url:u=>`https://open.spotify.com/user/${u}`},
  {name:"Twitch",     type:"link",  url:u=>`https://www.twitch.tv/${u}`},
  {name:"Steam",      type:"link",  url:u=>`https://steamcommunity.com/id/${u}`},
  {name:"Discord",    type:"link",  url:u=>`https://discord.com/users/`},
  {name:"Medium",     type:"link",  url:u=>`https://medium.com/@${u}`},
  {name:"DeviantArt", type:"link",  url:u=>`https://www.deviantart.com/${u}`},
  {name:"Behance",    type:"link",  url:u=>`https://www.behance.net/${u}`},
  {name:"Flickr",     type:"link",  url:u=>`https://www.flickr.com/people/${u}`},
  {name:"Vimeo",      type:"link",  url:u=>`https://vimeo.com/${u}`},
  {name:"Tumblr",     type:"image", probe:u=>`https://api.tumblr.com/v2/blog/${u}.tumblr.com/avatar`,
   url:u=>`https://${u}.tumblr.com`},
  {name:"WordPress",  type:"link",  url:u=>`https://${u}.wordpress.com`},
  {name:"Blogger",    type:"link",  url:u=>`https://${u}.blogspot.com`},
  {name:"Snapchat",   type:"link",  url:u=>`https://www.snapchat.com/add/${u}`},
  {name:"Threads",    type:"link",  url:u=>`https://www.threads.net/@${u}`},
  {name:"Facebook",   type:"link",  url:u=>`https://www.facebook.com/${u}`},
  {name:"LinkedIn",   type:"link",  url:u=>`https://www.linkedin.com/in/${u}`},
  {name:"GitLab",     type:"link",  url:u=>`https://gitlab.com/${u}`},
  {name:"Bitbucket",  type:"link",  url:u=>`https://bitbucket.org/${u}/`},
  {name:"npm",        type:"link",  url:u=>`https://www.npmjs.com/~${u}`},
  {name:"PyPI",       type:"link",  url:u=>`https://pypi.org/user/${u}/`},
  {name:"Docker Hub", type:"link",  url:u=>`https://hub.docker.com/u/${u}`},
  {name:"Roblox",     type:"link",  url:u=>`https://www.roblox.com/search/users?keyword=${u}`},
  {name:"Chess.com",  type:"link",  url:u=>`https://www.chess.com/member/${u}`},
  {name:"Last.fm",    type:"link",  url:u=>`https://www.last.fm/user/${u}`},
  {name:"Letterboxd", type:"link",  url:u=>`https://letterboxd.com/${u}/`},
  {name:"Goodreads",  type:"link",  url:u=>`https://www.goodreads.com/${u}`},
  {name:"Kick",       type:"link",  url:u=>`https://kick.com/${u}`},
  {name:"Rumble",     type:"link",  url:u=>`https://rumble.com/user/${u}`},
  {name:"Odysee",     type:"link",  url:u=>`https://odysee.com/@${u}`},
];

// ===== فحص تلقائي عبر صورة البروفايل =====
function probeImage(url, timeout = 7000){
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => { img.src=""; resolve(null); }, timeout);
    img.onload  = () => { clearTimeout(timer); resolve(true);  };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

// ===== الفحص الرئيسي =====
let scanning = false;

async function scan(){
  if(scanning) return;
  const user = document.getElementById("user").value.trim().replace(/^@/,"");
  if(!user){ alert("اكتب اسم المستخدم أولاً"); return; }
  if(!/^[a-zA-Z0-9._-]+$/.test(user)){ alert("اسم مستخدم غير صالح"); return; }

  scanning = true;
  const btn = document.getElementById("btn");
  btn.disabled = true; btn.textContent = "جاري الفحص...";
  const box = document.getElementById("results");
  const stats = document.getElementById("stats");
  const bar = document.getElementById("progressBar");
  const fill = document.getElementById("progressFill");
  box.innerHTML = ""; bar.style.display = "block"; fill.style.width = "0%";

  let done = 0, foundCount = 0;
  const total = platforms.length;

  // فحص متوازٍ بمجموعات (batch) حتى لا يُحجب المتصفح
  const BATCH = 6;
  for(let i = 0; i < platforms.length; i += BATCH){
    const batch = platforms.slice(i, i + BATCH);
    await Promise.all(batch.map(async p => {
      let found = null; // null = غير مؤكد
      if(p.type === "image"){
        found = await probeImage(p.probe(user));
      }
      done++;
      fill.style.width = (done/total*100) + "%";
      render(p, user, found, box);
      if(found === true) foundCount++;
      updateStats(stats, foundCount, done, total);
    }));
    await new Promise(r => setTimeout(r, 150)); // مهلة صغيرة بين الدفعات
  }

  bar.style.display = "none";
  btn.disabled = false; btn.textContent = "فحص الآن";
  scanning = false;
}

function render(p, user, found, box){
  const div = document.createElement("div");
  let status, cls;
  if(found === true){ status = "✅ موجود"; cls = "found"; }
  else if(found === false){ status = "❌ غير موجود"; cls = "notfound"; }
  else { status = "🔗 تحقق يدوياً"; cls = ""; }

  div.className = `result ${cls}`;
  div.innerHTML = `
    <div><span class="name">${p.name}</span> <span class="status">${status}</span></div>
    <a href="${p.url(user)}" target="_blank" rel="noopener">${p.url(user)}</a>`;
  box.appendChild(div);
}

function updateStats(stats, foundCount, done, total){
  stats.innerHTML = `تم فحص ${done}/${total} — <b>${foundCount}</b> حساب مؤكد`;
}
