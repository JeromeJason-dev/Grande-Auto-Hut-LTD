async function hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const alertBox = document.getElementById('alertBox');

            alertBox.style.display = 'none';
            alertBox.className = 'alert-msg';

            if (password.length < 6) {
                alertBox.textContent = "Password must be at least 6 characters long.";
                alertBox.classList.add('alert-error');
                alertBox.style.display = 'block';
                return;
            }

            if (password !== confirmPassword) {
                alertBox.textContent = "Passwords do not match. Please verify.";
                alertBox.classList.add('alert-error');
                alertBox.style.display = 'block';
                return;
            }

            let adminRegistry = JSON.parse(localStorage.getItem('grande_admins')) || [];

            const userExists = adminRegistry.some(admin => admin.username.toLowerCase() === username.toLowerCase());
            if (userExists || username.toLowerCase() === 'admin') {
                alertBox.textContent = "This username is already taken.";
                alertBox.classList.add('alert-error');
                alertBox.style.display = 'block';
                return;
            }

            const encryptedPassword = await hashPassword(password);

            adminRegistry.push({
                username: username,
                password: encryptedPassword
            });

            localStorage.setItem('grande_admins', JSON.stringify(adminRegistry));

            alertBox.textContent = "Admin Registration Successful! Redirecting to login...";
            alertBox.classList.add('alert-success');
            alertBox.style.display = 'block';

            document.getElementById('registerForm').reset();

            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
        });