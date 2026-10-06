(() => {
  'use strict';
  function initialize() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.pro-brand')) return;
    const brand = document.createElement('div');
    brand.className = 'pro-brand';
    brand.innerHTML = '<div class="pro-brand-mark" aria-hidden="true">C</div><div><strong>CoachVoice AI</strong><small>ESTÚDIO DO TREINADOR</small></div>';
    drawer.prepend(brand);
    const desktop = window.matchMedia('(min-width:1100px)');
    const groups = [...drawer.querySelectorAll('.drawer-group')];
    const mobileStates = groups.map(group => group.open);
    function adaptMenu() {
      groups.forEach((group, index) => { group.open = desktop.matches || mobileStates[index]; });
    }
    desktop.addEventListener('change', adaptMenu);
    adaptMenu();
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      const heading = dashboard.querySelector('.dashboard-hero h2');
      if (heading) heading.textContent = 'Seu dia. Suas prioridades.';
      const shortcuts = document.createElement('section');
      shortcuts.className = 'pro-shortcuts';
      shortcuts.setAttribute('aria-label', 'Acesso rápido');
      shortcuts.innerHTML = '<div class="pro-section-head"><h3>Estúdio do treinador</h3><button class="outline" type="button" data-route="practice">Ver treinos</button></div><div class="pro-shortcut-grid"></div>';
      const modules = [
        ['mentor','◎','Mentor IA','Conversas e decisões'],
        ['daily','▤','CoachDay','Preparação do dia'],
        ['languages','A','Idiomas','Inglês e espanhol'],
        ['studio','▷','Estúdio','Vídeo e comunicação']
      ];
      const grid = shortcuts.querySelector('.pro-shortcut-grid');
      for (const [route, icon, title, description] of modules) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'pro-shortcut'; button.dataset.route = route;
        button.innerHTML = `<span class="pro-shortcut-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><small>${description}</small></span>`;
        grid.append(button);
      }
      shortcuts.addEventListener('click', event => {
        const button = event.target.closest('button[data-route]');
        if (button && typeof window.go === 'function') window.go(button.dataset.route);
      });
      dashboard.querySelector('.dashboard-hero')?.after(shortcuts);
    }
    const activePage = document.querySelector('.page.active');
    function syncNavigation() {
      const current = document.querySelector('.page.active')?.id;
      drawer.querySelectorAll('[data-page]').forEach(button => {
        if (button.dataset.page === current) button.setAttribute('aria-current','page');
        else button.removeAttribute('aria-current');
      });
    }
    if (activePage) {
      const observer = new MutationObserver(syncNavigation);
      document.querySelectorAll('.page').forEach(page => observer.observe(page, {attributes:true, attributeFilter:['class']}));
    }
    syncNavigation();
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && typeof window.closeDrawer === 'function') window.closeDrawer();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
