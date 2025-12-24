/**
 * @fileoverview Admin Dashboard Logic
 * Fetches data from backend APIs and updates the UI dynamically.
 */

const API_BASE_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

function initAdminDashboard() {
    console.log('Initializing Admin Dashboard...');
    fetchShippingStatus();
    fetchCustomerProfiles();
    fetchWarehouseInventory();
}


/* 
 * --- HELPER FUNCTIONS ---
 */
function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

/* 
 * --- SHIPPING SECTION ---
 */

// State for Shipping Pagination & Filter
let allShippingOrders = [];
let filteredShippingOrders = []; // Add filtered array
let currentShippingPage = 1;
const shippingPerPage = 5;

// Filter Globals
let shippingSearchTerm = '';
let shippingStatusFilter = '';

async function fetchShippingStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/shipping`);
        if (!response.ok) throw new Error('Failed to fetch shipping data');
        const data = await response.json();

        allShippingOrders = data;
        filteredShippingOrders = data; // Initialize filtered list
        currentShippingPage = 1;

        if (allShippingOrders.length === 0) {
            document.getElementById('shipping-table-body').innerHTML = `<tr><td colspan="6" class="no-data">No shipping records found</td></tr>`;
            document.getElementById('shipping-pagination').innerHTML = '';
            return;
        }

        // Initial render
        filterShipping();

    } catch (error) {
        console.error('Error loading shipping status:', error);
        document.getElementById('shipping-table-body').innerHTML = `<tr><td colspan="6" class="error-msg">Error loading data</td></tr>`;
    }
}

function filterShipping() {
    const searchInput = document.getElementById('shipping-search-input');
    const statusSelect = document.getElementById('shipping-status-filter');

    shippingSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    shippingStatusFilter = statusSelect ? statusSelect.value : '';

    filteredShippingOrders = allShippingOrders.filter(order => {
        const matchesSearch = (order.order_id.toString().includes(shippingSearchTerm)) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(shippingSearchTerm));
        const matchesStatus = shippingStatusFilter === '' || order.status === shippingStatusFilter;
        return matchesSearch && matchesStatus;
    });

    currentShippingPage = 1; // Reset to page 1 on filter
    renderShippingTable();
    renderShippingPagination();
}

// Expose filter function to window for HTML access
window.filterShipping = filterShipping;

function renderShippingTable() {
    const tbody = document.getElementById('shipping-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Update Stats (Global stats, not filtered)
    document.getElementById('total-orders-stat').textContent = allShippingOrders.length;
    const totalRevenue = allShippingOrders.reduce((sum, item) => sum + (item.amount || 0), 0);
    document.getElementById('total-revenue-stat').textContent = '$' + totalRevenue.toLocaleString();
    const pendingCount = allShippingOrders.filter(i => i.status === 'Pending').length;
    document.getElementById('pending-orders-stat').textContent = pendingCount;

    if (filteredShippingOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No matching records found</td></tr>`;
        return;
    }

    // Calculate Slice based on FILTERED data
    const startIndex = (currentShippingPage - 1) * shippingPerPage;
    const endIndex = startIndex + shippingPerPage;
    const ordersToShow = filteredShippingOrders.slice(startIndex, endIndex);

    ordersToShow.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = getStatusBadgeClass(item.status);

        tr.innerHTML = `
            <td>#${item.order_id}</td>
            <td>${item.customer_name}</td>
            <td>${item.phone_number || 'N/A'}</td>
            <td><strong>$${(item.amount || 0).toFixed(2)}</strong></td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>${item.address || 'N/A'}</td>
            <td>${new Date(item.updated_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn edit" onclick="openUpdateShippingModal(${item.order_id}, '${item.status}')">Update</button>
                <button class="action-btn delete" onclick="deleteShippingOrder(${item.order_id})">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderShippingPagination() {
    const paginationContainer = document.getElementById('shipping-pagination');
    if (!paginationContainer) return;

    const currentPageInt = parseInt(currentShippingPage, 10);
    const totalPages = Math.ceil(filteredShippingOrders.length / shippingPerPage); // Use FILTERED length

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous Button
    if (currentPageInt > 1) {
        paginationHTML += `<a onclick="changeShippingPage(${currentPageInt - 1}); return false;" href="javascript:void(0)">« Prev</a>`;
    } else {
        paginationHTML += `<span class="disabled">« Prev</span>`;
    }

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPageInt) {
            paginationHTML += `<span class="active">${i}</span>`;
        } else {
            paginationHTML += `<a onclick="changeShippingPage(${i}); return false;" href="javascript:void(0)">${i}</a>`;
        }
    }

    // Next Button
    if (currentPageInt < totalPages) {
        paginationHTML += `<a onclick="changeShippingPage(${currentPageInt + 1}); return false;" href="javascript:void(0)">Next »</a>`;
    } else {
        paginationHTML += `<span class="disabled">Next »</span>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

window.changeShippingPage = function (page) {
    const pageInt = parseInt(page, 10);
    if (isNaN(pageInt) || pageInt < 1) return;

    const totalPages = Math.ceil(filteredShippingOrders.length / shippingPerPage);
    if (pageInt > totalPages && totalPages > 0) return;

    currentShippingPage = pageInt;
    renderShippingTable();
    renderShippingPagination();
}

// --- Status Update Modal Logic ---
let currentUpdatingOrderId = null;

window.openUpdateShippingModal = function (orderId, currentStatus) {
    currentUpdatingOrderId = orderId;
    document.getElementById('modal-order-id').value = orderId;
    document.getElementById('modal-order-status').value = currentStatus;
    openModal('updateStatusModal');
}

window.submitShippingUpdate = async function () {
    if (!currentUpdatingOrderId) return;
    const newStatus = document.getElementById('modal-order-status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/shipping/${currentUpdatingOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            closeModal('updateStatusModal');
            fetchShippingStatus(); // Refresh table
        } else {
            const err = await response.json();
            console.error('Update failed:', err);
            alert('Failed to update status: ' + (err.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating shipping:', error);
        alert('Error connecting to server: ' + error.message);
    }
}

window.deleteShippingOrder = async function (orderId) {
    if (confirm(`Are you sure you want to delete Order #${orderId}?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/shipping/${orderId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchShippingStatus(); // Refresh
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    }
}

/**
 * --- CUSTOMER SECTION ---
 */

// State for Customer Pagination & Filter
let allCustomers = [];
let filteredCustomers = [];
let currentCustomerPage = 1;
const customersPerPage = 5;

let customerSearchTerm = '';
let customerStatusFilter = '';

async function fetchCustomerProfiles() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers`);
        if (!response.ok) throw new Error('Failed to fetch customer data');
        const data = await response.json();

        allCustomers = data || [];
        filteredCustomers = data || []; // Init filtered
        currentCustomerPage = 1;

        if (allCustomers.length === 0) {
            const tbody = document.getElementById('customer-table-body');
            if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="no-data">No customer profiles found</td></tr>`;
            const pag = document.getElementById('customer-pagination');
            if (pag) pag.innerHTML = '';
            return;
        }

        // Apply filters initially (or just render if no filters)
        filterCustomers();

    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customer-table-body').innerHTML = `<tr><td colspan="10" class="error-msg">Error loading data</td></tr>`;
    }
}

// Make globally available
window.fetchCustomerProfiles = fetchCustomerProfiles;

function filterCustomers() {
    const searchInput = document.getElementById('customer-search-input');
    const statusSelect = document.getElementById('customer-status-filter');

    customerSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    customerStatusFilter = statusSelect ? statusSelect.value : '';

    filteredCustomers = allCustomers.filter(cust => {
        const matchesSearch = (cust.username && cust.username.toLowerCase().includes(customerSearchTerm)) ||
            (cust.email && cust.email.toLowerCase().includes(customerSearchTerm)) ||
            ((cust.full_name || '').toLowerCase().includes(customerSearchTerm));

        const custStatus = cust.status || 'Active';
        const matchesStatus = customerStatusFilter === '' || custStatus === customerStatusFilter;

        return matchesSearch && matchesStatus;
    });

    currentCustomerPage = 1;
    renderCustomerTable();
    renderCustomerPagination();
}
window.filterCustomers = filterCustomers;

function renderCustomerTable() {
    const tbody = document.getElementById('customer-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const statEl = document.getElementById('total-customers-stat');
    if (statEl) statEl.textContent = allCustomers.length;

    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="no-data">No matching customers found</td></tr>`;
        return;
    }

    const startIndex = (currentCustomerPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    const customersToShow = filteredCustomers.slice(startIndex, endIndex);

    customersToShow.forEach(cust => {
        const tr = document.createElement('tr');
        const statusClass = (cust.status && cust.status === 'Active') ? 'active' : 'inactive';

        tr.innerHTML = `
            <td>#${cust.id}</td>
            <td><strong>${cust.username || '-'}</strong></td>
            <td>${cust.full_name || '-'}</td>
            <td>${cust.email}</td>
            <td>${cust.phone_number || 'N/A'}</td>
            <td>${cust.total_orders || 0}</td>
            <td>$${(cust.total_spend || 0).toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${cust.status || 'Active'}</span></td>
            <td>${cust.created_at ? new Date(cust.created_at).toLocaleDateString() : '-'}</td>
            <td>
                <span class="badge" style="background:#fff3e0; color:#e65100;">${cust.vip_level || 'New'}</span>
                <button class="action-btn edit" onclick="openUpdateVIPModal(${cust.user_id}, '${cust.vip_level}')" title="Edit Level">✎</button>
                <button class="action-btn delete" onclick="deleteCustomer(${cust.id})">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCustomerPagination() {
    const paginationContainer = document.getElementById('customer-pagination');
    if (!paginationContainer) return;

    const currentPageInt = parseInt(currentCustomerPage, 10);
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous
    if (currentPageInt > 1) {
        paginationHTML += `<a onclick="changeCustomerPage(${currentPageInt - 1}); return false;" href="javascript:void(0)" class="page-link">« Prev</a>`;
    } else {
        paginationHTML += `<span class="disabled">« Prev</span>`;
    }

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPageInt) {
            paginationHTML += `<span class="active">${i}</span>`;
        } else {
            paginationHTML += `<a onclick="changeCustomerPage(${i}); return false;" href="javascript:void(0)" class="page-link">${i}</a>`;
        }
    }

    // Next
    if (currentPageInt < totalPages) {
        paginationHTML += `<a onclick="changeCustomerPage(${currentPageInt + 1}); return false;" href="javascript:void(0)" class="page-link">Next »</a>`;
    } else {
        paginationHTML += `<span class="disabled">Next »</span>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

// Explicitly attach to window
window.changeCustomerPage = function (page) {
    console.log("Changing customer page to", page);
    const pageInt = parseInt(page, 10);
    if (isNaN(pageInt) || pageInt < 1) return;

    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
    if (pageInt > totalPages && totalPages > 0) return;

    currentCustomerPage = pageInt;
    renderCustomerTable();
    renderCustomerPagination();
};

window.deleteCustomer = async function (userId) {
    if (confirm(`Are you sure you want to delete Customer #${userId}?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/customers/${userId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Remove from local arrays to update UI instantly
                allCustomers = allCustomers.filter(c => c.id !== userId);
                filterCustomers(); // Re-filter and re-render
                alert('Customer deleted successfully');
            } else {
                const err = await response.json();
                alert('Failed to delete customer: ' + (err.detail || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert('Error connecting to server');
        }
    }
};

// --- VIP Update Modal Logic ---
let currentUpdatingUserId = null;

window.openUpdateVIPModal = function (userId, currentLevel) {
    currentUpdatingUserId = userId;
    document.getElementById('modal-user-id').value = userId;
    document.getElementById('modal-vip-level').value = currentLevel || 'New';
    openModal('updateVIPModal');
}

window.submitVIPUpdate = async function () {
    if (!currentUpdatingUserId) return;
    const newLevel = document.getElementById('modal-vip-level').value;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers/${currentUpdatingUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vip_level: newLevel })
        });
        if (response.ok) {
            closeModal('updateVIPModal');
            fetchCustomerProfiles();
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * --- WAREHOUSE SECTION ---
 */
/**
 * --- WAREHOUSE SECTION ---
 */

let allWarehouseItems = [];
let currentWarehousePage = 1;
const warehousePerPage = 5;

async function fetchWarehouseInventory(preservePage = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/warehouse`);
        if (!response.ok) throw new Error('Failed to fetch inventory');
        const data = await response.json();

        allWarehouseItems = data || [];
        if (!preservePage) {
            currentWarehousePage = 1;
        }

        renderWarehouseTable();
        renderWarehousePagination();

    } catch (error) {
        console.error('Error loading warehouse:', error);
        document.getElementById('warehouse-table-body').innerHTML = `<tr><td colspan="4" class="error-msg">Error loading data</td></tr>`;
    }
}
// ... (renderWarehouseTable implementation omitted, assumes it's unchanged) ...

window.updateStock = async function (productName, quantityChange, btnElement) {
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.style.opacity = '0.5';
        btnElement.textContent = '...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/warehouse/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_name: productName, quantity_change: quantityChange })
        });

        if (response.ok) {
            // Fetch fresh but preserve current page
            await fetchWarehouseInventory(true);
        } else {
            console.error(await response.text());
            alert('Failed to update stock');
        }
    } catch (e) {
        console.error(e);
        alert('Error connecting to server');
    } finally {
        // Re-enable button after operation (even if table re-renders, this is safe)
        if (btnElement) {
            // Note: If table re-renders, this element might be removed from DOM, 
            // but if it wasn't, we want to reset it.
            // Actually, fetchWarehouseInventory REPLACES the HTML, so this button is gone.
            // So this finally block is mostly for error cases where table didn't refresh.
            if (document.body.contains(btnElement)) {
                btnElement.disabled = false;
                btnElement.style.opacity = '1';
                btnElement.textContent = quantityChange > 0 ? '+10' : '-10';
            }
        }
    }
}

function renderWarehouseTable() {
    const tbody = document.getElementById('warehouse-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (allWarehouseItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">Inventory empty</td></tr>`;
        return;
    }

    const startIndex = (currentWarehousePage - 1) * warehousePerPage;
    const endIndex = startIndex + warehousePerPage;
    const itemsToShow = allWarehouseItems.slice(startIndex, endIndex);

    itemsToShow.forEach(item => {
        const tr = document.createElement('tr');
        const dateStr = item.last_restock ? new Date(item.last_restock).toLocaleDateString() : 'N/A';
        // Encode product name to safe base64 or just escape quotes to avoid breaking HTML
        // Simple approach: Use data attributes and event delegation (safer)
        tr.innerHTML = `
            <td>${item.product_name}</td>
            <td><strong>${item.quantity}</strong></td>
            <td>${new Date(item.last_restock).toLocaleDateString()}</td>
            <td>
                <button type="button" class="action-btn view btn-stock-up" data-name="${item.product_name.replace(/"/g, '&quot;')}" data-qty="10">+10</button>
                <button type="button" class="action-btn delete btn-stock-down" data-name="${item.product_name.replace(/"/g, '&quot;')}" data-qty="-10">-10</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach listeners
    tbody.querySelectorAll('.btn-stock-up, .btn-stock-down').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault(); // Stop any default form submission/reload
            const name = this.getAttribute('data-name');
            const qty = parseInt(this.getAttribute('data-qty'), 10);
            updateStock(name, qty, this);
        });
    });
}

function renderWarehousePagination() {
    const paginationContainer = document.getElementById('warehouse-pagination');
    if (!paginationContainer) return;

    const currentPageInt = parseInt(currentWarehousePage, 10);
    const totalPages = Math.ceil(allWarehouseItems.length / warehousePerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous
    if (currentPageInt > 1) {
        paginationHTML += `<a onclick="changeWarehousePage(${currentPageInt - 1}); return false;" href="javascript:void(0)" class="page-link">« Prev</a>`;
    } else {
        paginationHTML += `<span class="disabled">« Prev</span>`;
    }

    // Pages
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPageInt) {
            paginationHTML += `<span class="active">${i}</span>`;
        } else {
            paginationHTML += `<a onclick="changeWarehousePage(${i}); return false;" href="javascript:void(0)" class="page-link">${i}</a>`;
        }
    }

    // Next
    if (currentPageInt < totalPages) {
        paginationHTML += `<a onclick="changeWarehousePage(${currentPageInt + 1}); return false;" href="javascript:void(0)" class="page-link">Next »</a>`;
    } else {
        paginationHTML += `<span class="disabled">Next »</span>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

window.changeWarehousePage = function (page) {
    const pageInt = parseInt(page, 10);
    if (isNaN(pageInt) || pageInt < 1) return;

    const totalPages = Math.ceil(allWarehouseItems.length / warehousePerPage);
    if (pageInt > totalPages && totalPages > 0) return;

    currentWarehousePage = pageInt;
    renderWarehouseTable();
    renderWarehousePagination();
}

// Global object to track pending updates for debouncing
const pendingUpdates = {};

window.updateStock = function (productName, quantityChange, btnElement) {
    // 1. Optimistic UI Update (Immediate)
    const itemIndex = allWarehouseItems.findIndex(i => i.product_name === productName);
    if (itemIndex === -1) return;

    // Update Local Data
    allWarehouseItems[itemIndex].quantity += quantityChange;
    // We don't change date yet, or temporary set it
    // allWarehouseItems[itemIndex].last_restock = new Date().toISOString(); 

    // Update DOM Immediately
    if (btnElement) {
        const tr = btnElement.closest('tr');
        if (tr) {
            const qtyMsg = tr.querySelector('td:nth-child(2) strong');
            if (qtyMsg) qtyMsg.textContent = allWarehouseItems[itemIndex].quantity;

            const dateCell = tr.querySelector('td:nth-child(3)');
            if (dateCell) dateCell.textContent = 'Saving...';
        }
    }

    // 2. Clear existing timeout for this specific product
    if (pendingUpdates[productName]) {
        clearTimeout(pendingUpdates[productName].timeoutId);
        pendingUpdates[productName].totalChange += quantityChange;
    } else {
        pendingUpdates[productName] = {
            totalChange: quantityChange
        };
    }

    // 3. Set new timeout (Debounce 1.5s)
    pendingUpdates[productName].timeoutId = setTimeout(async () => {
        const finalChange = pendingUpdates[productName].totalChange;
        delete pendingUpdates[productName]; // Clear pending state

        try {
            const response = await fetch(`${API_BASE_URL}/admin/warehouse/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: productName, quantity_change: finalChange })
            });

            if (response.ok) {
                // Server confirmed! Update date.
                const data = await response.json();

                // Update Date in DOM
                // We need to find the row again because btnElement might be stale if user paged away (unlikely with this logic but possible)
                // Actually, we can just search by product name to be safe
                // Or simplistic: rely on re-finding the row or re-render if needed? 
                // Let's iterate rows to find the match, as btnElement might be closed over but the row is still there
                const rows = document.querySelectorAll('#warehouse-table-body tr');
                rows.forEach(row => {
                    if (row.innerHTML.includes(productName)) { // Simple check, or check data attribute if we added one to TR
                        const dateCell = row.querySelector('td:nth-child(3)');
                        if (dateCell) {
                            dateCell.textContent = data.last_restock ? new Date(data.last_restock).toLocaleDateString() : 'Just now';
                        }
                    }
                });

                // Update Data Model Date
                if (allWarehouseItems[itemIndex]) {
                    allWarehouseItems[itemIndex].last_restock = data.last_restock;
                }

            } else {
                console.error("Sync failed", await response.text());
                // Revert? For now, just alert. Complex revert logic skipped for simplicity.
            }
        } catch (e) {
            console.error(e);
        }
    }, 1500); // Wait 1.5 seconds after last click
}


/**
 * Helper: Get badge class based on status string
 */
function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'pending';
        case 'shipped': return 'shipped';
        case 'delivered': return 'delivered';
        case 'cancelled': return 'cancelled';
        default: return 'inactive';
    }
}
