// Tracking page logic (extracted from tracking.html)

const SHIPPERS = [
    { name: 'John A.', phone: '+84 901 234 567' },
    { name: 'Michael B.', phone: '+84 902 345 678' },
    { name: 'Emily C.', phone: '+84 903 456 789' },
    { name: 'Daniel D.', phone: '+84 904 567 890' },
    { name: 'Sophia E.', phone: '+84 905 678 901' },
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
        const steps = (s.steps && s.steps.length ? s.steps : stepCodes.map(code => ({ code, title: code, note: '' })))
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
            recipient: s.recipient || `Address ${idx + 1}`,
            steps,
            activeIndex,
            shipper
        };
    });
}

let shipments = [];
let activeShipmentIndex = 0;

function loadShipmentsFromStorage() {
    let rawShipments = [];
    try {
        const raw = localStorage.getItem('trackingShipments');
        if (raw) rawShipments = JSON.parse(raw);
    } catch (e) {
        rawShipments = [];
    }

    if (!rawShipments || rawShipments.length === 0) {
        rawShipments = [
            {
                id: '#ORDER-20269-1',
                recipient: 'Recipient A - District 1',
                steps: [
                    { code: 'prep', title: 'Bakery is preparing your order', note: 'Kitchen is carefully preparing your treats.' },
                    { code: 'pickup_on_the_way', title: 'Driver on the way to store', note: 'Driver is heading to the bakery.' },
                    { code: 'pickup_waiting', title: 'Driver arrived at store', note: 'Waiting for the order to be handed over.' },
                    { code: 'on_delivery', title: 'Out for delivery', note: 'Your order is on the way to the destination.' },
                    { code: 'delivered', title: 'Delivered successfully', note: 'Order has been delivered. Enjoy!' }
                ],
                activeIndex: 3
            }
        ];
    }

    shipments = enrichShipments(rawShipments);
    activeShipmentIndex = 0;
}

function renderShipmentsList() {
    const list = document.getElementById('shipments-list');
    if (!list) return;
    list.innerHTML = shipments.map((s, idx) => `
        <div class="shipment-pill ${idx === activeShipmentIndex ? 'active' : ''}" data-idx="${idx}">
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
    if (orderEl) orderEl.textContent = shipment.id;
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
    renderTimeline(shipment.steps, shipment.activeIndex);
    updateStatus(shipment);
    updateShipper(shipment);
}

function tickProgress() {
    shipments.forEach(s => {
        if (s.activeIndex < s.steps.length - 1) {
            s.activeIndex += 1;
        }
    });
    updateView();
}

document.addEventListener('DOMContentLoaded', () => {
    loadShipmentsFromStorage();
    updateView();
    // Simulate live status updates every 2.5 seconds
    setInterval(() => tickProgress(), 2500);
});

// Refresh when cart updates trackingShipments (e.g., after Proceed to Checkout)
window.addEventListener('storage', (event) => {
    if (event.key === 'trackingShipments') {
        loadShipmentsFromStorage();
        updateView();
    }
});

