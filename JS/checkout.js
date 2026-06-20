document.addEventListener('DOMContentLoaded', () => {
    const navCartCount = document.getElementById('nav-cart-count');
    const summaryItemsContainer = document.getElementById('checkout-summary-items');
    const subtotalElement = document.getElementById('checkout-subtotal');
    const totalElement = document.getElementById('checkout-total');

    let cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

    // 1. Populate current items inside checkout panel box container matrix
    function renderCheckoutSummary() {
        if (!summaryItemsContainer) return;
        summaryItemsContainer.innerHTML = '';

        let totalItemsCount = 0;
        let totalPriceSum = 0;

        if (cart.length === 0) {
            summaryItemsContainer.innerHTML = '<p class="empty-summary" style="text-align:center; padding:15px; color:#888;">No items in cart</p>';
            if (subtotalElement) subtotalElement.textContent = 'Ksh 0';
            if (totalElement) totalElement.textContent = 'Ksh 0';
            if (navCartCount) navCartCount.textContent = '0';
            return;
        }

        cart.forEach((item) => {
            const itemQuantity = item.quantity || 1;
            const itemTotal = item.price * itemQuantity;

            totalItemsCount += itemQuantity;
            totalPriceSum += itemTotal;

            const summaryRow = document.createElement('div');
            summaryRow.style.display = 'flex';
            summaryRow.style.justifyContent = 'space-between';
            summaryRow.style.alignItems = 'center';
            summaryRow.style.marginBottom = '12px';
            summaryRow.style.fontSize = '14px';

            summaryRow.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <span style="font-weight: 500; color: #333;">${item.name}</span>
                    <small style="display: block; color: #666;">Qty: ${itemQuantity} × Ksh ${item.price.toLocaleString()}</small>
                </div>
                <span style="font-weight: 600; color: #111;">Ksh ${itemTotal.toLocaleString()}</span>
            `;
            summaryItemsContainer.appendChild(summaryRow);
        });

        if (navCartCount) navCartCount.textContent = totalItemsCount;
        if (subtotalElement) subtotalElement.textContent = `Ksh ${totalPriceSum.toLocaleString()}`;
        if (totalElement) totalElement.textContent = `Ksh ${totalPriceSum.toLocaleString()}`;
    }

    renderCheckoutSummary();
});

// 2. Tab switcher mechanics controller method logic pass
function switchTab(mode) {
    const tabs = ['mpesa', 'card', 'cod'];
    
    tabs.forEach(tab => {
        const tabEl = document.getElementById(`tab-${tab}`);
        const panelEl = document.getElementById(`panel-${tab}`);
        
        if (tab === mode) {
            if (tabEl) tabEl.classList.add('active');
            if (panelEl) {
                panelEl.style.display = 'block';
                panelEl.classList.add('visible');
            }
        } else {
            if (tabEl) tabEl.classList.remove('active');
            if (panelEl) {
                panelEl.style.display = 'none';
                panelEl.classList.remove('visible');
            }
        }
    });
}

// 3. Optional inline layout string parsers for Card styling UI fields helper attributes
function formatCard(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
        input.value = parts.join(' ');
    } else {
        input.value = value;
    }

    // Inline brand classification checking fallback toggler demo
    const icon = document.getElementById('card-brand-icon');
    if (icon) {
        if (value.startsWith('4')) {
            icon.className = 'fa-brands fa-cc-visa card-brand';
        } else if (value.startsWith('5')) {
            icon.className = 'fa-brands fa-cc-mastercard card-brand';
        } else {
            icon.className = 'fa-regular fa-credit-card card-brand';
        }
    }
}

function formatExpiry(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
        input.value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    } else {
        input.value = value;
    }
}

// ─────────────────────────────────────────────────────────────────
// Order ID generator: G-XXXXX, matching the existing "#G-98421" style
// ─────────────────────────────────────────────────────────────────
function generateOrderId() {
    const random5digit = Math.floor(10000 + Math.random() * 90000);
    return `G-${random5digit}`;
}

// 4. Submission Validation and Final Complete Action Loop Pipeline Handler 
function placeOrder() {
    const cart = JSON.parse(localStorage.getItem('grande_cart')) || [];
    
    if (cart.length === 0) {
        alert('Your cart is completely empty! Add products to build active cart sessions before checkouts.');
        return;
    }

    // Required fields verification validations arrays loops
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const county = document.getElementById('county').value;

    if (!firstName || !lastName || !email || !phone || !address || !city || !county) {
        alert('Please completely fill all relevant Delivery Details before finishing.');
        return;
    }

    // Determine current active selected payments tab block 
    let paymentMethod = 'cod';
    const activeTab = document.querySelector('.pay-tab.active');
    if (activeTab) {
        if (activeTab.id === 'tab-mpesa') {
            paymentMethod = 'mpesa';
            const mpesaNum = document.getElementById('mpesa-number').value.trim();
            if (!mpesaNum) {
                alert('Please supply an active M-Pesa contact payload number for the STK push.');
                return;
            }
        } else if (activeTab.id === 'tab-card') {
            paymentMethod = 'card';
            const cardName = document.getElementById('card-name').value.trim();
            const cardNum = document.getElementById('card-number').value.trim();
            const cardExp = document.getElementById('card-expiry').value.trim();
            const cardCvv = document.getElementById('card-cvv').value.trim();
            if (!cardName || !cardNum || !cardExp || !cardCvv) {
                alert('Please fully fill out your Credit Card configuration data entries.');
                return;
            }
        } else if (activeTab.id === 'tab-cod') {
            paymentMethod = 'cod';
        }
    }

    // ─────────────────────────────────────────────────────────
    // Build and persist the order record BEFORE clearing the cart.
    // This is what dashboard.html / profile.html read for order
    // history and tracking. Items keep their own id so each line
    // item can later be tied to a per-order review.
    //
    // ownerEmail is the SESSION identity (sessionStorage.activeUserEmail,
    // set by auth.js at login/register) — not the "email" field typed into
    // the delivery form above, which is just shipping contact info and
    // could differ from the logged-in account (e.g. ordering for someone
    // else) or be mistyped. ownerEmail is what profile.js filters on so
    // each account only ever sees its own orders.
    // ─────────────────────────────────────────────────────────
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const ownerEmail = sessionStorage.getItem('activeUserEmail') || null;

    const newOrder = {
        id: generateOrderId(),
        ownerEmail: ownerEmail,
        date: new Date().toISOString(),
        status: 'processing', // processing -> shipped -> delivered
        total: total,
        items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            image: item.image || item.img || null
        })),
        delivery: {
            firstName, lastName, email, phone, address, city, county
        },
        paymentMethod: paymentMethod,
        // Filled in later when the customer leaves feedback on this order (profile.html)
        review: null,
        // Filled in later if the customer reports a problem with this order (profile.html)
        issues: []
    };

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('grande_orders')) || [];
    } catch (e) {
        orders = [];
    }
    orders.push(newOrder);
    localStorage.setItem('grande_orders', JSON.stringify(orders));

    // Everything is validated and saved -> wipe cart data and launch completion window overlay modal
    localStorage.removeItem('grande_cart');

    const successOverlay = document.getElementById('success-overlay');
    const successMsg = document.getElementById('success-msg');
    if (successMsg) {
        successMsg.textContent = `Thank you for your order #${newOrder.id}. We'll reach out shortly to confirm delivery details.`;
    }
    if (successOverlay) {
        successOverlay.style.display = 'flex';
        successOverlay.style.opacity = '1';
    } else {
        alert(`Order #${newOrder.id} placed successfully! Thank you for buying from Grande Auto Hut Ltd.`);
        window.location.href = 'index.html';
    }
}