// Retrieve saved walks from localStorage
let savedWalks = JSON.parse(localStorage.getItem('savedWalks')) || [];

// DOM Elements
const walkList = document.getElementById('walk-list');
const searchWalksInput = document.getElementById('search-walks');
const walkComparison = document.getElementById('walk-comparison');
const compareResults = document.getElementById('compare-results');
const closeComparisonBtn = document.getElementById('close-comparison');

// Display the list of walks
function displayWalks(walks) {
    walkList.innerHTML = ''; // Clear the existing list

    walks.forEach((walk, index) => {
        // Create the walk item element
        const walkItem = document.createElement('div');
        walkItem.classList.add('walk-item');

        walkItem.innerHTML = `
            <div>
                <h3>Walk on ${walk.date}</h3>
                <p>Distance: ${walk.distance} km</p>
                <p>Time: ${walk.time}</p>
            </div>
            <div class="walk-actions">
                <button class="view-walk-btn" data-index="${index}">View Route</button>
                <button class="compare-walk-btn" data-index="${index}">Compare</button>
                <button class="delete-walk-btn" data-index="${index}">Delete</button>
            </div>
        `;

        walkList.appendChild(walkItem);
    });

    // Attach event listeners to the buttons
    attachEventListeners();
}

// Attach event listeners to the buttons (view, compare, delete)
function attachEventListeners() {
    document.querySelectorAll('.view-walk-btn').forEach(button => {
        button.addEventListener('click', viewWalkRoute);
    });

    document.querySelectorAll('.compare-walk-btn').forEach(button => {
        button.addEventListener('click', addToComparison);
    });

    document.querySelectorAll('.delete-walk-btn').forEach(button => {
        button.addEventListener('click', deleteWalk);
    });
}

// View walk route on the map
function viewWalkRoute(event) {
    const walkIndex = event.target.getAttribute('data-index');
    const walk = savedWalks[walkIndex];

    // Check if a map already exists, if so, remove it
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.remove();  // Remove the old map container
    }

    // Create a new map container
    const newMap = document.createElement('div');
    newMap.id = 'map';
    newMap.style.height = '400px';
    walkList.appendChild(newMap);

    // Initialize and show map with the walk route
    const map = L.map('map').setView(walk.route[0], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
    L.polyline(walk.route, { color: '#ff66b2' }).addTo(map);
}

// Add walk to comparison
let compareList = [];

function addToComparison(event) {
    const walkIndex = event.target.getAttribute('data-index');
    const walk = savedWalks[walkIndex];

    compareList.push(walk);

    // If two or more walks are selected, display the comparison
    if (compareList.length >= 2) {
        displayComparison();
    }
}

// Display comparison between walks
function displayComparison() {
    walkComparison.classList.remove('hidden'); // Show comparison section
    compareResults.innerHTML = ''; // Clear previous comparison

    compareList.forEach(walk => {
        const comparisonItem = document.createElement('div');
        comparisonItem.classList.add('comparison-item');

        comparisonItem.innerHTML = `
            <h3>Walk on ${walk.date}</h3>
            <p>Distance: ${walk.distance} km</p>
            <p>Time: ${walk.time}</p>
        `;

        compareResults.appendChild(comparisonItem);
    });

    // Clear comparison list after displaying
    compareList = [];
}

// Delete a walk
function deleteWalk(event) {
    const walkIndex = event.target.getAttribute('data-index');
    savedWalks.splice(walkIndex, 1); // Remove the walk from the array

    // Save the updated list back to localStorage
    localStorage.setItem('savedWalks', JSON.stringify(savedWalks));

    // Re-display the updated list
    displayWalks(savedWalks);
}

// Search/filter walks based on the search input
searchWalksInput.addEventListener('input', function () {
    const searchQuery = searchWalksInput.value.toLowerCase();
    const filteredWalks = savedWalks.filter(walk => {
        return walk.date.toLowerCase().includes(searchQuery) ||
               walk.distance.toString().includes(searchQuery) ||
               walk.time.toLowerCase().includes(searchQuery);
    });

    displayWalks(filteredWalks);
});

// Close comparison section
closeComparisonBtn.addEventListener('click', function () {
    walkComparison.classList.add('hidden');
});

// Initial display of saved walks
displayWalks(savedWalks);
