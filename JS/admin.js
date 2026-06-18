document.addEventListener('DOMContentLoaded', () => {
            const matrixBody = document.getElementById('admin-matrix-body');

            // Hardcoded initial collection structured with default quantities
            const defaultProducts = [
                { name: "Ignition Coil", inStock: true, quantity: 15 },
                { name: "Crankshaft", inStock: true, quantity: 5 },
                { name: "Bumper", inStock: true, quantity: 8 },
                { name: "Clutch Kit", inStock: true, quantity: 12 },
                { name: "Alternator", inStock: true, quantity: 7 },
                { name: "Water Pump", inStock: true, quantity: 14 },
                { name: "Oil Filter", inStock: true, quantity: 50 },
                { name: "Shock Absorber", inStock: true, quantity: 20 },
                { name: "Radiator", inStock: true, quantity: 6 },
                { name: "Headlights", inStock: true, quantity: 10 },
                { name: "Coolant", inStock: true, quantity: 25 },
                { name: "Battery", inStock: true, quantity: 11 },
                { name: "Brake Pads", inStock: true, quantity: 35 },
                { name: "Spark Plug", inStock: true, quantity: 100 },
                { name: "Brake Cylinder", inStock: true, quantity: 9 },
                { name: "Windshield Wipers", inStock: true, quantity: 40 }
            ];

            // Migration step: handle structural layout upgrades smoothly if older keys exist
            let inventoryRegistry = JSON.parse(localStorage.getItem('grande_inventory_status')) || defaultProducts;
            
            // Ensure any legacy localStorage items missing the quantity field get fixed automatically
            inventoryRegistry = inventoryRegistry.map((item, index) => {
                if (item.quantity === undefined) {
                    item.quantity = defaultProducts[index] ? defaultProducts[index].quantity : 10;
                }
                return item;
            });
            
            localStorage.setItem('grande_inventory_status', JSON.stringify(inventoryRegistry));

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

                // Persist state arrays immediately back to global application context
                localStorage.setItem('grande_inventory_status', JSON.stringify(inventoryRegistry));
                renderAdminMatrix();
            });

            // Logout Handler Configuration
            document.getElementById('logoutAction').addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.removeItem('isAdminAuthenticated');
                window.location.replace('login.html');
            });

            renderAdminMatrix();
        });