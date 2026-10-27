(function () {
    'use strict';

    // Keep historical entries explicit. Add future dates only after they are confirmed.
    var EVENTS = [
        {
            id: 'research-colloquium-2024',
            title: 'Research Colloquium',
            start: '2024-05-17',
            archived: true,
            description: 'An event about innovations, research, and engaging with leading experts. This entry is retained for reference; the event has ended.'
        }
    ];

    function dateKey(value) {
        if (value instanceof Date) {
            if (isNaN(value.getTime())) return null;
            value = value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
        }
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        var parts = value.split('-').map(Number);
        var parsed = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        if (parsed.getUTCFullYear() !== parts[0] || parsed.getUTCMonth() !== parts[1] - 1 || parsed.getUTCDate() !== parts[2]) return null;
        return value;
    }

    function formatEventDate(value) {
        var key = dateKey(value);
        if (!key) return 'Date unavailable';
        return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(key + 'T00:00:00Z'));
    }

    function getEventStatus(event, today) {
        if (event.archived) return 'Archived event';
        var start = dateKey(event.start);
        var current = dateKey(today === undefined ? new Date() : today);
        if (!start || !current) return 'Date unavailable';
        return start < current ? 'Archived event' : 'Scheduled event';
    }

    function getMonthStatus(events, rangeStart, rangeEnd, today) {
        var start = dateKey(rangeStart);
        var end = dateKey(rangeEnd);
        var visible = events.filter(function (event) {
            var key = dateKey(event.start);
            return key && start && end && key >= start && key < end;
        });
        if (!visible.length) return 'No events are scheduled for this month. View the event archive below or ask about future events.';
        var archived = visible.filter(function (event) { return getEventStatus(event, today) === 'Archived event'; }).length;
        var scheduled = visible.length - archived;
        if (!scheduled) return archived + ' archived event' + (archived === 1 ? '' : 's') + ' shown for this month. View details in the event archive.';
        if (!archived) return scheduled + ' scheduled event' + (scheduled === 1 ? '' : 's') + ' shown for this month.';
        return scheduled + ' scheduled event' + (scheduled === 1 ? '' : 's') + ' and ' + archived + ' archived event' + (archived === 1 ? '' : 's') + ' shown for this month.';
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EVENTS: EVENTS, formatEventDate: formatEventDate, getEventStatus: getEventStatus, getMonthStatus: getMonthStatus };
    }

    function initializeCalendar() {
        var calendarEl = document.getElementById('calendar');
        var statusEl = document.getElementById('calendar-status');
        var modal = document.getElementById('eventModal');
        var opener = null;

        function closeDialog() {
            if (modal && modal.open) modal.close();
        }

        function openEvent(event, trigger) {
            if (!modal || typeof modal.showModal !== 'function') return;
            var title = document.getElementById('eventTitle');
            var date = document.getElementById('eventDate');
            var description = document.getElementById('eventDescription');
            var contactLink = document.getElementById('registrationLink');
            if (title) title.textContent = event.title;
            if (date) date.textContent = formatEventDate(event.start) + ' · ' + getEventStatus(event);
            if (description) description.textContent = event.description;
            if (contactLink) {
                contactLink.href = 'contact.html#contact-form';
                contactLink.textContent = 'Ask about future events';
            }
            opener = trigger || document.activeElement;
            if (!modal.open) modal.showModal();
        }

        document.querySelectorAll('[data-event-id]').forEach(function (button) {
            var event = EVENTS.find(function (entry) { return entry.id === button.getAttribute('data-event-id'); });
            if (event) button.addEventListener('click', function () { openEvent(event, button); });
        });

        if (modal) {
            modal.querySelectorAll('[data-close-dialog]').forEach(function (button) { button.addEventListener('click', closeDialog); });
            modal.addEventListener('cancel', function (event) { event.preventDefault(); closeDialog(); });
            modal.addEventListener('click', function (event) {
                if (event.target !== modal) return;
                var bounds = modal.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
            });
            modal.addEventListener('close', function () {
                if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus();
                opener = null;
            });
        }

        if (!calendarEl) return;
        function calendarUnavailable() {
            calendarEl.hidden = true;
            if (statusEl) statusEl.textContent = 'The interactive calendar is unavailable. No upcoming event dates are currently listed. You can still view the event archive below or ask about future events.';
        }
        if (!window.FullCalendar || typeof window.FullCalendar.Calendar !== 'function') {
            calendarUnavailable();
            return;
        }

        try {
            var calendar = new window.FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: EVENTS.map(function (event) {
                    return { id: event.id, title: event.title + ' (archived)', start: event.start, allDay: true };
                }),
                datesSet: function (info) {
                    if (statusEl) statusEl.textContent = getMonthStatus(EVENTS, info.view.currentStart, info.view.currentEnd);
                },
                eventClick: function (info) {
                    info.jsEvent.preventDefault();
                    var event = EVENTS.find(function (entry) { return entry.id === info.event.id; });
                    if (event) openEvent(event, info.el);
                },
                eventDidMount: function (info) {
                    var event = EVENTS.find(function (entry) { return entry.id === info.event.id; });
                    if (!event) return;
                    info.el.setAttribute('tabindex', '0');
                    info.el.setAttribute('role', 'button');
                    info.el.setAttribute('aria-label', 'View details: ' + event.title + ', ' + formatEventDate(event.start) + ', archived event');
                    info.el.addEventListener('keydown', function (keyEvent) {
                        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                            keyEvent.preventDefault();
                            openEvent(event, info.el);
                        }
                    });
                }
            });
            calendar.render();
        } catch (error) {
            calendarUnavailable();
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeCalendar, { once: true });
        else initializeCalendar();
    }
}());
