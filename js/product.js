/**
 * @fileoverview Product detail page logic with gift options and dynamic pricing
 * @module product
 */

import { GIFT_OPTIONS, generateCartItemId } from './models.js';

// Product data (default values, overridden by DOM selections)
const PRODUCT = {
    id: 'cupcake-box-001',
    name: 'Heritage Assortment Box (4 pieces)',
    basePrice: 38.00,
    image: 'sea.png',
    description: 'A beautiful box of premium handmade cupcakes, perfect for gifting on special occasions.'
};


// Assortment options with world-famous cakes (name + country) and images
const ASSORTMENTS = [
    {
        id: 'cake1',
        name: 'Mooncake - VietNam',
        extraPrice: 4.50,
        image: 'cake1.png',
        madeIn: 'Viet Nam',
        description: 'Traditional baked mooncake with lotus seed and a touch of salted egg for a rich, aromatic finish.',
        allergyInfo: 'May contain eggs, nuts, wheat.'
    },
    {
        id: 'cake2',
        name: 'Mooncake - China',
        extraPrice: 5.00,
        image: 'cake2.png',
        madeIn: 'China',
        description: 'Golden crust mooncake with red bean and citrus peel, inspired by Mid-Autumn classics.',
        allergyInfo: 'May contain nuts, sesame, wheat.'
    },
    {
        id: 'cake3',
        name: 'Mooncake - Japan',
        extraPrice: 5.50,
        image: 'cake3.png',
        madeIn: 'Japan',
        description: 'Light mochi-style mooncake layered with matcha custard and white chocolate pearls.',
        allergyInfo: 'May contain milk, soy, wheat.'
    },
    {
        id: 'cake4',
        name: 'Mooncake - Korea',
        extraPrice: 5.00,
        image: 'cake4.png',
        madeIn: 'Korea',
        description: 'Soft rice cake crust filled with roasted chestnut and jujube for a gentle sweetness.',
        allergyInfo: 'May contain nuts, soy, wheat.'
    },
    {
        id: 'cake5',
        name: 'Mooncake - Thailand',
        extraPrice: 4.50,
        image: 'cake5.png',
        madeIn: 'Thailand',
        description: 'Pandan-scented mooncake with coconut custard, bright and fragrant in every bite.',
        allergyInfo: 'May contain coconut, milk, eggs.'
    },
    {
        id: 'tiramisu',
        name: 'Tiramisu - Italy',
        extraPrice: 6.50,
        image: 'tiramisu.png',
        madeIn: 'Italy',
        description: 'Velvety mascarpone cream layered with espresso-soaked sponge and a dusting of cocoa.',
        allergyInfo: 'Contains dairy, eggs, wheat.'
    },
    {
        id: 'macaron',
        name: 'Macaron - France',
        extraPrice: 5.50,
        image: 'macaron.png',
        madeIn: 'France',
        description: 'Crisp almond shells with a silky ganache center, inspired by Parisian patisseries.',
        allergyInfo: 'Contains almond nuts, eggs.'
    },
    {
        id: 'black forest cherry cake',
        name: 'Black Forest Cherry Cake - Germany',
        extraPrice: 6.00,
        image: 'forest.png',
        madeIn: 'Germany',
        description: 'Layers of chocolate sponge, kirsch cherries, and whipped cream for a deep cocoa finish.',
        allergyInfo: 'Contains dairy, eggs, wheat.'
    },
    {
        id: 'pavlova',
        name: 'Pavlova - Australia/NZ',
        extraPrice: 5.50,
        image: 'pavlova.png',
        madeIn: 'Australia & New Zealand',
        description: 'Crisp meringue with a marshmallow center, topped with bright seasonal berries.',
        allergyInfo: 'Contains eggs.'
    },
    {
        id: 'pastel-de-nata',
        name: 'Pastel de Nata - Portugal',
        extraPrice: 4.00,
        image: 'tart.png',
        madeIn: 'Portugal',
        description: 'Flaky pastry tart with slow-cooked custard and a caramelized top, Lisbon style.',
        allergyInfo: 'Contains dairy, eggs, wheat.'
    },
    {
        id: 'pastel de tres leches',
        name: 'Pastel de Tres Leches - Mexico',
        extraPrice: 5.00,
        image: 'mexico.png',
        madeIn: 'Mexico',
        description: 'Milky-soft sponge soaked in three milks, crowned with vanilla cream and cinnamon.',
        allergyInfo: 'Contains dairy, eggs, wheat.'
    },
    {
        id: 'mille-feuille',
        name: 'Mille Feuille - France',
        extraPrice: 6.00,
        image: 'france.png',
        madeIn: 'France',
        description: 'Crisp puff pastry layers with vanilla bean pastry cream and powdered sugar.',
        allergyInfo: 'Contains dairy, eggs, wheat.'
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
function buildAssortmentTooltip(option, extraText) {
    const origin = option.madeIn || (option.name.includes('-') ? option.name.split('-')[1].trim() : '');
    const desc = option.description || `Sweet pick inspired by ${origin || 'global favorites'}.`;
    const allergy = option.allergyInfo || 'May contain milk, eggs, wheat, peanuts, tree nuts.';
    return `
        <div class="assortment-tooltip">
            ${option.image ? `<img class="tooltip-image" src="${option.image}" alt="${option.name}">` : ''}
            <div class="tooltip-title">${option.name}</div>
            <div class="tooltip-subtitle">${origin ? `Made in ${origin}` : 'Handcrafted with care'}</div>
            <div class="tooltip-text">${desc}</div>
            <div class="tooltip-heading">More Information</div>
            <div class="tooltip-text"><strong>Price:</strong> ${extraText}</div>
            <div class="tooltip-allergy"><strong>Allergy info:</strong> ${allergy}</div>
        </div>
    `;
}

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
                ${buildAssortmentTooltip(option, extraText)}
            </button>
        `;
    }).join('');

    container.querySelectorAll('.assortment-tile').forEach(btn => {
        btn.addEventListener('click', handleAssortmentAdd);

        // Dynamic tooltip positioning to avoid overflow
        const tooltip = btn.querySelector('.assortment-tooltip');
        if (tooltip) {
            btn.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block';
                tooltip.style.visibility = 'hidden';
                tooltip.style.left = '50%';
                tooltip.style.right = 'auto';
                tooltip.style.transform = 'translateX(-50%)';

                const rect = tooltip.getBoundingClientRect();
                const vw = window.innerWidth;
                const padding = 12;

                if (rect.right > vw - padding) {
                    tooltip.style.left = 'auto';
                    tooltip.style.right = '0';
                    tooltip.style.transform = 'none';
                } else if (rect.left < padding) {
                    tooltip.style.left = '0';
                    tooltip.style.right = 'auto';
                    tooltip.style.transform = 'none';
                }

                tooltip.style.visibility = 'visible';
            });

            btn.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
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
        const addonHtml = picked.length > 0
            ? picked.map(option => `
                <div class="price-breakdown-item">
                    <span>${option.name} x${option.quantity}:</span>
                    <span>+$${(option.price * option.quantity).toFixed(2)}</span>
                </div>
            `).join('')
            : `
                <div class="price-breakdown-item muted">
                    <span>Gift add-ons:</span>
                    <span>$0.00</span>
                </div>
            `;

        addonsBreakdown.innerHTML = addonHtml;
    }

    // Assortment breakdown
    const assortmentBreakdown = document.getElementById('assortment-breakdown');
    if (assortmentBreakdown) {
        const lines = selectedAssortmentItems
            .filter(opt => opt.quantity > 0)
            .map(opt => `${opt.name} x${opt.quantity}: +$${(opt.extraPrice * opt.quantity).toFixed(2)}`);
        const detail = lines.length > 0 ? lines.join(' | ') : '$0.00';
        assortmentBreakdown.innerHTML = `
            <span>Assortment:</span>
            <span>${detail}</span>
        `;
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

    // Capture current display name and image (box selection on page)
    const productNameEl = document.getElementById('product-name');
    const productImageEl = document.getElementById('product-image');
    const selectedBoxEl = document.querySelector('.box-option.selected');
    const productNameText = productNameEl ? productNameEl.textContent.trim() : PRODUCT.name;
    const productImageSrc = productImageEl ? productImageEl.getAttribute('src') : PRODUCT.image;
    const boxThumbSrc = selectedBoxEl
        ? (selectedBoxEl.getAttribute('data-box-thumb') || selectedBoxEl.querySelector('img')?.getAttribute('src'))
        : '';

    // Create cart item object
    const cartItem = {
        id: generateCartItemId(),
        productId: PRODUCT.id,
        productName: productNameText || PRODUCT.name,
        productImage: productImageSrc || PRODUCT.image,
        boxThumb: boxThumbSrc || productImageSrc || PRODUCT.image,
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

        // Immediately refresh cart badge on header (product page)
        if (window.updateCartBadge && typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }

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

