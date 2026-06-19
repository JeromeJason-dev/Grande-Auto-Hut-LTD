/**
 * @jest-environment jsdom
 */

/**
 * product.test.js
 *
 * Tests for product.js (Grande auto-parts storefront script).
 *
 * NOTE ON TESTABILITY:
 * The original product.js wrapped its entire body in an anonymous
 * `document.addEventListener('DOMContentLoaded', () => { ... })` callback
 * and exported nothing. That makes every internal function (renderGrid,
 * applyCombinedFiltersAndSorting, getGlobalCartItemCount, etc.) private and
 * uncallable from outside, so it was previously impossible to unit test
 * this file at all. The script was refactored so that the body lives in a
 * named `setupProductApp()` function that is still invoked on
 * DOMContentLoaded for real browser use (identical behavior), but now also
 * returns its internal functions so tests can call them directly. No
 * business logic was changed.
 */

const buildDom = () => {
  document.body.innerHTML = `
    <div class="product-grid"></div>
    <select id="sortSelect">
      <option value="default">Default</option>
      <option value="low-to-high">Low to High</option>
      <option value="high-to-low">High to Low</option>
    </select>
    <select id="filterSelect">
      <option value="all">All</option>
      <option value="brake">Brake</option>
      <option value="wipers">Wipers</option>
    </select>
    <span id="cart-count"></span>
    <input id="searchInput" />
    <div id="suggestions"></div>
  `;
};

const sampleProducts = [
  { id: 1, name: 'Brake Pad Set', price: 1500, currency: 'KES', image: 'brake.jpg', rating: 4 },
  { id: 2, name: 'Windshield Wiper Blade', price: 800, currency: 'KES', image: 'wiper.jpg', rating: 5 },
  { id: 3, name: 'Engine Oil Filter', price: 500, currency: 'KES', image: 'oil.jpg', rating: 3 },
  { id: 4, name: 'Brake Disc Rotor', price: 3000, currency: 'KES', image: 'rotor.jpg', rating: 5 },
];

function mockFetchOnce(products, adminInventory = []) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ products: JSON.parse(JSON.stringify(products)) }),
  });
  localStorage.setItem('grande_inventory_status', JSON.stringify(adminInventory));
}

// Wait for the in-flight initializeProductCatalogue() promise chain to settle.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

let app;

beforeEach(async () => {
  jest.resetModules();
  jest.useRealTimers();
  localStorage.clear();
  buildDom();
  mockFetchOnce(sampleProducts);
  app = require('./product.js').setupProductApp();
  await flushPromises();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('initializeProductCatalogue', () => {
  test('loads products from fetch into allProducts', () => {
    expect(app.getAllProducts()).toHaveLength(4);
    expect(app.getAllProducts().map((p) => p.name)).toEqual(
      expect.arrayContaining(['Brake Pad Set', 'Windshield Wiper Blade'])
    );
  });

  test('defaults inStock=true and quantity=10 when no admin override exists', () => {
    const product = app.getAllProducts().find((p) => p.id === 1);
    expect(product.inStock).toBe(true);
    expect(product.quantity).toBe(10);
  });

  test('applies admin inventory overrides by case-insensitive name match', async () => {
    mockFetchOnce(sampleProducts, [
      { name: 'brake pad set', inStock: false, quantity: 0 },
    ]);
    const app2 = require('./product.js').setupProductApp();
    await flushPromises();

    const product = app2.getAllProducts().find((p) => p.id === 1);
    expect(product.inStock).toBe(false);
    expect(product.quantity).toBe(0);
  });

  test('renders an error message in the grid when fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const app2 = require('./product.js').setupProductApp();
    await flushPromises();

    const grid = document.querySelector('.product-grid');
    expect(grid.textContent).toMatch(/Unable to connect to product inventory/i);
    expect(app2.getAllProducts()).toEqual([]); // unchanged from initial []
  });

  test('renders an error message when fetch itself rejects (network error)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('network down'));
    const app2 = require('./product.js').setupProductApp();
    await flushPromises();

    const grid = document.querySelector('.product-grid');
    expect(grid.textContent).toMatch(/Unable to connect to product inventory/i);
  });
});

describe('renderGrid', () => {
  test('renders one .product-card per product', () => {
    app.renderGrid(sampleProducts.map((p) => ({ ...p, inStock: true, quantity: 5 })));
    const cards = document.querySelectorAll('.product-card');
    expect(cards).toHaveLength(4);
  });

  test('shows "no products found" message for an empty array', () => {
    app.renderGrid([]);
    expect(document.querySelector('.product-grid').textContent).toMatch(
      /No auto parts found/i
    );
  });

  test('marks out-of-stock items (quantity 0) with disabled button and out-of-stock-card class', () => {
    app.renderGrid([{ ...sampleProducts[0], inStock: true, quantity: 0 }]);
    const card = document.querySelector('.product-card');
    expect(card.classList.contains('out-of-stock-card')).toBe(true);
    const btn = card.querySelector('button');
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toMatch(/out of stock/i);
  });

  test('marks out-of-stock items (inStock false) the same way, even with quantity > 0', () => {
    // Guards against a common bug: only checking quantity and ignoring inStock.
    app.renderGrid([{ ...sampleProducts[0], inStock: false, quantity: 10 }]);
    const card = document.querySelector('.product-card');
    expect(card.classList.contains('out-of-stock-card')).toBe(true);
    expect(card.querySelector('button').disabled).toBe(true);
  });

  test('in-stock items get an enabled "Add to cart" button with correct data-id', () => {
    app.renderGrid([{ ...sampleProducts[0], inStock: true, quantity: 5 }]);
    const btn = document.querySelector('.add-to-cart-btn');
    expect(btn.disabled).toBe(false);
    expect(btn.dataset.id).toBe(String(sampleProducts[0].id));
    expect(btn.textContent).toMatch(/add to cart/i);
  });

  test('renders correct number of filled vs empty stars based on floor(rating)', () => {
    app.renderGrid([{ ...sampleProducts[0], rating: 3.9, inStock: true, quantity: 5 }]);
    const filled = document.querySelectorAll('.fa-solid.fa-star');
    const empty = document.querySelectorAll('.fa-regular.fa-star');
    // floor(3.9) = 3 filled, 2 empty
    expect(filled).toHaveLength(3);
    expect(empty).toHaveLength(2);
  });

  test('defaults to a 5-star rating when product.rating is missing', () => {
    const { rating, ...noRating } = sampleProducts[0];
    app.renderGrid([{ ...noRating, inStock: true, quantity: 5 }]);
    expect(document.querySelectorAll('.fa-solid.fa-star')).toHaveLength(5);
  });

  test('falls back to a placeholder image on image load error (no inline onerror, XSS-safe)', () => {
    app.renderGrid([{ ...sampleProducts[0], inStock: true, quantity: 5 }]);
    const img = document.querySelector('.product-image-container img');
    expect(img.getAttribute('onerror')).toBeNull(); // no inline handler
    img.dispatchEvent(new Event('error'));
    expect(img.src).toContain('placehold.co');
    expect(img.src).toContain(encodeURIComponent(sampleProducts[0].name));
  });

  test('clicking "Add to cart" increments cart-count and persists to localStorage', () => {
    app.renderGrid([{ ...sampleProducts[0], inStock: true, quantity: 5 }]);
    const btn = document.querySelector('.add-to-cart-btn');
    btn.click();

    const cart = JSON.parse(localStorage.getItem('grande_cart'));
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(sampleProducts[0].id);
    expect(cart[0].quantity).toBe(1);
    expect(document.getElementById('cart-count').textContent).toBe('1');
  });

  test('clicking "Add to cart" twice on the same product increments quantity, not a duplicate row', () => {
    app.renderGrid([{ ...sampleProducts[0], inStock: true, quantity: 5 }]);
    const btn = document.querySelector('.add-to-cart-btn');
    btn.click();
    btn.click();

    const cart = JSON.parse(localStorage.getItem('grande_cart'));
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    expect(document.getElementById('cart-count').textContent).toBe('2');
  });

  test('does nothing (no throw) when productGrid is missing from the DOM', () => {
    document.querySelector('.product-grid').remove();
    expect(() => app.renderGrid(sampleProducts)).not.toThrow();
  });
});

describe('applyCombinedFiltersAndSorting', () => {
  test('search filters by case-insensitive substring match on name', () => {
    document.getElementById('searchInput').value = 'brake';
    app.applyCombinedFiltersAndSorting();
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual([
      'Brake Pad Set',
      'Brake Disc Rotor',
    ]);
  });

  test('"brake" dropdown filter matches only products with "brake" in the name', () => {
    document.getElementById('filterSelect').value = 'brake';
    app.applyCombinedFiltersAndSorting();
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual([
      'Brake Pad Set',
      'Brake Disc Rotor',
    ]);
  });

  test('"wipers" dropdown filter matches "wiper" or "windshield" in the name', () => {
    document.getElementById('filterSelect').value = 'wipers';
    app.applyCombinedFiltersAndSorting();
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual([
      'Windshield Wiper Blade',
    ]);
  });

  test('sorts low-to-high by price', () => {
    document.getElementById('sortSelect').value = 'low-to-high';
    app.applyCombinedFiltersAndSorting();
    const prices = app.getCurrentProducts().map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorts high-to-low by price', () => {
    document.getElementById('sortSelect').value = 'high-to-low';
    app.applyCombinedFiltersAndSorting();
    const prices = app.getCurrentProducts().map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('search and dropdown filter combine (AND, not OR)', () => {
    document.getElementById('searchInput').value = 'disc';
    document.getElementById('filterSelect').value = 'brake';
    app.applyCombinedFiltersAndSorting();
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual(['Brake Disc Rotor']);
  });

  test('re-renders the grid as a side effect', () => {
    document.getElementById('searchInput').value = 'oil';
    app.applyCombinedFiltersAndSorting();
    expect(document.querySelectorAll('.product-card')).toHaveLength(1);
  });
});

describe('handleSearchAutocompleteUI', () => {
  test('populates up to 5 suggestion items matching the query', () => {
    document.getElementById('searchInput').value = 'e'; // matches several
    app.handleSearchAutocompleteUI();
    const items = document.querySelectorAll('#suggestions .suggestion-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  test('clears suggestions and re-runs filtering when search is emptied', () => {
    document.getElementById('searchInput').value = 'brake';
    app.handleSearchAutocompleteUI();
    expect(document.querySelectorAll('#suggestions .suggestion-item').length).toBeGreaterThan(0);

    document.getElementById('searchInput').value = '';
    app.handleSearchAutocompleteUI();
    expect(document.querySelectorAll('#suggestions .suggestion-item')).toHaveLength(0);
    // empty search means all products should show again
    expect(app.getCurrentProducts()).toHaveLength(4);
  });

  test('clicking a suggestion fills the search box and filters the grid', () => {
    document.getElementById('searchInput').value = 'oil filter';
    app.handleSearchAutocompleteUI();
    const item = document.querySelector('#suggestions .suggestion-item');
    expect(item.textContent).toBe('Engine Oil Filter');

    item.click();
    expect(document.getElementById('searchInput').value).toBe('Engine Oil Filter');
    expect(document.querySelectorAll('#suggestions .suggestion-item')).toHaveLength(0);
    expect(app.getCurrentProducts()).toHaveLength(1);
  });
});

describe('getGlobalCartItemCount / refreshCartCountUI', () => {
  test('returns 0 when the cart is empty/unset', () => {
    localStorage.removeItem('grande_cart');
    expect(app.getGlobalCartItemCount()).toBe(0);
  });

  test('sums item quantities across multiple cart entries', () => {
    localStorage.setItem(
      'grande_cart',
      JSON.stringify([
        { id: 1, quantity: 2 },
        { id: 2, quantity: 3 },
      ])
    );
    expect(app.getGlobalCartItemCount()).toBe(5);
  });

  test('treats a missing quantity field as 1', () => {
    localStorage.setItem('grande_cart', JSON.stringify([{ id: 1 }, { id: 2 }]));
    expect(app.getGlobalCartItemCount()).toBe(2);
  });

  test('refreshCartCountUI writes the count into the cart-count element', () => {
    localStorage.setItem('grande_cart', JSON.stringify([{ id: 1, quantity: 7 }]));
    app.refreshCartCountUI();
    expect(document.getElementById('cart-count').textContent).toBe('7');
  });

  test('refreshCartCountUI does not throw when cart-count element is missing', () => {
    document.getElementById('cart-count').remove();
    expect(() => app.refreshCartCountUI()).not.toThrow();
  });
});

describe('event bindings', () => {
  test('changing sortSelect triggers re-filtering/sorting', () => {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.value = 'low-to-high';
    sortSelect.dispatchEvent(new Event('change'));
    const prices = app.getCurrentProducts().map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('changing filterSelect triggers re-filtering', () => {
    const filterSelect = document.getElementById('filterSelect');
    filterSelect.value = 'wipers';
    filterSelect.dispatchEvent(new Event('change'));
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual([
      'Windshield Wiper Blade',
    ]);
  });

  test('typing in searchInput triggers autocomplete + filtering', () => {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'rotor';
    searchInput.dispatchEvent(new Event('input'));
    expect(app.getCurrentProducts().map((p) => p.name)).toEqual(['Brake Disc Rotor']);
  });

  test('clicking outside the search input clears the suggestions panel', () => {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'brake';
    app.handleSearchAutocompleteUI();
    expect(document.querySelectorAll('#suggestions .suggestion-item').length).toBeGreaterThan(0);

    document.body.click();
    expect(document.getElementById('suggestions').innerHTML).toBe('');
  });
});