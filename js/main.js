(function () {
    'use strict';

    function initializePage() {
        var reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        document.querySelectorAll('[data-menu-toggle]').forEach(function (button) {
            var menu = document.getElementById(button.getAttribute('aria-controls'));
            if (!menu) return;
            function setMenuOpen(open) {
                menu.classList.toggle('show', open);
                button.classList.toggle('collapsed', !open);
                button.setAttribute('aria-expanded', String(open));
                button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
            }
            setMenuOpen(false);
            button.addEventListener('click', function () { setMenuOpen(button.getAttribute('aria-expanded') !== 'true'); });
            menu.querySelectorAll('a[href]').forEach(function (link) { link.addEventListener('click', function () { setMenuOpen(false); }); });
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
                    event.preventDefault();
                    setMenuOpen(false);
                    button.focus();
                }
            });
        });

        var stickyNavbars = document.querySelectorAll('.sticky-top');
        var backToTopLinks = document.querySelectorAll('.back-to-top');
        function updateScrollControls() {
            var position = window.scrollY || 0;
            stickyNavbars.forEach(function (navbar) {
                navbar.classList.toggle('shadow-sm', position > 300);
                navbar.style.top = '0px';
            });
            backToTopLinks.forEach(function (link) { link.style.display = position > 100 ? 'inline-flex' : 'none'; });
        }
        window.addEventListener('scroll', updateScrollControls, { passive: true });
        updateScrollControls();
        backToTopLinks.forEach(function (link) {
            link.addEventListener('click', function (event) {
                if (typeof window.scrollTo !== 'function') return;
                event.preventDefault();
                var motionIsReduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollTo({ top: 0, behavior: motionIsReduced ? 'auto' : 'smooth' });
            });
        });

        if (window.bootstrap && typeof window.bootstrap.Carousel === 'function') {
            document.querySelectorAll('.carousel').forEach(function (element) {
                var carousel = new window.bootstrap.Carousel(element, { interval: false, ride: false, keyboard: true, touch: true });
                carousel.pause();
            });
        } else {
            document.querySelectorAll('.carousel-control-prev, .carousel-control-next, .photo-controls button[data-bs-slide]').forEach(function (control) {
                control.hidden = true;
                control.disabled = true;
                control.style.display = 'none';
                control.setAttribute('aria-hidden', 'true');
            });
        }

        // These enhancements are optional; navigation and page content work without jQuery.
        var jquery = window.jQuery;
        if (jquery && jquery.fn && typeof jquery.fn.counterUp === 'function' && typeof jquery.fn.waypoint === 'function' && !reduceMotion) {
            jquery('[data-toggle="counter-up"]').counterUp({ delay: 10, time: 2000 });
        }

        document.querySelectorAll('.testimonial-carousel').forEach(function (element) {
            if (!jquery || !jquery.fn || typeof jquery.fn.owlCarousel !== 'function') {
                element.style.display = 'block';
                return;
            }
            try {
                jquery(element).owlCarousel({
                    items: 1,
                    autoplay: false,
                    smartSpeed: reduceMotion ? 0 : 1000,
                    dots: true,
                    loop: true,
                    nav: true,
                    navText: ['<span aria-hidden="true">‹</span>', '<span aria-hidden="true">›</span>']
                });
                element.querySelectorAll('.owl-prev, .owl-next').forEach(function (button) {
                    button.setAttribute('type', 'button');
                    button.removeAttribute('role');
                    button.setAttribute('aria-label', button.classList.contains('owl-prev') ? 'Previous testimonial' : 'Next testimonial');
                });
                element.querySelectorAll('.owl-dot').forEach(function (button, index) {
                    button.setAttribute('type', 'button');
                    button.setAttribute('aria-label', 'Show testimonial ' + (index + 1));
                });
            } catch (error) {
                element.style.display = 'block';
            }
        });
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePage, { once: true });
        else initializePage();
    }
}());
