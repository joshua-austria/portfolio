(() => {
  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  // Only sections with a nav link, so the last linked section stays highlighted through the ones between.
  const sections = [...document.querySelectorAll('main > section[id]')]
    .filter((section) => links.some((link) => link.hash === `#${section.id}`))
    .reverse();
  if (!links.length || !sections.length) return;

  const root = document.documentElement;
  let currentSection;
  let framePending = false;

  function updateCurrentSection() {
    framePending = false;
    const scrollOffset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const atBottom = window.scrollY > 0 && root.scrollHeight - window.scrollY - window.innerHeight <= 2;
    const section = atBottom
      ? sections[0]
      : sections.find((item) => item.getBoundingClientRect().top <= scrollOffset + 2) ?? sections.at(-1);

    if (section === currentSection) return;
    currentSection = section;
    const hash = `#${section.id}`;

    links.forEach((link) => {
      const active = link.hash === hash;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function scheduleUpdate() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateCurrentSection);
  }

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('hashchange', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  scheduleUpdate();
})();
