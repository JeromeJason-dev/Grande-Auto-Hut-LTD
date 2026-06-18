document.addEventListener('DOMContentLoaded', () => {
    // Define the checkoutBtn here so it can be accessed everywhere in the script
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const summaryItemCount = document.getElementById('summary-item-count');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    const navCartCount = document.getElementById('nav-cart-count');

    // Retrieve active array database string from localStorage cache
    let cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

    function renderCart() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        
        let totalItemsCount = 0;

        // If no products are present, cleanly render empty state layout
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg" style="text-align: center; padding: 40px 20px;">
                    <i class="fa-solid fa-cart-flatbed-empty" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p style="font-size: 16px; color: #555;">Your shopping cart is currently empty.</p>
                    <a href="product.html" style="color: #007bff; text-decoration: underline; font-weight: 500;">Go back to browse items</a>
                </div>`;
            
            if (navCartCount) navCartCount.textContent = '0';
            if (summaryItemCount) summaryItemCount.textContent = '0';
            if (summaryTotalPrice) summaryTotalPrice.textContent = 'Ksh 0';
            if (checkoutBtn) {
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        // --- YOUR SIPPET GOES RIGHT HERE ---
        let totalPriceSum = 0;
        
        // RESTORE BUTTON VISUALS IF ITEMS EXIST
        if (checkoutBtn) {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.cursor = 'pointer';
        }
        // ------------------------------------

        // Loop array and build layout blocks sequentially
        cart.forEach((item, index) => {
            const itemQuantity = item.quantity || 1; 
            const itemTotal = item.price * itemQuantity;
            
            totalItemsCount += itemQuantity;
            totalPriceSum += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            itemElement.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">Ksh ${item.price.toLocaleString()}</p>
                    <div class="quantity-controls">
                        <button class="qty-btn minus-btn" data-index="${index}">-</button>
                        <span class="qty-value">${itemQuantity}</span>
                        <button class="qty-btn plus-btn" data-index="${index}">+</button>
                    </div>
                </div>
                <button class="remove-btn" data-index="${index}"><i class="fa-regular fa-trash-can"></i> Remove</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Sync calculation states to header element badges and sidebar block values
        if (navCartCount) navCartCount.textContent = totalItemsCount;
        if (summaryItemCount) summaryItemCount.textContent = totalItemsCount;
        if (summaryTotalPrice) {
            summaryTotalPrice.textContent = `Ksh ${totalPriceSum.toLocaleString()}`;
        }
    }

    // Interactive Action Delegation Handler (Handles deletes and increments together)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');
            if (!targetButton) return;

            const targetIndex = parseInt(targetButton.getAttribute('data-index'), 10);
            if (isNaN(targetIndex)) return;

            if (targetButton.classList.contains('remove-btn')) {
                cart.splice(targetIndex, 1);
            } 
            else if (targetButton.classList.contains('plus-btn')) {
                cart[targetIndex].quantity = (cart[targetIndex].quantity || 1) + 1;
            } 
            else if (targetButton.classList.contains('minus-btn')) {
                if ((cart[targetIndex].quantity || 1) > 1) {
                    cart[targetIndex].quantity -= 1;
                } else {
                    cart.splice(targetIndex, 1);
                }
            }

            // Sync structural modification back to dynamic database persistence storage
            localStorage.setItem('grande_cart', JSON.stringify(cart));
            renderCart();
        });
    }

    // Guard Rails: Empty Cart Checkout Interceptor Validation
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            const currentCart = JSON.parse(localStorage.getItem('grande_cart')) || [];
            
            if (currentCart.length === 0) {
                e.preventDefault(); 
                alert('Your shopping cart is empty! Please add parts from our products page before attempting to checkout.');
            } else {
                window.location.href = 'checkout.html';
            }
        });
    }

    // Run pipeline logic execution sequentially on document launch initialization pass
    renderCart();
});