// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initializeApp();
});

// Application state
const AppState = {
    currentCategory: 'all',
    searchTerm: '',
    isPasswordModalOpen: false,
    pendingLink: null,
    tools: [],
    categoryCounts: {}
};

// Configuration
const Config = {
    sharedServicesPassword: 'Dstx07804',
    clockUpdateInterval: 1000,
    searchDebounceDelay: 300,
    animationDuration: 300
};

// Initialize application
function initializeApp() {
    // Initialize components
    initializeTheme();
    initializeClock();
    initializeSearch();
    initializeCategories();
    initializeTools();
    initializeModal();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderTools();
    updateCategoryCounts();
}

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update icons
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }
    
    // Theme toggle event
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

// Clock Management
function initializeClock() {
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    
    function updateClock() {
        const now = new Date();
        const timeOptions = {
            timeZone: 'Africa/Cairo',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        const dateOptions = {
            timeZone: 'Africa/Cairo',
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        };
        
        clockTime.textContent = now.toLocaleString('en-US', timeOptions);
        clockDate.textContent = `${now.toLocaleString('en-US', dateOptions)} CLT`;
    }
    
    // Update immediately and then every second
    updateClock();
    setInterval(updateClock, Config.clockUpdateInterval);
}

// Search Management
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    if (!searchInput) {
        console.error('Search input not found');
        return;
    }
    
    // Debounced search function
    function handleSearch(value) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            AppState.searchTerm = value.toLowerCase().trim();
            renderTools();
            updateCategoryCounts();
        }, Config.searchDebounceDelay);
    }
    
    // Search input event
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    
    // Prevent form submission
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
}

// Category Management
function initializeCategories() {
    const categoryPills = document.querySelectorAll('.category-pill');
    
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Remove active class from all pills
            categoryPills.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked pill
            pill.classList.add('active');
            
            // Update app state
            AppState.currentCategory = pill.dataset.category;
            
            // Re-render tools
            renderTools();
        });
    });
}

// Tools Management
function initializeTools() {
    const toolCards = document.querySelectorAll('.tool-card');
    
    // Convert NodeList to array and store in app state
    AppState.tools = Array.from(toolCards).map(card => ({
        element: card,
        category: card.dataset.category,
        title: card.querySelector('.tool-title').textContent.toLowerCase(),
        tags: Array.from(card.querySelectorAll('.meta-tag')).map(tag => tag.textContent.toLowerCase()),
        isSharedService: card.dataset.category === 'shared services'
    }));
    
    // Set up shared services password protection
    setupSharedServicesProtection();
}

// Shared Services Protection
function setupSharedServicesProtection() {
    const sharedServiceCards = document.querySelectorAll('.tool-card[data-category="shared services"]');
    
    sharedServiceCards.forEach(card => {
        const link = card.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                AppState.pendingLink = link;
                openPasswordModal();
            });
        }
    });
}

// Modal Management
function initializeModal() {
    const modal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordReveal = document.getElementById('password-reveal');
    const eyeIcon = passwordReveal.querySelector('.eye-icon');
    const eyeOffIcon = passwordReveal.querySelector('.eye-off-icon');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSubmit = document.getElementById('modal-submit');
    const errorMessage = document.getElementById('error-message');
    
    // Password reveal toggle
    passwordReveal.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.style.display = isPassword ? 'none' : 'block';
        eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    });
    
    // Modal close events
    modalClose.addEventListener('click', closePasswordModal);
    modalCancel.addEventListener('click', closePasswordModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePasswordModal();
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && AppState.isPasswordModalOpen) {
            closePasswordModal();
        }
    });
    
    // Password submission
    modalSubmit.addEventListener('click', handlePasswordSubmit);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    });
    
    function handlePasswordSubmit() {
        const password = passwordInput.value.trim();
        
        if (password === Config.sharedServicesPassword) {
            // Correct password
            if (AppState.pendingLink) {
                // Open the link in new tab
                window.open(AppState.pendingLink.href, '_blank', 'noopener,noreferrer');
            }
            closePasswordModal();
        } else {
            // Incorrect password
            errorMessage.textContent = 'Incorrect password. Please refer back to Friday.';
            passwordInput.value = '';
            passwordInput.focus();
            
            // Add shake animation
            passwordInput.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    }
}

// Modal Controls
function openPasswordModal() {
    const modal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');
    
    AppState.isPasswordModalOpen = true;
    modal.classList.remove('hidden');
    
    // Clear previous state
    passwordInput.value = '';
    passwordInput.type = 'password';
    errorMessage.textContent = '';
    
    // Focus input after animation
    setTimeout(() => {
        passwordInput.focus();
    }, 150);
}

function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    
    AppState.isPasswordModalOpen = false;
    modal.classList.add('hidden');
    AppState.pendingLink = null;
}

// Render Tools
function renderTools() {
    const toolsGrid = document.getElementById('tools-grid');
    const emptyState = document.getElementById('empty-state');
    let visibleCount = 0;
    
    AppState.tools.forEach(tool => {
        const isVisible = shouldShowTool(tool);
        
        if (isVisible) {
            tool.element.style.display = 'block';
            visibleCount++;
        } else {
            tool.element.style.display = 'none';
        }
    });
    
    // Show/hide empty state
    if (visibleCount === 0) {
        emptyState.style.display = 'block';
        toolsGrid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        toolsGrid.style.display = 'grid';
    }
}

// Tool Visibility Logic
function shouldShowTool(tool) {
    // Category filter
    const categoryMatch = AppState.currentCategory === 'all' || tool.category === AppState.currentCategory;
    
    // Search filter
    const searchMatch = !AppState.searchTerm || 
        tool.title.includes(AppState.searchTerm) ||
        tool.tags.some(tag => tag.includes(AppState.searchTerm));
    
    return categoryMatch && searchMatch;
}

// Update Category Counts
function updateCategoryCounts() {
    const counts = {
        all: 0,
        'Monitoring Forms': 0,
        'Automated Submissions': 0,
        'Dashboards': 0,
        'Tools': 0,
        'shared services': 0
    };
    
    AppState.tools.forEach(tool => {
        if (shouldShowTool(tool)) {
            counts.all++;
            if (counts.hasOwnProperty(tool.category)) {
                counts[tool.category]++;
            }
        }
    });
    
    // Update count displays
    const countElements = {
        'count-all': counts.all,
        'count-monitoring': counts['Monitoring Forms'],
        'count-automation': counts['Automated Submissions'],
        'count-analytics': counts['Dashboards'],
        'count-utilities': counts['Tools']
    };
    
    Object.entries(countElements).forEach(([id, count]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = count;
        }
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        // Any resize-specific logic here
    }, 250));
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Update clock when tab becomes visible
            const clockTime = document.getElementById('clock-time');
            const clockDate = document.getElementById('clock-date');
            
            const now = new Date();
            const timeOptions = {
                timeZone: 'Africa/Cairo',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            
            const dateOptions = {
                timeZone: 'Africa/Cairo',
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            };
            
            clockTime.textContent = now.toLocaleString('en-US', timeOptions);
            clockDate.textContent = `${now.toLocaleString('en-US', dateOptions)} CLT`;
        }
    });
}

// Utility Functions
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

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application Error:', e.error);
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    });
}

// Export for potential external use
window.WorkFlowCentral = {
    AppState,
    Config,
    openPasswordModal,
    closePasswordModal,
    renderTools,
    updateCategoryCounts
};
