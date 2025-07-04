document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const cards = document.querySelectorAll('.card');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const clockElement = document.getElementById('clock');
    let currentCategory = 'all';

    // Theme handling
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Clock functionality
    function updateClock() {
        const now = new Date();
        const options = {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        };
        clockElement.textContent = now.toLocaleString('en-US', options) + ' CLT';
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Enhanced search functionality
    function filterCards(searchTerm = '') {
        searchTerm = searchTerm.toLowerCase().trim();

        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const matchesSearch = cardText.includes(searchTerm);

            // Show cards that match the search term, regardless of the selected category
            if (matchesSearch) {
                card.classList.remove('hidden');
                card.style.animation = 'none';
                card.offsetHeight; // Trigger reflow
                card.style.animation = null;
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // Category filtering
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentCategory = button.dataset.category;

            // Filter by category only when no search term is entered
            if (!searchInput.value.trim()) {
                cards.forEach(card => {
                    const category = card.dataset.category;
                    if (currentCategory === 'all' || category === currentCategory) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            }
        });
    });

    // Password protection for "Shared Services" category (custom modal)
    const sharedServicesPassword = "Dstx07804";
    let pendingSharedLink = null;

    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    const passwordError = document.getElementById('password-error');

    // Show modal and focus input
    function showPasswordModal(link) {
        pendingSharedLink = link;
        passwordModal.classList.remove('hidden');
        passwordInput.value = '';
        passwordError.textContent = '';
        setTimeout(() => passwordInput.focus(), 100);
    }

    // Hide modal
    function hidePasswordModal() {
        passwordModal.classList.add('hidden');
        pendingSharedLink = null;
        passwordInput.value = '';
        passwordError.textContent = '';
    }

    // Handle submit
    passwordSubmit.addEventListener('click', () => {
        if (passwordInput.value === sharedServicesPassword) {
            if (pendingSharedLink) {
                const url = pendingSharedLink.href.trim();
                // Simulate a user click to avoid popup blockers
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            hidePasswordModal();
        } else {
            passwordError.textContent = "Incorrect password. Please refer back to Friday.";
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Handle cancel
    passwordCancel.addEventListener('click', hidePasswordModal);

    // Handle Enter key in input
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordSubmit.click();
    });

    // Intercept shared services links
    document.querySelectorAll('.card[data-category="shared services"] a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPasswordModal(this);
        });
    });

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Search input handler
    searchInput.addEventListener('input', debounce((e) => {
        filterCards(e.target.value);
    }, 300));

    // Prevent form submission
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') e.preventDefault();
    });

    // Initialize with all cards visible
    filterCards();
});