document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       Reads/writes orders from 'grande_orders' (see checkout.js for the order
       shape it writes). Reviews and issues are stored ON the order record
       itself (order.review, order.issues[]) since reviews here are per-order,
       not per-product — matching the project's existing localStorage pattern
       of one source-of-truth array per feature.
       ========================================================================== */
    const ORDERS_KEY = 'grande_orders';

    let activeOrderIdForReview = null;
    let selectedStarRating = 0;

    // ---------------- Helpers ----------------
    function getOrders() {
        try {
            return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr || '—';
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function formatItemsSummary(items) {
        if (!Array.isArray(items)) return '—';
        return items.map((it) => `${it.name}${it.quantity > 1 ? ' x' + it.quantity : ''}`).join(', ');
    }

    function statusBadge(status) {
        const normalized = (status || 'processing').toLowerCase();
        const labels = { processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
        return `<span class="status-badge ${normalized}">${labels[normalized] || 'Processing'}</span>`;
    }

    function starsDisplay(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
        }
        return html;
    }

    // ---------------- Tabs ----------------
    const tabButtons = document.querySelectorAll('.profile-tab');
    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabButtons.forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.profile-panel').forEach((p) => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`panel-tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // ---------------- Tab 1: Track Orders ----------------
    function renderTracking() {
        const container = document.getElementById('trackingOrdersList');
        const orders = getOrders();

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state-msg">No orders yet. <a href="product.html">Start shopping →</a></div>`;
            return;
        }

        const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sorted.map((order) => `
            <div class="order-list-item">
                <div class="order-list-item-info">
                    <h4>#${order.id}</h4>
                    <p>${formatDate(order.date)} · ${formatItemsSummary(order.items)}</p>
                    <p>${statusBadge(order.status)}</p>
                </div>
                <div class="order-list-item-actions">
                    <button class="btn-small btn-track" onclick="openTracker('${order.id}', '${(order.status || 'processing').toLowerCase()}')">
                        <i class="fa-solid fa-location-dot"></i> Track
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ---------------- Tab 2: Reviews & Ratings ----------------
    function renderReviews() {
        const container = document.getElementById('reviewOrdersList');
        const orders = getOrders();

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state-msg">No orders yet. <a href="product.html">Start shopping →</a></div>`;
            return;
        }

        const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sorted.map((order) => {
            const isDelivered = (order.status || '').toLowerCase() === 'delivered';
            let actionHtml;

            if (order.review) {
                actionHtml = `<span class="status-badge delivered"><i class="fa-solid fa-check"></i> Reviewed</span>`;
            } else if (isDelivered) {
                actionHtml = `<button class="btn-small btn-review" onclick="openReviewModal('${order.id}')"><i class="fa-solid fa-star"></i> Leave a Review</button>`;
            } else {
                actionHtml = `<button class="btn-small btn-disabled" disabled title="Available once delivered"><i class="fa-solid fa-star"></i> Leave a Review</button>`;
            }

            const reviewBlock = order.review ? `
                <div class="existing-review">
                    <div class="stars-display">${starsDisplay(order.review.rating)}</div>
                    <p>${escapeHtml(order.review.text)}</p>
                </div>` : '';

            return `
                <div class="order-list-item" style="align-items: flex-start;">
                    <div class="order-list-item-info" style="flex: 1;">
                        <h4>#${order.id}</h4>
                        <p>${formatDate(order.date)} · ${formatItemsSummary(order.items)}</p>
                        <p>${statusBadge(order.status)}</p>
                        ${reviewBlock}
                    </div>
                    <div class="order-list-item-actions">
                        ${actionHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    window.openReviewModal = function (orderId) {
        activeOrderIdForReview = orderId;
        selectedStarRating = 0;
        document.getElementById('reviewModalOrderId').textContent = `#${orderId}`;
        document.getElementById('reviewText').value = '';
        updateStarDisplay(0);
        document.getElementById('reviewModal').style.display = 'flex';
    };

    window.closeReviewModal = function () {
        document.getElementById('reviewModal').style.display = 'none';
    };

    function updateStarDisplay(rating) {
        const stars = document.querySelectorAll('#starRatingInput i');
        stars.forEach((star) => {
            const val = parseInt(star.getAttribute('data-value'), 10);
            star.className = val <= rating ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
    }

    const starRatingInput = document.getElementById('starRatingInput');
    if (starRatingInput) {
        starRatingInput.addEventListener('click', (e) => {
            const star = e.target.closest('i');
            if (!star) return;
            selectedStarRating = parseInt(star.getAttribute('data-value'), 10);
            updateStarDisplay(selectedStarRating);
        });
    }

    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', () => {
            const text = document.getElementById('reviewText').value.trim();

            if (selectedStarRating === 0) {
                alert('Please select a star rating before submitting.');
                return;
            }
            if (!text) {
                alert('Please write a short review before submitting.');
                return;
            }

            const orders = getOrders();
            const order = orders.find((o) => o.id === activeOrderIdForReview);
            if (!order) {
                alert('Could not find that order. Please refresh and try again.');
                return;
            }

            order.review = {
                rating: selectedStarRating,
                text: text,
                date: new Date().toISOString()
            };

            saveOrders(orders);
            closeReviewModal();
            renderReviews();
        });
    }

    // ---------------- Tab 3: Report an Issue ----------------
    function populateIssueOrderSelect() {
        const select = document.getElementById('issueOrderSelect');
        const orders = getOrders();
        const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

        select.innerHTML = '<option value="">Choose an order…</option>' +
            sorted.map((o) => `<option value="${o.id}">#${o.id} — ${formatDate(o.date)}</option>`).join('');
    }

    function renderIssuesHistory() {
        const container = document.getElementById('issuesHistoryList');
        const orders = getOrders();

        const allIssues = [];
        orders.forEach((order) => {
            (order.issues || []).forEach((issue) => {
                allIssues.push({ ...issue, orderId: order.id });
            });
        });

        if (allIssues.length === 0) {
            container.innerHTML = `<div class="empty-state-msg">You haven't reported any issues.</div>`;
            return;
        }

        allIssues.sort((a, b) => new Date(b.date) - new Date(a.date));

        const typeLabels = {
            damaged: 'Item arrived damaged',
            wrong_item: 'Wrong item received',
            missing_item: 'Item missing from order',
            late_delivery: 'Delivery delayed / late',
            quality: 'Part quality concern',
            other: 'Other'
        };

        container.innerHTML = allIssues.map((issue) => `
            <div class="order-list-item" style="align-items: flex-start;">
                <div class="order-list-item-info">
                    <h4>#${issue.orderId} — ${typeLabels[issue.type] || 'Other'}</h4>
                    <p>${formatDate(issue.date)}</p>
                    <p>${escapeHtml(issue.description)}</p>
                </div>
                <div class="order-list-item-actions">
                    <span class="issue-status-pill">${issue.status || 'Submitted'}</span>
                </div>
            </div>
        `).join('');
    }

    const submitIssueBtn = document.getElementById('submitIssueBtn');
    if (submitIssueBtn) {
        submitIssueBtn.addEventListener('click', () => {
            const orderId = document.getElementById('issueOrderSelect').value;
            const type = document.getElementById('issueType').value;
            const description = document.getElementById('issueDescription').value.trim();

            if (!orderId) {
                alert('Please select which order this issue relates to.');
                return;
            }
            if (!description) {
                alert('Please describe the issue before submitting.');
                return;
            }

            const orders = getOrders();
            const order = orders.find((o) => o.id === orderId);
            if (!order) {
                alert('Could not find that order. Please refresh and try again.');
                return;
            }

            if (!Array.isArray(order.issues)) order.issues = [];
            order.issues.push({
                type,
                description,
                date: new Date().toISOString(),
                status: 'Submitted'
            });

            saveOrders(orders);

            document.getElementById('issueDescription').value = '';
            document.getElementById('issueOrderSelect').value = '';

            alert('Your issue has been reported. Our team will get back to you shortly.');
            renderIssuesHistory();
        });
    }

    // ---------------- Init ----------------
    renderTracking();
    renderReviews();
    populateIssueOrderSelect();
    renderIssuesHistory();
});