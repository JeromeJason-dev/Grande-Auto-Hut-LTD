/**
 * Master Authentication & State Management Script
 * GRANDE AUTO HUT LTD
 */
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
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
        el.style.display = "block";
        setTimeout(() => { el.style.display = "none"; }, 4000);
    }

    // ─────────────────────────────────────────────────────────────
    // HARDCODED ADMIN ACCOUNT
    // Only this one admin exists — registration is not supported.
    // ─────────────────────────────────────────────────────────────
    const ADMIN = {
        name: "Jason Macharia",
        email: "jmash8805@gmail.com",
        password: "JNM@123",
        isAdmin: true
    };

    // ─────────────────────────────────────────────────────────────
    // 0. NAV LOGIN/PROFILE LINK SWAP (runs on every page that has
    //    auth.js loaded). Finds any nav link pointing at login.html
    //    and, if the visitor is logged in, swaps it to point at
    //    profile.html with a profile icon/label instead. Uses
    //    a[href="login.html"] as the selector since that's the one
    //    thing every page's markup actually shares — no assumption
    //    about list structure, classes, or page layout.
    // ─────────────────────────────────────────────────────────────
    (function syncNavAuthLink() {
        const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
        if (!isLoggedIn) return; // leave "Login" links as-is for guests

        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        loginLinks.forEach((link) => {
            link.setAttribute("href", "profile.html");

            const icon = link.querySelector("i");
            if (icon) {
                icon.className = "fa-solid fa-user-circle";
            }

            // Replace only the trailing text node so the icon element itself
            // (and its classes) are left untouched; falls back to resetting
            // textContent if the link has no separate text node (e.g. icon-only links).
            let replaced = false;
            link.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = " My Account";
                    replaced = true;
                }
            });
            if (!replaced) {
                link.append(" My Account");
            }
        });
    })();

    // ─────────────────────────────────────────────────────────────
    // 1. CUSTOMER REGISTRATION  (register.html)
    //    Now lands on profile.html instead of dashboard.html
    // ─────────────────────────────────────────────────────────────
    if (registerForm) {
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

            // Block anyone from registering with the admin email
            if (email === ADMIN.email) {
                showError("registerError", "This email address is not available.");
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
            window.location.href = "profile.html";
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. UNIFIED LOGIN  (login.html)
    //    Admin    → admin.html      (sets isAdminAuthenticated)
    //    Customer → profile.html    (sets isLoggedIn)
    // ─────────────────────────────────────────────────────────────
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("loginEmail").value.trim().toLowerCase();
            const passwordInput = document.getElementById("loginPassword").value;

            // ── Check hardcoded admin first ─────────────────────
            if (emailInput === ADMIN.email && passwordInput === ADMIN.password) {
                sessionStorage.setItem("isAdminAuthenticated", "true");
                sessionStorage.setItem("adminEmail", ADMIN.email);
                window.location.replace("admin.html");
                return;
            }

            // ── Check registered customers ──────────────────────
            const users = getUsers();
            const matchedUser = users.find(u => u.email === emailInput && u.password === passwordInput);

            // Legacy hardcoded demo customer
            const isDemoAcct = emailInput === "jerome@example.com" && passwordInput === "password123";

            if (matchedUser || isDemoAcct) {
                sessionStorage.setItem("isLoggedIn", "true");
                sessionStorage.setItem("activeUserEmail", emailInput);
                window.location.href = "profile.html";
                return;
            }

            showError("errorMessage", "Invalid email address or wrong password.");
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PROFILE PAGE ACCESS GUARD  (profile.html)
    //    profile.html is now the post-login landing page, so the
    //    guard that used to protect dashboard.html lives here instead.
    //    Populates user-info elements if profile.html includes them;
    //    harmless no-ops (the null checks) if it doesn't.
    // ─────────────────────────────────────────────────────────────
    if (window.location.pathname.includes("profile.html")) {
        if (sessionStorage.getItem("isLoggedIn") !== "true") {
            window.location.href = "login.html";
            return;
        }

        const activeEmail = sessionStorage.getItem("activeUserEmail");
        const users = getUsers();
        let registeredUser = users.find(u => u.email === activeEmail) || null;

        // Fallback to savedUser (covers the most-recently-registered account
        // in case grande_users lookup ever misses)
        if (!registeredUser) {
            const saved = JSON.parse(localStorage.getItem("savedUser"));
            if (saved && saved.email === activeEmail) registeredUser = saved;
        }

        const nameNode = document.getElementById("dashUserName");
        const emailNode = document.getElementById("dashUserEmail");
        const phoneNode = document.getElementById("dashUserPhone");
        const welcomeNode = document.getElementById("welcomeName");

        if (registeredUser) {
            if (nameNode) nameNode.textContent = registeredUser.name;
            if (emailNode) emailNode.textContent = registeredUser.email;
            if (phoneNode) phoneNode.textContent = registeredUser.phone;
            if (welcomeNode) welcomeNode.textContent = registeredUser.name.split(" ")[0];
        } else if (activeEmail === "jerome@example.com") {
            // Legacy hardcoded demo customer
            if (nameNode) nameNode.textContent = "Jerome Jason";
            if (emailNode) emailNode.textContent = "jerome@example.com";
            if (phoneNode) phoneNode.textContent = "+254 700 000000";
            if (welcomeNode) welcomeNode.textContent = "Jerome";
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. REDIRECT ALREADY-AUTHENTICATED USERS AWAY FROM AUTH PAGES
    // ─────────────────────────────────────────────────────────────
    const path = window.location.pathname;

    if (path.includes("login.html") || path.includes("register.html")) {
        if (sessionStorage.getItem("isLoggedIn") === "true") {
            window.location.href = "profile.html";
        }
        if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
            window.location.replace("admin.html");
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. CUSTOMER LOGOUT
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