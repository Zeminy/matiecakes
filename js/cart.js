/**
 * @fileoverview Shopping cart page logic with multi-recipient shipping functionality
 * Harry & David style cart implementation
 * @module cart
 */

import { MOCK_ADDRESSES, SHIPPING_METHODS, calculateDeliveryDate, formatDeliveryDate } from './models.js';

// State
let cart = [];
let activePromo = null; // { code: string, discountRate: number }
let isMultiShipMode = false;
const DEFAULT_TRACKING_STEPS = [
    {
        code: 'prep',
        title: 'Bakery is preparing your order',
        time: '',
        note: 'Kitchen is carefully preparing your treats.'
    },
    {
        code: 'pickup_on_the_way',
        title: 'Driver on the way to store',
        time: '',
        note: 'Your driver is heading to the bakery.'
    },
    {
        code: 'pickup_waiting',
        title: 'Driver arrived at store',
        time: '',
        note: 'Waiting for the order to be handed over.'
    },
    {
        code: 'on_delivery',
        title: 'Out for delivery',
        time: '',
        note: 'Your order is on the way to the destination.'
    },
    {
        code: 'delivered',
        title: 'Delivered successfully',
        time: '',
        note: 'Order has been delivered. Enjoy!'
    }
];
const MULTI_SHIP_KEY = 'cart_multi_ship_mode';

/**
 * Initialize the cart page
 */
function init() {
    loadCart();
    loadMultiShipMode();
    renderCart();
    attachEventListeners();
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
            // Ensure all items have required fields (for backward compatibility)
            cart.forEach(item => {
                if (!item.quantity) item.quantity = 1;
                if (!item.productName) item.productName = 'Cupcake Box';
                if (!item.productImage) item.productImage = 'Image/Tinh hoa đoàn viên 1.jpg';
                if (!item.itemNumber) item.itemNumber = `20269${Math.floor(Math.random() * 1000)}`;
                if (!item.giftMessage) item.giftMessage = '';
                if (typeof item.giftMessageType === 'undefined') item.giftMessageType = null;
                if (!item.shippingAddress) {
                    item.shippingAddress = {
                        name: '',
                        street: '',
                        city: '',
                        state: '',
                        country: '',
                        phone: '',
                        locationType: ''
                    };
                }
                if (!item.recipientRelationship) item.recipientRelationship = '';
                if (!item.recipientOccasion) item.recipientOccasion = '';
                if (!item.shippingMethod) item.shippingMethod = 'standard';
                if (!item.deliveryDate) item.deliveryDate = null;
                if (!item.pickDateSelected) item.pickDateSelected = null;
            });
            updateHeaderCartBadge();
        } else {
            cart = [];
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        cart = [];
    }
}

/**
 * Compute unit price of a cart item (base + addons + assortment)
 * Falls back gracefully if finalPrice is missing.
 */
function computeUnitPrice(item) {
    const base = item.basePrice || 0;
    const addonsTotal = (item.selectedOptions || []).reduce(
        (sum, opt) => sum + (opt.price || 0) * (opt.quantity || 1),
        0
    );
    const assortmentTotal = (item.assortment || []).reduce(
        (sum, opt) => sum + (opt.extraPrice || 0) * (opt.quantity || 1),
        0
    );
    if (item.finalPrice && !Number.isNaN(item.finalPrice)) {
        return item.finalPrice;
    }
    return base + addonsTotal + assortmentTotal;
}

function hasFilledAddress(addr) {
    if (!addr) return false;
    const { name, street, city, state, phone } = addr;
    // Require at least street + city, and optionally name/phone
    return Boolean((street && city) || (street && phone) || (street && name));
}

/**
 * Build tracking payload for tracking.html from grouped shipments
 * @param {Array<Object>} shipments
 */
function buildTrackingPayload(shipments) {
    return shipments.map((shipment, idx) => {
        const recipientName = shipment.address?.name || `Shipment ${idx + 1}`;
        const recipientAddr = shipment.address?.fullAddress || [
            shipment.address?.street,
            shipment.address?.city,
            shipment.address?.state,
            shipment.address?.country
        ].filter(Boolean).join(', ');
        return {
            id: shipment.address?.id ? `#SHIP-${shipment.address.id}` : `#SHIP-${idx + 1}`,
            recipient: recipientAddr || recipientName,
            steps: DEFAULT_TRACKING_STEPS,
            activeIndex: 0,
            shipper: {
                name: 'Updating',
                phone: '--',
                status: 'Updating'
            }
        };
    });
}

/**
 * Derive a box thumbnail from main product image (e.g., red.png -> redBox.png)
 * Falls back to the original image if no derivation available.
 */
function deriveBoxThumb(imageSrc = '') {
    if (!imageSrc) return '';
    try {
        const lastSlash = imageSrc.lastIndexOf('/');
        const dir = lastSlash >= 0 ? imageSrc.slice(0, lastSlash + 1) : '';
        const file = lastSlash >= 0 ? imageSrc.slice(lastSlash + 1) : imageSrc;
        const dot = file.lastIndexOf('.');
        if (dot <= 0) return imageSrc;
        const name = file.slice(0, dot);
        const ext = file.slice(dot);
        if (name.toLowerCase().includes('box')) return imageSrc;
        const candidate = `${dir}${name}Box${ext}`;
        return candidate;
    } catch (e) {
        return imageSrc;
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateHeaderCartBadge();
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

function saveMultiShipMode() {
    try {
        localStorage.setItem(MULTI_SHIP_KEY, isMultiShipMode ? 'true' : 'false');
    } catch (e) {
        console.error('Error saving multi-ship mode:', e);
    }
}

function loadMultiShipMode() {
    try {
        const val = localStorage.getItem(MULTI_SHIP_KEY);
        isMultiShipMode = val === 'true';
    } catch (e) {
        isMultiShipMode = false;
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Multi-ship toggle
    const multiShipToggle = document.getElementById('multi-ship-toggle');
    if (multiShipToggle) {
        multiShipToggle.addEventListener('change', handleMultiShipToggle);
    }
}

/**
 * Handle multi-ship toggle change
 * @param {Event} event - The change event
 */
function handleMultiShipToggle(event) {
    isMultiShipMode = event.target.checked;
    saveMultiShipMode();
    renderCart();
}

/**
 * Handle quantity change for a cart item
 * @param {string} itemId - The cart item ID
 * @param {number} delta - Change in quantity (+1 or -1)
 */
function handleQuantityChange(itemId, delta) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);
    item.quantity = newQuantity;
    saveCart();
    renderCart();
}

/**
 * Handle quantity input change
 * @param {string} itemId - The cart item ID
 * @param {Event} event - The input event
 */
function handleQuantityInput(itemId, event) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(1, parseInt(event.target.value) || 1);
    item.quantity = newQuantity;
    saveCart();
    renderCart();
}

/**
 * Handle remove item
 * @param {string} itemId - The cart item ID
 */
function handleRemoveItem(itemId) {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
        cart = cart.filter(item => item.id !== itemId);
        saveCart();
        renderCart();
    }
}

/**
 * Handle shipping address dropdown change for a specific cart item
 * @param {string} itemId - The cart item ID
 * @param {Event} event - The change event
 */
function handleShippingAddressChange(itemId, event) {
    const addressId = event.target.value;

    // Update cart item's shippingAddressId
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.shippingAddressId = addressId === '' ? null : addressId;
        saveCart();
    }
}

/**
 * Handle gift message toggle
 * @param {string} itemId - The cart item ID
 * @param {Event} event - The change event
 */
function handleGiftMessageToggle(itemId, event) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;

    const textarea = document.getElementById(`gift-message-${itemId}`);
    if (textarea) {
        if (event.target.checked) {
            textarea.classList.add('active');
            textarea.focus();
        } else {
            textarea.classList.remove('active');
            item.giftMessage = '';
            saveCart();
        }
    }
}

/**
 * Handle gift message input
 * @param {string} itemId - The cart item ID
 * @param {Event} event - The input event
 */
function handleGiftMessageInput(itemId, event) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.giftMessage = event.target.value;
        saveCart();
    }
}

/**
 * Render the cart
 */
function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    // Sync toggle UI with stored state
    const multiShipToggle = document.getElementById('multi-ship-toggle');
    if (multiShipToggle) {
        multiShipToggle.checked = isMultiShipMode;
    }

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Add some delicious products to your cart!</p>
                <a href="product.html">Continue Shopping</a>
            </div>
        `;
        renderCartSummary(0, 0);
        return;
    }

    // Render common address form if not in multi-ship mode
    let commonAddressHTML = '';
    if (!isMultiShipMode && cart.length > 0) {
        // Get address from first item or use empty
        const firstItem = cart[0];
        const commonAddress = firstItem.shippingAddress || {
            name: '',
            street: '',
            city: '',
            state: '',
            country: '',
            phone: '',
            locationType: ''
        };

        const commonAddressDisplay = commonAddress.street
            ? `${commonAddress.name || ''}, ${commonAddress.street}, ${commonAddress.city}, ${commonAddress.state}, ${commonAddress.country || ''}, ${commonAddress.phone || ''}`
            : 'No address set';

        // Get common delivery date (from first item)
        const commonShippingMethod = firstItem.shippingMethod || 'standard';
        // Use pickDateSelected if switching to pick-date and user has selected a date
        // For Standard/Express, recalculate based on current device time
        let commonDeliveryDate = '';
        if (commonShippingMethod === 'pick-date' && firstItem.pickDateSelected) {
            commonDeliveryDate = firstItem.pickDateSelected;
        } else if (commonShippingMethod === 'standard' || commonShippingMethod === 'express') {
            // Recalculate delivery date based on current device time
            const deliveryDate = calculateDeliveryDate(commonShippingMethod);
            commonDeliveryDate = deliveryDate.toISOString().split('T')[0];
        } else {
            commonDeliveryDate = firstItem.deliveryDate || '';
        }

        commonAddressHTML = `
            <div class="cart-item-wrapper" id="common-address-section">
                <div class="item-header">
                    <div class="item-number">Shipping Address:</div>
                </div>
                <div class="recipient-section">
                    <div class="section-title">Sending To:</div>
                    <div class="section-content">
                        <span id="common-address-display">${commonAddressDisplay}</span>
                        <a href="#" class="edit-link" id="edit-common-address">Edit</a>
                    </div>
                    
                    <div class="edit-form" id="common-address-form">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="common-addr-name" value="${commonAddress.name || ''}" placeholder="Recipient name">
                        </div>
                        <div class="form-group">
                            <label>Location Type</label>
                            <select id="common-addr-location">
                                <option value="">Select</option>
                                <option value="Residence" ${commonAddress.locationType === 'Residence' ? 'selected' : ''}>Residence</option>
                                <option value="Business" ${commonAddress.locationType === 'Business' ? 'selected' : ''}>Business</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Delivery Address</label>
                            <input type="text" id="common-addr-street" value="${commonAddress.street || ''}" placeholder="Street address">
                        </div>
                        <div class="form-group">
                            <label>APT/SUITE/ROOM</label>
                            <input type="text" id="common-addr-apt" value="${commonAddress.apt || ''}" placeholder="Apt/Suite/Room">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>City</label>
                                <input type="text" id="common-addr-city" value="${commonAddress.city || ''}" placeholder="City">
                            </div>
                            <div class="form-group">
                                <label>State/Province</label>
                                <input type="text" id="common-addr-state" value="${commonAddress.state || ''}" placeholder="State">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Country</label>
                            <select id="common-addr-country">
                                <option value="">Select Country</option>
                                <option value="US" ${commonAddress.country === 'US' ? 'selected' : ''}>United States</option>
                                <option value="VN" ${commonAddress.country === 'VN' ? 'selected' : ''}>Vietnam</option>
                                <option value="CA" ${commonAddress.country === 'CA' ? 'selected' : ''}>Canada</option>
                                <option value="GB" ${commonAddress.country === 'GB' ? 'selected' : ''}>United Kingdom</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Recipient Phone Number</label>
                            <input type="tel" id="common-addr-phone" value="${commonAddress.phone || ''}" placeholder="Phone number">
                        </div>
                        <div class="form-actions">
                            <button class="btn-save" onclick="saveCommonAddress()">Save</button>
                            <button class="btn-cancel" onclick="cancelEditCommonAddress()">Cancel</button>
                        </div>
                    </div>
                    
                    <!-- Shipping Method Section for Common Address -->
                    <div class="shipping-method-section" style="margin-top: 20px;">
                        <div class="section-title">Shipping method</div>
                        ${SHIPPING_METHODS.map(method => {
            let methodDisplayName = method.name;
            let deliveryDateDisplay = '';

            if (method.id === 'standard') {
                const deliveryDate = calculateDeliveryDate('standard');
                const formattedDate = formatDeliveryDate(deliveryDate);
                methodDisplayName = 'Standard Shipping - Arrival Date';
                deliveryDateDisplay = `(Delivers: ${formattedDate})`;
            } else if (method.id === 'express') {
                const deliveryDate = calculateDeliveryDate('express');
                const formattedDate = formatDeliveryDate(deliveryDate);
                methodDisplayName = 'Express Shipping - Arrival by 12PM';
                deliveryDateDisplay = `(Delivers: ${formattedDate})`;
            }

            return `
                            <div class="shipping-method-option ${commonShippingMethod === method.id ? 'selected' : ''}">
                                <label onclick="selectCommonShippingMethod('${method.id}')" style="cursor: pointer;">
                                    <input type="radio" name="common-shipping" value="${method.id}" ${commonShippingMethod === method.id ? 'checked' : ''} onchange="selectCommonShippingMethod('${method.id}')">
                                    ${methodDisplayName} ${deliveryDateDisplay}
                                    <span class="shipping-option-price">$${method.price.toFixed(2)}</span>
                                </label>
                                ${method.id === 'pick-date' && commonShippingMethod === 'pick-date' ? `
                                    <div class="date-picker-container active" onclick="event.stopPropagation()">
                                        <div class="form-group">
                                            <label>Delivery date</label>
                                            <div class="date-input-wrapper">
                                                <input 
                                                    type="date" 
                                                    class="date-input" 
                                                    id="common-delivery-date"
                                                    value="${commonDeliveryDate}"
                                                    onclick="event.stopPropagation()"
                                                    onfocus="event.stopPropagation()"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Render cart items
    container.innerHTML = commonAddressHTML + cart.map((item, index) => renderCartItem(item, index)).join('');

    // Attach event listeners for common address
    if (!isMultiShipMode) {
        const editCommonAddressLink = document.getElementById('edit-common-address');
        if (editCommonAddressLink) {
            editCommonAddressLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('common-address-form').classList.add('active');
            });
        }

        // Note: Pick a Date is handled individually for each item, not in common address section
    }

    // Attach event listeners
    cart.forEach((item, index) => {
        // Quantity controls
        const minusBtn = document.getElementById(`qty-minus-${item.id}`);
        const plusBtn = document.getElementById(`qty-plus-${item.id}`);
        const qtyInput = document.getElementById(`qty-input-${item.id}`);

        if (minusBtn) {
            minusBtn.addEventListener('click', () => handleQuantityChange(item.id, -1));
        }
        if (plusBtn) {
            plusBtn.addEventListener('click', () => handleQuantityChange(item.id, 1));
        }
        if (qtyInput) {
            qtyInput.addEventListener('change', (e) => handleQuantityInput(item.id, e));
        }

        // Remove button
        const removeBtn = document.getElementById(`remove-${item.id}`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => handleRemoveItem(item.id));
        }

        // Shipping address
        const shippingSelect = document.getElementById(`shipping-select-${item.id}`);
        if (shippingSelect) {
            shippingSelect.addEventListener('change', (e) => handleShippingAddressChange(item.id, e));
        }

        // Gift message
        const giftToggle = document.getElementById(`gift-toggle-${item.id}`);
        const giftTextarea = document.getElementById(`gift-message-${item.id}`);

        if (giftToggle) {
            giftToggle.addEventListener('change', (e) => handleGiftMessageToggle(item.id, e));
            // Set checked state if message exists
            if (item.giftMessage) {
                giftToggle.checked = true;
                if (giftTextarea) {
                    giftTextarea.classList.add('active');
                    giftTextarea.value = item.giftMessage;
                }
            }
        }

        if (giftTextarea) {
            giftTextarea.addEventListener('input', (e) => handleGiftMessageInput(item.id, e));
        }

        // Edit address (only in multi-ship mode)
        if (isMultiShipMode) {
            const editAddressLink = document.getElementById(`edit-address-${item.id}`);
            if (editAddressLink) {
                editAddressLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById(`address-form-${item.id}`).classList.add('active');
                });
            }
        }

        // Edit relationship
        const editRelationshipLink = document.getElementById(`edit-relationship-${item.id}`);
        if (editRelationshipLink) {
            editRelationshipLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(`relationship-form-${item.id}`).classList.add('active');
            });
        }

        // Edit occasion
        const editOccasionLink = document.getElementById(`edit-occasion-${item.id}`);
        if (editOccasionLink) {
            editOccasionLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById(`occasion-form-${item.id}`).classList.add('active');
            });
        }

        // Shipping method date picker - ensure it's interactive
        const deliveryDateInput = document.getElementById(`delivery-date-${item.id}`);
        if (deliveryDateInput) {
            // Make sure input is enabled
            deliveryDateInput.disabled = false;
            deliveryDateInput.readOnly = false;

            // Remove any existing listeners to avoid duplicates
            const newInput = deliveryDateInput.cloneNode(true);
            deliveryDateInput.parentNode.replaceChild(newInput, deliveryDateInput);

            // Attach change listener to new input
            const updatedInput = document.getElementById(`delivery-date-${item.id}`);
            if (updatedInput) {
                updatedInput.addEventListener('change', (e) => {
                    const currentItem = cart.find(i => i.id === item.id);
                    if (currentItem) {
                        const selectedDate = e.target.value;
                        currentItem.deliveryDate = selectedDate;
                        currentItem.pickDateSelected = selectedDate; // Save pick-date selection
                        saveCart();
                        // Don't re-render to avoid losing focus
                    }
                });

                // Also listen to input event for real-time updates
                updatedInput.addEventListener('input', (e) => {
                    const currentItem = cart.find(i => i.id === item.id);
                    if (currentItem) {
                        const selectedDate = e.target.value;
                        currentItem.deliveryDate = selectedDate;
                        currentItem.pickDateSelected = selectedDate; // Save pick-date selection
                        saveCart();
                    }
                });
            }
        }
    });

    // Render summary
    const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const total = cart.reduce((sum, item) => sum + (computeUnitPrice(item) * (item.quantity || 1)), 0);
    renderCartSummary(itemCount, total, cart);
}

/**
 * Render a single cart item
 * @param {Object} item - The cart item object
 * @param {number} index - Index of item (0-based)
 * @returns {string} HTML string for the cart item
 */
function renderCartItem(item, index) {
    const addonsText = item.selectedOptions && item.selectedOptions.length > 0
        ? item.selectedOptions.map(opt => `${opt.name}${opt.quantity > 1 ? ` x${opt.quantity}` : ''}`).join(', ')
        : 'No addons';

    const unitPrice = computeUnitPrice(item);
    const qty = item.quantity || 1;
    const itemTotal = unitPrice * qty;
    const itemNumber = index + 1;
    const totalItems = cart.length;
    const productImage = item.productImage || 'Image/Logo.png';
    const boxThumb = item.boxThumb || deriveBoxThumb(productImage);
    const mainImage = boxThumb || productImage;
    const badgeImage = productImage;
    const base = item.basePrice || 0;
    const assortmentLines = (item.assortment || []).filter(opt => opt.quantity > 0);
    const addonLines = (item.selectedOptions || []).filter(opt => opt.quantity > 0);
    const thumbLines = assortmentLines.length > 0 ? assortmentLines : [];

    // Format address display
    const addressDisplay = item.shippingAddress && item.shippingAddress.street
        ? `${item.shippingAddress.name || ''}, ${item.shippingAddress.street}, ${item.shippingAddress.city}, ${item.shippingAddress.state}, ${item.shippingAddress.country || ''}, ${item.shippingAddress.phone || ''}`
        : 'No address set';

    // Get selected shipping method
    const selectedShippingMethod = item.shippingMethod || 'standard';

    // Use pickDateSelected if pick-date is selected and user has chosen a date
    // For Standard/Express, recalculate based on current device time
    let deliveryDateValue = '';
    if (selectedShippingMethod === 'pick-date' && item.pickDateSelected) {
        deliveryDateValue = item.pickDateSelected;
    } else if (selectedShippingMethod === 'standard' || selectedShippingMethod === 'express') {
        // Recalculate delivery date based on current device time
        const deliveryDate = calculateDeliveryDate(selectedShippingMethod);
        deliveryDateValue = deliveryDate.toISOString().split('T')[0];
    } else {
        deliveryDateValue = item.deliveryDate || '';
    }

    return `
        <div class="cart-item-wrapper" data-item-id="${item.id}">
            <div class="item-header">
                <div class="item-number">Item ${itemNumber} of ${totalItems}:</div>
                <button class="item-delete-btn" id="remove-${item.id}" title="Remove item">🗑️</button>
            </div>
            
            <div class="cart-item">
                <div class="cart-item-image-wrapper">
                    <img src="${mainImage}" alt="${item.productName}" class="cart-item-image">
                    <div class="box-thumb-badge">
                        <img src="${badgeImage}" alt="Item thumbnail">
                    </div>
                </div>
                
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.productName}</div>
                    <div class="item-meta">
                        <strong>Item #:</strong> ${item.itemNumber}
                    </div>
                    <div class="item-meta">
                        <strong>Matie Cake</strong>
                    </div>
                    <div class="item-meta">
                        <strong>Price:</strong> $${unitPrice.toFixed(2)}
                    </div>
                    <div class="item-meta">
                        <strong>Qty:</strong> ${item.quantity}
                    </div>

                    <div class="item-price-breakdown">
                        <div class="break-row">
                            <span>Base Price:</span>
                            <span>$${base.toFixed(2)}</span>
                        </div>
                        ${assortmentLines.map(opt => `
                            <div class="break-row">
                                <span>${opt.name} x${opt.quantity}:</span>
                                <span>+$${(opt.extraPrice * opt.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        ${addonLines.map(opt => `
                            <div class="break-row">
                                <span>${opt.name} x${opt.quantity}:</span>
                                <span>+$${(opt.price * opt.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="break-row break-total">
                            <span>Total (per item):</span>
                            <span>$${unitPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    ${thumbLines.length > 0 ? `
                        <div class="thumb-list">
                            ${thumbLines.map(opt => `
                                <div class="thumb-item">
                                    <img src="${opt.image || 'Image/Logo.png'}" alt="${opt.name}">
                                    <span class="thumb-qty">x${opt.quantity}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <a href="#" class="send-additional-link" id="send-additional-${item.id}">Send to an additional recipient</a>
                    
                    <!-- Recipient Section -->
                    <div class="recipient-section">
                        <div class="section-title">Sending To:</div>
                        ${isMultiShipMode ? `
                            <div class="section-content">
                                <span id="address-display-${item.id}">${addressDisplay}</span>
                                <a href="#" class="edit-link" id="edit-address-${item.id}">Edit</a>
                            </div>
                            
                            <div class="edit-form" id="address-form-${item.id}">
                                <div class="form-group">
                                    <label>Name</label>
                                    <input type="text" id="addr-name-${item.id}" value="${item.shippingAddress?.name || ''}" placeholder="Recipient name">
                                </div>
                                <div class="form-group">
                                    <label>Location Type</label>
                                    <select id="addr-location-${item.id}">
                                        <option value="">Select</option>
                                        <option value="Residence" ${item.shippingAddress?.locationType === 'Residence' ? 'selected' : ''}>Residence</option>
                                        <option value="Business" ${item.shippingAddress?.locationType === 'Business' ? 'selected' : ''}>Business</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Delivery Address</label>
                                    <input type="text" id="addr-street-${item.id}" value="${item.shippingAddress?.street || ''}" placeholder="Street address">
                                </div>
                                <div class="form-group">
                                    <label>APT/SUITE/ROOM</label>
                                    <input type="text" id="addr-apt-${item.id}" value="${item.shippingAddress?.apt || ''}" placeholder="Apt/Suite/Room">
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>City</label>
                                        <input type="text" id="addr-city-${item.id}" value="${item.shippingAddress?.city || ''}" placeholder="City">
                                    </div>
                                    <div class="form-group">
                                        <label>State/Province</label>
                                        <input type="text" id="addr-state-${item.id}" value="${item.shippingAddress?.state || ''}" placeholder="State">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Country</label>
                                    <select id="addr-country-${item.id}">
                                        <option value="">Select Country</option>
                                        <option value="US" ${item.shippingAddress?.country === 'US' ? 'selected' : ''}>United States</option>
                                        <option value="VN" ${item.shippingAddress?.country === 'VN' ? 'selected' : ''}>Vietnam</option>
                                        <option value="CA" ${item.shippingAddress?.country === 'CA' ? 'selected' : ''}>Canada</option>
                                        <option value="GB" ${item.shippingAddress?.country === 'GB' ? 'selected' : ''}>United Kingdom</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Recipient Phone Number</label>
                                    <input type="tel" id="addr-phone-${item.id}" value="${item.shippingAddress?.phone || ''}" placeholder="Phone number">
                                </div>
                                <div class="form-actions">
                                    <button class="btn-save" onclick="saveAddress('${item.id}')">Save</button>
                                    <button class="btn-cancel" onclick="cancelEditAddress('${item.id}')">Cancel</button>
                                </div>
                            </div>
                        ` : `
                            <div class="section-content">
                                <span>Single shipping address (set below)</span>
                            </div>
                        `}
                        
                        <div class="section-title" style="margin-top: 15px;">Recipient's Relationship:</div>
                        <div class="section-content">
                            <span class="bullet">•</span>
                            <span id="relationship-display-${item.id}">${item.recipientRelationship || 'Not set'}</span>
                            <a href="#" class="edit-link" id="edit-relationship-${item.id}">Edit</a>
                        </div>
                        
                        <div class="edit-form" id="relationship-form-${item.id}">
                            <div class="form-group">
                                <label>Relationship</label>
                                <select id="relationship-select-${item.id}">
                                    <option value="">Select relationship...</option>
                                    <option value="Dad" ${item.recipientRelationship === 'Dad' ? 'selected' : ''}>Dad</option>
                                    <option value="Mom" ${item.recipientRelationship === 'Mom' ? 'selected' : ''}>Mom</option>
                                    <option value="Friend" ${item.recipientRelationship === 'Friend' ? 'selected' : ''}>Friend</option>
                                    <option value="Colleague" ${item.recipientRelationship === 'Colleague' ? 'selected' : ''}>Colleague</option>
                                    <option value="Other" ${item.recipientRelationship && !['Dad', 'Mom', 'Friend', 'Colleague'].includes(item.recipientRelationship) ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button class="btn-save" onclick="saveRelationship('${item.id}')">Save</button>
                                <button class="btn-cancel" onclick="cancelEditRelationship('${item.id}')">Cancel</button>
                            </div>
                        </div>
                        
                        <div class="section-title" style="margin-top: 15px;">Recipient's Occasion:</div>
                        <div class="section-content">
                            <span class="bullet">•</span>
                            <span id="occasion-display-${item.id}">${item.recipientOccasion || 'Not set'}</span>
                            <a href="#" class="edit-link" id="edit-occasion-${item.id}">Edit</a>
                        </div>
                        
                        <div class="edit-form" id="occasion-form-${item.id}">
                            <div class="form-group">
                                <label>Occasion</label>
                                <input type="text" id="occasion-input-${item.id}" value="${item.recipientOccasion || ''}" placeholder="e.g., Birthday - February/16, 2025">
                            </div>
                            <div class="form-actions">
                                <button class="btn-save" onclick="saveOccasion('${item.id}')">Save</button>
                                <button class="btn-cancel" onclick="cancelEditOccasion('${item.id}')">Cancel</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Gift Message Section -->
        <div class="gift-message-section">
            <div class="section-title">Gift Message (optional):</div>
            
            <div class="gift-message-option ${item.giftMessageType === null || item.giftMessageType === 'none' ? 'selected' : ''}" onclick="selectGiftMessageType('${item.id}', 'none')">
                <label>
                    <input type="radio" name="gift-type-${item.id}" value="none" ${(item.giftMessageType === null || item.giftMessageType === 'none') ? 'checked' : ''}>
                    Not a message
                </label>
            </div>
            
            <div class="gift-message-option ${item.giftMessageType === 'complimentary' ? 'selected' : ''}" onclick="selectGiftMessageType('${item.id}', 'complimentary')">
                <label>
                    <input type="radio" name="gift-type-${item.id}" value="complimentary" ${item.giftMessageType === 'complimentary' ? 'checked' : ''}>
                    Complimentary Greeting Message
                </label>
                ${item.giftMessageType === 'complimentary' ? `
                    <textarea 
                        class="gift-message-textarea active"
                        id="gift-message-${item.id}"
                        placeholder="Enter your personal message here..."
                        maxlength="500"
                    >${item.giftMessage || ''}</textarea>
                ` : ''}
            </div>
        </div>
                    
                    <!-- Shipping Method Section -->
                    ${isMultiShipMode ? `
                    <div class="shipping-method-section">
                        <div class="section-title">Shipping method</div>
                        
                        ${SHIPPING_METHODS.map(method => {
        let methodDisplayName = method.name;
        let deliveryDateDisplay = '';

        if (method.id === 'standard') {
            const deliveryDate = calculateDeliveryDate('standard');
            const formattedDate = formatDeliveryDate(deliveryDate);
            methodDisplayName = 'Standard Shipping - Arrival Date';
            deliveryDateDisplay = `(Delivers: ${formattedDate})`;
        } else if (method.id === 'express') {
            const deliveryDate = calculateDeliveryDate('express');
            const formattedDate = formatDeliveryDate(deliveryDate);
            methodDisplayName = 'Express Shipping - Arrival by 12PM';
            deliveryDateDisplay = `(Delivers: ${formattedDate})`;
        }

        return `
                            <div class="shipping-method-option ${selectedShippingMethod === method.id ? 'selected' : ''}">
                                <label onclick="selectShippingMethod('${item.id}', '${method.id}')" style="cursor: pointer;">
                                    <input type="radio" name="shipping-${item.id}" value="${method.id}" ${selectedShippingMethod === method.id ? 'checked' : ''} onchange="selectShippingMethod('${item.id}', '${method.id}')">
                                    ${methodDisplayName} ${deliveryDateDisplay}
                                    <span class="shipping-option-price">$${method.price.toFixed(2)}</span>
                                </label>
                                ${method.id === 'pick-date' && selectedShippingMethod === 'pick-date' ? `
                                    <div class="date-picker-container active" onclick="event.stopPropagation()">
                                        <div class="form-group">
                                            <label>Delivery date</label>
                                            <div class="date-input-wrapper">
                                                <input 
                                                    type="date" 
                                                    class="date-input" 
                                                    id="delivery-date-${item.id}"
                                                    value="${deliveryDateValue}"
                                                    onclick="event.stopPropagation()"
                                                    onfocus="event.stopPropagation()"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            `;
    }).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <button class="save-continue-btn" onclick="saveItem('${item.id}')">Save To Continue</button>
        </div>
    `;
}

/**
 * Render cart summary
 * @param {number} itemCount - Total number of items
 * @param {number} total - Total cart value
 * @param {Array} items - Cart items
 */
function getPromoDiscount(subtotal) {
    if (!activePromo) return 0;
    // Only one simple code for now: MATIE10 -> 10% off
    const rate = activePromo.discountRate || 0;
    const discount = subtotal * rate;
    return Math.max(0, discount);
}

function renderCartSummary(itemCount, total, items = []) {
    const summaryContainer = document.getElementById('cart-summary');
    if (!summaryContainer) return;

    const itemText = itemCount === 1 ? 'item' : 'items';
    const subtotal = total;
    const shipping = 0; // Can be calculated later
    const promoDiscount = getPromoDiscount(subtotal);
    const finalTotal = Math.max(0, subtotal - promoDiscount + shipping);

    const listHTML = items.map(item => {
        const unit = computeUnitPrice(item);
        const qty = item.quantity || 1;
        const lineTotal = unit * qty;
        return `
            <div class="summary-item-row">
                <div class="summary-item-name">${item.productName || 'Item'}</div>
                <div class="summary-item-qty">x${qty}</div>
                <div class="summary-item-price">$${unit.toFixed(2)}</div>
                <div class="summary-item-line">$${lineTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    summaryContainer.innerHTML = `
        <h2>Order Summary</h2>
        <div class="summary-row">
            <span class="summary-row-label">Subtotal (${itemCount} ${itemText}):</span>
            <span class="summary-row-value">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-item-list">
            ${listHTML}
        </div>
        <div class="promo-row">
            <label for="promo-code-input">Promo code</label>
            <div class="promo-input-group">
                <input 
                    id="promo-code-input" 
                    type="text" 
                    placeholder="Enter code (e.g., MATIE10)" 
                    value="${activePromo ? activePromo.code : ''}"
                >
                <button type="button" id="apply-promo-btn">Apply</button>
            </div>
            <div id="promo-message" class="promo-message ${activePromo ? 'promo-message--success' : ''}">
                ${activePromo ? `Code <strong>${activePromo.code}</strong> applied: ${Math.round((activePromo.discountRate || 0) * 100)}% off` : ''}
            </div>
        </div>
        <div class="summary-row" id="summary-discount-row" style="${promoDiscount > 0 ? '' : 'display:none;'}">
            <span class="summary-row-label">Discount${activePromo ? ` (${activePromo.code})` : ''}:</span>
            <span class="summary-row-value">- $${promoDiscount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-row-label">Shipping:</span>
            <span class="summary-row-value">Calculated at checkout</span>
        </div>
        <div class="summary-row subtotal">
            <span class="summary-row-label">Estimated Total:</span>
            <span class="summary-row-value">$${finalTotal.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
            <span>Total:</span>
            <span>$${finalTotal.toFixed(2)}</span>
        </div>
        <button class="checkout-btn" id="checkout-btn" ${cart.length === 0 ? 'disabled' : ''}>
            Proceed to Checkout
        </button>
    `;

    // Re-attach checkout button listener
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Promo apply handler
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const input = document.getElementById('promo-code-input');
            const messageEl = document.getElementById('promo-message');
            const rawCode = (input?.value || '').trim().toUpperCase();

            // Simple rule: MATIE10 -> 10% off subtotal
            if (!rawCode) {
                activePromo = null;
                if (messageEl) {
                    messageEl.textContent = 'Promo code cleared.';
                    messageEl.className = 'promo-message promo-message--success';
                }
                // Re-render to remove discount
                renderCartSummary(itemCount, subtotal, items);
                return;
            }

            if (rawCode === 'MATIE10') {
                activePromo = { code: rawCode, discountRate: 0.10 };
                if (messageEl) {
                    messageEl.innerHTML = 'Code <strong>MATIE10</strong> applied: 10% off your cart subtotal.';
                    messageEl.className = 'promo-message promo-message--success';
                }
                renderCartSummary(itemCount, subtotal, items);
            } else {
                activePromo = null;
                if (messageEl) {
                    messageEl.textContent = 'This promo code is not valid.';
                    messageEl.className = 'promo-message promo-message--error';
                }
                renderCartSummary(itemCount, subtotal, items);
            }
        });
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
 * Group cart items by shipping address
 * @returns {Array<Object>} Array of grouped shipments
 */
function groupOrdersByAddress() {
    const grouped = {};

    cart.forEach(item => {
        const addressId = item.shippingAddressId || JSON.stringify(item.shippingAddress || {});

        if (!grouped[addressId]) {
            let address;
            if (item.shippingAddressId) {
                address = MOCK_ADDRESSES.find(addr => addr.id === addressId) || { id: addressId, name: 'Unknown', fullAddress: '' };
            } else if (hasFilledAddress(item.shippingAddress)) {
                const a = item.shippingAddress;
                const full = [a.street, a.city, a.state, a.country, a.phone].filter(Boolean).join(', ');
                address = { id: `custom-${Object.keys(grouped).length + 1}`, name: a.name || 'Custom Address', fullAddress: full };
            } else {
                address = { id: 'default', name: 'Default Address', fullAddress: 'No address selected' };
            }

            grouped[addressId] = {
                address: address,
                items: [],
                total: 0
            };
        }

        grouped[addressId].items.push(item);
        grouped[addressId].total += item.finalPrice * item.quantity;
    });

    return Object.values(grouped);
}

/**
 * Handle checkout button click
 */
function handleCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // If multi-ship mode is enabled, validate all items have addresses
    if (isMultiShipMode) {
        const itemsWithoutAddress = cart.filter(item => !item.shippingAddressId && !hasFilledAddress(item.shippingAddress));
        if (itemsWithoutAddress.length > 0) {
            alert(`Please select shipping addresses for all items. ${itemsWithoutAddress.length} item(s) missing address.`);
            return;
        }
    }

    // Group orders by address
    const shipments = groupOrdersByAddress();

    // Log the result in the specified format
    console.log('=== CHECKOUT SUMMARY ===');
    shipments.forEach((shipment, index) => {
        const itemCount = shipment.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemText = itemCount === 1 ? 'item' : 'items';
        const addressName = shipment.address.name;

        console.log(
            `Shipment ${index + 1} (To ${addressName}): ${itemCount} ${itemText} - Total $${shipment.total.toFixed(2)}`
        );
    });

    // Show alert with summary
    const summaryText = shipments.map((shipment, index) => {
        const itemCount = shipment.items.reduce((sum, item) => sum + item.quantity, 0);
        const itemText = itemCount === 1 ? 'item' : 'items';
        return `Shipment ${index + 1} (To ${shipment.address.name}): ${itemCount} ${itemText} - Total $${shipment.total.toFixed(2)}`;
    }).join('\n');

    console.log(`Checkout Summary:\n\n${summaryText}\n\nCheck the console for detailed information.`);

    // Save tracking payload for tracking.html
    try {
        const trackingPayload = buildTrackingPayload(shipments);
        localStorage.setItem('trackingShipments', JSON.stringify(trackingPayload));
    } catch (e) {
        console.error('Failed to save tracking payload', e);
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Global functions for inline event handlers
window.saveAddress = function (itemId) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.shippingAddress = {
        name: document.getElementById(`addr-name-${itemId}`).value,
        street: document.getElementById(`addr-street-${itemId}`).value,
        city: document.getElementById(`addr-city-${itemId}`).value,
        state: document.getElementById(`addr-state-${itemId}`).value,
        country: document.getElementById(`addr-country-${itemId}`).value,
        phone: document.getElementById(`addr-phone-${itemId}`).value,
        apt: document.getElementById(`addr-apt-${itemId}`).value,
        locationType: document.getElementById(`addr-location-${itemId}`).value
    };

    saveCart();
    renderCart();
};

window.saveCommonAddress = function () {
    const commonAddress = {
        name: document.getElementById('common-addr-name').value,
        street: document.getElementById('common-addr-street').value,
        city: document.getElementById('common-addr-city').value,
        state: document.getElementById('common-addr-state').value,
        country: document.getElementById('common-addr-country').value,
        phone: document.getElementById('common-addr-phone').value,
        apt: document.getElementById('common-addr-apt').value,
        locationType: document.getElementById('common-addr-location').value
    };

    // Get delivery date if pick-date is selected
    const commonDeliveryDateInput = document.getElementById('common-delivery-date');
    const commonDeliveryDate = commonDeliveryDateInput ? commonDeliveryDateInput.value : null;

    // Apply to all items
    cart.forEach(item => {
        item.shippingAddress = { ...commonAddress };
        if (commonDeliveryDate) {
            item.deliveryDate = commonDeliveryDate;
        }
    });

    saveCart();
    renderCart();
};

window.selectCommonShippingMethod = function (methodId) {
    // Apply shipping method to all items
    cart.forEach(item => {
        const previousMethod = item.shippingMethod;
        item.shippingMethod = methodId;

        // Only set date if:
        // 1. Switching to pick-date: restore pickDateSelected if exists, otherwise leave empty
        // 2. Switching away from pick-date: save current date to pickDateSelected if it was pick-date, then calculate estimated date
        if (methodId === 'pick-date') {
            // If user previously selected a date in pick-date, restore it
            if (item.pickDateSelected) {
                item.deliveryDate = item.pickDateSelected;
            } else {
                // Otherwise leave empty for user to choose freely
                item.deliveryDate = item.deliveryDate || '';
            }
        } else {
            // If switching FROM pick-date, save the current deliveryDate to pickDateSelected
            if (previousMethod === 'pick-date' && item.deliveryDate) {
                item.pickDateSelected = item.deliveryDate;
            }
            // For other methods, calculate estimated delivery date
            const deliveryDate = calculateDeliveryDate(methodId);
            item.deliveryDate = deliveryDate.toISOString().split('T')[0];
        }
    });

    saveCart();
    renderCart();

    // Attach date picker listener after render
    setTimeout(() => {
        const commonDeliveryDateInput = document.getElementById('common-delivery-date');
        if (commonDeliveryDateInput && methodId === 'pick-date') {
            // Make sure input is enabled
            commonDeliveryDateInput.disabled = false;
            commonDeliveryDateInput.readOnly = false;

            // Remove any existing listeners
            const newInput = commonDeliveryDateInput.cloneNode(true);
            commonDeliveryDateInput.parentNode.replaceChild(newInput, commonDeliveryDateInput);

            // Attach to new input
            const updatedInput = document.getElementById('common-delivery-date');
            if (updatedInput) {
                updatedInput.addEventListener('change', (e) => {
                    const selectedDate = e.target.value;
                    cart.forEach(item => {
                        item.deliveryDate = selectedDate;
                        item.pickDateSelected = selectedDate; // Save pick-date selection
                    });
                    saveCart();
                });

                updatedInput.addEventListener('input', (e) => {
                    const selectedDate = e.target.value;
                    cart.forEach(item => {
                        item.deliveryDate = selectedDate;
                        item.pickDateSelected = selectedDate; // Save pick-date selection
                    });
                    saveCart();
                });
            }
        }
    }, 100);
};

window.cancelEditCommonAddress = function () {
    document.getElementById('common-address-form').classList.remove('active');
};

window.cancelEditAddress = function (itemId) {
    document.getElementById(`address-form-${itemId}`).classList.remove('active');
};

window.saveRelationship = function (itemId) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.recipientRelationship = document.getElementById(`relationship-select-${itemId}`).value;
    saveCart();
    renderCart();
};

window.cancelEditRelationship = function (itemId) {
    document.getElementById(`relationship-form-${itemId}`).classList.remove('active');
};

window.saveOccasion = function (itemId) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.recipientOccasion = document.getElementById(`occasion-input-${itemId}`).value;
    saveCart();
    renderCart();
};

window.cancelEditOccasion = function (itemId) {
    document.getElementById(`occasion-form-${itemId}`).classList.remove('active');
};

window.selectGiftMessageType = function (itemId, type) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    if (type === 'none') {
        item.giftMessageType = null;
        item.giftMessage = '';
    } else {
        item.giftMessageType = type;
    }
    saveCart();
    renderCart();
};

window.selectShippingMethod = function (itemId, methodId) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    const previousMethod = item.shippingMethod;
    item.shippingMethod = methodId;

    // Only calculate delivery date if:
    // 1. Switching to pick-date: restore pickDateSelected if exists, otherwise leave empty
    // 2. Switching away from pick-date: save current date to pickDateSelected if it was pick-date, then calculate estimated date
    if (methodId === 'pick-date') {
        // If user previously selected a date in pick-date, restore it
        if (item.pickDateSelected) {
            item.deliveryDate = item.pickDateSelected;
        } else {
            // Otherwise leave empty for user to choose freely
            item.deliveryDate = item.deliveryDate || '';
        }
    } else {
        // If switching FROM pick-date, save the current deliveryDate to pickDateSelected
        if (previousMethod === 'pick-date' && item.deliveryDate) {
            item.pickDateSelected = item.deliveryDate;
        }
        // For other methods, calculate estimated delivery date
        const deliveryDate = calculateDeliveryDate(methodId);
        item.deliveryDate = deliveryDate.toISOString().split('T')[0];
    }

    saveCart();
    renderCart();

    // After render, ensure date picker is interactive
    setTimeout(() => {
        const deliveryDateInput = document.getElementById(`delivery-date-${itemId}`);
        if (deliveryDateInput && methodId === 'pick-date') {
            // Make sure input is enabled and can be changed
            deliveryDateInput.disabled = false;
            deliveryDateInput.readOnly = false;

            // Re-attach change listener
            deliveryDateInput.addEventListener('change', function (e) {
                const currentItem = cart.find(i => i.id === itemId);
                if (currentItem) {
                    const selectedDate = e.target.value;
                    currentItem.deliveryDate = selectedDate;
                    currentItem.pickDateSelected = selectedDate; // Save pick-date selection
                    saveCart();
                }
            });

            // Also listen to input event
            deliveryDateInput.addEventListener('input', function (e) {
                const currentItem = cart.find(i => i.id === itemId);
                if (currentItem) {
                    const selectedDate = e.target.value;
                    currentItem.deliveryDate = selectedDate;
                    currentItem.pickDateSelected = selectedDate; // Save pick-date selection
                    saveCart();
                }
            });
        }
    }, 100);
};

window.saveItem = function (itemId) {
    // Save all changes for this item
    saveCart();
    alert('Item saved successfully!');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
