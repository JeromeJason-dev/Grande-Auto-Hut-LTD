document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       Reads/writes the SAME storage auth.js owns:
       - localStorage.grande_users : array of { name, email, phone, password, isAdmin }
       - localStorage.savedUser    : most-recently-registered/edited user object
       - sessionStorage.activeUserEmail : which account is currently logged in
       Email is treated as immutable here since it's also the login identifier
       auth.js matches against — changing it would silently break login for
       this account unless auth.js's lookup logic is also updated.
       ========================================================================== */

    // Guard: bounce non-logged-in visitors to login, consistent with auth.js's
    // dashboard guard.
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const activeEmail = sessionStorage.getItem('activeUserEmail');

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem('grande_users')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem('grande_users', JSON.stringify(users));
    }

    function findActiveUser(users) {
        return users.find((u) => u.email === activeEmail) || null;
    }

    const firstNameInput = document.getElementById('edit-first-name');
    const lastNameInput = document.getElementById('edit-last-name');
    const emailInput = document.getElementById('edit-email');
    const phoneInput = document.getElementById('edit-phone');
    const passwordInput = document.getElementById('edit-password');
    const confirmPasswordInput = document.getElementById('edit-confirm-password');
    const errorEl = document.getElementById('edit-error');
    const successEl = document.getElementById('edit-success');
    const emailLockedNote = document.getElementById('email-locked-note');

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
        setTimeout(() => { errorEl.style.display = 'none'; }, 4000);
    }

    function showSuccess(msg) {
        successEl.textContent = msg;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
        setTimeout(() => { successEl.style.display = 'none'; }, 4000);
    }

    // ---------------- Load current values ----------------
    let users = getUsers();
    let currentUser = findActiveUser(users);

    // Fallback: the legacy demo account (jerome@example.com) isn't in
    // grande_users at all (auth.js hardcodes it), so there's nothing to edit
    // for that account. Surface that clearly instead of failing silently.
    if (!currentUser) {
        showError("This account's details can't be edited here (demo account). Register a real account to use Edit Profile.");
        document.getElementById('saveProfileBtn').disabled = true;
        document.getElementById('saveProfileBtn').style.opacity = '0.5';
        document.getElementById('saveProfileBtn').style.cursor = 'not-allowed';
    } else {
        const nameParts = (currentUser.name || '').split(' ');
        firstNameInput.value = nameParts[0] || '';
        lastNameInput.value = nameParts.slice(1).join(' ') || '';
        emailInput.value = currentUser.email || '';
        phoneInput.value = currentUser.phone || '';
    }

    emailInput.disabled = true;
    emailLockedNote.style.display = 'block';

    // ---------------- Save ----------------
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.addEventListener('click', () => {
        if (!currentUser) return;

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const phone = phoneInput.value.trim();
        const newPassword = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!firstName || !lastName) {
            showError('First and last name are required.');
            return;
        }

        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                showError('New passwords do not match.');
                return;
            }
            if (newPassword.length < 6) {
                showError('New password must be at least 6 characters.');
                return;
            }
        }

        users = getUsers();
        const userIndex = users.findIndex((u) => u.email === activeEmail);
        if (userIndex === -1) {
            showError('Could not find your account. Please log in again.');
            return;
        }

        users[userIndex].name = `${firstName} ${lastName}`.trim();
        users[userIndex].phone = phone;
        if (newPassword) {
            users[userIndex].password = newPassword;
        }

        saveUsers(users);
        // Keep savedUser in sync too, since auth.js's dashboard guard falls
        // back to it for the most-recently-registered account.
        localStorage.setItem('savedUser', JSON.stringify(users[userIndex]));

        passwordInput.value = '';
        confirmPasswordInput.value = '';

        showSuccess('Profile updated successfully.');
    });
});