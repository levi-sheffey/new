// Retrieve the walk data from localStorage
const totalDistance = localStorage.getItem('totalDistance');
const totalTime = localStorage.getItem('totalTime');
const walkRoute = JSON.parse(localStorage.getItem('walkRoute'));

// Display the distance and time in the summary
document.getElementById('summary-distance').innerText = totalDistance;
document.getElementById('summary-time').innerText = totalTime;

// Initialize the map
const map = L.map('map').setView(walkRoute[0], 13); // Set initial view at the start of the route

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Draw the final route on the map
L.polyline(walkRoute, { color: '#ff66b2' }).addTo(map);
