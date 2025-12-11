/**
 * @fileoverview Product detail page logic with gift options and dynamic pricing
 * @module product
 */

import { GIFT_OPTIONS, generateCartItemId } from './models.js';

// Product data
const PRODUCT = {
    id: 'cupcake-box-001',
    name: 'Mooncake Gift Box (6 pieces)',
    basePrice: 38.00,
    image: 'Image/Tinh hoa đoàn viên 1.jpg',
    description: 'A beautiful box of premium handmade cupcakes, perfect for gifting on special occasions.'
};

// Assortment options with world-famous cakes (name + country) and images
const ASSORTMENTS = [
    {
        id: 'tiramisu-italy',
        name: 'Tiramisu · Italy',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1626200412624-7ec771f4b01e?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'macaron-france',
        name: 'Macaron · France',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'cheesecake-usa',
        name: 'NY Cheesecake · USA',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1542826438-7a0deeaf3352?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'black-forest-germany',
        name: 'Black Forest · Germany',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1611077543837-b1c7c8771e2f?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'pavlova-australia',
        name: 'Pavlova · Australia/NZ',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'pastel-nata-portugal',
        name: 'Pastel de Nata · Portugal',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'mille-crepe-japan',
        name: 'Mille Crêpe · Japan',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d741ae7c9?auto=format&fit=crop&w=520&h=520&q=80'
    },
    {
        id: 'tres-leches-mexico',
        name: 'Tres Leches · Mexico',
        extraPrice: 0,
        image: 'https://images.unsplash.com/photo-1603899122634-2fef2f8dd9b4?auto=format&fit=crop&w=520&h=520&q=80'
    }
];

// State
let selectedGiftOptions = [];
let selectedAssortmentItems = []; // {id,name,extraPrice,image,quantity}

/**
 * Initialize the product page
 */
function init() {
    renderAssortments();
    renderGiftOptions();
    setBoxBackgroundFromProduct();
    updatePrice();
    attachEventListeners();
}

/**
 * Render assortment selection tiles
 */
function renderAssortments() {
    const container = document.getElementById('assortment-options');
    if (!container) return;

    container.innerHTML = ASSORTMENTS.map(option => {
        const existing = selectedAssortmentItems.find(item => item.id === option.id);
        const qty = existing ? existing.quantity : 0;
        const extraText = option.extraPrice > 0 ? `+$${option.extraPrice.toFixed(2)}` : '$0.00';
        return `
            <button 
                class="assortment-tile ${qty > 0 ? 'active' : ''}"
                data-assortment-id="${option.id}"
            >
                <img class="assortment-thumb" src="${option.image || ''}" alt="${option.name}">
                <div class="assortment-name">${option.name}</div>
                <span class="assortment-extra">${extraText}${qty > 0 ? ` · x${qty}` : ''}</span>
            </button>
        `;
    }).join('');

    container.querySelectorAll('.assortment-tile').forEach(btn => {
        btn.addEventListener('click', handleAssortmentAdd);
    });
}

function handleAssortmentAdd(event) {
    const id = event.currentTarget.dataset.assortmentId;
    const found = ASSORTMENTS.find(opt => opt.id === id);
    if (!found) return;

    const totalSelected = selectedAssortmentItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalSelected >= 4) {
        alert('Bạn chỉ có thể chọn tối đa 4 ô trong hộp.');
        return;
    }

    const existing = selectedAssortmentItems.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        selectedAssortmentItems.push({ ...found, quantity: 1 });
    }

    renderAssortments();
    updatePrice();
}

/**
 * Render gift options cards with quantity controls
 */
function renderGiftOptions() {
    const container = document.getElementById('gift-options-container');
    if (!container) return;

    // Render all available gift options with checkbox and quantity input
    container.innerHTML = GIFT_OPTIONS.map(option => {
        const selectedOption = selectedGiftOptions.find(opt => opt.id === option.id);
        const quantity = selectedOption ? selectedOption.quantity : 0;
        const isSelected = quantity > 0;

        return `
        <div class="gift-card ${isSelected ? 'selected' : ''}">
            ${option.image ? `<img src="${option.image}" alt="${option.name}" class="gift-card-image">` : ''}
            <div class="gift-card-body">
                <div class="gift-card-title">${option.name}</div>
                <div class="gift-card-price">$${option.price.toFixed(2)}</div>
            </div>
            <div class="gift-card-qty">
                <label for="gift-qty-${option.id}">Qty</label>
                <input 
                    type="number" 
                    id="gift-qty-${option.id}" 
                    data-option-id="${option.id}"
                    min="0" 
                    value="${quantity}"
                />
            </div>
        </div>
        `;
    }).join('');

    // Re-attach event listeners after render
    attachEventListeners();
}

/**
 * Attach event listeners to gift option quantity inputs
 */
function attachEventListeners() {
    // Listen to all gift option qty inputs
    document.querySelectorAll('#gift-options-container input[type="number"]').forEach(input => {
        input.addEventListener('input', handleGiftQuantityChange);
        input.addEventListener('change', handleGiftQuantityChange);
    });

    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
}

/**
 * Handle gift option quantity change
 * @param {Event} event - The change event
 */
function handleGiftQuantityChange(event) {
    const input = event.target;
    const optionId = input.dataset.optionId;
    const qty = Math.max(0, parseInt(input.value, 10) || 0);

    // Find the full option data from GIFT_OPTIONS
    const fullOption = GIFT_OPTIONS.find(opt => opt.id === optionId);
    if (!fullOption) return;

    if (qty > 0) {
        // Add or update option in selectedGiftOptions
        const existingIndex = selectedGiftOptions.findIndex(opt => opt.id === optionId);
        if (existingIndex >= 0) {
            // Update existing
            selectedGiftOptions[existingIndex] = { ...fullOption, quantity: qty };
        } else {
            // Add new
            selectedGiftOptions.push({ ...fullOption, quantity: qty });
        }
    } else {
        // Remove if quantity is 0
        selectedGiftOptions = selectedGiftOptions.filter(opt => opt.id !== optionId);
    }

    updatePrice();
    renderGiftOptions(); // Re-render to update selected state
}

/**
 * Update the displayed price based on base price and selected options
 */
function updatePrice() {
    const basePrice = PRODUCT.basePrice;
    const assortmentExtra = selectedAssortmentItems.reduce((sum, opt) => sum + (opt.extraPrice * (opt.quantity || 0)), 0);
    const addonsTotal = selectedGiftOptions.reduce((sum, opt) => sum + (opt.price * (opt.quantity || 0)), 0);
    const finalPrice = basePrice + assortmentExtra + addonsTotal;

    // Update base price display
    const basePriceDisplay = document.getElementById('base-price-display');
    if (basePriceDisplay) {
        basePriceDisplay.textContent = `$${basePrice.toFixed(2)}`;
    }

    // Update addons breakdown
    const addonsBreakdown = document.getElementById('addons-breakdown');
    if (addonsBreakdown) {
        const picked = selectedGiftOptions.filter(opt => opt.quantity > 0);
        const addonHtml = picked.length > 0 ? picked.map(option => `
            <div class="price-breakdown-item">
                <span>${option.name} x${option.quantity}:</span>
                <span>+$${(option.price * option.quantity).toFixed(2)}</span>
            </div>
        `).join('') : '';

        addonsBreakdown.innerHTML = addonHtml || '';
    }

    // Assortment breakdown
    const assortmentBreakdown = document.getElementById('assortment-breakdown');
    if (assortmentBreakdown) {
        const lines = selectedAssortmentItems
            .filter(opt => opt.quantity > 0)
            .map(opt => `${opt.name} x${opt.quantity}: +$${(opt.extraPrice * opt.quantity).toFixed(2)}`);
        const text = lines.length > 0 ? lines.join(' | ') : 'Assortment: $0.00';
        assortmentBreakdown.textContent = text;
    }

    // Update total price display
    const totalPriceDisplay = document.getElementById('total-price-display');
    if (totalPriceDisplay) {
        totalPriceDisplay.textContent = `$${finalPrice.toFixed(2)}`;
    }

    // Update main price display
    const displayPrice = document.getElementById('display-price');
    if (displayPrice) {
        displayPrice.textContent = `$${finalPrice.toFixed(2)}`;
    }

    renderBoxPreview();
    renderSelectedList();
}

/**
 * Handle add to cart button click
 */
function handleAddToCart() {
    const assortmentExtra = selectedAssortmentItems.reduce((sum, opt) => sum + (opt.extraPrice * (opt.quantity || 0)), 0);
    const addonsTotal = selectedGiftOptions.reduce((sum, opt) => sum + (opt.price * (opt.quantity || 0)), 0);
    const finalPrice = PRODUCT.basePrice + assortmentExtra + addonsTotal;
    const pickedOptions = selectedGiftOptions.filter(opt => opt.quantity > 0);
    const pickedAssortments = selectedAssortmentItems.filter(opt => opt.quantity > 0);

    // Create cart item object
    const cartItem = {
        id: generateCartItemId(),
        productId: PRODUCT.id,
        productName: PRODUCT.name,
        productImage: PRODUCT.image,
        itemNumber: `20269${Math.floor(Math.random() * 1000)}`,
        basePrice: PRODUCT.basePrice,
        quantity: 1,
        selectedOptions: pickedOptions.map(opt => ({ id: opt.id, name: opt.name, price: opt.price, quantity: opt.quantity })),
        assortment: pickedAssortments,
        finalPrice: finalPrice, // CRUCIAL: Use calculated final price per unit
        shippingAddressId: null, // Will be set in cart page
        shippingAddress: {
            name: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            phone: ''
        },
        recipientRelationship: '',
        recipientOccasion: '',
        giftMessage: '', // Will be set in cart page
        giftMessageType: 'complimentary',
        shippingMethod: 'standard',
        deliveryDate: null
    };

    // Get existing cart from localStorage
    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (error) {
        console.error('Error reading cart from localStorage:', error);
        cart = [];
    }

    // Add new item to cart
    cart.push(cartItem);

    // Save to localStorage
    try {
        localStorage.setItem('cart', JSON.stringify(cart));

        // Show success message
        alert(`Added to cart! Total: $${finalPrice.toFixed(2)}`);

        // Optionally redirect to cart page
        // window.location.href = 'cart.html';
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('Error adding item to cart. Please try again.');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

/**
 * Use main product image as box background
 */
function setBoxBackgroundFromProduct() {
    const productImg = document.getElementById('product-image');
    const box = document.getElementById('box-preview');
    if (productImg && box) {
        // We overlay directly on the main image; keep background transparent
        box.style.backgroundImage = 'none';
    }
}

/**
 * Render selected assortment items into 4 slots
 */
function renderBoxPreview() {
    const container = document.getElementById('box-slots');
    const overflowBadge = document.getElementById('box-overflow');
    if (!container) return;

    const expanded = [];
    selectedAssortmentItems.forEach(opt => {
        const qty = opt.quantity || 0;
        for (let i = 0; i < qty; i++) expanded.push(opt);
    });

    const maxSlots = 4;
    const shown = expanded.slice(0, maxSlots);
    const overflow = Math.max(0, expanded.length - maxSlots);

    container.innerHTML =
        shown.map((opt, idx) => `
            <div class="box-slot slot-${idx + 1} filled">
                ${opt.image ? `<img src="${opt.image}" alt="${opt.name}">` : `<span>${opt.name}</span>`}
            </div>
        `).join('') +
        Array.from({ length: maxSlots - shown.length }).map((_, idx) => `
            <div class="box-slot slot-${shown.length + idx + 1}">+</div>
        `).join('');

    if (overflowBadge) {
        overflowBadge.style.display = overflow > 0 ? 'block' : 'none';
        if (overflow > 0) overflowBadge.textContent = `+${overflow}`;
    }
}

/**
 * Render selected assortment list with remove buttons
 */
function renderSelectedList() {
    const list = document.getElementById('selected-list');
    if (!list) return;

    const picked = selectedAssortmentItems.filter(opt => opt.quantity > 0);
    if (picked.length === 0) {
        list.innerHTML = `<div class="selected-list-item" style="border-bottom:none;">No items selected</div>`;
        return;
    }

    list.innerHTML = picked.map(opt => `
        <div class="selected-list-item">
            <img class="selected-thumb" src="${opt.image || ''}" alt="${opt.name}">
            <div class="selected-name">${opt.name}</div>
            <div class="selected-qty">x${opt.quantity}</div>
            <button class="selected-remove" onclick="removeSelectedAssortment('${opt.id}')">×</button>
        </div>
    `).join('');
}

/**
 * Remove an assortment item
 */
window.removeSelectedAssortment = function (optionId) {
    selectedAssortmentItems = selectedAssortmentItems.filter(opt => opt.id !== optionId);
    renderAssortments();
    updatePrice();
};

