const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');
const navLinks = [...navigation.querySelectorAll('a')];
const sections = [...document.querySelectorAll('section[id]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open) {
  navigation.classList.toggle('is-open', open);
  menuToggle.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
}
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
  if (!event.target.closest('.navbar')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});
window.matchMedia('(max-width: 650px)').addEventListener('change', () => setMenu(false));

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(section => {
    section.classList.add('reveal-ready');
    observer.observe(section);
  });
}

const filterButtons = [...document.querySelectorAll('.filter-btn[data-filter]')];
const projectCards = [...document.querySelectorAll('.project-card')];
const search = document.querySelector('#project-search');
let category = 'all';
const searchableText = card => [card.querySelector('h3').textContent, card.querySelector('p').textContent, card.querySelector('span').textContent].join(' ').toLowerCase();
function updateProjects() {
  const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  projectCards.forEach(card => {
    const visible = (category === 'all' || card.dataset.category === category) && words.every(word => searchableText(card).includes(word));
    card.hidden = !visible;
    if (visible) count++;
  });
  filterButtons.forEach(button => {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#project-count').textContent = `${count} of ${projectCards.length} projects shown`;
  document.querySelector('#no-projects').hidden = count !== 0;
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  updateProjects();
}));
search.addEventListener('input', updateProjects);
document.querySelector('#reset-projects').addEventListener('click', () => {
  search.value = '';
  category = 'all';
  updateProjects();
  search.focus({ preventScroll: true });
});
document.querySelector('.project-search').hidden = false;
updateProjects();

document.querySelectorAll('.skill-card').forEach(skill => {
  const label = skill.textContent.trim();
  // Only offer a shortcut where the portfolio actually contains a match.
  if (!projectCards.some(card => searchableText(card).includes(label.toLowerCase()))) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'skill-card skill-link';
  button.textContent = label;
  button.setAttribute('aria-label', `Find projects using ${label}`);
  button.addEventListener('click', () => {
    category = 'all';
    search.value = label;
    updateProjects();
    document.querySelector('#projects').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    search.focus({ preventScroll: true });
  });
  skill.replaceWith(button);
});
document.querySelector('#skills-hint').hidden = false;

const modal = document.querySelector('.project-modal');
const liveLink = document.querySelector('#modal-live-link');
const modalScreenshots = document.querySelector('#modal-screenshots');
document.querySelectorAll('.project-screenshot img').forEach(img => {
  const updateScreenshot = () => {
    const loaded = img.complete && img.naturalWidth > 0;
    img.hidden = !loaded;
    img.nextElementSibling.hidden = loaded;
  };
  img.addEventListener('load', updateScreenshot);
  img.addEventListener('error', updateScreenshot);
  updateScreenshot();
});
let modalTrigger;
document.querySelectorAll('.project-details').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.project-card');
  modalTrigger = button;
  const screenshots = [...card.querySelectorAll('.project-screenshot img')]
    .filter(img => img.complete && img.naturalWidth > 0)
    .map(img => {
      const preview = img.cloneNode();
      preview.hidden = false;
      preview.loading = 'eager';
      return preview;
    });
  modalScreenshots.replaceChildren(...screenshots);
  modalScreenshots.hidden = screenshots.length === 0;
  document.querySelector('#modal-title').textContent = card.querySelector('h3').textContent;
  document.querySelector('#modal-description').textContent = card.querySelector('p').textContent.trim();
  const badges = card.querySelector('span').textContent.split('•').map(technology => {
    const badge = document.createElement('span');
    badge.textContent = technology.trim();
    return badge;
  });
  document.querySelector('#modal-stack').replaceChildren(...badges);
  const sourceLink = card.querySelector('a');
  liveLink.hidden = !sourceLink;
  if (sourceLink) {
    liveLink.href = sourceLink.href;
    liveLink.textContent = sourceLink.textContent.trim();
  }
  else liveLink.removeAttribute('href');
  modal.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('.modal-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  const box = modal.getBoundingClientRect();
  if (event.target === modal && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) modal.close();
});
modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  modalTrigger?.focus({ preventScroll: true });
});
document.querySelectorAll('a[target="_blank"]').forEach(link => link.rel = 'noopener noreferrer');

const progress = document.querySelector('.reading-progress');
const backToTop = document.querySelector('.back-to-top');
function updateScroll() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
  backToTop.hidden = window.scrollY < 500;
  let current = '';
  sections.forEach(section => {
    if (section.getBoundingClientRect().top <= 150) current = section.id;
  });
  if (distance > 0 && window.scrollY >= distance - 2) current = sections.at(-1).id;
  navLinks.forEach(link => {
    const active = link.hash === `#${current}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => {
    updateScroll();
    scrollPending = false;
  });
}, { passive: true });
window.addEventListener('resize', updateScroll);
if ('ResizeObserver' in window) new ResizeObserver(updateScroll).observe(document.body);
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  document.querySelector('.skip-link').focus({ preventScroll: true });
});
updateScroll();

const focuses = {
  ai: { label: '01 / ARTIFICIAL INTELLIGENCE', title: 'Ideas. Data. Intelligent experiences.', description: 'Exploring generative AI, retrieval-augmented generation, and conversational applications.', stack: ['Python', 'FastAPI', 'RAG'], category: 'ai', link: 'Explore AI / ML projects' },
  software: { label: '02 / SOFTWARE DEVELOPMENT', title: 'Logic. Structure. Useful applications.', description: 'Building practical applications with Java, object-oriented programming, and data structures.', stack: ['Java', 'OOP', 'DSA'], category: 'java', link: 'Explore software projects' }
};
let activeFocus = 'ai';
const focusButtons = [...document.querySelectorAll('[data-focus]')];
focusButtons.forEach(button => button.addEventListener('click', () => {
  activeFocus = button.dataset.focus;
  const focus = focuses[activeFocus];
  focusButtons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  document.querySelector('#focus-label').textContent = focus.label;
  document.querySelector('#focus-title').textContent = focus.title;
  document.querySelector('#focus-description').textContent = focus.description;
  document.querySelector('#focus-stack').replaceChildren(...focus.stack.map(name => {
    const badge = document.createElement('span');
    badge.textContent = name;
    return badge;
  }));
  document.querySelector('#focus-link').firstChild.textContent = `${focus.link} `;
}));
document.querySelector('.workspace-controls').hidden = false;
document.querySelector('#focus-link').addEventListener('click', () => {
  category = focuses[activeFocus].category;
  search.value = '';
  updateProjects();
  search.focus({ preventScroll: true });
});

// Pointer lighting is decorative; touch and reduced-motion users get static cards.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('.project-card, .certification-card').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--glow-x');
    card.style.removeProperty('--glow-y');
  });
});
