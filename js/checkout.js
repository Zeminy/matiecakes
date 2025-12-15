/**
 * @fileoverview Checkout page logic with payment form validation
 * @module checkout
 */

// State
let selectedPaymentMethod = 'card';
let cart = [];
let useBillingAddress = false;

/**
 * Initialize the checkout page
 */
function init() {
    loadCart();
    renderOrderSummary();
    populateYearDropdown();
    attachEventListeners();
    loadBillingAddressFromCart();
    setupBillingToggle();
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
            // Update header cart count
            try {
                const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const headerBadge = document.getElementById('header-cart-badge');
                if (headerBadge) {
                    headerBadge.textContent = count;
                    headerBadge.style.display = count > 0 ? 'inline-flex' : 'none';
                }
            } catch (e) {
                console.error('Error updating header cart count', e);
            }
        } else {
            cart = [];
            // Redirect to cart if empty
            alert('Your cart is empty!');
            window.location.href = 'cart.html';
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

/**
 * Populate year dropdown with next 20 years
 */
function populateYearDropdown() {
    const yearSelect = document.getElementById('card-year');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 20; i++) {
        const year = currentYear + i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

/**
 * Load billing address from cart (if available)
 */
function loadBillingAddressFromCart() {
    if (cart.length === 0) return;

    const firstItem = cart[0];
    if (firstItem.shippingAddress) {
        const addr = firstItem.shippingAddress;
        if (addr.name) {
            const names = addr.name.split(' ');
            if (names.length >= 2) {
                document.getElementById('billing-firstname').value = names[0];
                document.getElementById('billing-lastname').value = names.slice(1).join(' ');
            } else {
                document.getElementById('billing-firstname').value = names[0] || '';
            }
        }
        if (addr.street) document.getElementById('billing-address').value = addr.street;
        if (addr.city) document.getElementById('billing-city').value = addr.city;
        if (addr.state) document.getElementById('billing-state').value = addr.state;
        if (addr.zip) document.getElementById('billing-zip').value = addr.zip;
        if (addr.phone) document.getElementById('contact-phone').value = addr.phone;
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Card number formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
        cardNumberInput.addEventListener('blur', validateCardNumber);
    }

    // CVV validation
    const cvvInput = document.getElementById('card-cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            validateField('card-cvv');
        });
    }

    // MoMo phone validation
    const momoPhoneInput = document.getElementById('momo-phone');
    if (momoPhoneInput) {
        momoPhoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            validateField('momo-phone');
        });
        momoPhoneInput.addEventListener('blur', () => validateField('momo-phone'));
    }

    // Contact phone validation
    const contactPhoneInput = document.getElementById('contact-phone');
    if (contactPhoneInput) {
        contactPhoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
            validateField('contact-phone');
        });
        contactPhoneInput.addEventListener('blur', () => validateField('contact-phone'));
    }

    // Contact email validation
    const contactEmailInput = document.getElementById('contact-email');
    if (contactEmailInput) {
        contactEmailInput.addEventListener('input', () => validateField('contact-email'));
        contactEmailInput.addEventListener('blur', () => validateField('contact-email'));
    }

    // VNPay bank selection
    const vnpayBankSelect = document.getElementById('vnpay-bank');
    if (vnpayBankSelect) {
        vnpayBankSelect.addEventListener('change', () => validateField('vnpay-bank'));
    }

    // Real-time validation for all required fields
    const requiredFields = [
        'card-name', 'card-number', 'card-month', 'card-year', 'card-cvv',
        'contact-email', 'contact-phone'
    ];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldId));
            field.addEventListener('input', () => {
                if (field.value.trim() !== '') {
                    validateField(fieldId);
                }
            });
        }
    });
}

/**
 * Select payment method
 * @param {string} method - Payment method ID
 */
window.selectPaymentMethod = function (method) {
    selectedPaymentMethod = method;

    // Update button states
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    const selectedBtn = document.querySelector(`[data-method="${method}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    // Show/hide payment forms
    const cardForm = document.getElementById('card-payment-form');
    const paypalForm = document.getElementById('paypal-payment-form');
    const momoForm = document.getElementById('momo-payment-form');
    const vnpayForm = document.getElementById('vnpay-payment-form');
    const codForm = document.getElementById('cod-payment-form');

    if (cardForm) {
        cardForm.style.display = method === 'card' ? 'block' : 'none';
    }
    if (paypalForm) {
        paypalForm.style.display = method === 'paypal' ? 'block' : 'none';
    }
    if (momoForm) {
        momoForm.style.display = method === 'momo' ? 'block' : 'none';
    }
    if (vnpayForm) {
        vnpayForm.style.display = method === 'vnpay' ? 'block' : 'none';
    }
    if (codForm) {
        codForm.style.display = method === 'cod' ? 'block' : 'none';
    }
};

/**
 * Format card number with spaces
 * @param {Event} event - Input event
 */
function formatCardNumber(event) {
    let value = event.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formattedValue.length > 19) formattedValue = formattedValue.substring(0, 19);
    event.target.value = formattedValue;
    validateField('card-number');
}

/**
 * Validate card number (Luhn algorithm)
 * @param {Event} event - Blur event
 */
function validateCardNumber(event) {
    const cardNumber = event.target.value.replace(/\s/g, '');
    const isValid = cardNumber.length >= 13 && cardNumber.length <= 19 && luhnCheck(cardNumber);
    updateValidationIcon('card-number', isValid);
}

/**
 * Luhn algorithm for card validation
 * @param {string} cardNumber - Card number without spaces
 * @returns {boolean} True if valid
 */
function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * Validate a form field
 * @param {string} fieldId - Field ID to validate
 * @returns {boolean} True if valid
 */
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    let isValid = false;
    const value = field.value.trim();

    switch (fieldId) {
        case 'card-name':
            isValid = value.length >= 2;
            break;
        case 'card-number':
            const cardNum = value.replace(/\s/g, '');
            isValid = cardNum.length >= 13 && cardNum.length <= 19 && luhnCheck(cardNum);
            break;
        case 'card-month':
            isValid = value !== '' && parseInt(value) >= 1 && parseInt(value) <= 12;
            break;
        case 'card-year':
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            isValid = value !== '' && year >= currentYear && year <= currentYear + 20;
            break;
        case 'card-cvv':
            isValid = /^\d{3,4}$/.test(value);
            break;
        case 'billing-firstname':
        case 'billing-lastname':
        case 'billing-city':
            isValid = value.length >= 2;
            break;
        case 'billing-address':
            isValid = value.length >= 5;
            break;
        case 'billing-zip':
            isValid = /^\d{5,10}$/.test(value);
            break;
        case 'billing-state':
        case 'billing-country':
            isValid = value !== '';
            break;
        case 'contact-phone':
            isValid = /^[\d\s\-\+\(\)]{10,}$/.test(value.replace(/\s/g, ''));
            break;
        case 'contact-email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            break;
        case 'momo-phone':
            const momoPhone = value.replace(/\D/g, '');
            isValid = /^(0[3|5|7|8|9])+([0-9]{8})$/.test(momoPhone) && momoPhone.length === 10;
            break;
        case 'vnpay-bank':
            isValid = value !== '';
            break;
        default:
            isValid = value.length > 0;
    }

    updateValidationIcon(fieldId, isValid);
    return isValid;
}

/**
 * Update validation icon
 * @param {string} fieldId - Field ID
 * @param {boolean} isValid - Whether field is valid
 */
function updateValidationIcon(fieldId, isValid) {
    const icon = document.getElementById(`${fieldId}-icon`);
    const field = document.getElementById(fieldId);

    if (icon && field) {
        if (field.value.trim() === '') {
            icon.textContent = '';
            icon.className = 'validation-icon';
            field.classList.remove('valid', 'invalid');
        } else if (isValid) {
            icon.textContent = '✓';
            icon.className = 'validation-icon valid';
            field.classList.add('valid');
            field.classList.remove('invalid');
        } else {
            icon.textContent = '✗';
            icon.className = 'validation-icon invalid';
            field.classList.add('invalid');
            field.classList.remove('valid');
        }
    }
}

/**
 * Validate all required fields
 * @returns {boolean} True if all fields are valid
 */
function validateAllFields() {
    let requiredFields = [
        'card-name', 'card-number', 'card-month', 'card-year', 'card-cvv',
        'contact-email', 'contact-phone'
    ];

    if (useBillingAddress) {
        requiredFields.push(
            'billing-firstname', 'billing-lastname', 'billing-address',
            'billing-zip', 'billing-city', 'billing-state', 'billing-country'
        );
    }

    // Adjust required fields based on payment method
    if (selectedPaymentMethod === 'momo') {
        // Remove card fields, add MoMo fields
        requiredFields = requiredFields.filter(f => !f.startsWith('card-'));
        requiredFields.push('momo-phone');
    } else if (selectedPaymentMethod === 'vnpay') {
        // Remove card fields, add VNPay fields
        requiredFields = requiredFields.filter(f => !f.startsWith('card-'));
        requiredFields.push('vnpay-bank');
    } else if (selectedPaymentMethod === 'paypal') {
        // Remove card fields for PayPal (no additional fields needed)
        requiredFields = requiredFields.filter(f => !f.startsWith('card-'));
    } else if (selectedPaymentMethod === 'cod') {
        // COD: remove card-specific fields
        requiredFields = requiredFields.filter(f => !f.startsWith('card-'));
    } else if (selectedPaymentMethod !== 'card') {
        // Remove card fields for other methods
        requiredFields = requiredFields.filter(f => !f.startsWith('card-'));
    }

    let allValid = true;
    requiredFields.forEach(fieldId => {
        if (!validateField(fieldId)) {
            allValid = false;
        }
    });

    return allValid;
}

/**
 * Render order summary
 */
function renderOrderSummary() {
    const summaryContainer = document.getElementById('order-summary');
    if (!summaryContainer) return;

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<p>No items in cart</p>';
        return;
    }

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const shipping = 9.95; // Default shipping
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    const itemsHTML = cart.map(item => `
        <div class="summary-item">
            <span class="summary-item-name">${item.productName} x${item.quantity}</span>
            <span class="summary-item-value">$${(item.finalPrice * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    summaryContainer.innerHTML = `
        <h2>Order Summary</h2>
        ${itemsHTML}
        <div class="summary-item">
            <span class="summary-item-name">Subtotal</span>
            <span class="summary-item-value">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-item-name">Shipping</span>
            <span class="summary-item-value">$${shipping.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-item-name">Tax</span>
            <span class="summary-item-value">$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-item summary-total">
            <span>Total</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
}

/**
 * Handle continue to review order
 */
window.handleContinueToReview = function () {
    if (!validateAllFields()) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    // Collect form data
    const formData = {
        paymentMethod: selectedPaymentMethod,
        card: selectedPaymentMethod === 'card' ? {
            name: document.getElementById('card-name').value,
            number: document.getElementById('card-number').value.replace(/\s/g, ''),
            month: document.getElementById('card-month').value,
            year: document.getElementById('card-year').value,
            cvv: document.getElementById('card-cvv').value
        } : null,
        paypal: selectedPaymentMethod === 'paypal' ? {
            method: 'paypal'
        } : null,
        momo: selectedPaymentMethod === 'momo' ? {
            phone: document.getElementById('momo-phone').value.replace(/\D/g, '')
        } : null,
        vnpay: selectedPaymentMethod === 'vnpay' ? {
            bank: document.getElementById('vnpay-bank').value
        } : null,
        cod: selectedPaymentMethod === 'cod' ? {
            method: 'cod',
            note: 'Cash on Delivery'
        } : null,
        billing: {
            enabled: useBillingAddress,
            firstName: useBillingAddress ? document.getElementById('billing-firstname').value : '',
            lastName: useBillingAddress ? document.getElementById('billing-lastname').value : '',
            company: useBillingAddress ? document.getElementById('billing-company').value : '',
            address: useBillingAddress ? document.getElementById('billing-address').value : '',
            apt: useBillingAddress ? document.getElementById('billing-apt').value : '',
            zip: useBillingAddress ? document.getElementById('billing-zip').value : '',
            city: useBillingAddress ? document.getElementById('billing-city').value : '',
            state: useBillingAddress ? document.getElementById('billing-state').value : '',
            country: useBillingAddress ? document.getElementById('billing-country').value : ''
        },
        contact: {
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            smsUpdates: document.getElementById('sms-updates').checked,
            smsOffers: document.getElementById('sms-offers').checked,
            emailOffers: document.getElementById('email-offers').checked
        }
    };

    // Save to localStorage
    try {
        localStorage.setItem('checkoutData', JSON.stringify(formData));
        console.log('Checkout data saved:', formData);

        // Redirect to review page
        window.location.href = 'review.html';
    } catch (error) {
        console.error('Error saving checkout data:', error);
        alert('Error processing order. Please try again.');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

/**
 * Setup billing toggle
 */
function setupBillingToggle() {
    const billingToggle = document.getElementById('billing-toggle');
    const billingFields = document.getElementById('billing-fields');
    if (!billingToggle || !billingFields) return;

    // Prefill detection
    const hasPrefill = ['billing-firstname', 'billing-lastname', 'billing-address', 'billing-zip', 'billing-city', 'billing-state', 'billing-country']
        .some(id => (document.getElementById(id)?.value || '').trim() !== '');

    billingToggle.checked = hasPrefill;
    useBillingAddress = billingToggle.checked;
    billingFields.style.display = useBillingAddress ? 'block' : 'none';

    billingToggle.addEventListener('change', (e) => {
        useBillingAddress = e.target.checked;
        billingFields.style.display = useBillingAddress ? 'block' : 'none';
    });
}

