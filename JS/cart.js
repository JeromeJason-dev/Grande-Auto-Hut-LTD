document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const summaryItemCount = document.getElementById('summary-item-count');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    const navCartCount = document.getElementById('nav-cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Read stored live data array context from memory cache registry
    let cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

    

    function renderCart() {
        // Reset element views
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        
        // Update item total badges
        if (navCartCount) navCartCount.textContent = cart.length;
        if (summaryItemCount) summaryItemCount.textContent = cart.length;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <p>Your shopping cart is currently empty.</p>
                    <a href="product.html" style="color: #007bff; text-decoration: underline;">Go back to browse items</a>
                </div>`;
            if (summaryTotalPrice) summaryTotalPrice.textContent = 'Ksh 0';
            return;
        }

        let totalPriceSum = 0;

        // Loop array and build layout blocks sequentially
        cart.forEach((item, index) => {
            totalPriceSum += item.price;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width:80px; height:80px; object-fit:contain;">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p style="margin:5px 0 0 0; color:#555;">Ksh ${item.price.toLocaleString()}</p>
                </div>
                <button class="remove-btn" data-index="${index}">Remove</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        if (summaryTotalPrice) {
            summaryTotalPrice.textContent = `Ksh ${totalPriceSum.toLocaleString()}`;
        }
    }

    // Deletion Logic Listener Handler
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const targetIndex = e.target.getAttribute('data-index');
                cart.splice(targetIndex, 1); // Delete item entry out of active array sequence
                localStorage.setItem('grande_cart', JSON.stringify(cart)); // Update live persistence storage
                renderCart(); // Trigger fresh interface rendering refresh pass
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('Order received successfully! Thank you for choosing Grande Auto Hut.');
                cart = [];
                localStorage.removeItem('grande_cart');
                renderCart();
            } else {
                alert('Your cart is empty. Add items from the products page before checking out.');
            }
        });
    }

    renderCart();
    
});