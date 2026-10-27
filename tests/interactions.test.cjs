const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const calendar = require('../calendar.js');

function loadPageScript(elements = {}) {
  const listeners = {};
  const document = {
    readyState: 'complete',
    querySelectorAll(selector) {
      return selector.split(',').flatMap(part => elements[part.trim()] || []);
    }
  };
  const window = { addEventListener(name, callback) { listeners[name] = callback; }, scrollY: 0 };
  const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  vm.runInNewContext(source, { document, window });
  return { window, listeners };
}

test('pages without optional libraries or target containers can initialize all interaction scripts', async (t) => {
  for (const relativePath of ['../calendar.js', '../newscript.js', '../js/main.js']) {
    await t.test(relativePath, () => {
      const document = {
        readyState: 'complete',
        addEventListener(name, callback) { if (name === 'DOMContentLoaded') callback(); },
        getElementById() { return null; },
        getElementsByClassName() { return []; },
        querySelector() { return null; },
        querySelectorAll() { return []; }
      };
      const window = { addEventListener() {}, scrollY: 0 };
      const source = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
      assert.doesNotThrow(() => vm.runInNewContext(source, { document, window }));
    });
  }
});

test('standard and custom photo controls are hidden and disabled if Bootstrap cannot load', () => {
  const standardControl = { style: {}, setAttribute() {} };
  const customControl = { style: {}, setAttribute() {} };
  loadPageScript({
    '.carousel-control-prev': [standardControl],
    '.photo-controls button[data-bs-slide]': [customControl]
  });
  for (const control of [standardControl, customControl]) {
    assert.equal(control.hidden, true);
    assert.equal(control.disabled, true);
    assert.equal(control.style.display, 'none');
  }
});

test('the header stays visible and keeps its primary background at the top and after scrolling', () => {
  const classes = new Set(['site-header', 'bg-primary']);
  const header = {
    style: {},
    classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    }
  };
  const { window, listeners } = loadPageScript({ '.sticky-top': [header] });
  for (const position of [0, 500, 0]) {
    window.scrollY = position;
    listeners.scroll();
    assert.equal(header.style.top, '0px', `header must remain visible at scroll position ${position}`);
    assert.equal(classes.has('bg-primary'), true, 'the background supplied by the markup must remain');
    assert.equal(classes.has('shadow-sm'), position > 300);
  }
});

test('all-day event dates keep their calendar day when displayed', () => {
  const { formatEventDate } = calendar;
  assert.equal(typeof formatEventDate, 'function');
  assert.equal(formatEventDate('2024-05-18'), 'May 18, 2024');
  assert.equal(formatEventDate('2024-02-29'), 'February 29, 2024');
});

test('invalid event dates are not silently moved into another month', () => {
  const { formatEventDate } = calendar;
  assert.equal(typeof formatEventDate, 'function');
  assert.equal(formatEventDate('2024-02-30'), 'Date unavailable');
  assert.equal(formatEventDate('not-a-date'), 'Date unavailable');
  assert.equal(formatEventDate(null), 'Date unavailable');
});

test('an explicitly archived event remains archived regardless of the current date', () => {
  const { getEventStatus } = calendar;
  assert.equal(typeof getEventStatus, 'function');
  assert.equal(
    getEventStatus({ start: '2024-05-18', archived: true }, '2024-01-01'),
    'Archived event'
  );
});

test('past dates are archived while an event today remains scheduled', () => {
  const { getEventStatus } = calendar;
  assert.equal(typeof getEventStatus, 'function');
  assert.equal(getEventStatus({ start: '2024-05-18' }, '2024-05-19'), 'Archived event');
  assert.equal(getEventStatus({ start: '2024-05-18' }, '2024-05-18'), 'Scheduled event');
  assert.equal(getEventStatus({ start: 'invalid' }, '2024-05-18'), 'Date unavailable');
});

test('an empty month points to the archive without advertising a future date', () => {
  const { EVENTS, getMonthStatus } = calendar;
  assert.equal(typeof getMonthStatus, 'function');
  assert.equal(
    getMonthStatus(EVENTS, '2026-10-01', '2026-11-01', '2026-10-27'),
    'No events are scheduled for this month. View the event archive below or ask about future events.'
  );
});

test('month status distinguishes archived events and excludes the next month boundary', () => {
  const { getMonthStatus } = calendar;
  assert.equal(typeof getMonthStatus, 'function');
  const events = [
    { start: '2024-05-18', archived: true },
    { start: '2024-06-01', archived: false }
  ];
  assert.equal(
    getMonthStatus(events, '2024-05-01', '2024-06-01', '2024-05-01'),
    '1 archived event shown for this month. View details in the event archive.'
  );
  assert.equal(
    getMonthStatus(events, '2024-06-01', '2024-07-01', '2024-05-01'),
    '1 scheduled event shown for this month.'
  );
});
