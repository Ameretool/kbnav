// ==========================================
// 1. 存储引擎
// ==========================================
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

// ==========================================
// 2. 核心配置 (10种颜色预设分类)
// ==========================================
const engines = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: '🌐' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: '🅱️' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: '🐾' }
];
let currentEngine = engines[0];
const $ = id => document.getElementById(id);

// 10种颜色分类面板 (含渐变色背景配置)
const presetCategories = [
    { cat: "AI 工具", color: "blue", bar: "border-l-blue-500", bg: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", sites: [{n:"ChatGPT",u:"https://chatgpt.com"},{n:"Claude",u:"https://claude.ai"},{n:"Gemini",u:"https://gemini.google.com"}] },
    { cat: "开发社区", color: "green", bar: "border-l-green-500", bg: "linear-gradient(135deg, #1e3c2c 0%, #2d6a4f 100%)", sites: [{n:"GitHub",u:"https://github.com"},{n:"Cloudflare",u:"https://dash.cloudflare.com"},{n:"Vercel",u:"https://vercel.com"}] },
    { cat: "设计灵感", color: "red", bar: "border-l-red-500", bg: "linear-gradient(135deg, #3b1c1c 0%, #6b2d2d 100%)", sites: [{n:"Figma",u:"https://figma.com"},{n:"Dribbble",u:"https://dribbble.com"},{n:"Behance",u:"https://behance.net"}] },
    { cat: "影音视听", color: "yellow", bar: "border-l-yellow-500", bg: "linear-gradient(135deg, #3a2e10 0%, #665214 100%)", sites: [{n:"YouTube",u:"https://youtube.com"},{n:"Bilibili",u:"https://bilibili.com"},{n:"Netflix",u:"https://netflix.com"}] },
    { cat: "社交资讯", color: "cyan", bar: "border-l-cyan-500", bg: "linear-gradient(135deg, #103a3a 0%, #146666 100%)", sites: [{n:"Twitter",u:"https://x.com"},{n:"Reddit",u:"https://reddit.com"},{n:"知乎",u:"https://zhihu.com"}] },
    { cat: "次要灰", color: "gray", bar: "border-l-gray-500", bg: "linear-gradient(135deg, #2b2b2b 0%, #4a4a4a 100%)", sites: [{n:"Notion",u:"https://notion.so"},{n:"语雀",u:"https://yuque.com"},{n:"Flomo",u:"https://flomoapp.com"}] },
    { cat: "深色黑", color: "black", bar: "border-l-black", bg: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)", sites: [{n:"Wikipedia",u:"https://wikipedia.org"},{n:"Medium",u:"https://medium.com"},{n:"少数派",u:"https://sspai.com"}] },
    { cat: "扩展紫", color: "purple", bar: "border-l-purple-500", bg: "linear-gradient(135deg, #2e103a 0%, #4b1466 100%)", sites: [{n:"Midjourney",u:"https://midjourney.com"},{n:"Perplexity",u:"https://perplexity.ai"},{n:"Kimi",u:"https://kimi.moonshot.cn"}] },
    { cat: "扩展粉", color: "pink", bar: "border-l-pink-500", bg: "linear-gradient(135deg, #3a102c 0%, #66144f 100%)", sites: [{n:"小红书",u:"https://xiaohongshu.com"},{n:"微博",u:"https://weibo.com"},{n:"Instagram",u:"https://instagram.com"}] },
    { cat: "扩展橙", color: "orange", bar: "border-l-orange-500", bg: "linear-gradient(135deg, #3a2210 0%, #663c14 100%)", sites: [{n:"淘宝",u:"https://taobao.com"},{n:"京东",u:"https://jd.com"},{n:"Amazon",u:"https://amazon.com"}] }
];

let currentLayout = storage.get('layout') || 'grid'; 
const defaultApps = [ { name: 'GitHub', url: 'https://github.com' }, { name: 'YouTube', url: 'https://youtube.com' }, { name: 'Bilibili', url: 'https://bilibili.com' } ];
let apps = defaultApps;
try { const s = storage.get('myApps'); if(s) apps = JSON.parse(s); } catch(e) {}

// ==========================================
// 3. 初始化
// ==========================================
function updateClock() {
    const now = new Date();
    $('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    $('date-text').textContent = now.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

function getDomain(url) { try { return new URL(url).hostname; } catch (e) { return ''; } }

function getIcon(url, size="w-8 h-8", textSize="text-xs") {
    const domain = getDomain(url);
    const img1 = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    const letter = url.replace(/^https?:\/\//, '').charAt(0).toUpperCase();
    return `<div class="${size} icon-box rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm border border-black/5 dark:border-white/10"><img src="${img1}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\\'font-bold text-gray-800 ${textSize}\\'>${letter}</span>';"></div>`;
}

// ==========================================
// 4. 渲染主页
// ==========================================
function renderApps() {
    const grid = $('app-grid');
    grid.className = currentLayout === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6" :
                   currentLayout === 'banner' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4" :
                   "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3";
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
        if(b.dataset.layout === currentLayout) { b.classList.add('bg-primary', 'text-white'); b.classList.remove('bg-black/10', 'dark:bg-white/10'); }
        else { b.classList.remove('bg-primary', 'text-white'); b.classList.add('bg-black/10', 'dark:bg-white/10'); }
    });
}

function saveApps() { storage.set('myApps', JSON.stringify(apps)); renderApps(); }

// ==========================================
// 5. 渲染 10色折叠面板 (并联动背景色)
// ==========================================
function renderAccordionPresets() {
    const container = $('accordion-container');
    container.innerHTML = '';
    
    presetCategories.forEach((cat, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = "mb-3";
        const unadded = cat.sites.filter(site => !apps.some(a => a.url.includes(getDomain(site.u))));

        // 图二图三风格的彩色折叠面板
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
                        // 标签背景色随分类颜色变化
                        return `<button 
                            class="px-3 py-1.5 rounded-lg text-xs font-medium border transition ${isAdded ? 'opacity-40 cursor-not-allowed border-gray-500 bg-transparent' : 'bg-white/50 dark:bg-white/10 border-gray-300 dark:border-white/20 hover:scale-105 cursor-pointer shadow-sm'}"
                            ${isAdded ? 'disabled' : `onclick="addPresetSite(this, '${site.n}', '${site.u}')"`}
                        >${site.n}</button>`;
                    }).join('')}
                </div>
            </div>`;
        container.appendChild(wrapper);
    });

    // 绑定折叠事件和背景变色事件
    container.querySelectorAll('button[data-target]').forEach(btn => {
        btn.onclick = () => {
            const target = document.getElementById(btn.dataset.target);
            const icon = btn.querySelector('svg');
            if(target.classList.contains('open')){
                target.classList.remove('open');
                icon.style.transform = 'rotate(0deg)';
            } else {
                // 折叠其他
                container.querySelectorAll('.accordion-content').forEach(el => el.classList.remove('open'));
                container.querySelectorAll('button[data-target] svg').forEach(el => el.style.transform = 'rotate(0deg)');
                // 展开当前
                target.classList.add('open');
                icon.style.transform = 'rotate(180deg)';
                // 🌟 联动：改变网页背景颜色
                document.body.style.background = btn.dataset.bg;
            }
        };
    });
}

// 全局添加函数
window.addPresetSite = function(btn, name, url) {
    apps.push({ name, url }); saveApps();
    btn.classList.add('animate-pop'); btn.style.opacity = '0.4'; btn.style.pointerEvents = 'none'; btn.innerHTML = '✔ Added';
    setTimeout(() => { renderAccordionPresets(); }, 800);
};

// ==========================================
// 6. 事件绑定
// ==========================================
$('add-app-btn').onclick = () => {
    renderAccordionPresets(); $('app-name').value = ''; $('app-url').value = '';
    $('modal').classList.replace('hidden', 'flex');
};
$('modal-close-x').onclick = () => {
    $('modal').classList.replace('flex', 'hidden');
    applyBackground(); // 关闭弹窗时恢复用户原本的背景
};

$('modal-save').onclick = () => {
    const name = $('app-name').value.trim(); let url = $('app-url').value.trim();
    if (!name || !url) return alert('请填写完整信息');
    if (!url.startsWith('http')) url = 'https://' + url;
    apps.push({ name, url }); saveApps(); $('modal-close-x').click();
};

$('settings-btn').onclick = () => $('settings-panel').classList.toggle('hidden');
document.addEventListener('click', e => {
    const panel = $('settings-panel'), btn = $('settings-btn');
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && !btn.contains(e.target)) panel.classList.add('hidden');
});

document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.onclick = () => { currentLayout = btn.dataset.layout; storage.set('layout', currentLayout); renderApps(); };
});

$('toggle-theme').onclick = () => { 
    document.documentElement.classList.toggle('dark'); 
    storage.set('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); 
};
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

$('reset-btn').onclick = () => { 
    if(confirm('确定清空所有数据吗？')) { storage.clear(); location.reload(); } 
};

// 初始化搜索引擎
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

// 启动
applyBackground(); renderApps();
