const API_BASE_URL = window.location.origin;

// Check if already authenticated
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);
        const data = await response.json();
        
        if (data.authenticated) {
            // Redirect to admin dashboard
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'admin.html';
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const messageDiv = document.getElementById('message');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!username || !password) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Please enter both username and password';
        messageDiv.style.display = 'block';
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    messageDiv.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // Important for sessions
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - redirect
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'admin.html';
            window.location.href = redirectUrl;
        } else {
            // Error
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || 'Invalid username or password';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Network error. Please check your connection and try again.';
        messageDiv.style.display = 'block';
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

// Check auth on page load
checkAuth();
