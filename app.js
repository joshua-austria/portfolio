if (typeof particlesJS !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Stars belong to the night sky: run them only in dark mode so light mode stops redrawing a hidden canvas.
  const root = document.documentElement;
  const isDark = () => root.dataset.theme === 'dark';
  let loading = false;

  const stopStars = () => {
    window.pJSDom?.forEach((dom) => dom.pJS.fn.vendors.destroypJS());
    window.pJSDom = [];
  };

  const syncStars = () => {
    if (!isDark()) return stopStars();
    if (loading || window.pJSDom?.length) return;
    loading = true;
    particlesJS.load('particles-js', 'assets/particles.json?v=7', () => {
      loading = false;
      if (!isDark()) stopStars(); // the theme changed while the config was loading
    });
  };

  syncStars();
  new MutationObserver(syncStars).observe(root, { attributeFilter: ['data-theme'] });
}
