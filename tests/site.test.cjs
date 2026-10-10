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
