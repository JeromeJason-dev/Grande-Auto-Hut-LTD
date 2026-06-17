document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT INITIALIZATION ---
    const productGrid = document.querySelector('.product-grid');
    const sortSelect = document.querySelector('.flex select:nth-of-type(1)');
    const filterSelect = document.querySelector('.flex select:nth-of-type(2)');
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const cartCountElement = document.getElementById('cart-count');
    
    // Search Elements
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("suggestions");

    // Pull cart from local storage using your dedicated key 'grande_cart'
    let cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

    // --- 1. CART COUNT REFRESH LOGIC ---
    function updateCartCountDOM() {
        if (!cartCountElement) return;
        
        // Refresh the local reference to stay synced
        const currentCart = JSON.parse(localStorage.getItem('grande_cart')) || [];
        
        // Count reflects total elements stored in context
        cartCountElement.textContent = currentCart.length;
    }

    // Run immediately on page load to render existing cart totals
    updateCartCountDOM();


    // --- 2. GLOBAL CLICK & ADD-TO-CART LOGIC ---
    if (productGrid) {
        productGrid.addEventListener('click', (e) => {
            // Check if clicked element is the button, or an icon inside the button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                e.preventDefault(); 
                
                const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
                
                // Ensure it's an add-to-cart action button
                if (!button.classList.contains('add-to-cart-btn')) return;

                const card = button.closest('.product-card');
                if (!card) return;

                // Extract data directly from your clean HTML tags
                const productName = card.querySelector('h3').textContent.trim();
                const priceText = card.querySelector('.price').textContent; 
                
                // Clean the price string into a pure integer
                const productPrice = parseInt(priceText.replace(/[^\d]/g, ''), 10);
                const productImage = card.querySelector('img').getAttribute('src');

                // Build the item payload object
                const product = {
                    name: productName,
                    price: productPrice,
                    img: productImage
                };

                // Push item to storage array
                cart.push(product);
                localStorage.setItem('grande_cart', JSON.stringify(cart));

                // --- UPDATE NAV BAR BADGE IMMEDIATELY ---
                updateCartCountDOM();

                // Quick visual confirmation on button
                const originalText = button.innerHTML;
                button.innerHTML = 'Added! ✓';
                button.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.backgroundColor = '';
                }, 800);
            }
        });
    }


    // --- 3. SORTING LOGIC ---
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sortValue = sortSelect.value;
            if (sortValue === 'Sort by Price') return;

            const sortedCards = [...productCards].sort((a, b) => {
                const priceA = parseInt(a.querySelector('.price').textContent.replace(/[^\d]/g, ''), 10);
                const priceB = parseInt(b.querySelector('.price').textContent.replace(/[^\d]/g, ''), 10);
                return sortValue === 'Low to High' ? priceA - priceB : priceB - priceA;
            });

            productGrid.innerHTML = '';
            sortedCards.forEach(card => productGrid.appendChild(card));
        });
    }


    // --- 4. FILTER LOGIC ---
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const selectedValue = filterSelect.value.toLowerCase();
            
            productCards.forEach(card => {
                const productName = card.querySelector('h3').textContent.toLowerCase();
                if (selectedValue === 'filter' || productName.includes(selectedValue) || (selectedValue === 'brake pad' && productName.includes('brake'))) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }


    // --- 5. SEARCH & AUTOCOMPLETE SUGGESTIONS LOGIC ---
    if (searchInput && suggestions) {
        searchInput.addEventListener("input", () => {
            const value = searchInput.value.toLowerCase();
            suggestions.innerHTML = "";

            productCards.forEach(product => {
                const productName = product.querySelector("h3").textContent;

                if (productName.toLowerCase().includes(value) && value !== "") {
                    const item = document.createElement("div");
                    item.textContent = productName;
                    item.classList.add("suggestion-item"); // Useful hook for your custom drop-down styling

                    item.addEventListener("click", () => {
                        searchInput.value = productName;
                        suggestions.innerHTML = "";

                        // Make sure the hidden matching element is visible again if filter rules hide it
                        product.style.display = 'block';

                        product.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                        // Orange highlight indicator context flash
                        product.style.border = "3px solid orange";

                        setTimeout(() => {
                            product.style.border = "";
                        }, 2000);
                    });

                    suggestions.appendChild(item);
                }
            });
        });

        // Hide suggestions drop-down box context when clicking outside it
        document.addEventListener("click", (e) => {
            if (e.target !== searchInput && e.target !== suggestions) {
                suggestions.innerHTML = "";
            }
        });
    }
});