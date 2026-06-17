/**
 * Master Authentication & State Management Script
 * GRANDE AUTO HUT LTD
 */
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");

    // --- 1. REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const errorToast = document.getElementById("registerError");

            if (password !== confirmPassword) {
                errorToast.textContent = "Passwords do not match.";
                errorToast.style.display = "block";
                return;
            }

            if (password.length < 6) {
                errorToast.textContent = "Password must be at least 6 characters.";
                errorToast.style.display = "block";
                return;
            }

            const newCustomer = { name: fullName, email, phone, password };
            localStorage.setItem("savedUser", JSON.stringify(newCustomer));
            errorToast.style.display = "none";

            // Auto-login after registration
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("activeUserEmail", email);

            alert("Registration successful! Welcome to Grande Auto Hut.");
            window.location.href = "dashboard.html";
        });
    }

    // --- 2. LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("loginEmail").value.trim();
            const passwordInput = document.getElementById("loginPassword").value;
            const errorToast = document.getElementById("errorMessage");

            const registeredUser = JSON.parse(localStorage.getItem("savedUser"));
            let isVerified = false;

            if (registeredUser && emailInput === registeredUser.email && passwordInput === registeredUser.password) {
                isVerified = true;
            } else if (emailInput === "jerome@example.com" && passwordInput === "password123") {
                isVerified = true;
            }

            if (isVerified) {
                sessionStorage.setItem("isLoggedIn", "true");
                sessionStorage.setItem("activeUserEmail", emailInput);
                errorToast.style.display = "none";
                window.location.href = "dashboard.html";
            } else {
                errorToast.textContent = "Invalid email address or wrong password.";
                errorToast.style.display = "block";
            }
        });
    }

    // --- 3. DASHBOARD ACCESS GUARD ---
    // Redirect unauthenticated visitors to register page
    if (window.location.pathname.includes("dashboard.html")) {
        const loggedInStatus = sessionStorage.getItem("isLoggedIn");

        if (loggedInStatus !== "true") {
            window.location.href = "register.html";
            return; // Stop further execution
        }

        const activeEmail = sessionStorage.getItem("activeUserEmail");
        const registeredUser = JSON.parse(localStorage.getItem("savedUser"));

        const nameNode = document.getElementById("dashUserName");
        const emailNode = document.getElementById("dashUserEmail");
        const phoneNode = document.getElementById("dashUserPhone");
        const welcomeNode = document.getElementById("welcomeName");
        const totalOrdersNode = document.querySelector(".metric-card:nth-child(1) .metric-number");
        const transitOrdersNode = document.querySelector(".metric-card:nth-child(2) .metric-number");

        if (registeredUser && activeEmail === registeredUser.email) {
            if (nameNode) nameNode.textContent = registeredUser.name;
            if (emailNode) emailNode.textContent = registeredUser.email;
            if (phoneNode) phoneNode.textContent = registeredUser.phone;
            if (welcomeNode) welcomeNode.textContent = registeredUser.name.split(" ")[0];
            if (totalOrdersNode) totalOrdersNode.textContent = "0";
            if (transitOrdersNode) transitOrdersNode.textContent = "0";
        } else {
            if (nameNode) nameNode.textContent = "Jerome Jason";
            if (emailNode) emailNode.textContent = "jerome@example.com";
            if (phoneNode) phoneNode.textContent = "+254 700 000000";
            if (welcomeNode) welcomeNode.textContent = "Jerome";
        }
    }

    // --- 4. REDIRECT LOGGED-IN USERS AWAY FROM AUTH PAGES ---
    // If already logged in and visiting login/register, go straight to dashboard
    const isOnAuthPage = window.location.pathname.includes("login.html") ||
                         window.location.pathname.includes("register.html");

    if (isOnAuthPage && sessionStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "dashboard.html";
    }

    // --- 5. LOGOUT ---
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("isLoggedIn");
            sessionStorage.removeItem("activeUserEmail");
            window.location.href = "login.html";
        });
    }
});

// --- GLOBAL MODAL CONTROLLERS FOR ORDER TRACKING ---
window.openTracker = function(orderId, currentStatus) {
    const modal = document.getElementById("trackingModal");
    const orderIdPlaceholder = document.getElementById("modalOrderId");

    if (!modal || !orderIdPlaceholder) return;

    orderIdPlaceholder.textContent = orderId;

    const steps = ['processing', 'shipped', 'delivered'];
    steps.forEach(status => {
        document.getElementById(`step-${status}`).classList.remove('active');
    });

    if (currentStatus === 'processing') {
        document.getElementById('step-processing').classList.add('active');
    } else if (currentStatus === 'shipped') {
        document.getElementById('step-processing').classList.add('active');
        document.getElementById('step-shipped').classList.add('active');
    } else if (currentStatus === 'delivered') {
        steps.forEach(status => document.getElementById(`step-${status}`).classList.add('active'));
    }

    modal.style.display = "flex";
}

window.closeTracker = function() {
    const modal = document.getElementById("trackingModal");
    if (modal) modal.style.display = "none";
}

window.addEventListener("click", (e) => {
    const modal = document.getElementById("trackingModal");
    if (e.target === modal) closeTracker();
});