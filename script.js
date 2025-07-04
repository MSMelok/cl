// Central Link Landing Page - No header time display needed

// Password for management access
const MANAGEMENT_PASSWORD = 'Dstx07804';

// Access functions
function accessAgents() {
    // Redirect to agent portal
    window.location.href = './tools/agentsCL/index.html';
}

function accessManagement() {
    showPasswordModal();
}

// Modal functions
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    modal.style.display = 'block';
    passwordInput.value = '';
    errorMessage.textContent = '';
    
    // Focus on password input
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
    
    // Add event listener for Enter key
    passwordInput.addEventListener('keypress', handleEnterKey);
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    
    modal.style.display = 'none';
    passwordInput.value = '';
    errorMessage.textContent = '';
    
    // Remove event listener
    passwordInput.removeEventListener('keypress', handleEnterKey);
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        validatePassword();
    }
}

function validatePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    const enteredPassword = passwordInput.value;
    
    if (enteredPassword === MANAGEMENT_PASSWORD) {
        // Password is correct
        closePasswordModal();
        // Redirect to management portal
        window.location.href = './tools/managmentCL/index.html';
    } else {
        // Password is incorrect
        errorMessage.textContent = 'Invalid password. Please try again.';
        passwordInput.value = '';
        passwordInput.focus();
        
        // Add shake animation to the modal
        const modalContent = document.querySelector('.modal-content');
        modalContent.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            modalContent.style.animation = '';
        }, 500);
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('passwordModal');
    if (event.target === modal) {
        closePasswordModal();
    }
}

// Add shake animation for wrong password
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Add loading states for buttons
function addLoadingState(button) {
    const originalText = button.innerHTML;
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2v4M10 14v4M18 10h-4M6 10H2M15.657 4.343l-2.829 2.829M7.172 12.828l-2.829 2.829M15.657 15.657l-2.829-2.829M7.172 7.172l-2.829-2.829" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Loading...</span>
    `;
    button.disabled = true;
    button.style.opacity = '0.7';
    
    // Add rotation animation to the loading icon
    const loadingIcon = button.querySelector('svg');
    if (loadingIcon) {
        loadingIcon.style.animation = 'spin 1s linear infinite';
    }
    
    return originalText;
}

function removeLoadingState(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
    button.style.opacity = '1';
}

// Add spin animation for loading state
const spinStyle = document.createElement('style');
spinStyle.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(spinStyle);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Central Link Landing Page Initialized');
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Press 'M' key to open management login
        if (event.key.toLowerCase() === 'm' && !document.getElementById('passwordModal').style.display.includes('block')) {
            event.preventDefault();
            accessManagement();
        }
        
        // Press 'A' key to access agents
        if (event.key.toLowerCase() === 'a' && !document.getElementById('passwordModal').style.display.includes('block')) {
            event.preventDefault();
            accessAgents();
        }
        
        // Press 'Escape' to close modal
        if (event.key === 'Escape') {
            const modal = document.getElementById('passwordModal');
            if (modal.style.display === 'block') {
                closePasswordModal();
            }
        }
    });
    
    // Add subtle animations to cards on page load
    const cards = document.querySelectorAll('.access-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
});
