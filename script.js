function updateTime() {
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');

    const now = new Date();

    // Time format: 12:00
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}`;

    // Date format: Day, Month Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Update time every second
setInterval(updateTime, 1000);
updateTime();

// Add some dynamic update items
const updatesList = document.getElementById('updates-list');
const sampleUpdates = [
    { title: "Weekly Report", desc: "Your summary is ready for review.", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=150&q=80" },
    { title: "Network Status", desc: "All systems are operational.", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&w=150&q=80" },
    { title: "Upcoming Meeting", desc: "Product sync at 2:00 PM.", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=150&q=80" }
];

function populateUpdates() {
    // Clear existing (except the first one if we wanted, but we'll just replace)
    updatesList.innerHTML = '';

    sampleUpdates.forEach((update, index) => {
        const card = document.createElement('div');
        card.className = 'update-card';
        card.innerHTML = `
            <div class="update-img" style="background-image: url('${update.img}')"></div>
            <div class="update-info">
                <h4>${update.title}</h4>
                <p>${update.desc}</p>
            </div>
        `;
        updatesList.appendChild(card);
    });
}

populateUpdates();

// Auto-scroll logic for digital signage (since it's non-interactive)
function autoScroll() {
    const content = document.querySelector('.content');
    let scrollStep = 1;
    let scrollInterval = 50; // ms

    setInterval(() => {
        if (content.scrollTop + content.clientHeight >= content.scrollHeight) {
            // Reset to top when reached bottom
            setTimeout(() => {
                content.scrollTo({ top: 0, behavior: 'smooth' });
            }, 2000);
        } else {
            content.scrollTop += scrollStep;
        }
    }, scrollInterval);
}

// Only auto-scroll if it's longer than the viewport
window.onload = () => {
    const content = document.querySelector('.content');
    if (content.scrollHeight > content.clientHeight) {
        // Wait a bit before starting auto-scroll
        setTimeout(autoScroll, 3000);
    }
};
