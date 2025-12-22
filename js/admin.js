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

/**
 * --- SHIPPING SECTION ---
 */
async function fetchShippingStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/shipping`);
        if (!response.ok) throw new Error('Failed to fetch shipping data');
        const data = await response.json();
        renderShippingTable(data);
    } catch (error) {
        console.error('Error loading shipping status:', error);
        document.getElementById('shipping-table-body').innerHTML = `<tr><td colspan="6" class="error-msg">Error loading data</td></tr>`;
    }
}

function renderShippingTable(data) {
    const tbody = document.getElementById('shipping-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No shipping records found</td></tr>`;
        return;
    }

    // Update Stats
    document.getElementById('total-orders-stat').textContent = data.length;

    // Calculate Revenue
    const totalRevenue = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    document.getElementById('total-revenue-stat').textContent = '$' + totalRevenue.toLocaleString();

    // Calculate Pending
    const pendingCount = data.filter(i => i.status === 'Pending').length;
    document.getElementById('pending-orders-stat').textContent = pendingCount;

    data.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = getStatusBadgeClass(item.status);

        tr.innerHTML = `
            <td>#${item.order_id}</td>
            <td>${item.customer_name}</td>
            <td>${item.phone_number || 'N/A'}</td>
            <td><strong>$${(item.amount || 0).toFixed(2)}</strong></td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>${new Date(item.updated_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn edit" onclick="openUpdateShippingModal(${item.order_id}, '${item.status}')">Update Status</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateShippingStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/shipping/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            alert('Shipping status updated successfully!');
            fetchShippingStatus(); // Refresh table
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating shipping:', error);
    }
}

// Simple prompt for now, can be replaced with a modal
window.openUpdateShippingModal = function (orderId, currentStatus) {
    const newStatus = prompt(`Update Status (Pending, Shipped, Delivered, Cancelled):`, currentStatus);
    if (newStatus && newStatus !== currentStatus) {
        updateShippingStatus(orderId, newStatus);
    }
}

/**
 * --- CUSTOMER SECTION ---
 */
async function fetchCustomerProfiles() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers`);
        if (!response.ok) throw new Error('Failed to fetch customer data');
        const data = await response.json();
        renderCustomerTable(data);
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customer-table-body').innerHTML = `<tr><td colspan="7" class="error-msg">Error loading data</td></tr>`;
    }
}

function renderCustomerTable(data) {
    const tbody = document.getElementById('customer-table-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No customer profiles found</td></tr>`;
        return;
    }

    // Update Customer Stat
    document.getElementById('total-customers-stat').textContent = data.length;

    data.forEach(cust => {
        const tr = document.createElement('tr');
        const statusClass = cust.status === 'Active' ? 'active' : 'inactive';

        tr.innerHTML = `
            <td>#${cust.id}</td>
            <td><strong>${cust.username || '-'}</strong></td>
            <td>${cust.full_name}</td>
            <td>${cust.email}</td>
            <td>${cust.phone_number || 'N/A'}</td>
            <td>${cust.total_orders || 0}</td>
            <td>$${(cust.total_spend || 0).toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${cust.status}</span></td>
            <td>${new Date(cust.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn edit" onclick="updateCustomerVIP(${cust.user_id}, '${cust.vip_level}')">Change VIP</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateCustomerVIP = async function (userId, currentLevel) {
    const newLevel = prompt("Enter new VIP Level (New, Bronze, Silver, Gold):", currentLevel);
    if (newLevel && newLevel !== currentLevel) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/customers/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vip_level: newLevel })
            });
            if (response.ok) {
                alert('Customer updated!');
                fetchCustomerProfiles();
            }
        } catch (e) {
            console.error(e);
        }
    }
}

/**
 * --- WAREHOUSE SECTION ---
 */
async function fetchWarehouseInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/warehouse`);
        if (!response.ok) throw new Error('Failed to fetch inventory');
        const data = await response.json();
        renderWarehouseTable(data);
    } catch (error) {
        console.error('Error loading warehouse:', error);
        document.getElementById('warehouse-table-body').innerHTML = `<tr><td colspan="4" class="error-msg">Error loading data</td></tr>`;
    }
}

function renderWarehouseTable(data) {
    const tbody = document.getElementById('warehouse-table-body');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">Inventory empty</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.product_name}</td>
            <td><strong>${item.quantity}</strong></td>
            <td>${new Date(item.last_restock).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view" onclick="updateStock('${item.product_name}', 10)">+10</button>
                <button class="action-btn delete" onclick="updateStock('${item.product_name}', -10)">-10</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateStock = async function (productName, quantityChange) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/warehouse/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_name: productName, quantity_change: quantityChange })
        });

        if (response.ok) {
            fetchWarehouseInventory();
        } else {
            alert('Failed to update stock');
        }
    } catch (e) {
        console.error(e);
        alert('Error connecting to server');
    }
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
