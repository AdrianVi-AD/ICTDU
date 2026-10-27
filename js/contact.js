(function () {
    'use strict';

    function buildMailto(fields, recipient) {
        if (!fields || typeof fields !== 'object') {
            throw new Error('Contact fields are required.');
        }

        ['name', 'email', 'subject', 'message'].forEach(function (field) {
            if (typeof fields[field] !== 'string' || !fields[field].trim()) {
                throw new Error('Please enter your ' + field + '.');
            }
        });

        var emailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
        var email = fields.email.trim();
        if (!emailPattern.test(email)) {
            throw new Error('Please enter a valid email address.');
        }
        if (typeof recipient !== 'string' || !emailPattern.test(recipient.trim())) {
            throw new Error('A valid recipient email address is required.');
        }

        var subject = fields.subject.replace(/[\r\n]+/g, ' ').trim();
        var message = fields.message.replace(/\r\n|\r|\n/g, '\r\n');
        var body = 'Name: ' + fields.name.trim() + '\r\nEmail: ' + email + '\r\n\r\n' + message;
        var address = encodeURIComponent(recipient.trim()).replace(/%40/g, '@');
        return 'mailto:' + address + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    function initializeContactForms() {
        document.querySelectorAll('[data-contact-form]').forEach(function (form) {
            var status = form.querySelector('[data-form-status]');
            var draft = form.querySelector('[data-email-draft]');

            function clearDraft() {
                if (draft) {
                    draft.hidden = true;
                    draft.removeAttribute('href');
                }
                if (status) status.textContent = '';
            }

            form.addEventListener('input', clearDraft);
            // Invalid events do not bubble; capture them before native validation blocks submit.
            form.addEventListener('invalid', clearDraft, true);

            form.addEventListener('submit', function (event) {
                event.preventDefault();
                if (!status || !draft) return;

                clearDraft();
                if (!form.reportValidity()) {
                    status.textContent = 'Please complete all required fields and enter a valid email address.';
                    return;
                }

                var fields = {};
                ['name', 'email', 'subject', 'message'].forEach(function (name) {
                    var control = form.elements.namedItem(name);
                    fields[name] = control ? control.value : '';
                });

                try {
                    draft.href = buildMailto(fields, form.dataset.recipient);
                    draft.textContent = 'Open email draft';
                    draft.hidden = false;
                    status.textContent = 'Your email draft is ready. Open it in your email app, review it, and send it there. No message has been sent by this website.';
                    draft.focus();
                } catch (error) {
                    status.textContent = 'Could not prepare an email draft. ' + error.message;
                }
            });
        });
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = { buildMailto: buildMailto };
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeContactForms, { once: true });
        } else {
            initializeContactForms();
        }
    }
})();
