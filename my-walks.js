<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Walks</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
</head>
<body>

    <!-- Header Section -->
    <header>
        <h1>My Walks</h1>
    </header>

    <!-- Home Button -->
    <div id="home-button-container">
        <a href="index.html" class="home-button">Go to Home</a>
    </div>

    <main>
        <!-- Search/Filter Section -->
        <section id="search-filter">
            <input type="text" id="search-walks" placeholder="Search walks by date, distance, or time">
        </section>

        <!-- List of Walks -->
        <section id="walk-list">
            <!-- Walks will be dynamically added here -->
        </section>

        <!-- Comparison Section -->
        <section id="walk-comparison" class="hidden">
            <h2>Compare Walks</h2>
            <div id="compare-results">
                <!-- Comparison details will be dynamically added here -->
            </div>
            <button id="close-comparison">Close Comparison</button>
        </section>

    </main>

    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>
        const walksContainer = document.getElementById('walk-list');
        const searchWalks = document.getElementById('search-walks');

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Fetch and display walks from Firestore
                db.collection('walks').where('userId', '==', user.uid).orderBy('timestamp', 'desc')
                .get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        const walk = doc.data();
                        const walkElement = createWalkElement(walk);
                        walksContainer.appendChild(walkElement);
                    });
                }).catch(error => {
                    console.error("Error retrieving walks: ", error);
                });
            } else {
                alert('Please log in to view your walks.');
            }
        });

        function createWalkElement(walk) {
            const walkElement = document.createElement('div');
            walkElement.className = 'walk-entry';

            // Convert Firestore timestamp to Date
            const walkDate = new Date(walk.timestamp.seconds * 1000).toLocaleString();

            // Walk details template
            walkElement.innerHTML = `
                <h3>Walk on ${walkDate}</h3>
                <p>Total Distance: ${walk.distance} km</p>
                <p>Total Time: ${walk.time}</p>
                <img src="${walk.screenshot}" alt="Walked Route" style="width:100%;max-width:400px;border-radius:10px;">
            `;

            return walkElement;
        }

        // Search functionality
        searchWalks.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const walks = document.querySelectorAll('.walk-entry');

            walks.forEach(walk => {
                const text = walk.innerText.toLowerCase();
                walk.style.display = text.includes(query) ? '' : 'none';
            });
        });
    </script>

</body>
</html>
