const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '../js/contact.js');
const contact = require(scriptPath);

test('buildMailto prepares the recipient, subject, and sender details without sending', () => {
  assert.equal(typeof contact.buildMailto, 'function', 'contact.js must export buildMailto');
  assert.equal(
    contact.buildMailto({
      name: 'Alex Reyes',
      email: 'alex@example.com',
      subject: 'Website question',
      message: 'Please share the details.'
    }, 'spcf.ictdu@spcf.edu.ph'),
    'mailto:spcf.ictdu@spcf.edu.ph?subject=Website%20question&body=Name%3A%20Alex%20Reyes%0D%0AEmail%3A%20alex%40example.com%0D%0A%0D%0APlease%20share%20the%20details.'
  );
});

const validFields = {
  name: 'Alex Reyes',
  email: 'alex@example.com',
  subject: 'Website question',
  message: 'Please share the details.'
};

test('buildMailto preserves Unicode and query characters while normalizing message line endings', () => {
  const fields = {
    name: 'José & 李',
    email: 'alex+ictdu@example.com',
    subject: 'Café & study? #1',
    message: 'Hello & welcome.\n第二行\rThird\r\nLast'
  };
  const before = { ...fields };
  const url = new URL(contact.buildMailto(fields, 'spcf.ictdu@spcf.edu.ph'));
  assert.equal(url.searchParams.get('subject'), 'Café & study? #1');
  assert.equal(url.searchParams.get('body'), 'Name: José & 李\r\nEmail: alex+ictdu@example.com\r\n\r\nHello & welcome.\r\n第二行\r\nThird\r\nLast');
  assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
  assert.deepEqual(fields, before, 'draft preparation must preserve the supplied values');
});

test('buildMailto removes subject line breaks so they cannot introduce email headers', () => {
  const url = new URL(contact.buildMailto({
    ...validFields,
    subject: 'Hello\r\nBcc: hidden@example.com\nWorld'
  }, 'spcf.ictdu@spcf.edu.ph'));
  assert.equal(url.searchParams.get('subject'), 'Hello Bcc: hidden@example.com World');
});

test('buildMailto rejects missing or blank required values with a useful field error', () => {
  for (const field of ['name', 'email', 'subject', 'message']) {
    for (const value of ['', ' \r\n ', undefined]) {
      assert.throws(
        () => contact.buildMailto({ ...validFields, [field]: value }, 'spcf.ictdu@spcf.edu.ph'),
        new RegExp(field, 'i'),
        `${field} must reject ${JSON.stringify(value)}`
      );
    }
  }
  assert.throws(() => contact.buildMailto(undefined, 'spcf.ictdu@spcf.edu.ph'), /required|fields/i);
});

test('buildMailto rejects invalid sender and recipient addresses', () => {
  assert.throws(() => contact.buildMailto({ ...validFields, email: 'not-an-email' }, 'spcf.ictdu@spcf.edu.ph'), /email/i);
  for (const recipient of ['', undefined, 'office@example.com?bcc=hidden@example.com', 'office@example.com\r\nBcc:hidden@example.com']) {
    assert.throws(() => contact.buildMailto(validFields, recipient), /recipient/i);
  }
});

function browserFixture({ validity = true, fields = validFields, recipient = 'spcf.ictdu@spcf.edu.ph', readyState = 'loading' } = {}) {
  const controls = Object.fromEntries(Object.entries(fields).map(([name, value]) => [name, { value }]));
  const listeners = new Map();
  const captures = new Map();
  const documentListeners = new Map();
  const status = { textContent: '' };
  let focused = false;
  let validationCount = 0;
  const draft = {
    hidden: true,
    href: '',
    textContent: '',
    focus() { focused = true; },
    removeAttribute(name) { if (name === 'href') this.href = ''; },
    click() { assert.fail('Preparing a draft must not open the email app'); }
  };
  const form = {
    dataset: { recipient },
    elements: { namedItem(name) { return controls[name] || null; } },
    addEventListener(type, callback, options) {
      listeners.set(type, callback);
      captures.set(type, options === true || Boolean(options && options.capture));
    },
    reportValidity() { validationCount += 1; return validity; },
    querySelector(selector) {
      return selector === '[data-form-status]' ? status : selector === '[data-email-draft]' ? draft : null;
    }
  };
  const document = {
    readyState,
    addEventListener(type, callback) { documentListeners.set(type, callback); },
    querySelectorAll(selector) { return selector === '[data-contact-form]' ? [form] : []; }
  };
  const location = new Proxy({}, { set() { assert.fail('Preparing a draft must not navigate'); } });
  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), {
    document,
    window: { location, open() { assert.fail('Preparing a draft must not open a window'); } },
    location,
    fetch() { assert.fail('Preparing a draft must not transmit a request'); }
  });
  return {
    controls, status, draft, documentListeners,
    get focused() { return focused; },
    get validationCount() { return validationCount; },
    ready() {
      assert.equal(typeof documentListeners.get('DOMContentLoaded'), 'function', 'initialization must wait for DOMContentLoaded');
      documentListeners.get('DOMContentLoaded')();
    },
    input(name, value) {
      controls[name].value = value;
      if (listeners.has('input')) listeners.get('input')({ target: controls[name], bubbles: true });
    },
    nativeInvalid(name) {
      // Native invalid events do not bubble from a control to its form.
      if (listeners.has('invalid') && captures.get('invalid')) {
        listeners.get('invalid')({ target: controls[name], bubbles: false });
      }
    },
    submit() {
      let prevented = false;
      assert.equal(typeof listeners.get('submit'), 'function', 'contact form must handle submit');
      listeners.get('submit')({ preventDefault() { prevented = true; } });
      assert.ok(prevented, 'draft preparation must prevent the default form request');
    }
  };
}

test('valid browser submission prepares and focuses an explicit draft link without opening or sending it', () => {
  const fixture = browserFixture();
  fixture.ready();
  fixture.submit();
  assert.equal(fixture.validationCount, 1);
  assert.equal(fixture.draft.hidden, false);
  assert.equal(fixture.draft.textContent, 'Open email draft');
  assert.equal(new URL(fixture.draft.href).pathname, 'spcf.ictdu@spcf.edu.ph');
  assert.ok(fixture.focused);
  assert.match(fixture.status.textContent, /review/i);
  assert.match(fixture.status.textContent, /send.*email app|email app.*send/i);
  assert.match(fixture.status.textContent, /no message has been sent|nothing has been sent|message has not been sent/i);
  assert.deepEqual(Object.fromEntries(Object.entries(fixture.controls).map(([name, control]) => [name, control.value])), validFields);
});

test('invalid browser submission uses native validation and leaves the draft unavailable', () => {
  const fixture = browserFixture({ validity: false, fields: { name: '', email: 'invalid', subject: '', message: '' } });
  fixture.ready();
  fixture.submit();
  assert.equal(fixture.validationCount, 1);
  assert.equal(fixture.draft.hidden, true);
  assert.equal(fixture.draft.href, '');
  assert.equal(fixture.focused, false);
  assert.match(fixture.status.textContent, /required|valid email/i);
});

test('invalid draft configuration reports an actionable error without exposing a draft', () => {
  const fixture = browserFixture({ recipient: '' });
  fixture.ready();
  fixture.submit();
  assert.equal(fixture.draft.hidden, true);
  assert.equal(fixture.draft.href, '');
  assert.equal(fixture.focused, false);
  assert.match(fixture.status.textContent, /recipient/i);
});

test('contact forms initialize when the script loads after DOMContentLoaded', () => {
  const fixture = browserFixture({ readyState: 'complete' });
  fixture.submit();
  assert.equal(fixture.draft.hidden, false);
});

test('editing a prepared draft hides its outdated link and clears its ready status', () => {
  const fixture = browserFixture();
  fixture.ready();
  fixture.submit();
  assert.equal(fixture.draft.hidden, false);
  fixture.input('message', 'Updated question with new details.');
  assert.equal(fixture.draft.hidden, true);
  assert.equal(fixture.draft.href, '');
  assert.equal(fixture.status.textContent, '');
  assert.equal(fixture.controls.message.value, 'Updated question with new details.');
  fixture.submit();
  assert.equal(new URL(fixture.draft.href).searchParams.get('body'), 'Name: Alex Reyes\r\nEmail: alex@example.com\r\n\r\nUpdated question with new details.');
});

test('native invalid events clear a prepared draft even when validation prevents submit', () => {
  const fixture = browserFixture();
  fixture.ready();
  fixture.submit();
  assert.equal(fixture.draft.hidden, false);
  fixture.controls.email.value = '';
  fixture.nativeInvalid('email');
  assert.equal(fixture.draft.hidden, true);
  assert.equal(fixture.draft.href, '');
  assert.equal(fixture.status.textContent, '');
  assert.equal(fixture.controls.email.value, '');
});
