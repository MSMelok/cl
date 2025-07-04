document.addEventListener('DOMContentLoaded', () => {
    // Mark document as ready for animations and transitions immediately
    document.body.classList.add('ready');

    // DOM elements - cache references to avoid repeated queries
    const searchInput = document.getElementById('searchInput');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const cards = document.querySelectorAll('.card');
    const themeToggle = document.getElementById('theme-toggle');
    const clockElement = document.getElementById('clock');

    // Info modal elements
    const infoButton = document.getElementById('info-button');
    const infoModal = document.getElementById('info-modal');
    const infoModalOverlay = document.getElementById('info-modal-overlay');
    const closeModalButton = document.getElementById('close-modal');

    // Password modal elements
    const passwordModalOverlay = document.getElementById('password-modal-overlay');
    const passwordModal = document.getElementById('password-modal');
    const passwordModalClose = document.getElementById('password-modal-close');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordError = document.getElementById('password-error');

    // Protected content state
    let currentProtectedUrl = null;

    // State variables
    let currentCategory = 'all';
    let searchTerm = '';
    let searchTimeout;
    let clockUpdateInterval;

    // Card data cache for faster filtering
    const cardData = Array.from(cards).map(card => {
        return {
            element: card,
            text: card.textContent.toLowerCase(),
            searchTerms: (card.dataset.search || '').toLowerCase(),
            category: card.dataset.category || '',
            status: card.dataset.status || '',
            visible: true
        };
    });

    // Initialize the app
    initializeApp();

    /**
     * Initialize all app features with performance optimizations
     */
    function initializeApp() {
        // Run non-UI critical tasks immediately
        initializeTheme();
        updateClock();
        updateCategoryCounts();

        // Use requestAnimationFrame for smoother UI updates and better frame rendering
        requestAnimationFrame(() => {
            // Once the frame is ready, set up the UI
            setupEventListeners();

            // Delay heavy operations slightly to prioritize initial render
            setTimeout(() => {
                filterCards();
                checkModalState();
            }, 100);
        });

        // Set clock interval (update every minute instead of every second for better performance)
        clockUpdateInterval = setInterval(updateClock, 60000);

        // Add event listener for page visibility changes to save resources when tab is inactive
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    /**
     * Handle page visibility changes to save resources
     */
    function handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, clear interval to save resources
            clearInterval(clockUpdateInterval);
        } else {
            // Page is visible again, update clock and restart interval
            updateClock();
            clockUpdateInterval = setInterval(updateClock, 60000);
        }
    }

    /**
     * Initialize theme from localStorage
     */
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Theme toggle
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });

        // Category filtering
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                currentCategory = button.dataset.category;
                filterCards(searchInput.value);
                updateCategoryCounts();
            });
        });

        // Search functionality
        searchInput.addEventListener('input', debounce((e) => {
            filterCards(e.target.value);
        }, 300));

        // Prevent form submission
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });

        // Info button and modal functionality
        if (infoButton) {
            infoButton.addEventListener('click', () => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'info_button_click', {
                        event_category: 'interaction',
                        event_label: 'Tool Info Floating Button',
                        value: 1
                    });
                }
                openModal();
            });
        }

        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeModal);
        }

        if (infoModalOverlay) {
            infoModalOverlay.addEventListener('click', (e) => {
                if (e.target === infoModalOverlay) {
                    closeModal();
                }
            });
        }

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && infoModalOverlay && !infoModalOverlay.classList.contains('hidden')) {
                closeModal();
            }
        });

        // Add keyboard navigation for cards and handle protected links
        cards.forEach(card => {
            const link = card.querySelector('a');
            if (link) {
                // Handle protected links
                if (card.dataset.protected === 'true') {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        currentProtectedUrl = card.dataset.url;
                        openPasswordModal();
                    });
                }

                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        link.click();
                    }
                });
                card.setAttribute('tabindex', '0');
            }
        });

        // Password modal event listeners
        if (passwordModalClose) {
            passwordModalClose.addEventListener('click', closePasswordModal);
        }

        if (passwordModalOverlay) {
            passwordModalOverlay.addEventListener('click', (e) => {
                if (e.target === passwordModalOverlay) {
                    closePasswordModal();
                }
            });
        }

        if (passwordSubmit) {
            passwordSubmit.addEventListener('click', handlePasswordSubmit);
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePasswordSubmit();
                }
            });
        }
    }

    /**
     * Set theme and save preference
     * @param {string} theme - Theme name (light/dark)
     */
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update theme toggle icon
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * Update clock with current time
     */
    function updateClock() {
        if (!clockElement) return;

        const now = new Date();
        const options = {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        };

        const timeString = now.toLocaleString('en-US', options);
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' });

        clockElement.textContent = `${timeString} ${dayOfWeek} CLT`;
    }

    /**
     * Update category counts based on current filters
     */
    function updateCategoryCounts() {
        const counts = {
            all: cardData.length,
            DU: 0,
            tools: 0,
            dashboards: 0
        };

        cardData.forEach(card => {
            const categories = card.category.toLowerCase().split(' ');

            if (categories.includes('du')) counts.DU++;
            if (categories.includes('tools')) counts.tools++;
            if (categories.includes('dashboards')) counts.dashboards++;
        });

        // Update count displays
        Object.keys(counts).forEach(category => {
            const countElement = document.getElementById(`${category}-count`);
            if (countElement) {
                countElement.textContent = counts[category];
            }
        });
    }

    /**
     * Optimized filtering function for better performance
     * @param {string} query - Search term
     */
    function filterCards(query = '') {
        // Store the search term
        searchTerm = query.toLowerCase().trim();

        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
            let visibleCount = 0;

            // Apply filter logic to each card using cached data
            cardData.forEach(card => {
                const matchesSearch = searchTerm === '' || 
                                     card.text.includes(searchTerm) ||
                                     card.searchTerms.includes(searchTerm);

                let matchesCategory = false;

                if (currentCategory === 'all') {
                    matchesCategory = true;
                } else {
                    const categories = card.category.toLowerCase().split(' ');
                    matchesCategory = categories.includes(currentCategory.toLowerCase());
                }

                const shouldBeVisible = matchesSearch && matchesCategory;

                // Only manipulate DOM if visibility changed (reduces reflows)
                if (card.visible !== shouldBeVisible) {
                    if (shouldBeVisible) {
                        card.element.classList.remove('hidden');
                        card.element.style.animation = 'fadeIn 0.3s ease-in-out';
                        visibleCount++;
                    } else {
                        card.element.classList.add('hidden');
                        card.element.style.animation = '';
                    }

                    card.visible = shouldBeVisible;
                } else if (shouldBeVisible) {
                    visibleCount++;
                }
            });

            // Show "no results" message if needed
            showNoResultsMessage(visibleCount === 0 && (searchTerm || currentCategory !== 'all'));
        });
    }

    /**
     * Show or hide no results message
     * @param {boolean} show - Whether to show the message
     */
    function showNoResultsMessage(show) {
        let noResultsElement = document.getElementById('no-results');

        if (show && !noResultsElement) {
            noResultsElement = document.createElement('div');
            noResultsElement.id = 'no-results';
            noResultsElement.className = 'no-results';
            noResultsElement.innerHTML = `
                <div class="no-results-content">
                    <i class="fas fa-search"></i>
                    <h3>No tools found</h3>
                    <p>Try adjusting your search terms or category filter.</p>
                </div>
            `;

            const grid = document.getElementById('toolsGrid');
            if (grid) {
                grid.appendChild(noResultsElement);
            }
        } else if (!show && noResultsElement) {
            noResultsElement.remove();
        }
    }

    /**
     * Debounce function to limit execution frequency
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Check if modal has been shown before
     */
    function checkModalState() {
        if (!infoModalOverlay) return;

        const hasSeenModal = localStorage.getItem('hasSeenInfoModal');

        // If first visit or modal hasn't been shown, show it automatically
        if (!hasSeenModal) {
            // Wait a bit before showing the modal on first visit
            setTimeout(() => {
                openModal();
            }, 2000);
        }
    }

    /**
     * Open info modal with animation
     */
    function openModal() {
        if (!infoModalOverlay || !infoModal) return;

        // Show the overlay first
        infoModalOverlay.classList.remove('hidden');
        infoModalOverlay.offsetHeight; // Force reflow
        infoModalOverlay.classList.add('show');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Record that user has seen the modal
        localStorage.setItem('hasSeenInfoModal', 'true');
    }

    /**
     * Close info modal with animation
     */
    function closeModal() {
        if (!infoModalOverlay || !infoModal) return;

        // Animate out the modal first
        infoModalOverlay.classList.remove('show');

        // Restore body scroll
        document.body.style.overflow = '';

        // After fade out is complete, hide the elements
        setTimeout(() => {
            infoModalOverlay.classList.add('hidden');
        }, 300);
    }

    /**
     * Add keyboard shortcuts
     */
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }

        // Ctrl/Cmd + / to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            themeToggle.click();
        }
    });

    /**
     * Open password modal
     */
    function openPasswordModal() {
        if (!passwordModalOverlay) return;

        passwordModalOverlay.classList.remove('hidden');
        passwordModalOverlay.offsetHeight; // Force reflow
        passwordModalOverlay.classList.add('show');

        // Clear previous input and error
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        if (passwordError) {
            passwordError.classList.add('hidden');
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close password modal
     */
    function closePasswordModal() {
        if (!passwordModalOverlay) return;

        passwordModalOverlay.classList.remove('show');
        document.body.style.overflow = '';

        setTimeout(() => {
            passwordModalOverlay.classList.add('hidden');
        }, 300);

        currentProtectedUrl = null;
    }

    /**
     * Handle password submission
     */
    function handlePasswordSubmit() {
        if (!passwordInput || !currentProtectedUrl) return;

        const password = passwordInput.value.trim();

        // Simple password check (in production, this would be more secure)
        if (password === 'evostatic2025' || password === 'admin123') {
            // Password correct, redirect to protected URL
            window.open(currentProtectedUrl, '_blank');
            closePasswordModal();
        } else {
            // Password incorrect, show error
            if (passwordError) {
                passwordError.classList.remove('hidden');
            }
            if (passwordInput) {
                passwordInput.select();
            }
        }
    }

    // Add CSS for fade-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .no-results {
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-secondary);
        }

        .no-results-content i {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }

        .no-results-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text);
        }

        .no-results-content p {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
    `;
    document.head.appendChild(style);
});