function setupProductApp() {
  // --- DOM CACHE DECK REGISTER ---
  const productGrid = document.querySelector('.product-grid');
  const sortSelect = document.getElementById('sortSelect');
  const filterSelect = document.getElementById('filterSelect');
  const cartCountElement = document.getElementById('cart-count');
  const searchInput = document.getElementById('searchInput');
  const suggestionsPanel = document.getElementById('suggestions');

  // Unified Runtime App States 
  let allProducts = [];
  let currentProducts = [];
  let cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

  // --- 1. INITIALIZATION DATA PIPELINE RUNNERS ---
  async function initializeProductCatalogue() {
    try {
      const response = await fetch('product.json');
      if (!response.ok) throw new Error('Failed to acquire API products data ledger.');
      
      const data = await response.json();
      
      // Pull live admin dashboard updates from localStorage
      const adminInventory = JSON.parse(localStorage.getItem('grande_inventory_status')) || [];

      // Map across json file products and cross-reference state with admin adjustments
      allProducts = data.products.map(product => {
        // Match by product name
        const liveAdminUpdate = adminInventory.find(item => item.name.toLowerCase() === product.name.toLowerCase());
        
        if (liveAdminUpdate) {
          // Sync stock status and quantity attributes dynamically
          product.inStock = liveAdminUpdate.inStock;
          product.quantity = liveAdminUpdate.quantity;
        } else {
          // Default fallbacks if the item hasn't been handled by admin script yet
          product.inStock = true;
          product.quantity = 10;
        }
        return product;
      });

      currentProducts = [...allProducts];
      
      renderGrid(currentProducts);
      refreshCartCountUI();
    } catch (error) {
      console.error('System Data Loading Error Exception:', error);
      if (productGrid) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: #ef4444; font-weight:600;">Unable to connect to product inventory. Please verify your local live server connection state configurations and try again.</p>`;
      }
    }
  }

  // --- 2. LAYOUT ENGINE MATRIX GENERATOR ---
  function renderGrid(productsToRender) {
    if (!productGrid) return;
    productGrid.innerHTML = '';

    if (productsToRender.length === 0) {
      productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #6b7280;">No auto parts found matching your selection criteria.</p>`;
      return;
    }

    productsToRender.forEach(product => {
      // FontAwesome Star Component Generator Loop
      let starsHTML = '';
      const baselineRating = Math.floor(product.rating || 5);
      for (let i = 1; i <= 5; i++) {
        starsHTML += i <= baselineRating 
          ? `<i class="fa-solid fa-star"></i>` 
          : `<i class="fa-regular fa-star"></i>`;
      }

      // Check live status
      const isAvailable = product.inStock && product.quantity > 0;

      const card = document.createElement('article');
      card.className = `product-card ${!isAvailable ? 'out-of-stock-card' : ''}`;
      
      // FIX: Render base layout block without string-broken inline onerror attributes
      card.innerHTML = `
        <div class="product-image-container"></div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating">${starsHTML}</div>
          <p class="price">${product.currency} ${product.price.toLocaleString()}</p>
          ${isAvailable 
            ? `<button class="add-to-cart-btn" data-id="${product.id}">Add to cart</button>` 
            : `<button class="add-to-cart-btn disabled-btn" disabled style="background-color: #9ca3af; cursor: not-allowed;">Out of Stock</button>`
          }
        </div>
      `;

      // FIX: Dynamic standalone image handling node injection to prevent layout-shattering XSS vulnerabilities
      const imgElement = document.createElement('img');
      imgElement.src = product.image;
      imgElement.alt = product.name;
      imgElement.addEventListener('error', () => {
        imgElement.src = `https://placehold.co/250x200?text=${encodeURIComponent(product.name)}`;
      });
      card.querySelector('.product-image-container').appendChild(imgElement);

      // Interactive Add-To-Cart Execution (only bind if available)
      const actionButton = card.querySelector('.add-to-cart-btn:not(.disabled-btn)');
      if (actionButton) {
        actionButton.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Re-sync local container array reference state before evaluation pass
          cart = JSON.parse(localStorage.getItem('grande_cart')) || [];

          // FIX: Check if product structural model already exists inside tracking data array
          const existingCartItem = cart.find(item => item.id === product.id);

          if (existingCartItem) {
            // Increment existing item parameter safely
            existingCartItem.quantity = (existingCartItem.quantity || 1) + 1;
          } else {
            // Push complete payload object with assigned explicit quantifiers
            cart.push({
              id: product.id,
              name: product.name,
              price: product.price,
              currency: product.currency,
              image: product.image,
              quantity: 1
            });
          }

          localStorage.setItem('grande_cart', JSON.stringify(cart));
          refreshCartCountUI();

          // UI Button Interaction Feedback Flash Loops
          actionButton.textContent = 'Added! ✓';
          actionButton.style.backgroundColor = '#22c55e';
          
          setTimeout(() => {
            actionButton.textContent = 'Add to cart';
            actionButton.style.backgroundColor = '';
          }, 1000);
        });
      }

      productGrid.appendChild(card);
    });
  }

  // --- 3. PIPELINE FILTER & SORT INTERACTION CONTROL SYSTEM ---
  function applyCombinedFiltersAndSorting() {
    const searchValue = searchInput.value.toLowerCase().trim();
    const filterValue = filterSelect.value.toLowerCase();
    const sortValue = sortSelect.value;

    // A. Apply Search Filter Rules
    let processedProducts = allProducts.filter(product => 
      product.name.toLowerCase().includes(searchValue)
    );

    // B. Apply Dropdown Filter Match Settings Matrix
    if (filterValue !== 'all') {
      processedProducts = processedProducts.filter(product => {
        const name = product.name.toLowerCase();
        if (filterValue === 'brake') {
          return name.includes('brake');
        }
        if (filterValue === 'wipers') {
          return name.includes('wiper') || name.includes('windshield');
        }
        return name.includes(filterValue);
      });
    }

    // C. Apply Multi-Directional Currency Sort Computations
    if (sortValue === 'low-to-high') {
      processedProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'high-to-low') {
      processedProducts.sort((a, b) => b.price - a.price);
    }

    currentProducts = processedProducts;
    renderGrid(currentProducts);
  }

  // --- 4. ASYNC SEARCH AUTOCOMPLETE INDEPENDENT ENGINE ---
  function handleSearchAutocompleteUI() {
    const value = searchInput.value.toLowerCase().trim();
    suggestionsPanel.innerHTML = '';

    if (value === '') {
      applyCombinedFiltersAndSorting();
      return;
    }

    const matchedSuggestions = allProducts.filter(p => 
      p.name.toLowerCase().includes(value)
    );

    matchedSuggestions.slice(0, 5).forEach(product => {
      const rowItem = document.createElement('div');
      rowItem.className = 'suggestion-item';
      rowItem.textContent = product.name;

      rowItem.addEventListener('click', () => {
        searchInput.value = product.name;
        suggestionsPanel.innerHTML = '';
        applyCombinedFiltersAndSorting();
      });

      suggestionsPanel.appendChild(rowItem);
    });

    applyCombinedFiltersAndSorting();
  }

  // --- 5. COMPONENT UI PERSISTENCE MANAGEMENT UPDATER ---
  // FIX: Helper logic algorithm to map totals accurately using .reduce cumulative reduction loops
  function getGlobalCartItemCount() {
    const currentStorage = JSON.parse(localStorage.getItem('grande_cart')) || [];
    return currentStorage.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  function refreshCartCountUI() {
    if (!cartCountElement) return;
    // Apply aggregate sum straight into DOM container node text elements
    cartCountElement.textContent = getGlobalCartItemCount();
  }

  // --- 6. EVENT BINDING SUITE LISTENERS ---
  if (sortSelect) sortSelect.addEventListener('change', applyCombinedFiltersAndSorting);
  if (filterSelect) filterSelect.addEventListener('change', applyCombinedFiltersAndSorting);
  if (searchInput) searchInput.addEventListener('input', handleSearchAutocompleteUI);

  // Structural Blur Listener to clean suggestions list layout nodes safely
  document.addEventListener('click', (e) => {
    if (suggestionsPanel && e.target !== searchInput && e.target !== suggestionsPanel) {
      suggestionsPanel.innerHTML = '';
    }
  });

  // Ignition Loop Trigger
  initializeProductCatalogue();

  // Expose internals for testing purposes only (no effect on browser behavior)
  return {
    initializeProductCatalogue,
    renderGrid,
    applyCombinedFiltersAndSorting,
    handleSearchAutocompleteUI,
    getGlobalCartItemCount,
    refreshCartCountUI,
    getAllProducts: () => allProducts,
    getCurrentProducts: () => currentProducts,
  };
}

// Real browser behavior: run exactly as before, on DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
  setupProductApp();
});

// Test-only hook: lets Jest/Node call setupProductApp() directly against
// a jsdom document that already has the required elements in place.
// This block is a no-op in real browsers (module is undefined there).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupProductApp };
}