document.addEventListener("DOMContentLoaded", () => {
    const scrollWheel = document.querySelector(".scroll-wheel");
    const items = document.querySelectorAll(".scroll-item");
  
    let totalHeight = 0;
    items.forEach(item => {
      totalHeight += item.offsetHeight;
    });
  
    scrollWheel.style.height = `${totalHeight}px`;
  });

  var map = L.map('map').setView([51.505, -0.09], 13);

  // Add a tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add a marker
  var marker = L.marker([15.158559272278623, 120.59243595927532]).addTo(map)
      .bindPopup('ICTDU.')
      .openPopup();