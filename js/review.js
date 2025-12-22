/**
 * @fileoverview Review order page logic
 * @module review
 */

// State
let cart = [];
let checkoutData = null;

/**
 * Initialize the review page
 */
function init() {
    loadData();

    if (cart.length === 0) {
        alert('No items in cart. Redirecting to cart page.');
        window.location.href = 'cart.html';
        return;
    }

    renderItems();
    renderOrderSummary();
    renderPaymentMethod();
    renderBillingAddress();
    renderContactInfo();
    renderOrderTotal();
}

/**
 * Load cart and checkout data from localStorage
 */
function loadData() {
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
            updateHeaderCartBadge();
        } else {
            cart = [];
        }

        const checkoutDataStr = localStorage.getItem('checkoutData');
        if (checkoutDataStr) {
            checkoutData = JSON.parse(checkoutDataStr);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        cart = [];
        checkoutData = null;
    }
}

function updateHeaderCartBadge() {
    try {
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const badge = document.getElementById('header-cart-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    } catch (e) {
        console.error('Error updating header cart badge', e);
    }
}

/**
 * Render all items
 */
function renderItems() {
    const container = document.getElementById('items-container');
    if (!container) return;

    container.innerHTML = cart.map((item, index) => renderItem(item, index)).join('');

    // Attach delete button listeners
    cart.forEach(item => {
        const deleteBtn = document.getElementById(`delete-item-${item.id}`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => handleDeleteItem(item.id));
        }
    });
}

/**
 * Render a single item
 * @param {Object} item - Cart item
 * @param {number} index - Item index (0-based)
 * @returns {string} HTML string
 */
function renderItem(item, index) {
    const itemNumber = index + 1;
    const totalItems = cart.length;

    // Format address
    const addressDisplay = item.shippingAddress && item.shippingAddress.street
        ? `${item.shippingAddress.name || ''}, ${item.shippingAddress.street}, ${item.shippingAddress.city}, ${item.shippingAddress.state}, ${item.shippingAddress.zip || ''}, ${item.shippingAddress.phone || ''}`
        : 'No address set';

    // Format delivery date
    let deliveryDateDisplay = 'Not set';
    if (item.deliveryDate) {
        const date = new Date(item.deliveryDate);
        deliveryDateDisplay = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    } else if (item.shippingMethod && item.shippingMethod !== 'pick-date') {
        // Show estimated delivery for other methods
        deliveryDateDisplay = 'Estimated delivery: 5-7 business days';
    }

    // Gift message display
    const giftMessageDisplay = item.giftMessage && item.giftMessage.trim() !== ''
        ? item.giftMessage
        : 'No Card Message';

    return `
        <div class="review-section">
            <div class="item-header">
                <div class="item-number">Item ${itemNumber} of ${totalItems}:</div>
                <button class="item-delete-btn" id="delete-item-${item.id}" title="Remove item">🗑️</button>
            </div>
            
            <div class="item-details">
                <img src="${item.productImage}" alt="${item.productName}" class="item-image">
                
                <div class="item-info">
                    <div class="item-name">${item.productName}</div>
                    <div class="item-meta">
                        <strong>Item #:</strong> ${item.itemNumber}
                    </div>
                    <div class="item-meta">
                        <strong>Matie Cake</strong>
                    </div>
                    <div class="item-meta">
                        <strong>Price:</strong> $${item.finalPrice.toFixed(2)}
                    </div>
                    <div class="item-meta">
                        <strong>Qty:</strong> ${item.quantity}
                    </div>
                    <a href="#" class="send-additional-link">Send to an additional recipient</a>
                </div>
            </div>
            
            <!-- Recipient Information -->
            <div class="info-display" style="margin-top: 20px;">
                <div class="info-label">Sending To:</div>
                <div class="info-value with-edit">
                    <span>${addressDisplay}</span>
                    <a href="cart.html" class="edit-link">Edit</a>
                </div>
            </div>
            
            <div class="info-display">
                <div class="info-label">Recipient's Relationship:</div>
                <div class="info-value">
                    <span class="bullet">•</span>
                    <span>${item.recipientRelationship || 'Not set'}</span>
                </div>
            </div>
            
            <div class="info-display">
                <div class="info-label">Recipient's Occasion:</div>
                <div class="info-value">
                    <span class="bullet">•</span>
                    <span>${item.recipientOccasion || 'Not set'}</span>
                </div>
            </div>
            
            <!-- Gift Message -->
            <div class="info-display">
                <div class="info-label">Gift Message:</div>
                <div class="info-value with-edit">
                    <span>${giftMessageDisplay}</span>
                    <a href="cart.html" class="edit-link">Edit</a>
                </div>
            </div>
            
            <!-- Delivery Date -->
            <div class="info-display">
                <div class="info-label">Delivery Date:</div>
                <div class="info-value with-edit">
                    <span>${deliveryDateDisplay}</span>
                    <a href="cart.html" class="edit-link">Edit</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render order summary
 */
function renderOrderSummary() {
    const container = document.getElementById('order-summary-content');
    if (!container) return;

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const merchandise = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const shipping = 8.99; // Default shipping
    const totalBeforeTax = merchandise + shipping;
    const estimatedTax = 0.00; // Can be calculated based on location
    const orderTotal = totalBeforeTax + estimatedTax;

    container.innerHTML = `
        <div class="summary-items-count">${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}</div>
        <div class="summary-row">
            <span class="summary-row-label">Merchandise:</span>
            <span class="summary-row-value">$${merchandise.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">
                Shipping Charge:
                <span class="info-icon" title="Shipping charges may vary">i</span>
            </span>
            <span class="summary-row-value">$${shipping.toFixed(2)}</span>
        </div>
        <div class="summary-row total-before-tax">
            <span>Total before tax:</span>
            <span>$${totalBeforeTax.toFixed(2)}</span>
        </div>
        <div class="summary-row taxes">
            <span class="summary-row-label">
                Estimated Taxes:
                <span class="info-icon" title="Taxes calculated based on shipping address">i</span>
            </span>
            <span class="summary-row-value">$${estimatedTax.toFixed(2)}</span>
        </div>
    `;
}

/**
 * Render payment method
 */
function renderPaymentMethod() {
    const container = document.getElementById('payment-method-display');
    if (!container) return;

    if (!checkoutData || !checkoutData.paymentMethod) {
        container.innerHTML = '<p style="color: #999;">No payment method selected</p>';
        return;
    }

    if (checkoutData.paymentMethod === 'card' && checkoutData.card) {
        const card = checkoutData.card;
        const last4 = card.number.slice(-4);
        const cardType = getCardType(card.number);

        container.innerHTML = `
            <div>Credit or Debit Card</div>
            <div class="payment-info-box">
                <div class="payment-card-display">
                    <span class="card-logo-small">${cardType}</span>
                    <span class="card-details">Ending in ${last4} - ${card.name} - ${card.month}/${card.year}</span>
                </div>
            </div>
        `;
    } else {
        const methodNames = {
            'paypal': 'PayPal',
            'klarna': 'Klarna',
            'paze': 'paze'
        };
        container.innerHTML = `
            <div>${methodNames[checkoutData.paymentMethod] || checkoutData.paymentMethod}</div>
        `;
    }
}

/**
 * Get card type from number
 * @param {string} cardNumber - Card number
 * @returns {string} Card type
 */
function getCardType(cardNumber) {
    if (!cardNumber) return 'CARD';

    if (cardNumber.startsWith('4')) return 'VISA';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'AMEX';
    if (cardNumber.startsWith('6')) return 'DISCOVER';

    return 'CARD';
}

/**
 * Render billing address
 */
function renderBillingAddress() {
    const container = document.getElementById('billing-address-display');
    if (!container) return;

    if (!checkoutData || !checkoutData.billing) {
        container.innerHTML = '<p style="color: #999;">No billing address</p>';
        return;
    }

    const billing = checkoutData.billing;
    const addressParts = [
        billing.firstName && billing.lastName ? `${billing.firstName} ${billing.lastName}` : '',
        billing.address,
        billing.apt ? `Apt ${billing.apt}` : '',
        billing.city,
        billing.state,
        billing.zip,
        billing.country
    ].filter(part => part).join(', ');

    container.innerHTML = `
        <div class="address-display">${addressParts}</div>
    `;
}

/**
 * Render contact info
 */
function renderContactInfo() {
    const container = document.getElementById('contact-info-display');
    if (!container) return;

    if (!checkoutData || !checkoutData.contact) {
        container.innerHTML = '<p style="color: #999;">No contact information</p>';
        return;
    }

    const contact = checkoutData.contact;
    let html = `
        <div class="contact-display">Your email address: ${contact.email}</div>
        <div class="contact-display">Your phone number: ${contact.phone}</div>
    `;

    if (contact.emailOffers) {
        html += `
            <div class="checkbox-group" style="margin-top: 10px;">
                <input type="checkbox" checked disabled>
                <label>Receive emails regarding promotions and special offers.</label>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render order total
 */
function renderOrderTotal() {
    const container = document.getElementById('order-total-display');
    if (!container) return;

    const merchandise = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const shipping = 8.99;
    const totalBeforeTax = merchandise + shipping;
    const estimatedTax = 0.00;
    const orderTotal = totalBeforeTax + estimatedTax;

    container.innerHTML = `
        <div class="summary-row order-total">
            <span>Order Total:</span>
            <span>$${orderTotal.toFixed(2)}</span>
        </div>
    `;
}

/**
 * Handle delete item
 * @param {string} itemId - Item ID to delete
 */
function handleDeleteItem(itemId) {
    if (confirm('Are you sure you want to remove this item from your order?')) {
        cart = cart.filter(item => item.id !== itemId);

        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }

        if (cart.length === 0) {
            window.location.href = 'cart.html';
        } else {
            renderItems();
            renderOrderSummary();
            renderOrderTotal();
        }
    }
}

/**
 * Handle place order
 */
window.handlePlaceOrder = async function () {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'cart.html';
        return;
    }

    if (!checkoutData) {
        alert('Please complete checkout first.');
        window.location.href = 'checkout.html';
        return;
    }

    const totalAmount = calculateOrderTotal();
    const orderInfo = JSON.stringify({
        items: cart,
        checkout: checkoutData,
        date: new Date().toISOString()
    });

    try {
        const response = await fetch('http://localhost:8000/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: 1, // Default to user ID 1 for now as auth is not fully persistent across pages
                amount: totalAmount,
                order_info: orderInfo,
                status: 'completed'
            })
        });

        if (response.ok) {
            const result = await response.json();

            // Create order object for local history
            const order = {
                id: `order-${Date.now()}`,
                db_id: result.payment_id,
                date: new Date().toISOString(),
                items: cart,
                checkout: checkoutData,
                total: totalAmount
            };

            // Save order locally
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));

            // Clear cart and checkout data
            localStorage.removeItem('cart');
            localStorage.removeItem('checkoutData');

            // Show success and redirect
            alert(`Order placed successfully! Payment ID: ${result.payment_id}`);
            window.location.href = 'index.html';
        } else {
            const err = await response.json();
            alert(`Payment failed: ${err.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Error connecting to payment server. Please try again.');
    }
};

/**
 * Calculate order total
 * @returns {number} Total amount
 */
function calculateOrderTotal() {
    const merchandise = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const shipping = 8.99;
    const tax = 0.00;
    return merchandise + shipping + tax;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

