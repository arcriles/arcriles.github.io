// --- DATA INITIALIZATION ---
async function initData() {
    try {
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        if (data.projects) {
            renderProjects(data.projects);
            updateProjectCount(data.projects); 
        }
        if (data.skills) renderSkills(data.skills);

    } catch (error) {
        console.error("Failed to load data.", error);
        const container = document.getElementById('projects-container');
        if (container) container.innerHTML = `<div style="text-align:center; padding:20px;">Unable to load data. Please run on a server.</div>`;
    }
    setTimeout(initTooltips, 500);
}

// --- DYNAMIC STATS LOGIC ---
function updateProjectCount(projects) {
    const el = document.getElementById('stat-project-count');
    if (!el || !projects || projects.length === 0) return;
    const maxId = projects.reduce((max, p) => Math.max(max, parseInt(p.id || 0)), 0);
    el.textContent = `${maxId}+`;
}

// --- RENDERING FUNCTIONS ---
function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;
    let html = '';

    projects.forEach((p) => {
        const teamHTML = Array.isArray(p.team) ? p.team.map(m => 
            `<div class="meta-group"><span class="meta-label">${m.label}</span><span class="meta-value">${m.value}</span></div>`
        ).join('') : '';

        // --- IMAGE LAYOUT LOGIC ---
        const imgCount = Array.isArray(p.images) ? p.images.length : 0;
        let gridStyle = ''; 
        let getImageClass = (i) => (i === 0 ? 'large' : ''); 
        let getWrapperStyle = (i) => ''; 
        
        const gapStyle = 'gap: 5px;'; 

        if (imgCount === 1) {
            gridStyle = `grid-template-columns: 1fr; ${gapStyle}`;
            getImageClass = (i) => ''; 
            getWrapperStyle = (i) => 'height: 410px;'; 
        } else if (imgCount === 2) {
            gridStyle = `grid-template-columns: 1fr; grid-template-rows: 4fr 6fr; height: 410px; ${gapStyle}`;
            getImageClass = (i) => ''; 
            getWrapperStyle = (i) => 'height: 100%;'; 
        } else if (imgCount === 3) {
            gridStyle = `grid-template-columns: 1fr 1fr; grid-template-rows: 4fr 6fr; height: 410px; ${gapStyle}`;
            getImageClass = (i) => ''; 
            getWrapperStyle = (i) => {
                if (i === 2) return 'grid-column: span 2; height: 100%;';
                return 'height: 100%;'; 
            };
        } else {
            gridStyle = `${gapStyle}`;
        }

        const imagesHTML = Array.isArray(p.images) ? p.images.map((img, i) => `
            <div class="img-wrapper ${getImageClass(i)}" style="${getWrapperStyle(i)}" onclick="openLightbox('${img}')">
                <img src="${img}" 
                     class="gallery-img" 
                     alt="${p.title} screenshot" 
                     loading="lazy"
                     onerror="this.parentElement.style.display='none'">
            </div>
        `).join('') : '';

        const descHTML = Array.isArray(p.desc) ? p.desc.map(d => `<p>${d}</p>`).join('') : `<p>${p.desc}</p>`;

        const thumbUrl = (p.images && p.images.length > 0) ? p.images[0] : '';
        const thumbHTML = thumbUrl ? `
            <div class="btn-thumb-wrapper">
                <img src="${thumbUrl}" class="btn-thumb" alt="thumb">
                <img src="${thumbUrl}" class="btn-thumb-large" alt="preview">
            </div>
        ` : '';

        html += `
        <div class="accordion-item slide-reveal">
            <button id="accordion-btn-${p.id}" aria-expanded="false">
                <div class="btn-left">
                    ${thumbHTML}
                    <div class="header-info">
                        <span class="accordion-title">${p.title} (${p.year})</span>
                        <span class="accordion-subtitle">${p.subtitle}</span>
                    </div>
                </div>
                <div class="btn-right">
                    <span class="tech-stack-preview">Tech Stack: <span style="color:var(--text-main)">${p.tech}</span></span>
                    <span class="icon"></span>
                </div>
            </button>
            <div class="accordion-content">
                <div class="project-inner">
                    <div class="project-header">
                        <h1 class="project-title">${p.title}</h1>
                        <p class="project-subtitle">${p.subtitle}</p>
                    </div>
                    <div class="project-grid">
                        <div class="gallery-grid" style="${gridStyle}">
                            ${imagesHTML}
                        </div>
                        <div class="project-meta">
                            <div class="meta-group">
                                <span class="meta-label">Year</span>
                                <span class="meta-value">${p.year}</span>
                            </div>
                            ${teamHTML}
                            <div class="meta-group">
                                <span class="meta-label">Tech Stack</span>
                                <span class="meta-value">${p.tech}</span>
                            </div>
                            <div class="meta-group">
                                <span class="meta-label">Link</span>
                                <a href="#" class="meta-link">${p.link}</a>
                            </div>
                        </div>
                    </div>
                    <div class="project-desc">
                        <div class="desc-col">
                            ${descHTML}
                        </div>
                        <div class="desc-col">
                            <p><strong>Additional Details:</strong> This project showcases expertise in ${p.tech ? p.tech.split(',')[0] : 'modern stack'}. The architecture prioritized scalability and user experience.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    attachAccordionEvents(); 
    initLightbox(); 
    initScrollObserver(); 
}

function renderSkills(skills) {
    const list = document.getElementById('skills-list-dom');
    if (!list) return;
    list.innerHTML = skills.map(s => {
        const tags = s.tech.split(',').map(t => `<span class="skill-tag">${t.trim()}</span>`).join('');
        return `<li>
            <strong>${s.category}</strong>
            <div class="skill-tags-wrapper">${tags}</div>
        </li>`;
    }).join('');
}

// --- PARTICLE ECHO EFFECT ---
let shockwave = 0; 
function triggerEcho() { shockwave = 10; }

// --- UI INTERACTION FUNCTIONS ---
function attachAccordionEvents() {
    const items = document.querySelectorAll(".accordion button");
    items.forEach(item => item.onclick = function() {
        const isOpen = this.getAttribute('aria-expanded') === 'true';
        items.forEach(i => {
            i.setAttribute('aria-expanded', 'false');
            i.nextElementSibling.style.maxHeight = null;
            i.nextElementSibling.style.opacity = '0';
        });
        if (!isOpen) {
            this.setAttribute('aria-expanded', 'true');
            const content = this.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.opacity = '1';
            triggerEcho(); 
            setTimeout(() => this.scrollIntoView({behavior:'smooth', block:'center'}), 300);
        }
    });
}

function initTooltips() {
    const tooltip = document.getElementById('theme-bubble');
    const elements = document.querySelectorAll('[title]');
    if (!tooltip) return;
    
    elements.forEach(el => {
        const text = el.getAttribute('title');
        if (text) {
            el.setAttribute('data-tooltip', text);
            el.removeAttribute('title'); 
            el.addEventListener('mouseenter', () => { tooltip.textContent = text; tooltip.classList.add('visible'); });
            el.addEventListener('mouseleave', () => { tooltip.classList.remove('visible'); tooltip.classList.remove('flip'); tooltip.classList.remove('flip-y'); });
            el.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = e.clientY + 'px';
                if (e.clientX > window.innerWidth / 2) tooltip.classList.add('flip'); else tooltip.classList.remove('flip');
                if (e.clientY > window.innerHeight - 100) tooltip.classList.add('flip-y'); else tooltip.classList.remove('flip-y');
            });
        }
    });
}

function updateClock() {
    const el = document.getElementById('sys-time');
    if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000); updateClock();

// --- BUTTONS & TOGGLES ---
const btnFullscreen = document.getElementById('btn-fullscreen');
if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen();
    });
}

const btnHide = document.getElementById('btn-hide-frame');
const btnRestore = document.getElementById('btn-restore-frame');
if (btnHide) btnHide.onclick = () => document.body.classList.add('frames-hidden');
if (btnRestore) btnRestore.onclick = () => document.body.classList.remove('frames-hidden');

const frameLeft = document.getElementById('frame-left');
const closeSkills = document.getElementById('close-skills-btn');
let skillState = 0;
if (frameLeft && closeSkills) {
    frameLeft.onclick = (e) => {
        if (e.target === closeSkills) return;
        if (skillState === 0) { skillState = 1; frameLeft.classList.add('stage-1'); }
        else if (skillState === 1) { skillState = 2; frameLeft.classList.remove('stage-1'); frameLeft.classList.add('stage-2'); }
    };
    closeSkills.onclick = (e) => { e.stopPropagation(); skillState = 0; frameLeft.classList.remove('stage-1', 'stage-2'); };
}

// --- DRAWER LOGIC ---
let collapse = false, expanse = false;
const drawer = document.getElementById('about-drawer');
const trigger = document.getElementById('bh-trigger');

window.toggleAbout = () => {
    if (!drawer) return;
    const hint = document.querySelector('.click-hint');
    const fadeTargets = document.querySelectorAll('.fade-target');

    if (drawer.classList.contains('active')) {
        // CLOSE
        drawer.classList.remove('active'); 
        expanse = false; 
        isLogoState = false; 
        trigger.style.pointerEvents = "auto";
        if (hint) hint.textContent = "[ Who am I? ]";
        fadeTargets.forEach(el => el.classList.remove('visible'));
    } else {
        // OPEN
        drawer.classList.add('active'); 
        expanse = true; 
        collapse = false; 
        isLogoState = true; 
        trigger.style.pointerEvents = "none";
        if (hint) hint.textContent = "(hey you scrolled back ( • ⩊ • ))"; 
        
        // Smoothly scroll to drawer
        setTimeout(() => drawer.scrollIntoView({behavior:'smooth', block:'center'}), 300);
        
        setTimeout(() => {
            fadeTargets.forEach(el => el.classList.add('visible'));
        }, 300); 
    }
}

// --- ANIMATION OBSERVER ---
function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.slide-reveal').forEach(el => observer.observe(el));
}

// --- EVENTS ---
const frameBottom = document.getElementById('frame-bottom');
const scrollTopBtn = document.getElementById('btn-scroll-top');
const contactBtn = document.getElementById('nav-btn-contact');

function toggleFooter() {
    document.body.classList.toggle('footer-mode');
    if (document.body.classList.contains('footer-mode')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

if (frameBottom) {
    frameBottom.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.social-card')) return;
        toggleFooter();
    });
}

document.addEventListener('click', (e) => {
    if (document.body.classList.contains('footer-mode')) {
        const isFooter = e.target.closest('#frame-bottom');
        const isContactBtn = e.target.closest('#nav-btn-contact');
        if (!isFooter && !isContactBtn) document.body.classList.remove('footer-mode');
    }
});

if (contactBtn) {
    contactBtn.onclick = () => {
        if (!document.body.classList.contains('footer-mode')) {
            document.body.classList.add('footer-mode');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    };
}

if (scrollTopBtn) {
    scrollTopBtn.onclick = () => {
        document.body.classList.remove('footer-mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

// --- MAIN SCROLL LISTENER (Robust Trigger) ---
window.addEventListener('wheel', (e) => {
    // 1. Fetch elements dynamically to ensure they exist on first load
    const drawerRef = document.getElementById('about-drawer');
    
    // 2. Footer Toggle Logic
    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    const isAtBottom = Math.abs(scrollPosition - bodyHeight) < 5;

    if (isAtBottom && e.deltaY > 0 && !document.body.classList.contains('footer-mode')) {
        document.body.classList.add('footer-mode');
    }

    // 3. Hero Scroll Trigger Logic
    // Checks:
    // - User is scrolling down (deltaY > 0)
    // - Drawer element exists
    // - Drawer is NOT currently active/open
    // - User is at the very top of the page (scrollY < 50)
    if (e.deltaY > 0 && drawerRef && !drawerRef.classList.contains('active') && window.scrollY < 50) {
        // Double check function existence
        if (typeof window.toggleAbout === 'function') {
            window.toggleAbout();
        }
    }
}, { passive: true });

// NAV HIGHLIGHT ON SCROLL
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= (sectionTop - 300)) current = section.getAttribute('id');
    });
    document.querySelectorAll('.nav-icon-item').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('href') && li.getAttribute('href').includes(current)) li.classList.add('active');
    });
}, { passive: true });

// --- THEME ---
const themeBtn = document.getElementById('btn-theme');
if (themeBtn) {
    themeBtn.onclick = () => {
        document.documentElement.classList.toggle('light-mode');
        const isLight = document.documentElement.classList.contains('light-mode');
        themeBtn.innerHTML = isLight ? '<i class="fi fi-rr-moon"></i>' : '<i class="fi fi-rr-bulb"></i>';
    };
}

// --- VISUALS: BLACKHOLE & LOGO ---
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const bhContainer = document.getElementById('blackhole-container');
if (bhContainer) bhContainer.appendChild(canvas);

let cw, ch, centerx, centery;
const stars = [];
const starCount = 4000; 

let logoPoints = [];
let isLogoState = false;

function resizeBlackhole() {
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.width = cw; canvas.height = ch;
    centerx = cw/2; centery = ch/2;
    initLogoProcessing(); 
}
window.addEventListener('resize', resizeBlackhole);
resizeBlackhole();

function initLogoProcessing() {
    const img = new Image();
    img.src = 'logo_4RC(white).png'; 
    
    img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = cw;
        tempCanvas.height = ch;
        const scale = Math.min(cw / img.width, ch / img.height) * 0.75;
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (cw - w) / 2;
        const y = (ch - h) / 2;
        tempCtx.drawImage(img, x, y, w, h);
        const imgData = tempCtx.getImageData(0, 0, cw, ch).data;
        logoPoints = [];
        const step = 2; 
        const threshold = 128; 
        const getAlpha = (x, y) => {
            if (x < 0 || y < 0 || x >= cw || y >= ch) return 0;
            return imgData[((y * cw) + x) * 4 + 3];
        };
        for (let py = 0; py < ch; py += step) {
            for (let px = 0; px < cw; px += step) {
                if (getAlpha(px, py) > threshold) {
                    const isEdge = 
                        getAlpha(px - step, py) < threshold ||
                        getAlpha(px + step, py) < threshold ||
                        getAlpha(px, py - step) < threshold ||
                        getAlpha(px, py + step) < threshold;
                    if (isEdge) logoPoints.push({x: px, y: py});
                }
            }
        }
    };
}
window.addEventListener('load', initLogoProcessing);

class Star {
    constructor(index) {
        this.index = index; 
        this.baseR = Math.random() * 340 + 50;
        this.currR = this.baseR;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.5 + 0.2) * (340 / this.baseR);
        this.size = Math.random() * 2 + 1;
        this.color = `rgba(255,255,255,${Math.random()*0.5+0.25})`;
        this.x = centerx + Math.cos(this.angle) * this.currR;
        this.y = centery + Math.sin(this.angle) * this.currR;
    }

    draw() {
        this.angle += this.speed * 0.01;
        let orbitTargetR = this.baseR;
        if (expanse) orbitTargetR += 300 + Math.random() * 200;
        else if (collapse) orbitTargetR = 10 + Math.random() * 20;
        else if (shockwave > 0) orbitTargetR += shockwave * 15;

        this.currR += (orbitTargetR - this.currR) * 0.05;
        let targetX = centerx + Math.cos(this.angle) * this.currR;
        let targetY = centery + Math.sin(this.angle) * this.currR;

        if (isLogoState && logoPoints.length > 0) {
            const mapIndex = Math.floor((this.index / starCount) * logoPoints.length);
            const pt = logoPoints[mapIndex % logoPoints.length];
            targetX = pt.x + (Math.random() - 0.5) * 2;
            targetY = pt.y + (Math.random() - 0.5) * 2;
        }

        this.x += (targetX - this.x) * 0.05;
        this.y += (targetY - this.y) * 0.05;

        if (isLogoState) {
            if (document.documentElement.classList.contains('light-mode')) {
                ctx.fillStyle = '#001f3f'; // Navy Blue
            } else {
                ctx.fillStyle = '#ff3e3e'; // Red
            }
        } else {
            ctx.fillStyle = this.color;
            if (document.documentElement.classList.contains('light-mode')) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.5+0.25})`; 
            }
        }
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

for (let i = 0; i < starCount; i++) stars.push(new Star(i));

function loopBlackhole() {
    ctx.clearRect(0,0,cw,ch);
    stars.forEach(s => s.draw());
    if (shockwave > 0) shockwave -= 0.2; 
    requestAnimationFrame(loopBlackhole);
}
loopBlackhole();

// --- STARTUP LOGIC ---
window.addEventListener('load', () => {
    document.body.classList.remove('is-loading');
    initData();
    const trigger = document.getElementById('bh-trigger');
    if (trigger) {
        const newTrig = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrig, trigger);
        newTrig.onclick = toggleAbout;
        const bhTitle = newTrig.querySelector("h1"); 
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        
        if (bhTitle) {
            const enableHover = () => {
                newTrig.onmouseover = () => {  
                    let iteration = 0; 
                    let interval = setInterval(() => {
                        let scrambled = bhTitle.dataset.value.split("").map((letter, index) => {
                            if (index < iteration) return bhTitle.dataset.value[index];
                            return letters[Math.floor(Math.random() * 26)]
                        }).join("");
                        bhTitle.innerText = scrambled;
                        if (iteration >= bhTitle.dataset.value.length) {
                            clearInterval(interval);
                            bhTitle.innerHTML = '<span class="mono-accent">Arc</span>riles';
                        }
                        iteration += 1 / 3;
                    }, 30);
                };
            };
            const originalText = bhTitle.dataset.value;
            let introInterval = setInterval(() => {
                bhTitle.innerText = originalText.split("").map(() => letters[Math.floor(Math.random() * 26)]).join("");
            }, 30);
            setTimeout(() => {
                clearInterval(introInterval);
                let iteration = 0;
                let resolveInterval = setInterval(() => {
                    let scrambled = originalText.split("").map((letter, index) => {
                        if (index < iteration) return originalText[index];
                        return letters[Math.floor(Math.random() * 26)]
                    }).join("");
                    bhTitle.innerText = scrambled;
                    if (iteration >= originalText.length) {
                        clearInterval(resolveInterval);
                        bhTitle.innerHTML = '<span class="mono-accent">Arc</span>riles';
                        enableHover(); 
                    }
                    iteration += 1 / 3;
                }, 30);
            }, 1500); 
        }
    }
});

// Cursor Blob
const blob = document.getElementById("blob");
if (blob) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let blobX = mouseX;
    let blobY = mouseY;
    window.addEventListener("pointermove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
    function animateBlob() {
        const ease = 0.02; 
        blobX += (mouseX - blobX) * ease;
        blobY += (mouseY - blobY) * ease;
        blob.style.left = `${blobX}px`;
        blob.style.top = `${blobY}px`;
        requestAnimationFrame(animateBlob);
    }
    animateBlob();
}

// --- LIGHTBOX LOGIC ---
function initLightbox() {
    if (document.getElementById('lightbox')) return; 
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox-overlay';
    lb.innerHTML = `<span class="lightbox-close">&times;</span><img class="lightbox-img" src="" alt="Zoomed view">`;
    lb.addEventListener('click', (e) => { if (e.target !== lb.querySelector('.lightbox-img')) lb.classList.remove('active'); });
    document.body.appendChild(lb);
}
window.openLightbox = (src) => {
    const lb = document.getElementById('lightbox');
    if (!lb) initLightbox(); 
    const img = lb.querySelector('.lightbox-img');
    img.src = src;
    lb.classList.add('active');
};