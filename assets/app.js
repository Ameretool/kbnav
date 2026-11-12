const storage = {
    set: (k, v) => { try { localStorage.setItem(k, v); } catch(e){}; document.cookie = `${k}=${encodeURIComponent(v)}; max-age=31536000; path=/; SameSite=Lax`; },
    get: (k) => {
        let v = null; try { v = localStorage.getItem(k); } catch(e){}
        if (!v) { const m = document.cookie.match(new RegExp('(^| )' + k + '=([^;]+)')); if (m) v = decodeURIComponent(m[2]); }
        return v;
    },
    remove: (k) => { try { localStorage.removeItem(k); } catch(e){}; document.cookie = `${k}=; max-age=-1; path=/`; },
    clear: () => {
        try { localStorage.clear(); } catch(e){}
        document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    }
};

const engines = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🌐' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🅱️' },
    { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: '🐾' }
];
let currentEngine = engines[0];
const $ = id => document.getElementById(id);

const presetCategories = [
    { cat: "AI 工具", bar: "border-l-blue-500", bg: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", sites: [{n:"ChatGPT",u:"https://chatgpt.com"},{n:"Claude",u:"https://claude.ai"},{n:"Gemini",u:"https://gemini.google.com"}] },
    { cat: "开发社区", bar: "border-l-green-500", bg: "linear-gradient(135deg, #1e3c2c 0%, #2d6a4f 100%)", sites: [{n:"GitHub",u:"https://github.com"},{n:"Cloudflare",u:"https://dash.cloudflare.com"},{n:"Vercel",u:"https://vercel.com"}] },
    { cat: "设计灵感", bar: "border-l-red-500", bg: "linear-gradient(135deg, #3b1c1c 0%, #6b2d2d 100%)", sites: [{n:"Figma",u:"https://figma.com"},{n:"Dribbble",u:"https://dribbble.com"},{n:"Behance",u:"https://behance.net"}] },
    { cat: "影音视听", bar: "border-l-yellow-500", bg: "linear-gradient(135deg, #3a2e10 0%, #665214 100%)", sites: [{n:"YouTube",u:"https://youtube.com"},{n:"Bilibili",u:"https://bilibili.com"},{n:"Netflix",u:"https://netflix.com"}] },
    { cat: "社交资讯", bar: "border-l-cyan-500", bg: "linear-gradient(135deg, #103a3a 0%, #146666 100%)", sites: [{n:"Twitter",u:"https://x.com"},{n:"Reddit",u:"https://reddit.com"},{n:"知乎",u:"https://zhihu.com"}] },
    { cat: "次要灰", bar: "border-l-gray-500", bg: "linear-gradient(135deg, #2b2b2b 0%, #4a4a4a 100%)", sites: [{n:"Notion",u:"https://notion.so"},{n:"语雀",u:"https://yuque.com"},{n:"Flomo",u:"https://flomoapp.com"}] },
    { cat: "深色黑", bar: "border-l-black", bg: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)", sites: [{n:"Wikipedia",u:"https://wikipedia.org"},{n:"Medium",u:"https://medium.com"},{n:"少数派",u:"https://sspai.com"}] },
    { cat: "扩展紫", bar: "border-l-purple-500", bg: "linear-gradient(135deg, #2e103a 0%, #4b1466 100%)", sites: [{n:"Midjourney",u:"https://midjourney.com"},{n:"Perplexity",u:"https://perplexity.ai"},{n:"Kimi",u:"https://kimi.moonshot.cn"}] },
    { cat: "扩展粉", bar: "border-l-pink-500", bg: "linear-gradient(135deg, #3a102c 0%, #66144f 100%)", sites: [{n:"小红书",u:"https://xiaohongshu.com"},{n:"微博",u:"https://weibo.com"},{n:"Instagram",u:"https://instagram.com"}] },
    { cat: "扩展橙", bar: "border-l-orange-500", bg: "linear-gradient(135deg, #3a2210 0%, #663c14 100%)", sites: [{n:"淘宝",u:"https://taobao.com"},{n:"京东",u:"https://jd.com"},{n:"Amazon",u:"https://amazon.com"}] }
];

let currentLayout = storage.get('layout') || 'grid'; 
let apps = [{ name: 'GitHub', url: 'https://github.com' }, { name: 'YouTube', url: 'https://youtube.com' }, { name: 'Bilibili', url: 'https://bilibili.com' }];
try { const s = storage.get('myApps'); if(s) apps = JSON.parse(s); } catch(e) {}

function updateClock() {
    const now = new Date();
    $('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    $('date-text').textContent = now.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

function getDomain(url) { try { return new URL(url).hostname; } catch (e) { return ''; } }

function getIcon(url, size="w-8 h-8", textSize="text-xs") {
    const domain = getDomain(url);
    const img1 = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const letter = url.replace(/^https?:\/\//, '').charAt(0).toUpperCase();
    return `<div class="${size} icon-box rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm border border-black/5 dark:border-white/10"><img src="${img1}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'font-bold text-gray-800 ${textSize}\\'>${letter}</span>';"></div>`;
}

function renderApps() {
    const grid = $('app-grid');
    grid.className = currentLayout === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6" : currentLayout === 'banner' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3";
    grid.innerHTML = '';
    
    apps.forEach((app, index) => {
        const card = document.createElement('div');
        card.onclick = () => window.open(app.url, '_blank');
        if (currentLayout === 'grid') {
            card.className = "flex flex-col items-center justify-center gap-2 cursor-pointer group relative p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition";
            card.innerHTML = `${getIcon(app.url, "w-12 h-12 md:w-14 md:h-14", "text-lg")}<span class="text-xs font-medium text-center w-full truncate opacity-90">${app.name}</span><button class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-md text-[10px] delete-btn shadow-sm" data-index="${index}">✕</button>`;
        } else if (currentLayout === 'banner') {
            card.className = "glass rounded-xl p-3 flex items-center gap-3 cursor-pointer group relative hover:-translate-y-1 hover:shadow-xl transition-all";
            card.innerHTML = `${getIcon(app.url, "w-8 h-8", "text-sm")}<span class="font-medium text-sm truncate flex-1">${app.name}</span><button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500 text-white rounded text-[10px] delete-btn" data-index="${index}">✕</button>`;
        } else {
            card.className = "glass rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer group relative hover:-translate-y-1 hover:shadow-xl hover:bg-white/80 dark:hover:bg-black/80 transition-all";
            card.innerHTML = `${getIcon(app.url, "w-6 h-6", "text-xs")}<span class="font-medium text-sm flex-1 truncate">${app.name}</span><button class="opacity-0 group-hover:opacity-100 p-1 text-red-500 font-bold transition-opacity delete-btn" data-index="${index}">✕</button>`;
        }
        grid.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); apps.splice(parseInt(btn.getAttribute('data-index')), 1); saveApps(); }
    });
    document.querySelectorAll('.layout-btn').forEach(b => {
        if(b.dataset.layout === currentLayout) { b.classList.add('bg-primary', 'text-white'); b.classList.remove('bg-black/10'); }
        else { b.classList.remove('bg-primary', 'text-white'); b.classList.add('bg-black/10'); }
    });
}
function saveApps() { storage.set('myApps', JSON.stringify(apps)); renderApps(); }

function renderAccordionPresets() {
    const container = $('accordion-container');
    container.innerHTML = '';
    
    // 1. 渲染 10 个预设面板
    presetCategories.forEach((cat, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = "mb-2";
        const unadded = cat.sites.filter(site => !apps.some(a => a.url.includes(getDomain(site.u))));
        wrapper.innerHTML = `
            <button class="w-full flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-black/40 border-l-4 ${cat.bar} shadow-sm hover:bg-white/80 dark:hover:bg-black/60 transition-all" data-target="cat-${idx}" data-bg="${cat.bg}">
                <span class="font-bold text-sm tracking-wide text-gray-800 dark:text-gray-200">${cat.cat}</span>
                <div class="flex items-center gap-2">
                    <span class="text-xs opacity-50 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">${unadded.length}</span>
                    <svg class="w-4 h-4 transform transition-transform opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            <div id="cat-${idx}" class="accordion-content px-2">
                <div class="flex flex-wrap gap-2 pt-3 pb-2">
                    ${cat.sites.map(site => {
                        const isAdded = apps.some(a => a.url.includes(getDomain(site.u)));
                        return `<button class="px-3 py-1.5 rounded-lg text-xs font-medium border transition ${isAdded ? 'opacity-40 cursor-not-allowed border-gray-500 bg-transparent' : 'bg-white/50 dark:bg-white/10 border-gray-300 dark:border-white/20 hover:scale-105 cursor-pointer shadow-sm'}" ${isAdded ? 'disabled' : `onclick="addPresetSite(this, '${site.n}', '${site.u}')"`}>${site.n}</button>`;
                    }).join('')}
                </div>
            </div>`;
        container.appendChild(wrapper);
    });

    // 2. 🌟 渲染第 11 个面板：自定义添加
    const customWrapper = document.createElement('div');
    customWrapper.className = "mb-4";
    customWrapper.innerHTML = `
        <button class="w-full flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-black/40 border-l-4 border-l-indigo-500 shadow-sm hover:bg-white/80 dark:hover:bg-black/60 transition-all" data-target="cat-custom" data-bg="linear-gradient(135deg, #1e1e2f 0%, #4a1c40 100%)">
            <span class="font-bold text-sm tracking-wide text-indigo-600 dark:text-indigo-400">+ 自定义添加</span>
            <svg class="w-4 h-4 transform transition-transform opacity-50 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <div id="cat-custom" class="accordion-content px-2">
            <div class="flex flex-col gap-3 pt-3 pb-2">
                <input type="text" id="app-name" placeholder="名称 (例如：GitHub)" class="w-full bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2.5 outline-none text-sm border border-transparent focus:border-primary">
                <input type="url" id="app-url" placeholder="网址 (https://...)" class="w-full bg-black/10 dark:bg-white/10 rounded-lg px-3 py-2.5 outline-none text-sm border border-transparent focus:border-primary">
                <button id="modal-save" class="w-full py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 text-sm font-medium shadow-lg">保存链接</button>
            </div>
        </div>`;
    container.appendChild(customWrapper);

    // 3. 绑定事件
    container.querySelectorAll('button[data-target]').forEach(btn => {
        btn.onclick = () => {
            const target = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector('svg');
            if(target.classList.contains('open')){
                target.classList.remove('open'); icon.style.transform = 'rotate(0deg)';
            } else {
                container.querySelectorAll('.accordion-content').forEach(el => el.classList.remove('open'));
                container.querySelectorAll('button[data-target] svg').forEach(el => el.style.transform = 'rotate(0deg)');
                target.classList.add('open'); icon.style.transform = 'rotate(180deg)';
                if(btn.dataset.bg) document.body.style.background = btn.dataset.bg;
            }
        };
    });

    // 4. 自定义保存
    $('modal-save').onclick = () => {
        const name = $('app-name').value.trim(); let url = $('app-url').value.trim();
        if (!name || !url) return alert('请填写完整信息');
        if (!url.startsWith('http')) url = 'https://' + url;
        apps.push({ name, url }); saveApps(); 
        $('app-name').value = ''; $('app-url').value = ''; 
        document.getElementById('cat-custom').classList.remove('open'); 
        document.querySelector('button[data-target="cat-custom"] svg').style.transform = 'rotate(0deg)';
        applyBackground(); 
    };
}

window.addPresetSite = function(btn, name, url) {
    apps.push({ name, url }); saveApps();
    btn.classList.add('animate-pop'); btn.style.opacity = '0.4'; btn.style.pointerEvents = 'none'; btn.innerHTML = '✔ Added';
    setTimeout(() => { renderAccordionPresets(); }, 800);
};

$('add-app-btn').onclick = () => { renderAccordionPresets(); $('modal').classList.replace('hidden', 'flex'); };
$('modal-close-x').onclick = () => { $('modal').classList.replace('flex', 'hidden'); applyBackground(); };
$('settings-btn').onclick = () => $('settings-panel').classList.toggle('hidden');
document.addEventListener('click', e => {
    const panel = $('settings-panel'), btn = $('settings-btn');
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && !btn.contains(e.target)) panel.classList.add('hidden');
});
document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.onclick = () => { currentLayout = btn.dataset.layout; storage.set('layout', currentLayout); renderApps(); };
});
$('toggle-theme').onclick = () => { document.documentElement.classList.toggle('dark'); storage.set('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); };
if (storage.get('theme') === 'light') document.documentElement.classList.remove('dark');

function applyBackground() {
    let img = null; try { img = localStorage.getItem('bgImg'); } catch(e){}
    const color = storage.get('bgColor');
    if (img) { document.body.style.background = `url('${img}') center/cover fixed`; }
    else { document.body.style.background = color || 'linear-gradient(135deg, #1e1e2f 0%, #4a1c40 100%)'; }
}
$('bg-upload').addEventListener('change', e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader(); 
    reader.onload = ev => { try { localStorage.setItem('bgImg', ev.target.result); } catch(err) { alert('图片太大'); } applyBackground(); }; 
    reader.readAsDataURL(file);
});
$('reset-btn').onclick = () => { if(confirm('确定清空所有数据吗？')) { storage.clear(); location.reload(); } };

engines.forEach(eng => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left px-4 py-3 hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 text-sm";
    btn.innerHTML = `<span>${eng.icon}</span> ${eng.name}`;
    btn.onclick = () => { currentEngine = eng; $('current-engine-icon').textContent = eng.icon; };
    $('engine-dropdown').appendChild(btn);
});
function doSearch() { const kw = $('search-input').value.trim(); if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank'); }
$('search-btn').onclick = doSearch;
$('search-input').addEventListener('keypress', e => { if(e.key === 'Enter') doSearch(); });

applyBackground(); renderApps();
