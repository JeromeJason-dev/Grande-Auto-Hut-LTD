document.addEventListener('DOMContentLoaded', () => {
    const matrixBody = document.getElementById('admin-matrix-body');
    const STORAGE_KEY = 'grande_inventory_status';
    const PRODUCTS_URL = 'products.json'; // adjust path if products.json lives elsewhere

    let inventoryRegistry = [];

    // Read whatever stock overrides (inStock / quantity) were previously saved, keyed by product id
    function loadStockOverrides() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!Array.isArray(raw)) return {};
            const map = {};
            raw.forEach((item) => {
                if (item && item.id !== undefined) {
                    map[item.id] = { inStock: item.inStock, quantity: item.quantity };
                }
            });
            return map;
        } catch (e) {
            return {};
        }
    }

    function persistInventory() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inventoryRegistry));
    }

    async function loadProducts() {
        let products;
        try {
            const response = await fetch("product.json");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            products = data.products || [];
        } catch (err) {
            matrixBody.innerHTML = `<tr><td colspan="4">Failed to load products from ${PRODUCTS_URL}: ${err.message}</td></tr>`;
            return;
        }

        const overrides = loadStockOverrides();

        // Merge catalog data (id/name) with saved stock state, falling back to sensible defaults for new products
        inventoryRegistry = products.map((product) => {
            const saved = overrides[product.id];
            return {
                id: product.id,
                name: product.name,
                inStock: saved && saved.inStock !== undefined ? saved.inStock : true,
                quantity: saved && saved.quantity !== undefined ? saved.quantity : 10
            };
        });

        persistInventory();
        renderAdminMatrix();
    }

    function renderAdminMatrix() {
        matrixBody.innerHTML = '';
        inventoryRegistry.forEach((item, index) => {
            const row = document.createElement('tr');

            // Smart safety fallback logic: if quantity is 0, force it to display out of stock
            const displayInStock = item.quantity > 0 ? item.inStock : false;

            const pillClass = displayInStock ? 'pill-in' : 'pill-out';
            const statusText = displayInStock ? 'In Stock' : 'Out of Stock';
            const buttonText = displayInStock ? 'Mark Out of Stock' : 'Mark In Stock';

            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span class="status-pill ${pillClass}">${statusText}</span></td>
                <td>
                    <div class="qty-controls">
                        <button class="qty-btn btn-reduce" data-action="reduce" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn btn-add" data-action="add" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </td>
                <td>
                    <button class="action-toggle-btn" data-action="toggle" data-index="${index}">
                        ${buttonText}
                    </button>
                </td>
            `;
            matrixBody.appendChild(row);
        });
    }

    // Consolidated Event Delegation Block
    matrixBody.addEventListener('click', (e) => {
        // Find closest element with a target data attribute if clicking fontawesome icons inside buttons
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const action = targetBtn.getAttribute('data-action');
        const idx = parseInt(targetBtn.getAttribute('data-index'), 10);
        if (!inventoryRegistry[idx]) return;

        if (action === 'toggle') {
            inventoryRegistry[idx].inStock = !inventoryRegistry[idx].inStock;

            // User helper loop: if marking an out-of-stock item as available but qty is 0, give it a default stock of 5
            if (inventoryRegistry[idx].inStock && inventoryRegistry[idx].quantity === 0) {
                inventoryRegistry[idx].quantity = 5;
            }
        }
        else if (action === 'add') {
            inventoryRegistry[idx].quantity += 1;
            // Auto toggle back to True if user updates quantity from zero
            if (inventoryRegistry[idx].quantity > 0 && !inventoryRegistry[idx].inStock) {
                inventoryRegistry[idx].inStock = true;
            }
        }
        else if (action === 'reduce') {
            if (inventoryRegistry[idx].quantity > 0) {
                inventoryRegistry[idx].quantity -= 1;

                if (inventoryRegistry[idx].quantity === 0) {
                    inventoryRegistry[idx].inStock = false;
                }
            }
        }

        // Persist state arrays immediately back to localStorage
        persistInventory();
        renderAdminMatrix();
    });

    // Logout Handler Configuration
    document.getElementById('logoutAction').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isAdminAuthenticated');
        window.location.replace('login.html');
    });

    loadProducts();
});