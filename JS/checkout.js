    /* ── Load cart from localStorage ── */
    function loadCart() {
        try { return JSON.parse(localStorage.getItem('cart')) || []; }
        catch { return []; }
    }

    function formatKsh(n) {
        return 'Ksh ' + Number(n).toLocaleString('en-KE');
    }

    function renderSummary() {
        const cart = loadCart();
        const container = document.getElementById('checkout-summary-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        const navCount = document.getElementById('nav-cart-count');

        if (!cart.length) {
            container.innerHTML = '<p class="empty-summary">No items in cart</p>';
            subtotalEl.textContent = 'Ksh 0';
            totalEl.textContent = 'Ksh 0';
            if (navCount) navCount.textContent = '0';
            return;
        }

        let total = 0;
        let countTotal = 0;
        let html = '';

        cart.forEach(item => {
            const qty = item.quantity || 1;
            const price = parseFloat(item.price) || 0;
            const lineTotal = price * qty;
            total += lineTotal;
            countTotal += qty;

            html += `
                <div class="s-item">
                    <img src="${item.image || ''}" alt="${item.name || 'Product'}" onerror="this.style.display='none'">
                    <span class="s-item-name">${item.name || 'Item'}${qty > 1 ? ' &times;' + qty : ''}</span>
                    <span class="s-item-price">${formatKsh(lineTotal)}</span>
                </div>`;
        });

        container.innerHTML = html;
        subtotalEl.textContent = formatKsh(total);
        totalEl.textContent = formatKsh(total);
        if (navCount) navCount.textContent = countTotal;
    }

    /* ── Payment tab switching ── */
    const panels = ['mpesa', 'card', 'cod'];
    function switchTab(tab) {
        panels.forEach(p => {
            document.getElementById('tab-' + p).classList.toggle('active', p === tab);
            const el = document.getElementById('panel-' + p);
            if (p === 'mpesa') { el.classList.toggle('visible', p === tab); if (p !== tab) el.classList.remove('visible'); }
            else if (p === 'card') { el.classList.toggle('visible', p === tab); }
            else { el.style.display = p === tab ? 'block' : 'none'; }
        });
        // ensure mpesa / card visibility correct
        document.getElementById('panel-mpesa').style.display = tab === 'mpesa' ? 'block' : 'none';
        document.getElementById('panel-card').style.display = tab === 'card' ? 'block' : 'none';
        document.getElementById('panel-cod').style.display = tab === 'cod' ? 'block' : 'none';
    }
    // init
    switchTab('mpesa');

    /* ── Card number formatting ── */
    function formatCard(input) {
        let v = input.value.replace(/\D/g, '').substring(0, 16);
        input.value = v.replace(/(.{4})/g, '$1 ').trim();
    }
    function formatExpiry(input) {
        let v = input.value.replace(/\D/g, '').substring(0, 4);
        if (v.length >= 3) v = v.substring(0, 2) + ' / ' + v.substring(2);
        input.value = v;
    }

    /* ── Validation ── */
    function validate() {
        const firstName = document.getElementById('first-name').value.trim();
        const lastName = document.getElementById('last-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();

        if (!firstName || !lastName) { alert('Please enter your full name.'); return false; }
        if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return false; }
        if (!phone || !/^0[0-9]{9}$/.test(phone)) { alert('Please enter a valid phone number (e.g. 07XXXXXXXX).'); return false; }
        if (!address) { alert('Please enter a delivery address.'); return false; }
        if (!city) { alert('Please enter your city or town.'); return false; }

        const activeTab = document.querySelector('.pay-tab.active').id;

        if (activeTab === 'tab-mpesa') {
            const mpesa = document.getElementById('mpesa-number').value.trim();
            if (!mpesa || !/^0[0-9]{9}$/.test(mpesa)) { alert('Please enter a valid M-Pesa number.'); return false; }
        }

        if (activeTab === 'tab-card') {
            const cardName = document.getElementById('card-name').value.trim();
            const cardNum = document.getElementById('card-number').value.replace(/\s/g, '');
            const expiry = document.getElementById('card-expiry').value.trim();
            const cvv = document.getElementById('card-cvv').value.trim();
            if (!cardName) { alert('Please enter the cardholder name.'); return false; }
            if (cardNum.length < 16) { alert('Please enter a valid 16-digit card number.'); return false; }
            if (!expiry || expiry.length < 7) { alert('Please enter a valid expiry date.'); return false; }
            if (!cvv || cvv.length < 3) { alert('Please enter a valid CVV.'); return false; }
        }

        return true;
    }

    /* ── Place order ── */
    function placeOrder() {
        const cart = loadCart();
        if (!cart.length) { alert('Your cart is empty. Add products before placing an order.'); return; }
        if (!validate()) return;

        const name = document.getElementById('first-name').value.trim() + ' ' + document.getElementById('last-name').value.trim();
        const activeTab = document.querySelector('.pay-tab.active').id;
        let method = activeTab === 'tab-mpesa' ? 'M-Pesa' : activeTab === 'tab-card' ? 'Card' : 'Cash on Delivery';

        document.getElementById('success-msg').textContent =
            `Thank you, ${name}! Your order has been received and will be processed via ${method}. We'll contact you shortly to confirm.`;

        // Clear cart
        localStorage.removeItem('cart');

        document.getElementById('success-overlay').classList.add('show');
    }

    renderSummary();
