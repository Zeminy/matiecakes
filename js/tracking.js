// Tracking page logic (extracted from tracking.html)

const SHIPPERS = [
    { name: 'John A.', phone: '+84 901 234 567' },
    { name: 'Michael B.', phone: '+84 902 345 678' },
    { name: 'Emily C.', phone: '+84 903 456 789' },
    { name: 'Daniel D.', phone: '+84 904 567 890' },
    { name: 'Sophia E.', phone: '+84 905 678 901' },
];

const DEFAULT_TRACKING_STEPS = [
    { code: 'prep', title: 'Bakery is preparing your order', note: 'Kitchen is carefully preparing your treats.' },
    { code: 'pickup_on_the_way', title: 'Driver on the way to store', note: 'Driver is heading to the bakery.' },
    { code: 'pickup_waiting', title: 'Driver arrived at store', note: 'Waiting for the order to be handed over.' },
    { code: 'on_delivery', title: 'Out for delivery', note: 'Your order is on the way to the destination.' },
    { code: 'delivered', title: 'Delivered successfully', note: 'Order has been delivered. Enjoy!' }
];

function formatTime(d) {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

function enrichShipments(rawShipments = []) {
    const now = new Date();
    return rawShipments.map((s, idx) => {
        // Always assign a demo driver based on index
        const shipper = SHIPPERS[idx % SHIPPERS.length];
        // Build a fake timeline around "now" for demo
        const base = new Date(now.getTime() - (30 + idx * 5) * 60000);
        const offsets = [0, 10, 20, 35, 55]; // minutes after base
        const stepCodes = ['prep', 'pickup_on_the_way', 'pickup_waiting', 'on_delivery', 'delivered'];
        const steps = (s.steps && s.steps.length ? s.steps : DEFAULT_TRACKING_STEPS)
            .map((st, i) => {
                const t = new Date(base.getTime() + offsets[i % offsets.length] * 60000);
                return { ...st, time: formatTime(t) };
            });
        const activeIndex = Math.min(
            typeof s.activeIndex === 'number' ? s.activeIndex : 3, // default: out for delivery
            steps.length - 1
        );
        return {
            id: s.id || `#SHIP-${idx + 1}`,
            orderId: s.orderId || currentOrderId, // Preserve Order ID
            recipient: s.recipient || `Address ${idx + 1}`,
            steps,
            activeIndex,
            shipper
        };
    });
}

let shipments = [];
let activeShipmentIndex = 0;
let dismissedMap = {};
let currentOrderId = null; // Store the actual Order ID (e.g., ORDER-ITIUK2122-1)

// Build a unique key for tracking dismissed state per order + shipment
function getDismissKey(shipment) {
    const baseOrderId = shipment.orderId || currentOrderId || 'unknown-order';
    const baseShipId = shipment.id || 'unknown-shipment';
    return `${baseOrderId}::${baseShipId}`;
}

function loadDismissedMap() {
    try {
        const raw = localStorage.getItem('trackingDismissedMap');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveDismissedMap() {
    try {
        localStorage.setItem('trackingDismissedMap', JSON.stringify(dismissedMap));
    } catch (e) {
        // ignore
    }
}

function loadShipmentsFromStorage() {
    let rawShipments = [];
    try {
        const raw = localStorage.getItem('trackingShipments');
        if (raw) rawShipments = JSON.parse(raw);
    } catch (e) {
        rawShipments = [];
    }

    // Extract Order ID from first shipment if available
    if (rawShipments.length > 0 && rawShipments[0].orderId) {
        currentOrderId = rawShipments[0].orderId;
    }

    dismissedMap = loadDismissedMap();
    shipments = enrichShipments(rawShipments).map(s => {
        const enriched = {
            ...s,
            orderId: s.orderId || currentOrderId // Preserve Order ID
        };
        const key = getDismissKey(enriched);
        return {
            ...enriched,
            dismissed: !!dismissedMap[key]
        };
    });
    activeShipmentIndex = 0;
}

/**
 * Find order by Order ID and Phone number
 * @param {string} orderId - Order ID (e.g., "ORDER-ITIUK2122-1" or "order-1234567890")
 * @param {string} phone - Phone number
 * @returns {Object|null} Order object or null if not found
 */
function findOrderByIdAndPhone(orderId, phone) {
    try {
        const ordersData = localStorage.getItem('orders');
        if (!ordersData) return null;

        const orders = JSON.parse(ordersData);
        if (!Array.isArray(orders)) return null;

        // Normalize phone numbers (remove spaces, dashes, etc.)
        const normalizePhone = (p) => p ? p.replace(/[\s\-\(\)\+]/g, '') : '';

        // Normalize order ID (remove #, convert to lowercase for comparison)
        const normalizeOrderId = (id) => id ? id.replace(/^#/, '').toLowerCase() : '';

        const normalizedPhone = normalizePhone(phone);
        const normalizedOrderId = normalizeOrderId(orderId);

        return orders.find(order => {
            const orderPhone = order.checkout?.contact?.phone;
            const normalizedOrderPhone = normalizePhone(orderPhone);

            const orderIdMatch = normalizeOrderId(order.id) === normalizedOrderId;
            const phoneMatch = normalizedOrderPhone === normalizedPhone;

            return orderIdMatch && phoneMatch;
        }) || null;
    } catch (e) {
        console.error('Error finding order:', e);
        return null;
    }
}

/**
 * Convert order to tracking shipments format
 * @param {Object} order - Order object
 * @returns {Array} Array of tracking shipments
 */
function convertOrderToTrackingShipments(order) {
    if (!order || !order.items || !Array.isArray(order.items)) {
        return [];
    }

    // Store the actual Order ID
    currentOrderId = order.id || null;

    // Group items by shipping address
    const shipmentsMap = {};

    order.items.forEach((item, idx) => {
        const address = item.shippingAddress || {};
        const addressKey = item.shippingAddressId || JSON.stringify({
            name: address.name || '',
            street: address.street || '',
            city: address.city || '',
            phone: address.phone || ''
        });

        if (!shipmentsMap[addressKey]) {
            const recipientName = address.name || `Recipient ${Object.keys(shipmentsMap).length + 1}`;
            const recipientAddr = [
                address.name,
                address.street,
                address.city,
                address.state,
                address.zip,
                address.phone
            ].filter(Boolean).join(', ') || recipientName;

            shipmentsMap[addressKey] = {
                id: `#SHIP-${Object.keys(shipmentsMap).length + 1}`,
                orderId: order.id, // Store Order ID in each shipment
                recipient: recipientAddr,
                steps: DEFAULT_TRACKING_STEPS,
                activeIndex: 0
            };
        }
    });

    return Object.values(shipmentsMap);
}

function renderShipmentsList() {
    const list = document.getElementById('shipments-list');
    if (!list) return;
    list.innerHTML = shipments.map((s, idx) => `
        <div class="shipment-pill ${idx === activeShipmentIndex ? 'active' : ''} ${s.dismissed ? 'dismissed' : ''}" data-idx="${idx}">
            <span class="pill-id">${s.id}</span>
            <span class="pill-recipient">${s.recipient}</span>
        </div>
    `).join('');

    list.querySelectorAll('.shipment-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            activeShipmentIndex = Number(pill.dataset.idx);
            updateView();
        });
    });
}

function renderTimeline(steps, activeIndex) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;
    timeline.innerHTML = steps.map((s, idx) => `
        <div class="step ${idx <= activeIndex ? 'active' : ''}">
            <div class="title">${s.title}</div>
            <div class="time">${s.time || '--:--'}</div>
            ${s.note ? `<div class="note">${s.note}</div>` : ''}
        </div>
    `).join('');
}

function updateStatus(shipment) {
    const badge = document.getElementById('status-badge');
    const desc = document.getElementById('status-desc');
    const step = shipment.steps[shipment.activeIndex];
    if (!step) return;
    if (badge) badge.textContent = step.title;
    if (desc) desc.textContent = step.note || '';
    const orderEl = document.getElementById('order-id');
    // Display the actual Order ID (e.g., ORDER-ITIUK2122-1) instead of shipment ID
    if (orderEl) {
        orderEl.textContent = shipment.orderId || currentOrderId || shipment.id;
    }
}

function updateShipper(shipment) {
    const card = document.getElementById('shipper-card');
    const step = shipment.steps[shipment.activeIndex];
    if (!step || !card) return;
    if (step.code === 'on_delivery' || step.code === 'delivered') {
        card.style.display = 'grid';
        const nameEl = document.getElementById('shipper-name');
        const phoneEl = document.getElementById('shipper-phone');
        const statusEl = document.getElementById('shipper-status');
        if (nameEl) nameEl.textContent = shipment.shipper.name;
        if (phoneEl) phoneEl.textContent = shipment.shipper.phone;
        if (statusEl) statusEl.textContent = step.code === 'delivered'
            ? 'Delivered'
            : shipment.shipper.status || 'On the way';
    } else {
        card.style.display = 'none';
    }
}

function updateView() {
    if (!shipments.length) return;
    const shipment = shipments[activeShipmentIndex];
    renderShipmentsList();
    const timeline = document.getElementById('timeline');
    const shipperCard = document.getElementById('shipper-card');
    const completeBtn = document.getElementById('complete-btn');
    if (shipment.dismissed) {
        // Hide timeline & driver info for this order
        if (timeline) timeline.innerHTML = '';
        if (shipperCard) shipperCard.style.display = 'none';
        const badge = document.getElementById('status-badge');
        const desc = document.getElementById('status-desc');
        if (badge) badge.textContent = 'Tracking completed';
        if (desc) desc.textContent = 'You have marked tracking as completed for this order.';
        if (completeBtn) completeBtn.style.display = 'none';
        return;
    }

    renderTimeline(shipment.steps, shipment.activeIndex);
    updateStatus(shipment);
    updateShipper(shipment);
    if (completeBtn) {
        completeBtn.style.display = shipments.length ? 'inline-flex' : 'none';
        completeBtn.disabled = false;
        completeBtn.textContent = 'Complete';
    }
}

function tickProgress() {
    shipments.forEach(s => {
        if (s.activeIndex < s.steps.length - 1) {
            s.activeIndex += 1;
        }
    });
    updateView();
}

/**
 * Show tracking form and hide tracking content
 */
function showTrackingForm() {
    const form = document.getElementById('tracking-form');
    const content = document.getElementById('tracking-content');
    if (form) form.style.display = 'block';
    if (content) content.classList.remove('show');
}

/**
 * Show tracking content and hide form
 */
function showTrackingContent() {
    const form = document.getElementById('tracking-form');
    const content = document.getElementById('tracking-content');
    if (form) form.style.display = 'none';
    if (content) content.classList.add('show');
}

/**
 * Handle form submission
 */
function handleTrackingFormSubmit(e) {
    e.preventDefault();

    const orderIdInput = document.getElementById('order-id-input');
    const phoneInput = document.getElementById('phone-input');
    const errorMessage = document.getElementById('error-message');
    const submitBtn = document.getElementById('track-submit-btn');

    if (!orderIdInput || !phoneInput) return;

    const orderId = orderIdInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!orderId || !phone) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter both Order ID and Phone number.';
            errorMessage.classList.add('show');
        }
        return;
    }

    // Disable submit button
    if (submitBtn) submitBtn.disabled = true;

    // Find order
    const order = findOrderByIdAndPhone(orderId, phone);

    if (!order) {
        if (errorMessage) {
            errorMessage.textContent = 'Order not found. Please check your Order ID and Phone number.';
            errorMessage.classList.add('show');
        }
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Convert order to tracking shipments
    const trackingShipments = convertOrderToTrackingShipments(order);

    if (trackingShipments.length === 0) {
        if (errorMessage) {
            errorMessage.textContent = 'Unable to load tracking information for this order.';
            errorMessage.classList.add('show');
        }
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    // Save to localStorage
    try {
        localStorage.setItem('trackingShipments', JSON.stringify(trackingShipments));
    } catch (e) {
        console.error('Error saving tracking shipments:', e);
    }

    // Hide error message
    if (errorMessage) errorMessage.classList.remove('show');

    // Load and display tracking
    loadShipmentsFromStorage();
    updateView();
    showTrackingContent();

    if (submitBtn) submitBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    // Always show form to enter Order ID + Phone first
    // User must enter Order ID + Phone to track, even if trackingShipments exists in localStorage
    showTrackingForm();

    // Pre-fill form if Order ID and Phone are in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('orderId');
    const phoneFromUrl = urlParams.get('phone');

    if (orderIdFromUrl && phoneFromUrl) {
        const orderIdInput = document.getElementById('order-id-input');
        const phoneInput = document.getElementById('phone-input');
        if (orderIdInput) orderIdInput.value = orderIdFromUrl;
        if (phoneInput) phoneInput.value = phoneFromUrl;

        // Optionally auto-submit the form
        // Uncomment the line below if you want to auto-submit when coming from confirmation page
        // setTimeout(() => document.getElementById('order-tracking-form')?.requestSubmit(), 500);
    }

    // Attach form submit handler
    const trackingForm = document.getElementById('order-tracking-form');
    if (trackingForm) {
        trackingForm.addEventListener('submit', handleTrackingFormSubmit);
    }

    // Attach complete button handler
    const completeBtn = document.getElementById('complete-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            const s = shipments[activeShipmentIndex];
            if (!s) return;
            s.dismissed = true;
            const key = getDismissKey(s);
            dismissedMap[key] = true;
            saveDismissedMap();
            updateView();
        });
    }

    // Simulate live status updates every 2.5 seconds (only if tracking content is shown)
    let progressInterval = null;
    function startProgressInterval() {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(() => {
            const content = document.getElementById('tracking-content');
            if (content && content.classList.contains('show')) {
                tickProgress();
            }
        }, 2500);
    }
    startProgressInterval();
});

// Refresh when cart updates trackingShipments (e.g., after Proceed to Checkout)
window.addEventListener('storage', (event) => {
    if (event.key === 'trackingShipments') {
        loadShipmentsFromStorage();
        updateView();
    }
});

