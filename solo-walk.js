// Solo Walk Script for tracking, ending walk, and screenshot capture

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

    // Refresh the map and capture screenshot after delay
    setTimeout(() => {
        map.invalidateSize(true);
        captureScreenshot();  // Screenshot capture after refresh
    }, 1000);
});

// Function to capture the screenshot
function captureScreenshot() {
    html2canvas(document.body).then(canvas => {
        const screenshotDataUrl = canvas.toDataURL('image/png');
        console.log("Screenshot captured!");
        
        // Display captured image (for testing)
        const imgElement = document.createElement('img');
        imgElement.src = screenshotDataUrl;
        document.body.appendChild(imgElement);
        
        saveScreenshotToFirestore(screenshotDataUrl);
    });
}

// Save the screenshot to Firestore (optional)
function saveScreenshotToFirestore(imageDataUrl) {
    const user = auth.currentUser;
    if (user) {
        db.collection('walks').add({
            userId: user.uid,
            image: imageDataUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Screenshot saved to Firestore");
        }).catch(error => {
            console.error("Error saving screenshot: ", error);
        });
    } else {
        console.log("User not logged in, cannot save screenshot");
    }
}
