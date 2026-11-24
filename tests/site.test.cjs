const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function bootTheme({ saved = null, systemDark = false, blockedStorage = false } = {}) {
  const file = path.join(root, 'theme.js');
  assert.ok(fs.existsSync(file), 'Theme preference support has not been added yet');
  const attributes = {};
  const listeners = {};
  const button = {
    setAttribute: (key, value) => { attributes[key] = value; },
    querySelector: () => ({ set textContent(value) { attributes.icon = value; } }),
    addEventListener: (name, handler) => { listeners[name] = handler; },
  };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => button,
    addEventListener: (name, handler) => { listeners[name] = handler; },
  };
  const storage = new Map(saved === null ? [] : [['portfolio-theme', saved]]);
  const localStorage = {
    getItem(key) {
      if (blockedStorage) throw new Error('Storage unavailable');
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      if (blockedStorage) throw new Error('Storage unavailable');
      storage.set(key, value);
    },
  };
  const media = {
    matches: systemDark,
    addEventListener: (name, handler) => { listeners['system-' + name] = handler; },
  };
  const window = {
    matchMedia: () => media,
    addEventListener: (name, handler) => { listeners[name] = handler; },
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { document, window, localStorage });
  listeners.DOMContentLoaded();
  return { document, attributes, listeners, storage };
}

test('an explicit light preference takes priority over a dark system theme', () => {
  const site = bootTheme({ saved: 'light', systemDark: true });
  assert.equal(site.document.documentElement.dataset.theme, 'light');
  assert.equal(site.attributes['aria-pressed'], 'false');
});

test('the system theme is used without a saved choice', () => {
  const site = bootTheme({ systemDark: true });
  assert.equal(site.document.documentElement.dataset.theme, 'dark');
});

test('switching theme updates the page and survives opening another page', () => {
  const site = bootTheme();
  site.listeners.click();
  assert.equal(site.document.documentElement.dataset.theme, 'dark');
  assert.equal(site.attributes['aria-pressed'], 'true');
  assert.equal(site.attributes['aria-label'], undefined, 'the label stays fixed; aria-pressed carries the state');
  const nextPage = bootTheme({ saved: site.storage.get('portfolio-theme') });
  assert.equal(nextPage.document.documentElement.dataset.theme, 'dark');
});

test('theme switching still works when the browser blocks storage', () => {
  const site = bootTheme({ blockedStorage: true });
  assert.doesNotThrow(() => site.listeners.click());
  assert.equal(site.document.documentElement.dataset.theme, 'dark');
});

test('invalid saved data falls back to the system theme', () => {
  const site = bootTheme({ saved: 'invalid', systemDark: true });
  assert.equal(site.document.documentElement.dataset.theme, 'dark');
});

test('a later system change follows the OS until the user chooses a theme', () => {
  const site = bootTheme();
  site.listeners['system-change']({ matches: true });
  assert.equal(site.document.documentElement.dataset.theme, 'dark');
  site.listeners.click();
  site.listeners['system-change']({ matches: true });
  assert.equal(site.document.documentElement.dataset.theme, 'light');
});

test('the background does not crash when the particle library is unavailable', () => {
  assert.doesNotThrow(() => vm.runInNewContext(
    fs.readFileSync(path.join(root, 'app.js'), 'utf8'),
    { window: { matchMedia: () => ({ matches: false }) } },
  ));
});

test('reduced motion prevents the animated background from starting', () => {
  let starts = 0;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), {
    window: { matchMedia: () => ({ matches: true }) },
    particlesJS: { load: () => { starts++; } },
  });
  assert.equal(starts, 0);
});

test('Escape restores page scrolling without waiting for the queued dialog close event', () => {
  const triggerEvents = {};
  const menuEvents = {};
  const body = { style: { overflow: 'auto' } };
  const trigger = {
    addEventListener: (name, handler) => { triggerEvents[name] = handler; },
    setAttribute() {},
  };
  const menu = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    querySelector: () => ({ addEventListener() {} }),
    querySelectorAll: () => [],
    addEventListener: (name, handler) => { menuEvents[name] = handler; },
  };
  const document = {
    body,
    querySelector: (selector) => selector === '.hamburger-menu' ? trigger : menu,
    addEventListener: (name, handler) => { if (name === 'DOMContentLoaded') handler(); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'hamburger.js'), 'utf8'), {
    document, window: { addEventListener() {} },
  });
  triggerEvents.click();
  assert.equal(body.style.overflow, 'hidden');
  let prevented = false;
  menuEvents.cancel?.({ preventDefault() { prevented = true; } });
  if (!prevented) menu.open = false;
  assert.equal(menu.open, false);
  assert.equal(body.style.overflow, 'auto');
});

test('the lightbox opens the clicked project image and wraps between that project\'s images', () => {
  const handlers = {};
  const on = (key) => (name, handler) => { handlers[key + ':' + name] = handler; };
  const body = { style: { overflow: '' } };
  const image = {};
  const caption = {};
  const box = {
    open: false,
    classList: { toggle() {} },
    showModal() { this.open = true; },
    close() { this.open = false; handlers['box:close'](); },
    querySelector: (selector) => ({
      img: image,
      figcaption: caption,
      '.lightbox-prev': { addEventListener: on('prev') },
      '.lightbox-next': { addEventListener: on('next') },
      '.lightbox-close': { addEventListener: on('close') },
    })[selector],
    addEventListener: on('box'),
  };
  const media = { querySelectorAll: () => links };
  const links = ['a.webp', 'b.webp', 'c.webp'].map((href, i) => ({
    href,
    dataset: {},
    querySelector: () => ({ alt: 'Screen ' + i }),
    closest: () => media,
    addEventListener: on('link' + i),
  }));
  const document = {
    body,
    querySelector: () => box,
    querySelectorAll: () => links,
    addEventListener: (name, handler) => { if (name === 'DOMContentLoaded') handler(); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'lightbox.js'), 'utf8'), { document });

  handlers['link2:click']({ preventDefault() {} });
  assert.equal(box.open, true);
  assert.equal(image.src, 'c.webp');
  assert.equal(caption.textContent, 'Screen 2');
  assert.equal(body.style.overflow, 'hidden');
  handlers['next:click']();
  assert.equal(image.src, 'a.webp');
  handlers['box:keydown']({ key: 'ArrowLeft' });
  assert.equal(image.src, 'c.webp');
  handlers['close:click']();
  assert.equal(box.open, false);
  assert.equal(body.style.overflow, '');
});

test('a standalone lightbox link opens alone with its own caption', () => {
  const handlers = {};
  const on = (key) => (name, handler) => { handlers[key + ':' + name] = handler; };
  const image = {};
  const caption = {};
  let single = false;
  const box = {
    classList: { toggle: (name, value) => { if (name === 'lightbox-single') single = value; } },
    showModal() {},
    close() {},
    querySelector: (selector) => ({
      img: image,
      figcaption: caption,
      '.lightbox-prev': { addEventListener: on('prev') },
      '.lightbox-next': { addEventListener: on('next') },
      '.lightbox-close': { addEventListener: on('close') },
    })[selector],
    addEventListener: on('box'),
  };
  const link = {
    href: 'certificate.jpg',
    dataset: { caption: 'Certificate of Appreciation' },
    closest: () => null,
    addEventListener: on('link'),
  };
  const document = {
    body: { style: {} },
    querySelector: () => box,
    querySelectorAll: () => [link],
    addEventListener: (name, handler) => { if (name === 'DOMContentLoaded') handler(); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'lightbox.js'), 'utf8'), { document });

  handlers['link:click']({ preventDefault() {} });
  assert.equal(image.src, 'certificate.jpg');
  assert.equal(caption.textContent, 'Certificate of Appreciation');
  assert.equal(single, true);
});

test('stars run only in dark mode and stop when switching to light', () => {
  const html = { dataset: { theme: 'light' } };
  const window = { matchMedia: () => ({ matches: false }), pJSDom: [] };
  let themeChanged;
  let loads = 0;
  let destroyed = 0;
  const particlesJS = {
    load: (id, config, done) => {
      loads++;
      window.pJSDom.push({ pJS: { fn: { vendors: { destroypJS: () => { destroyed++; } } } } });
      done();
    },
  };
  class MutationObserver {
    constructor(callback) { themeChanged = callback; }
    observe() {}
  }
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), {
    window, particlesJS, MutationObserver, document: { documentElement: html },
  });

  assert.equal(loads, 0);
  html.dataset.theme = 'dark';
  themeChanged();
  themeChanged();
  assert.equal(loads, 1);
  html.dataset.theme = 'light';
  themeChanged();
  assert.equal(destroyed, 1);
  assert.equal(window.pJSDom.length, 0);
});

test('old page links redirect to the matching home section', () => {
  const redirect = (dataset, hash, search = '') => {
    let target;
    vm.runInNewContext(fs.readFileSync(path.join(root, 'home-redirect.js'), 'utf8'), {
      window: { location: { search, hash, replace: (url) => { target = url; } } },
      document: { documentElement: { dataset } },
    });
    return target;
  };
  const about = { homeSection: 'about', homeAnchors: 'about-title' };

  assert.equal(redirect({}, '#projects'), 'home.html#projects');
  assert.equal(redirect(about, '#about-title'), 'home.html#about-title');
  assert.equal(redirect(about, '#old-anchor'), 'home.html#about');
  assert.equal(redirect(about, '#%E0%A4%A', '?ref=cv'), 'home.html?ref=cv#about');
});

test('the contact form stays on the page until the captcha is done', () => {
  let submit;
  const captcha = { value: '' };
  const error = { hidden: true };
  const form = {
    addEventListener: (name, handler) => { if (name === 'submit') submit = handler; },
    querySelector: () => captcha,
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'contact-form.js'), 'utf8'), {
    document: { querySelector: (selector) => (selector === '.contact-form' ? form : error) },
  });
  const send = () => {
    let prevented = false;
    submit({ target: form, preventDefault() { prevented = true; } });
    return prevented;
  };

  assert.equal(send(), true);
  assert.equal(error.hidden, false);
  captcha.value = 'token';
  assert.equal(send(), false);
  assert.equal(error.hidden, true);
});
