(function () {
    'use strict';

    function initializeMap() {
        var mapEl = document.getElementById('map');
        if (!mapEl) return;
        var coordinates = [15.158559272278623, 120.59243595927532];
        var leaflet = window.L;

        function showMapFallback() {
            mapEl.textContent = '';
            var message = document.createElement('p');
            message.className = 'map-fallback';
            message.textContent = 'The interactive map is unavailable. ';
            var link = document.createElement('a');
            link.href = 'https://www.openstreetmap.org/?mlat=' + coordinates[0] + '&mlon=' + coordinates[1] + '#map=16/' + coordinates[0] + '/' + coordinates[1];
            link.textContent = 'View the ICTDU location on OpenStreetMap';
            message.appendChild(link);
            mapEl.appendChild(message);
        }

        if (!leaflet || typeof leaflet.map !== 'function') {
            showMapFallback();
            return;
        }
        try {
            var map = leaflet.map(mapEl, { scrollWheelZoom: false }).setView(coordinates, 16);
            leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            leaflet.marker(coordinates).addTo(map).bindPopup('ICTDU').openPopup();
        } catch (error) {
            showMapFallback();
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMap, { once: true });
        else initializeMap();
    }
}());
