// Initialize Lucide icons
lucide.createIcons();

// State management
let state = {
    user: null,
    token: localStorage.getItem('token'),
    currentView: 'dashboard'
};

// Elements
const screens = {
    login: document.getElementById('login-screen'),
    main: document.getElementById('main-dashboard')
};

const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const sidebarItems = document.querySelectorAll('.sidebar-nav li');
const viewTitle = document.getElementById('view-title');
const viewContainer = document.getElementById('view-container');

// API calls
const api = {
    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    async get(url) {
        const headers = state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
        const response = await fetch(url, { headers });
        return response.json();
    }
};

// Actions
function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const data = await api.post('/login', { username, password });
        if (data.access_token) {
            state.token = data.access_token;
            localStorage.setItem('token', state.token);
            
            // Decipher user from token (hack for demo)
            const base64Url = state.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            state.user = {
                name: payload.sub,
                role: payload.role
            };

            updateUserInfo();
            switchScreen('main');
            renderDashboard();
        } else {
            alert('Login failed. Please check credentials.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred during login.');
    }
}

function updateUserInfo() {
    document.getElementById('user-name').textContent = state.user.name;
    document.getElementById('user-role').textContent = state.user.role;
    document.getElementById('user-avatar').textContent = state.user.name[0].toUpperCase();

    // Toggle admin views
    const adminItems = document.querySelectorAll('.admin-only');
    adminItems.forEach(item => {
        item.style.display = state.user.role === 'admin' ? 'flex' : 'none';
    });
}

async function renderDashboard() {
    viewTitle.textContent = 'Dashboard';
    const stats = await api.get('/dashboard');
    
    viewContainer.innerHTML = `
        <div class="stats-grid">
            <div class="card">
                <div class="card-title">Total Requests</div>
                <div class="card-value">${stats.total_requests || 0}</div>
                <div class="card-trend" style="color: #10b981">↑ Healthy</div>
            </div>
            <div class="card">
                <div class="card-title">Error Rate</div>
                <div class="card-value">${stats.error_count || 0}</div>
                <div class="card-trend" style="color: ${stats.error_count > 0 ? '#f43f5e' : '#64748b'}">Stable</div>
            </div>
            <div class="card">
                <div class="card-title">Avg Response Time</div>
                <div class="card-value">${(stats.avg_response_time * 1000).toFixed(2)}ms</div>
                <div class="card-trend" style="color: #10b981">Optimal</div>
            </div>
        </div>
        <div class="card" style="margin-top: 2rem;">
            <div class="card-title">Recent Activity</div>
            <p style="color: var(--text-muted); margin-top: 1rem;">No recent logs found.</p>
        </div>
    `;
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);

logoutBtn.addEventListener('click', () => {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    switchScreen('login');
});

sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const view = item.getAttribute('data-view');
        if (view === 'dashboard') renderDashboard();
        else {
            viewTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
            viewContainer.innerHTML = `<p>Feature coming soon...</p>`;
        }
    });
});

// Init
if (state.token) {
    // Attempt to recover session
    try {
        const base64Url = state.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        state.user = { name: payload.sub, role: payload.role };
        updateUserInfo();
        switchScreen('main');
        renderDashboard();
    } catch (e) {
        switchScreen('login');
    }
} else {
    switchScreen('login');
}
