const API_BASE_URL = window.location.origin;

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = `login.html?redirect=${encodeURIComponent('admin.html')}`;
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = `login.html?redirect=${encodeURIComponent('admin.html')}`;
        return false;
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = 'login.html';
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            window.location.href = `login.html?redirect=${encodeURIComponent('admin.html')}`;
            return;
        }
        
        const stats = await response.json();
        
        document.getElementById('totalAttendees').textContent = stats.total || 0;
        document.getElementById('usedCodes').textContent = stats.used || 0;
        document.getElementById('unusedCodes').textContent = stats.unused || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load attendees
async function loadAttendees() {
    const tbody = document.getElementById('attendeesTableBody');
    
    // Show loading
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/attendees`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            window.location.href = `login.html?redirect=${encodeURIComponent('admin.html')}`;
            return;
        }
        
        const attendees = await response.json();
        
        if (attendees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">No attendees yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = attendees.map(attendee => {
            const statusClass = attendee.is_used ? 'used' : 'unused';
            const statusText = attendee.is_used ? 'Used' : 'Unused';
            const registeredDate = new Date(attendee.created_at).toLocaleString();
            const expiresDate = attendee.expires_at ? new Date(attendee.expires_at).toLocaleString() : '-';
            const usedDate = attendee.used_at ? new Date(attendee.used_at).toLocaleString() : '-';
            
            // Check if expired
            let expired = false;
            if (attendee.expires_at) {
                const expiresAt = new Date(attendee.expires_at);
                const now = new Date();
                expired = now > expiresAt && !attendee.is_used;
            }
            
            const expiresDisplay = expired ? 
                `<span style="color: var(--error); font-weight: 600;">${expiresDate} (Expired)</span>` : 
                expiresDate;
            
            return `
                <tr>
                    <td>${escapeHtml(attendee.name)}</td>
                    <td>${escapeHtml(attendee.email)}</td>
                    <td>${escapeHtml(attendee.phone || '-')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${registeredDate}</td>
                    <td>${expiresDisplay}</td>
                    <td>${usedDate}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading attendees:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Error loading data</td></tr>';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Refresh data
async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Refreshing...';
    
    await Promise.all([loadStats(), loadAttendees()]);
    
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Refresh Data';
}

// Event listeners
document.getElementById('refreshBtn').addEventListener('click', refreshData);
document.getElementById('logoutBtn').addEventListener('click', logout);

// Load data on page load
window.addEventListener('load', async () => {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        loadStats();
        loadAttendees();
    }
});
