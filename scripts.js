// Firebase SDKs already initialized in index.html

// Initialize Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();

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
    map.setView(latLng, 15); // Center the map on the current location

    if (previousPosition) {
        const distance = calculateDistance(previousPosition, latLng);
        totalDistance += distance;
        walkDistanceElement.innerText = totalDistance.toFixed(2); // Update the distance in km
    }

    previousPosition = latLng; // Save the current position as the previous one for the next iteration
}

// Function to calculate the distance between two coordinates (Haversine formula)
function calculateDistance(pos1, pos2) {
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = pos1[0], lon1 = pos1[1];
    const lat2 = pos2[0], lon2 = pos2[1];
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

// Convert degrees to radians
function toRad(deg) {
    return deg * Math.PI / 180;
}

// Sign-up functionality
function signUpUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert(`Welcome ${user.email}, your account has been created!`);
        })
        .catch((error) => {
            console.error(error.message);
        });
}

// Log-in functionality
function loginUser(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            alert(`Welcome back ${user.email}`);
        })
        .catch((error) => {
            console.error(error.message);
        });
}

// Log-out functionality
function logoutUser() {
    auth.signOut().then(() => {
        alert('You have been logged out.');
    }).catch((error) => {
        console.error(error.message);
    });
}

// Function to save walk to Firestore
function saveWalkToFirestore(userId, distance, time, route) {
    db.collection('walks').add({
        userId: userId,
        distance: distance,
        time: time,
        route: route,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Walk saved successfully!');
    }).catch((error) => {
        console.error('Error saving walk: ', error);
    });
}

// Function to stop tracking the walk and finalize the route
endWalkBtn.addEventListener('click', () => {
    isWalking = false;  // Stop the walking state
    clearInterval(walkInterval);  // Stop the timer

    const user = auth.currentUser; // Get the logged-in user
    if (user) {
        // Save walk details
        const time = walkTimeElement.innerText;
        saveWalkToFirestore(user.uid, totalDistance, time, route);
    } else {
        alert('Please log in to save your walk.');
    }
});

// Error handling for geolocation
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

// Authentication Modal Elements
const authModal = document.getElementById('auth-modal');
const authContainer = document.getElementById('auth-container');
const authTitle = document.getElementById('auth-title');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const closeAuth = document.getElementById('close-auth');

// Show Login Modal
document.getElementById('login-btn').addEventListener('click', () => {
    authTitle.innerText = 'Login';
    authSubmitBtn.innerText = 'Login';
    authModal.classList.add('show');
});

// Show Sign Up Modal
document.getElementById('signup-btn').addEventListener('click', () => {
    authTitle.innerText = 'Sign Up';
    authSubmitBtn.innerText = 'Sign Up';
    authModal.classList.add('show');
});

// Close Modal
closeAuth.addEventListener('click', () => {
    authModal.classList.remove('show');
});

// Handle Authentication Submit
authSubmitBtn.addEventListener('click', () => {
    const email = authEmail.value;
    const password = authPassword.value;

    if (authTitle.innerText === 'Login') {
        // Login User
        loginUser(email, password);
    } else {
        // Sign Up User
        signUpUser(email, password);
    }

    // Clear inputs and close modal
    authEmail.value = '';
    authPassword.value = '';
    authModal.classList.remove('show');
});

// Authentication Functions
function signUpUser(email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert(`Welcome ${userCredential.user.email}, your account has been created!`);
        })
        .catch((error) => {
            alert(error.message);
        });
}

function loginUser(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert(`Welcome back ${userCredential.user.email}`);
        })
        .catch((error) => {
            alert(error.message);
        });
}
