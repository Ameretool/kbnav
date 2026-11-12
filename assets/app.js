const storage = {
    set: (k, v) => { try { localStorage.setItem(k, v); } catch(e){}; document.cookie = `${k}=${encodeURIComponent(v)}; max-age=31536000; path=/; SameSite=Lax`; },
    get: (k) => {
        let v = null; try { v = localStorage.getItem(k); } catch(e){}
        if (!v) { const m = document.cookie.match(new RegExp('(^| )' + k + '=([^;]+)')); if (m) v = decodeURIComponent(m[2]); }
        return v;
    },
    remove: (k) => { try { localStorage.removeItem(k); } catch(e){}; document.cookie = `${k}=; max-age=-1; path=/`; },
    clear: () => { try { localStorage.clear(); } catch(e){} document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); }
};

const engines = [
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: '🌐' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🅱️' },
    { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: '🐾' }
];
let currentEngine = engines[0];
const $ = id => document.getElementById(id);

const presetCategories = [
    { cat: "AI 工具", bar: "border-l-blue-500", sites: [{n:"ChatGPT",u:"https://chatgpt.com"},{n:"Claude",u:"https://claude.ai"},{n:"Gemini",u:"https://gemini.google.com"}] },
    { cat: "开发社区", bar: "border-l-green-500", sites: [{n:"GitHub",u:"https://github.com"},{n:"Cloudflare",u:"https://dash.cloudflare.com"},{n:"Vercel",u:"https://vercel.com"}] },
    { cat: "设计灵感", bar: "border-l-red-500", sites: [{n:"Figma",u:"https://figma.com"},{n:"Dribbble",u:"https://dribbble.com"},{n:"Behance",u:"https://behance.net"}] },
    { cat: "文档笔记", bar: "border-l-purple-500", sites: [{n:"Notion",u:"https://notion.so"},{n:"语雀",u:"https://yuque.com"},{n:"Flomo",u:"https://flomoapp.com"}] },
    { cat: "影音视听", bar: "border-l-orange-500", sites: [{n:"YouTube",u:"https://youtube.com"},{n:"Bilibili",u:"https://bilibili.com"},{n:"Netflix",u:"https://netflix.com"}] },
    { cat: "社交资讯", bar: "border-l-cyan-500", sites: [{n:"Twitter",u:"https://x.com"},{n:"Reddit",u:"https://reddit.com"},{n:"知乎",u:"https://zhihu.com"}] },
    { cat: "购物电商", bar: "border-l-yellow-500", sites: [{n:"淘宝",u:"https://taobao.com"},{n:"京东",u:"https://jd.com"},{n:"Amazon",u:"https://amazon.com"}] },
    { cat: "阅读资讯", bar: "border-l-indigo-500", sites: [{n:"Wikipedia",u:"https://wikipedia.org"},{n:"Medium",u:"https://medium.com"},{n:"少数派",u:"https://sspai.com"}] },
    { cat: "效率工具", bar: "border-l-teal-500", sites: [{n:"Speedtest",u:"https://speedtest.net"},{n:"草料二维码",u:"https://cli.im"},{n:"TinyPNG",u:"https://tinypng.com"}] },
    { cat: "游戏娱乐", bar: "border-l-rose-500", sites: [{n:"Steam",u:"https://store.steampowered.com"},{n:"Epic",u:"https://epicgames.com"},{n:"Twitch",u:"https://twitch.tv"}] }
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

// 重写图标获取，去掉边框，直接把尺寸放大
function getIcon(url, size="w-12 h-12 md:w-16 md:h-16", textSize="text-xl") {
    const domain = getDomain(url);
    const img1 = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const letter = url.replace(/^https?:\/\//, '').charAt(0).toUpperCase();
    // 移除了 border，图标如果是透明底直接透出背景
    return `<div class="${size} icon-box flex-shrink-0 flex items-center justify-center">
                <img src="${img1}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'font-bold text-gray-500 ${textSize}\\'>${letter}</span>';">
            </div>`;
}

function renderApps() {
    const grid = $('app-grid');
    grid.className = currentLayout === 'grid' ? "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6" : 
                   currentLayout === 'banner' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : 
                   "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";
    grid.innerHTML = '';
    
    apps.forEach((app, index) => {
        const card = document.createElement('div');
        card.onclick = () => window.open(app.url, '_blank');
        
        // 🌟 核心修改：无边框，背景透明，悬浮时才显示毛玻璃底色
        const hoverEffect = "hover:bg-gray-200/50 dark:hover:bg-[#21262d]/80";
        
        if (currentLayout === 'grid') {
            // 图二风格的 Grid：纯图标 + 小字，无框
            card.className = `flex flex-col items-center justify-center gap-2 cursor-pointer group relative p-2 rounded-2xl transition-all duration-300 ${hoverEffect}`;
            card.innerHTML = `
                ${getIcon(app.url)}
                <span class="text-[12px] md:text-[13px] font-medium text-gray-600 dark:text-gray-400 text-center w-full truncate">${app.name}</span>
                <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500 text-white rounded-md text-[10px] delete-btn shadow-sm" data-index="${index}">✕</button>`;
        } else if (currentLayout === 'banner') {
            // Banner：水平排列
            card.className = `flex items-center gap-3 cursor-pointer group relative p-3 rounded-xl transition-all duration-300 ${hoverEffect}`;
            card.innerHTML = `
                ${getIcon(app.url, "w-10 h-10", "text-base")}
                <span class="font-medium text-sm truncate flex-1 text-gray-700 dark:text-gray-300">${app.name}</span>
                <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500 text-white rounded text-[10px] delete-btn" data-index="${index}">✕</button>`;
        } else {
            // Pill：胶囊
            card.className = `flex items-center gap-3 cursor-pointer group relative px-4 py-2 rounded-full transition-all duration-300 ${hoverEffect}`;
            card.innerHTML = `
                ${getIcon(app.url, "w-8 h-8", "text-sm")}
                <span class="font-medium text-sm flex-1 truncate text-gray-700 dark:text-gray-300">${app.name}</span>
                <button class="opacity-0 group-hover:opacity-100 p-1 text-red-500 font-bold transition-opacity delete-btn" data-index="${index}">✕</button>`;
        }
        grid.appendChild(card);
    });
    
    // 删除按钮绑定
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); apps.splice(parseInt(btn.getAttribute('data-index')), 1); saveApps(); }
    });
    
    // 布局按钮高亮
    document.querySelectorAll('.layout-btn').forEach(b => {
        if(b.dataset.layout === currentLayout) { b.classList.add('bg-[#2ea043]', 'text-white'); b.classList.remove('bg-gray-100', 'dark:bg-[#21262d]'); }
        else { b.classList.remove('bg-[#2ea043]', 'text-white'); b.classList.add('bg-gray-100', 'dark:bg-[#21262d]'); }
    });
}
function saveApps() { storage.set('myApps', JSON.stringify(apps)); renderApps(); }

// 折叠面板渲染 (保持不变)
function renderAccordionPresets() {
    const container = $('accordion-container');
    container.innerHTML = '';
    presetCategories.forEach((cat, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = "mb-2";
        const unadded = cat.sites.filter(site => !apps.some(a => a.url.includes(getDomain(site.u))));
        wrapper.innerHTML = `
            <button class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] border-l-4 ${cat.bar} rounded-lg shadow-sm hover:brightness-95 dark:hover:bg-[#30363d] transition-all" data-target="cat-${idx}">
                <span class="font-bold text-sm tracking-wide text-gray-800 dark:text-gray-200">${cat.cat}</span>
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span class="text-xs opacity-70 bg-white dark:bg-[#161b22] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#30363d]">${unadded.length}</span>
                    <svg class="w-4 h-4 transform transition-transform opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            <div id="cat-${idx}" class="accordion-content px-2">
                <div class="flex flex-wrap gap-2 pt-3 pb-2">
                    ${cat.sites.map(site => {
                        const isAdded = apps.some(a => a.url.includes(getDomain(site.u)));
                        return `<button class="px-3 py-1.5 rounded-lg text-xs font-medium border transition ${isAdded ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-[#30363d] bg-transparent text-gray-500' : 'bg-white dark:bg-[#161b22] border-gray-300 dark:border-[#30363d] text-gray-700 dark:text-gray-300 hover:border-[#2ea043] hover:text-[#2ea043] cursor-pointer shadow-sm'}" ${isAdded ? 'disabled' : `onclick="addPresetSite(this, '${site.n}', '${site.u}')"`}>${site.n}</button>`;
                    }).join('')}
                </div>
            </div>`;
        container.appendChild(wrapper);
    });

    const customWrapper = document.createElement('div');
    customWrapper.className = "mb-4";
    customWrapper.innerHTML = `
        <button class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] border-l-4 border-l-indigo-500 rounded-lg shadow-sm hover:brightness-95 dark:hover:bg-[#30363d] transition-all" data-target="cat-custom">
            <span class="font-bold text-sm tracking-wide text-indigo-700 dark:text-indigo-400">+ 自定义添加</span>
            <svg class="w-4 h-4 transform transition-transform opacity-50 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <div id="cat-custom" class="accordion-content px-2">
            <div class="flex flex-col gap-3 pt-3 pb-2">
                <input type="text" id="app-name" placeholder="名称 (例如：GitHub)" class="custom-input w-full rounded-lg px-3 py-2.5 outline-none text-sm transition">
                <input type="url" id="app-url" placeholder="网址 (https://...)" class="custom-input w-full rounded-lg px-3 py-2.5 outline-none text-sm transition">
                <button id="modal-save" class="w-full py-2.5 bg-[#2ea043] text-white rounded-xl hover:bg-[#238636] text-sm font-medium shadow-sm transition">保存链接</button>
            </div>
        </div>`;
    container.appendChild(customWrapper);

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
            }
        };
    });

    $('modal-save').onclick = () => {
        const name = $('app-name').value.trim(); let url = $('app-url').value.trim();
        if (!name || !url) return alert('请填写完整信息');
        if (!url.startsWith('http')) url = 'https://' + url;
        apps.push({ name, url }); saveApps(); 
        $('app-name').value = ''; $('app-url').value = ''; 
        document.getElementById('cat-custom').classList.remove('open'); 
        document.querySelector('button[data-target="cat-custom"] svg').style.transform = 'rotate(0deg)';
    };
}

window.addPresetSite = function(btn, name, url) {
    apps.push({ name, url }); saveApps();
    btn.classList.add('animate-pop'); btn.style.opacity = '0.4'; btn.style.pointerEvents = 'none'; btn.innerHTML = '✔ Added';
    setTimeout(() => { renderAccordionPresets(); }, 800);
};

$('add-app-btn').onclick = () => { renderAccordionPresets(); $('modal').classList.replace('hidden', 'flex'); };
$('modal-close-x').onclick = () => { $('modal').classList.replace('flex', 'hidden'); };
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
    if (img) { document.body.style.background = `url('${img}') center/cover fixed`; }
    else { document.body.style.background = ''; }
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
    btn.className = "w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#30363d] flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200";
    btn.innerHTML = `<span>${eng.icon}</span> ${eng.name}`;
    btn.onclick = () => { currentEngine = eng; $('current-engine-icon').textContent = eng.icon; };
    $('engine-dropdown').appendChild(btn);
});
function doSearch() { const kw = $('search-input').value.trim(); if (kw) window.open(currentEngine.url + encodeURIComponent(kw), '_blank'); }
$('search-btn').onclick = doSearch;
$('search-input').addEventListener('keypress', e => { if(e.key === 'Enter') doSearch(); });

applyBackground(); 
renderApps();
