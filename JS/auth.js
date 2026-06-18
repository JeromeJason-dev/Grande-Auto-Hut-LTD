/**
 * Master Authentication & State Management Script
 * GRANDE AUTO HUT LTD
 */
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const adminRegisterForm = document.getElementById("adminRegisterForm");
    const loginForm = document.getElementById("loginForm");
    const logoutBtn = document.getElementById("logoutBtn");

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    function getUsers() {
        return JSON.parse(localStorage.getItem("grande_users")) || [];
    }

    function saveUsers(users) {
        localStorage.setItem("grande_users", JSON.stringify(users));
    }

    function showError(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = message;
        el.className = el.className.replace(/\balert-success\b/, "");
        el.style.display = "block";
        setTimeout(() => { el.style.display = "none"; }, 4000);
    }

    function showSuccess(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = message;
        el.classList.add("alert-success");
        el.style.display = "block";
    }

    // ─────────────────────────────────────────────────────────────
    // SEED DEFAULT ADMIN (runs once on fresh browser)
    // Credentials: admin@grande.com / Grande2026!
    // ─────────────────────────────────────────────────────────────
    (function seedDefaultAdmin() {
        const users = getUsers();
        if (!users.some(u => u.email === "admin@grande.com")) {
            users.push({
                name: "System Admin",
                email: "admin@grande.com",
                phone: "",
                password: "Grande2026!",
                isAdmin: true
            });
            saveUsers(users);
        }
    })();

    // ─────────────────────────────────────────────────────────────
    // 1. CUSTOMER REGISTRATION  (register.html)
    // ─────────────────────────────────────────────────────────────
    if (registerForm && !adminRegisterForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim().toLowerCase();
            const phone = document.getElementById("phone").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                showError("registerError", "Passwords do not match.");
                return;
            }
            if (password.length < 6) {
                showError("registerError", "Password must be at least 6 characters.");
                return;
            }

            const users = getUsers();
            if (users.find(u => u.email === email)) {
                showError("registerError", "An account with this email already exists.");
                return;
            }

            const newUser = { name: fullName, email, phone, password, isAdmin: false };
            users.push(newUser);
            saveUsers(users);
            localStorage.setItem("savedUser", JSON.stringify(newUser));

            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("activeUserEmail", email);

            alert("Registration successful! Welcome to Grande Auto Hut.");
            window.location.href = "dashboard.html";
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ADMIN REGISTRATION  (admin-register.html)
    //    Uses id="adminRegisterForm" — no secret key needed,
    //    simply saves with isAdmin: true into grande_users.
    // ─────────────────────────────────────────────────────────────
    if (adminRegisterForm) {
        adminRegisterForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("adminName").value.trim();
            const email = document.getElementById("adminRegEmail").value.trim().toLowerCase();
            const password = document.getElementById("adminRegPassword").value;
            const confirmPassword = document.getElementById("adminConfirmPassword").value;
            const alertBox = document.getElementById("alertBox");

            if (password.length < 6) {
                showError("alertBox", "Password must be at least 6 characters.");
                return;
            }
            if (password !== confirmPassword) {
                showError("alertBox", "Passwords do not match.");
                return;
            }

            const users = getUsers();
            if (users.find(u => u.email === email)) {
                showError("alertBox", "An account with this email already exists.");
                return;
            }

            const newAdmin = { name, email, phone: "", password, isAdmin: true };
            users.push(newAdmin);
            saveUsers(users);

            showSuccess("alertBox", "Admin registered successfully! Redirecting...");
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. UNIFIED LOGIN  (login.html)
    //    Admin   → admin.html      (sets isAdminAuthenticated)
    //    Customer → dashboard.html (sets isLoggedIn)
    // ─────────────────────────────────────────────────────────────
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("loginEmail").value.trim().toLowerCase();
            const passwordInput = document.getElementById("loginPassword").value;

            const users = getUsers();
            const matchedUser = users.find(u => u.email === emailInput && u.password === passwordInput);

            // Legacy hardcoded demo customer
            const isDemoAcct = emailInput === "jerome@example.com" && passwordInput === "password123";

            if (!matchedUser && !isDemoAcct) {
                showError("errorMessage", "Invalid email address or wrong password.");
                return;
            }

            // ── ADMIN path ──────────────────────────────────────
            if (matchedUser && matchedUser.isAdmin) {
                sessionStorage.setItem("isAdminAuthenticated", "true");
                sessionStorage.setItem("adminEmail", matchedUser.email);
                window.location.replace("admin.html");
                return;
            }

            // ── CUSTOMER path ───────────────────────────────────
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("activeUserEmail", emailInput);
            window.location.href = "dashboard.html";
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. DASHBOARD ACCESS GUARD  (dashboard.html)
    // ─────────────────────────────────────────────────────────────
    if (window.location.pathname.includes("dashboard.html")) {
        if (sessionStorage.getItem("isLoggedIn") !== "true") {
            window.location.href = "login.html";
            return;
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

    // ─────────────────────────────────────────────────────────────
    // 5. REDIRECT ALREADY-AUTHENTICATED USERS AWAY FROM AUTH PAGES
    // ─────────────────────────────────────────────────────────────
    const path = window.location.pathname;

    if (path.includes("login.html") || path.includes("register.html")) {
        if (sessionStorage.getItem("isLoggedIn") === "true") {
            window.location.href = "dashboard.html";
        }
        if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
            window.location.replace("admin.html");
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. CUSTOMER LOGOUT
    // ─────────────────────────────────────────────────────────────
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("isLoggedIn");
            sessionStorage.removeItem("activeUserEmail");
            window.location.href = "login.html";
        });
    }
});

// ─────────────────────────────────────────────────────────────────
// GLOBAL MODAL CONTROLLERS FOR ORDER TRACKING
// ─────────────────────────────────────────────────────────────────
window.openTracker = function (orderId, currentStatus) {
    const modal = document.getElementById("trackingModal");
    const orderIdPlaceholder = document.getElementById("modalOrderId");
    if (!modal || !orderIdPlaceholder) return;

    orderIdPlaceholder.textContent = orderId;

    const steps = ["processing", "shipped", "delivered"];
    steps.forEach(s => document.getElementById(`step-${s}`)?.classList.remove("active"));

    if (currentStatus === "processing") {
        document.getElementById("step-processing")?.classList.add("active");
    } else if (currentStatus === "shipped") {
        document.getElementById("step-processing")?.classList.add("active");
        document.getElementById("step-shipped")?.classList.add("active");
    } else if (currentStatus === "delivered") {
        steps.forEach(s => document.getElementById(`step-${s}`)?.classList.add("active"));
    }

    modal.style.display = "flex";
};

window.closeTracker = function () {
    const modal = document.getElementById("trackingModal");
    if (modal) modal.style.display = "none";
};

window.addEventListener("click", (e) => {
    const modal = document.getElementById("trackingModal");
    if (e.target === modal) closeTracker();
});