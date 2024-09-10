// Variables to track the walk state
let isWalking = false;
let startTime, walkInterval;
let totalDistance = 0;
let previousPosition = null;
let route = [];

// Element references
const soloWalkBtn = document.getElementById('solo-walk');
const endWalkBtn = document.getElementById('end-walk-btn');
const walkInfoSection = document.getElementById('walk-info');
const walkDistanceElement = document.getElementById('walk-distance');
const walkTimeElement = document.getElementById('walk-time');

// Map setup
let map, polyline;

// Initialize the map
function initializeMap() {
    map = L.map('map').setView([51.505, -0.09], 13); // Center map initially
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
    polyline = L.polyline([], { color: '#ff66b2' }).addTo(map); // Initialize an empty polyline
}

// Function to start the solo walk
soloWalkBtn.addEventListener('click', () => {
    if (!map) initializeMap(); // Initialize the map if it hasn't been already
    walkInfoSection.classList.remove('hidden'); // Show map and walk details
    startWalk();
});

// Function to start tracking the walk
function startWalk() {
    isWalking = true;
    startTime = Date.now();
    totalDistance = 0;
    previousPosition = null;
    route = [];

    // Start updating the time
    walkInterval = setInterval(updateWalkTime, 1000);

    // Start tracking the location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateWalkLocation, showError, { enableHighAccuracy: true });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Function to update the walk time
function updateWalkTime() {
    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor(elapsedTime / 1000);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    walkTimeElement.innerText = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// Helper function to pad time values (e.g., "01", "09")
function pad(value) {
    return String(value).padStart(2, '0');
}

// Function to update the walk location and route
function updateWalkLocation(position) {
    const latLng = [position.coords.latitude, position.coords.longitude];
    route.push(latLng);
    polyline.setLatLngs(route); // Update the route on the map
    map.setView(latLng, 15); //
