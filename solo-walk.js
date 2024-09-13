// Firebase setup for authentication and storage
const storage = firebase.storage();
const auth = firebase.auth();
const db = firebase.firestore();

let isWalking = false;
let startTime, walkInterval;
let totalDistance = 0;
let previousPosition = null;
let route = [];

const countdownElement = document.getElementById('countdown');
const walkDistanceElement = document.getElementById('walk-distance');
const walkTimeElement = document.getElementById('walk-time');
const endWalkBtn = document.getElementById('end-walk-btn');
const walkDetailsSection = document.getElementById('walk-details');
const pageTitle = document.getElementById('page-title'); // Title reference
const screenshotElement = document.getElementById('screenshot');

// Countdown before starting the walk
let countdownNumber = 3;

const countdownInterval = setInterval(() => {
    countdownNumber--;
    countdownElement.textContent = countdownNumber;
    if (countdownNumber <= 0) {
        clearInterval(countdownInterval);
        countdownElement.style.display = 'none'; // Hide countdown text
        document.getElementById('map').style.display = 'block'; // Show the map
        endWalkBtn.style.display = 'inline-block'; // Show the End Walk button
        pageTitle.textContent = "HOT GIRLS WALK"; // Change the page title

        // Initialize the map and start tracking the walk
        initializeMapAndStartTracking();
    }
}, 1000);

// Initialize the map and track the user's location
function initializeMapAndStartTracking() {
    const map = L.map('map').setView([51.505, -0.09], 13); // Center map initially
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    const routePolyline = L.polyline([], { color: '#ff66b2' }).addTo(map); // Initialize route

    isWalking = true;
    startTime = Date.now();
    walkInterval = setInterval(updateWalkTime, 1000);

    // Start tracking location
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            const latLng = [position.coords.latitude, position.coords.longitude];

            // Update map view and route
            map.setView(latLng, 15);
            routePolyline.addLatLng(latLng);

            // Calculate distance if there's a previous position
            if (previousPosition) {
                const distance = calculateDistance(previousPosition, latLng);
                totalDistance += distance;
                walkDistanceElement.innerText = totalDistance.toFixed(2); // Update distance in km
            }

            previousPosition = latLng;
        }, showError, { enableHighAccuracy: true });
    } else {
        alert("Geolocation is not supported by your browser.");
    }

    // Store map instance for later use
    window.mapInstance = map;
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

// Function to calculate the distance between two coordinates (Haversine formula)
function calculateDistance(pos1, pos2) {
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = pos1[0], lon1 = pos1[1];
    const lat2 = pos2[0], lon2 = pos2[1];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Handle geolocation errors
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

// End walk functionality
endWalkBtn.addEventListener('click', () => {
    isWalking = false;
    clearInterval(walkInterval);

    // Show walk details and hide the map and end button
    document.getElementById('map').style.display = 'none';
    endWalkBtn.style.display = 'none';
    walkDetailsSection.style.display = 'block';

    // Capture the map using Leaflet Image Export (leaflet-image.js)
    leafletImage(window.mapInstance, function(err, canvas) {
        if (err) {
            console.error("Error capturing map image:", err);
            return;
        }
        const screenshotDataUrl = canvas.toDataURL('image/png');
        screenshotElement.src = screenshotDataUrl;
        screenshotElement.style.display = 'block'; // Show screenshot

        const user = auth.currentUser; // Get the logged-in user
        if (user) {
            const time = walkTimeElement.innerText;
            saveWalkToFirestore(user.uid, totalDistance, time, screenshotDataUrl);
        } else {
            alert('Please log in to save your walk.');
        }
    });
});

// Function to save walk data and screenshot to Firestore
function saveWalkToFirestore(userId, distance, time, screenshot) {
    const storageRef = storage.ref();
    const screenshotRef = storageRef.child(`screenshots/${userId}_${Date.now()}.png`);

    // Convert data URL to Blob for upload
    fetch(screenshot)
        .then(res => res.blob())
        .then(blob => {
            return screenshotRef.put(blob); // Upload the screenshot blob to Firebase Storage
        })
        .then(snapshot => {
            return screenshotRef.getDownloadURL(); // Get the download URL of the uploaded screenshot
        })
        .then(downloadURL => {
            // Save the walk data and screenshot URL to Firestore
            db.collection('walks').add({
                userId: userId,
                distance: distance,
                time: time,
                screenshotUrl: downloadURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            }).then(() => {
                console.log("Walk data and screenshot saved successfully!");
            }).catch(error => {
                console.error("Error saving walk to Firestore: ", error);
            });
        });
}
