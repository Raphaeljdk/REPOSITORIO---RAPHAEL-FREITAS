// ==================== CONFIGURAÇÕES ====================
const CONFIG = {
    currentMonth: 3,
    monthFocus: {
        1: "construir base sólida",
        2: "ganhar consistência", 
        3: "aplicar em projetos",
        4: "refinar boas práticas",
        5: "pensar como profissional",
        6: "consolidar para o mercado"
    },
    categories: {
        frontend: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Tailwind'],
        backend: ['Java', 'Node.js', 'Python', 'PHP', 'Spring'],
        database: ['MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'MongoDB'],
        tools: ['Git', 'GitHub', 'Docker', 'VS Code', 'Postman', 'AWS']
    },
    projectsPerPage: 6,
    animationDelay: 100,
    storageKeys: {
        theme: 'portfolio-theme',
        filters: 'portfolio-filters'
    },
    chartColors: {
        expert: '#10b981',
        intermediate: '#3b82f6',
        basic: '#f59e0b',
        beginner: '#ef4444'
    }
};

// ==================== ESTADO GLOBAL ====================
const state = {
    currentPage: 1,
    currentFilter: 'all',
    projects: [],
    skills: [],
    theme: localStorage.getItem(CONFIG.storageKeys.theme) || 'dark',
    isChartInitialized: false
};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando portfólio...');
    console.log('📊 Canvas encontrados:', {
        evolutionChart: document.getElementById('evolutionChart'),
        skillsChart: document.getElementById('skillsChart')
    });
    
    showLoading();
    
    try {
        await carregarDadosCompletos();
        initTheme();
        initMobileMenu();
        initSmoothScroll();
        initThemeToggle();
        initLazyLoading();
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
    
    hideLoading();
});

// ==================== LOADING ====================
function showLoading() {
    if (document.getElementById('global-loader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `<div class="loader-spinner"></div>`;
    document.body.appendChild(loader);
}

function hideLoading() {
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 300);
        }
    }, 500);
}

// ==================== CARREGAMENTO PRINCIPAL ====================
async function carregarDadosCompletos() {
    try {
        const [data, projects] = await Promise.all([
            fetch('data.json').then(r => handleResponse(r, 'data.json')).catch(() => null),
            fetch('projects.json').then(r => handleResponse(r, 'projects.json')).catch(() => null)
        ]);

        console.log('📦 Dados carregados:', { data, projects });

        if (!data && !projects) {
            console.warn('⚠️ Nenhum JSON encontrado, usando fallback');
            usarDadosFallback();
            return;
        }

        // Processa skills se existirem
        if (data) {
            state.skills = processarDataJson(data);
            if (state.skills?.length) {
                atualizarSugestaoAI(state.skills);
                renderizarEvolutionDashboard(state.skills);
                renderizarGraficoBarras(state.skills);
            }
        } else {
            carregarSkillsFallback();
        }

        // Processa projetos se existirem
        if (projects) {
            state.projects = Array.isArray(projects) ? projects : 
                           (projects.projects || projects.projetos || []);
            renderizarProjetos(state.projects);
            initProjectFilters();
            initPaginacao();
            adicionarBadgesProjetos();
        } else {
            carregarProjetosFallback();
        }

        // Animações após carregar
        setTimeout(() => {
            animarProgressBars();
            initIntersectionObserver();
        }, CONFIG.animationDelay);

    } catch (err) {
        console.error("❌ Erro fatal:", err);
        usarDadosFallback();
    }
}

function handleResponse(response, fileName) {
    if (!response.ok) {
        console.warn(`⚠️ Arquivo ${fileName} não encontrado (${response.status})`);
        return null;
    }
    return response.json();
}

function usarDadosFallback() {
    carregarSkillsFallback();
    carregarProjetosFallback();
}

// ==================== SKILLS ====================
function processarDataJson(data) {
    if (!data?.skills) return null;

    const skills = data.skills;
    const currentMonth = data.currentMonth || CONFIG.currentMonth;
    const computedSkills = [];

    // Organiza skills por categoria
    const skillsPorCategoria = {
        frontend: [],
        backend: [],
        database: [],
        tools: []
    };

    skills.forEach(skill => {
        const percent = calcularPercentualSkill(skill, currentMonth);
        const categoria = determinarCategoria(skill.name);
        
        if (skillsPorCategoria[categoria]) {
            skillsPorCategoria[categoria].push({
                ...skill,
                percent,
                tooltip: skill.monthlyLearning?.[currentMonth]?.join(" • ") || "Em evolução"
            });
        }

        computedSkills.push({
            name: skill.name,
            percent,
            desc: skill.monthlyLearning?.[currentMonth]?.[0] || ''
        });
    });

    renderizarSkills(skillsPorCategoria);
    renderizarRoadmap(skills, currentMonth);

    return computedSkills;
}

function calcularPercentualSkill(skill, currentMonth) {
    return Math.min((skill.basePercent || 0) + (currentMonth - 1) * 5, 100);
}

function determinarCategoria(skillName) {
    if (CONFIG.categories.frontend.includes(skillName)) return 'frontend';
    if (CONFIG.categories.backend.includes(skillName)) return 'backend';
    if (CONFIG.categories.database.includes(skillName)) return 'database';
    return 'tools';
}

function renderizarSkills(skillsPorCategoria) {
    const categorias = ['frontend', 'backend', 'database', 'tools'];
    
    categorias.forEach(cat => {
        const el = document.getElementById(`skills-${cat}`);
        if (el && skillsPorCategoria[cat]) {
            el.innerHTML = skillsPorCategoria[cat].map(skill => criarSkillHTML(skill)).join('');
        }
    });
}

function criarSkillHTML(skill) {
    const percentClass = skill.name.toLowerCase().replace(/[^a-z]/g, '');
    
    return `
        <div class="skill-card" data-tooltip="${skill.tooltip || ''}" data-skill="${skill.name}">
            ${skill.icon ? `
                <img src="${skill.icon}" 
                     alt="${skill.name}" 
                     class="skill-icon"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/40?text=${skill.name.charAt(0)}'">
            ` : ''}
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">
                <div class="skill-progress ${percentClass}" style="width: ${skill.percent}%"></div>
            </div>
            <div class="skill-percent">${skill.percent}%</div>
        </div>
    `;
}

// ==================== ROADMAP ====================
function renderizarRoadmap(skills, currentMonth) {
    const roadmapEl = document.getElementById('roadmap');
    if (!roadmapEl) return;

    roadmapEl.innerHTML = skills
        .filter(skill => skill.monthlyLearning?.[currentMonth])
        .map(skill => `
            <div class="roadmap-item" data-skill="${skill.name}">
                <strong>${skill.name}</strong>
                <ul>
                    ${skill.monthlyLearning[currentMonth]
                        .map(item => `<li>${item}</li>`)
                        .join("")}
                </ul>
            </div>
        `).join('');
}

// ==================== PROJETOS ====================
function renderizarProjetos(projects) {
    const container = document.getElementById('projects');
    if (!container) {
        console.warn('⚠️ Elemento #projects não encontrado');
        return;
    }
    
    if (!projects?.length) {
        container.innerHTML = '<p class="text-center">Nenhum projeto encontrado</p>';
        return;
    }

    container.innerHTML = projects.map(project => {
        const projectData = {
            id: project.id || crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
            title: project.title || project.nome || 'Sem título',
            description: project.description || project.descricao || '',
            category: project.category || project.categoria || 'Geral',
            difficulty: project.difficulty || project.requiredSkill || project.nivel || 50,
            highlights: project.highlights || project.reward || project.tecnicas || [],
            technologies: project.technologies || project.tecnologias || [],
            link: project.link || project.liveDemo || project.url || '#',
            github: project.github || project.repo || '',
            featured: project.featured || project.destaque || false
        };

        return `
            <div class="project-card ${projectData.featured ? 'featured' : ''}" 
                 data-id="${projectData.id}"
                 data-category="${projectData.category}"
                 data-technologies='${JSON.stringify(projectData.technologies)}'
                 onclick="window.open('${projectData.link}', '_blank')">
                
                ${projectData.featured ? '<span class="badge">⭐ Destaque</span>' : ''}
                
                <h3>${projectData.title}</h3>
                <p class="project-description">${projectData.description}</p>
                
                <div class="project-category">
                    <span class="category-tag">${projectData.category}</span>
                    <span class="difficulty-badge">${projectData.difficulty}%</span>
                </div>
                
                ${projectData.highlights.length ? `
                    <div class="project-highlights">
                        ${projectData.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${projectData.technologies.length ? `
                    <div class="project-technologies">
                        ${projectData.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="project-links" onclick="event.stopPropagation()">
                    <a href="${projectData.link}" target="_blank" class="project-link">Ver Projeto →</a>
                    ${projectData.github ? `<a href="${projectData.github}" target="_blank" class="github-link">GitHub</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== FILTROS DE PROJETOS ====================
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;
    
    const savedFilter = localStorage.getItem(CONFIG.storageKeys.filters) || 'all';
    state.currentFilter = savedFilter;
    
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === savedFilter) btn.classList.add('active');
        
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.currentFilter = btn.dataset.filter;
            state.currentPage = 1;
            
            localStorage.setItem(CONFIG.storageKeys.filters, state.currentFilter);
            filtrarProjetos(state.currentFilter);
            atualizarPaginacao();
        });
    });
}

function filtrarProjetos(filter) {
    const projects = document.querySelectorAll('.project-card');
    let visibleCount = 0;
    
    projects.forEach(project => {
        const isVisible = filter === 'all' || 
            (project.dataset.technologies || '').includes(filter);
        
        project.dataset.visible = isVisible;
        if (isVisible) visibleCount++;
    });
    
    aplicarPaginacao(state.currentPage);
    return visibleCount;
}

// ==================== PAGINAÇÃO ====================
function initPaginacao() {
    if (!document.querySelector('#projects')) return;
    
    let paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        paginationContainer = criarPaginacao();
    }
    atualizarPaginacao();
}

function criarPaginacao() {
    const projectsSection = document.querySelector('#projects')?.parentElement;
    if (!projectsSection) return null;
    
    const paginationEl = document.createElement('div');
    paginationEl.id = 'pagination';
    paginationEl.className = 'pagination-container';
    projectsSection.appendChild(paginationEl);
    return paginationEl;
}

function atualizarPaginacao() {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    const projects = document.querySelectorAll('.project-card[data-visible="true"]');
    const totalPages = Math.ceil(projects.length / CONFIG.projectsPerPage);
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    renderizarPaginacao(totalPages);
    aplicarPaginacao(state.currentPage);
}

function renderizarPaginacao(totalPages) {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;
    
    let html = '<div class="pagination">';
    html += `<button class="page-btn prev" ${state.currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
            html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    html += `<button class="page-btn next" ${state.currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    html += '</div>';
    
    paginationEl.innerHTML = html;
    adicionarEventosPaginacao(totalPages);
}

function adicionarEventosPaginacao(totalPages) {
    document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPage = parseInt(btn.dataset.page);
            aplicarPaginacao(state.currentPage);
            renderizarPaginacao(totalPages);
            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    const prevBtn = document.querySelector('.page-btn.prev');
    const nextBtn = document.querySelector('.page-btn.next');
    
    if (prevBtn && !prevBtn.disabled) {
        prevBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                aplicarPaginacao(state.currentPage);
                renderizarPaginacao(totalPages);
            }
        });
    }
    
    if (nextBtn && !nextBtn.disabled) {
        nextBtn.addEventListener('click', () => {
            if (state.currentPage < totalPages) {
                state.currentPage++;
                aplicarPaginacao(state.currentPage);
                renderizarPaginacao(totalPages);
            }
        });
    }
}

function aplicarPaginacao(page) {
    const projects = document.querySelectorAll('.project-card[data-visible="true"]');
    const start = (page - 1) * CONFIG.projectsPerPage;
    const end = start + CONFIG.projectsPerPage;
    
    document.querySelectorAll('.project-card').forEach(p => p.style.display = 'none');
    
    projects.forEach((project, index) => {
        if (index >= start && index < end) {
            project.style.display = 'flex';
        }
    });
}

// ==================== BADGES DE PROJETOS ====================
function adicionarBadgesProjetos() {
    document.querySelectorAll('.project-card').forEach(projeto => {
        if (projeto.querySelector('.badge-expert, .badge-advanced')) return;
        
        const difficultyEl = projeto.querySelector('.difficulty-badge');
        if (!difficultyEl) return;
        
        const num = parseInt(difficultyEl.innerText.replace(/[^0-9]/g, '')) || 0;
        
        if (num >= 90) {
            projeto.classList.add('expert');
            projeto.insertAdjacentHTML('afterbegin', '<span class="badge-expert">🏆 Expert</span>');
        } else if (num >= 80) {
            projeto.classList.add('advanced');
            projeto.insertAdjacentHTML('afterbegin', '<span class="badge-advanced">🚀 Avançado</span>');
        }
    });
}

// ==================== EVOLUTION DASHBOARD ====================
function renderizarEvolutionDashboard(skills) {
    if (!skills?.length) return;
    
    const skillsPorCategoria = { frontend: [], backend: [], database: [], tools: [] };
    
    skills.forEach(skill => {
        const categoria = determinarCategoria(skill.name);
        if (skillsPorCategoria[categoria]) skillsPorCategoria[categoria].push(skill);
    });
    
    // Atualiza médias
    Object.keys(skillsPorCategoria).forEach((cat, index) => {
        const skillsCat = skillsPorCategoria[cat];
        if (!skillsCat.length) return;
        
        const media = Math.round(skillsCat.reduce((sum, s) => sum + s.percent, 0) / skillsCat.length);
        const avgEl = document.querySelector(`.evolution-category:nth-child(${index + 1}) .category-average`);
        if (avgEl) avgEl.textContent = media + '%';
    });
    
    // Renderiza categorias
    ['frontend', 'backend', 'database', 'tools'].forEach(cat => {
        renderizarEvolutionCategory(cat, skillsPorCategoria[cat]);
    });
    
    // Atualiza estatísticas
    atualizarEvolutionStats(skills);
}

function renderizarEvolutionCategory(categoria, skills) {
    const container = document.getElementById(`evolution-${categoria}`);
    if (!container || !skills?.length) return;
    
    container.innerHTML = skills.map(skill => {
        const iconUrl = skill.icon || `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${skill.name.toLowerCase()}/${skill.name.toLowerCase()}-original.svg`;
        
        return `
            <div class="evolution-skill-item">
                <img src="${iconUrl}" alt="${skill.name}" class="skill-icon-small"
                     onerror="this.src='https://via.placeholder.com/24?text=${skill.name.charAt(0)}'">
                <div class="skill-info">
                    <div class="skill-info-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-percentage">${skill.percent}%</span>
                    </div>
                    <div class="skill-progress-bar">
                        <div class="skill-progress-fill" style="width: ${skill.percent}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function atualizarEvolutionStats(skills) {
    const mediaGeral = Math.round(skills.reduce((sum, s) => sum + s.percent, 0) / skills.length);
    const emEvolucao = skills.filter(s => s.percent < 50).length;
    
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = skills.length;
        statValues[1].textContent = mediaGeral + '%';
        statValues[2].textContent = emEvolucao;
    }
}

// ==================== GRÁFICO DE BARRAS ====================
function renderizarGraficoBarras(skills) {
    const canvas = document.getElementById('evolutionChart') || document.getElementById('skillsChart');
    
    if (!canvas) {
        console.warn('⚠️ Canvas do gráfico não encontrado');
        return;
    }
    
    if (!skills?.length) {
        console.warn('⚠️ Sem dados para o gráfico');
        return;
    }

    console.log('📊 Renderizando gráfico com:', skills);

    if (typeof Chart === 'undefined') {
        carregarChartJS(canvas, skills);
    } else {
        criarGraficoBarras(canvas, skills);
    }
}

function carregarChartJS(canvas, skills) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => {
        console.log('✅ Chart.js carregado');
        setTimeout(() => criarGraficoBarras(canvas, skills), 100);
    };
    script.onerror = () => {
        console.error('❌ Erro ao carregar Chart.js');
        mostrarFallbackGrafico(canvas);
    };
    document.head.appendChild(script);
}

function criarGraficoBarras(canvas, skills) {
    if (!canvas || !skills) return;
    
    // Remove fallback
    const container = canvas.parentElement;
    container?.querySelector('.chart-fallback')?.remove();
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    if (canvas.chart) canvas.chart.destroy();
    
    const sorted = [...skills].sort((a, b) => b.percent - a.percent);
    
    const backgroundColors = sorted.map(s => {
        if (s.percent >= 80) return CONFIG.chartColors.expert;
        if (s.percent >= 60) return CONFIG.chartColors.intermediate;
        if (s.percent >= 40) return CONFIG.chartColors.basic;
        return CONFIG.chartColors.beginner;
    });
    
    try {
        canvas.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(s => s.name),
                datasets: [{
                    label: 'Nível de Proficiência (%)',
                    data: sorted.map(s => s.percent),
                    backgroundColor: backgroundColors,
                    borderColor: 'transparent',
                    borderRadius: 8,
                    barPercentage: 0.7,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15,23,42,0.95)',
                        callbacks: {
                            label: (ctx) => {
                                const value = ctx.raw;
                                let level = '🌱 Iniciante';
                                if (value >= 80) level = '🔥 Avançado';
                                else if (value >= 60) level = '📈 Intermediário';
                                else if (value >= 40) level = '📚 Básico';
                                return [`Nível: ${value}%`, level];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { 
                            stepSize: 20,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#94a3b8',
                            callback: v => v + '%'
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#94a3b8',
                            maxRotation: 35
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico criado com sucesso!');
        state.isChartInitialized = true;
        
    } catch (error) {
        console.error('❌ Erro no gráfico:', error);
        mostrarFallbackGrafico(canvas);
    }
}

function mostrarFallbackGrafico(canvas) {
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    canvas.style.display = 'none';
    container.querySelector('.chart-fallback')?.remove();
    
    const fallback = document.createElement('div');
    fallback.className = 'chart-fallback';
    fallback.innerHTML = `
        <div>
            <span>📊</span>
            <p style="color: var(--text-secondary); margin: 10px 0;">Gráfico indisponível</p>
            <button onclick="location.reload()" style="
                padding: 8px 20px;
                background: var(--accent-gradient);
                color: white;
                border: none;
                border-radius: 30px;
                cursor: pointer;
            ">Tentar novamente</button>
        </div>
    `;
    container.appendChild(fallback);
}

// ==================== THEME ====================
function initTheme() {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem(CONFIG.storageKeys.theme) || 'dark';
    html.setAttribute('data-theme', savedTheme);
    state.theme = savedTheme;
}

function initThemeToggle() {
    const toggles = [
        document.getElementById('themeToggle'),
        document.getElementById('themeToggleFloating')
    ].filter(Boolean);
    
    if (!toggles.length) return;
    
    function toggleTheme() {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(CONFIG.storageKeys.theme, newTheme);
        state.theme = newTheme;
        
        document.body.style.transition = 'background-color 0.3s, color 0.3s';
        setTimeout(() => document.body.style.transition = '', 300);
        
        // Atualiza gráfico
        if (state.isChartInitialized && state.skills.length) {
            renderizarGraficoBarras(state.skills);
        }
    }
    
    toggles.forEach(toggle => toggle.addEventListener('click', toggleTheme));
}

// ==================== MENU MOBILE ====================
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuBtn || !navLinks) return;
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// ==================== SMOOTH SCROLL ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==================== AI SUGGESTION ====================
function atualizarSugestaoAI(computedSkills) {
    const aiSuggestionEl = document.querySelector('#aiSuggestion p');
    if (!aiSuggestionEl || !computedSkills?.length) return;

    const menorSkill = computedSkills.reduce((min, s) => s.percent < min.percent ? s : min);
    const foco = CONFIG.monthFocus[CONFIG.currentMonth] || "continuar evoluindo";

    aiSuggestionEl.innerHTML = `
        <strong>${menorSkill.name}</strong> — ${menorSkill.desc || 'Em desenvolvimento'}
        <small>Momento ideal para ${foco}. Priorize prática em projetos pequenos.</small>
    `;
}

// ==================== ANIMAÇÕES ====================
function animarProgressBars() {
    document.querySelectorAll('.skill-progress').forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        bar.offsetHeight; // Reflow
        setTimeout(() => bar.style.width = targetWidth, CONFIG.animationDelay);
    });
}

// ==================== INTERSECTION OBSERVER ====================
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.id === 'skills') animarProgressBars();
            }
        });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    document.querySelectorAll('.section').forEach(section => observer.observe(section));
}

// ==================== FALLBACKS ====================
function carregarSkillsFallback() {
    console.log('📚 Carregando skills fallback');
    
    const fallbackSkills = {
        frontend: [
            { name: 'HTML', percent: 85, icon: 'icons/html.svg' },
            { name: 'CSS', percent: 80, icon: 'icons/css.svg' },
            { name: 'JavaScript', percent: 75, icon: 'icons/js.svg' },
            { name: 'React', percent: 70, icon: 'icons/react.svg' }
        ],
        backend: [
            { name: 'Java', percent: 65, icon: 'icons/java.svg' },
            { name: 'Node.js', percent: 60, icon: 'icons/nodejs.svg' }
        ],
        database: [
            { name: 'MySQL', percent: 55, icon: 'icons/mysql.svg' }
        ],
        tools: [
            { name: 'Git', percent: 70, icon: 'icons/git.svg' },
            { name: 'GitHub', percent: 70, icon: 'icons/github.svg' },
            { name: 'VS Code', percent: 85, icon: 'icons/vscode.svg' }
        ]
    };

    // Converte para array único para o gráfico
    const allSkills = [];
    Object.values(fallbackSkills).forEach(cat => allSkills.push(...cat));
    state.skills = allSkills;

    // Renderiza tudo
    renderizarSkills(fallbackSkills);
    renderizarEvolutionDashboard(allSkills);
    renderizarGraficoBarras(allSkills);
}

function carregarProjetosFallback() {
    console.log('📁 Carregando projetos fallback');
    
    const fallbackProjects = [
        {
            id: 1,
            title: "EnergyOS - Dashboard SaaS",
            description: "Dashboard inteligente com atualização em tempo real",
            category: "SaaS",
            difficulty: 85,
            highlights: ["UI/UX", "Charts", "Tempo Real"],
            technologies: ["React", "Chart.js"],
            link: "#",
            featured: true
        },
        {
            id: 2,
            title: "TMS Lite PRO",
            description: "Sistema de gestão de fretes",
            category: "Logística",
            difficulty: 90,
            highlights: ["Dashboards", "Gestão"],
            technologies: ["React", "TypeScript"],
            link: "#",
            featured: true
        }
    ];
    
    state.projects = fallbackProjects;
    renderizarProjetos(fallbackProjects);
    adicionarBadgesProjetos();
}

// ==================== LAZY LOADING ====================
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// ==================== SERVICE WORKER (PWA) ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => 
            console.log('ServiceWorker não registrado:', err)
        );
    });
}

// ==================== EXPORT ====================
window.Portfolio = {
    state,
    CONFIG,
    carregarDadosCompletos,
    renderizarProjetos,
    filtrarProjetos,
    initTheme,
    renderizarGraficoBarras,
    testarGrafico: () => {
        const testSkills = [
            { name: 'HTML', percent: 85 },
            { name: 'CSS', percent: 80 },
            { name: 'JavaScript', percent: 75 },
            { name: 'React', percent: 70 },
            { name: 'Java', percent: 65 },
            { name: 'Node.js', percent: 60 }
        ];
        renderizarGraficoBarras(testSkills);
    }
};

console.log('✅ Script carregado com sucesso!');
// ==================== FUNÇÃO COM FONT AWESOME FALLBACK ====================
function getSkillIcon(skillName) {
    // Tenta primeiro o DevIcon
    const iconMap = {
        'HTML': 'html5/html5-original.svg',
        'CSS': 'css3/css3-original.svg',
        'JavaScript': 'javascript/javascript-original.svg',
        'React': 'react/react-original.svg',
        'TypeScript': 'typescript/typescript-original.svg',
        'Tailwind': 'tailwindcss/tailwindcss-original.svg',
        'Java': 'java/java-original.svg',
        'Node.js': 'nodejs/nodejs-original.svg',
        'Python': 'python/python-original.svg',
        'PHP': 'php/php-original.svg',
        'Spring': 'spring/spring-original.svg',
        'MySQL': 'mysql/mysql-original.svg',
        'PostgreSQL': 'postgresql/postgresql-original.svg',
        'SQLite': 'sqlite/sqlite-original.svg',
        'Oracle': 'oracle/oracle-original.svg',
        'MongoDB': 'mongodb/mongodb-original.svg',
        'Git': 'git/git-original.svg',
        'GitHub': 'github/github-original.svg',
        'Docker': 'docker/docker-original.svg',
        'VS Code': 'vscode/vscode-original.svg',
        'Postman': 'postman/postman-original.svg',
        'AWS': 'amazonwebservices/amazonwebservices-original-wordmark.svg',
        'Kubernetes': 'kubernetes/kubernetes-original.svg'
    };
    
    const iconPath = iconMap[skillName];
    if (iconPath) {
        return {
            type: 'img',
            url: `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconPath}`
        };
    }
    
    // Fallback para Font Awesome
    const faMap = {
        'HTML': 'fa-brands fa-html5',
        'CSS': 'fa-brands fa-css3-alt',
        'JavaScript': 'fa-brands fa-js',
        'React': 'fa-brands fa-react',
        'Java': 'fa-brands fa-java',
        'Node.js': 'fa-brands fa-node',
        'Python': 'fa-brands fa-python',
        'PHP': 'fa-brands fa-php',
        'Git': 'fa-brands fa-git-alt',
        'GitHub': 'fa-brands fa-github',
        'Docker': 'fa-brands fa-docker',
        'AWS': 'fa-brands fa-aws',
    };
    
    const faClass = faMap[skillName];
    if (faClass) {
        return {
            type: 'i',
            class: faClass
        };
    }
    
    // Fallback genérico
    return {
        type: 'i',
        class: 'fa-solid fa-code'
    };
}

function criarSkillHTML(skill) {
    const percentClass = skill.name.toLowerCase().replace(/[^a-z]/g, '');
    const icon = getSkillIcon(skill.name);
    
    let iconHtml = '';
    if (icon.type === 'img') {
        iconHtml = `<img src="${icon.url}" alt="${skill.name}" class="skill-icon" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    } else {
        iconHtml = `<i class="${icon.class}" style="font-size: 2rem; color: var(--accent-primary); display: none;"></i>`;
    }
    
    return `
        <div class="skill-card" data-tooltip="${skill.tooltip || ''}" data-skill="${skill.name}">
            ${iconHtml}
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">
                <div class="skill-progress ${percentClass}" style="width: ${skill.percent}%"></div>
            </div>
            <div class="skill-percent">${skill.percent}%</div>
        </div>
    `;
}