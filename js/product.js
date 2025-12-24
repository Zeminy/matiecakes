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
 * Fetch inventory status from backend and update UI
 */
async function fetchInventoryStatus() {
    // 1. Get Assortment Names
    const productNames = ASSORTMENTS.map(item => item.name);

    // 2. Get Box Names (scrape from DOM)
    const boxElements = document.querySelectorAll('.box-option');
    const boxNames = Array.from(boxElements).map(el => {
        const nameEl = el.querySelector('.box-option-name');
        return nameEl ? nameEl.textContent.trim() : '';
    }).filter(name => name);

    // Combine lists
    const allNames = [...productNames, ...boxNames];

    try {
        const response = await fetch('http://127.0.0.1:8000/api/inventory/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_names: allNames })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const inventory = await response.json();

        // --- Update Assortments ---
        ASSORTMENTS.forEach(item => {
            if (inventory.hasOwnProperty(item.name)) {
                item.stock = inventory[item.name];
            } else {
                item.stock = 0; // Default to 0 if not returned
            }
        });
        renderAssortments(); // Re-render assortments

        // --- Update Boxes ---
        boxElements.forEach(el => {
            const nameEl = el.querySelector('.box-option-name');
            const name = nameEl ? nameEl.textContent.trim() : '';
            const stock = inventory.hasOwnProperty(name) ? inventory[name] : 0;

            // Add or update stock label
            let stockLabel = el.querySelector('.stock-label');
            if (!stockLabel) {
                stockLabel = document.createElement('div');
                stockLabel.className = 'stock-label';
                stockLabel.style.fontSize = '0.85rem';
                stockLabel.style.marginTop = '4px';
                stockLabel.style.fontWeight = 'bold';
                el.appendChild(stockLabel);
            }
            stockLabel.textContent = stock > 0 ? `${stock} left` : 'Sold Out';
            stockLabel.style.color = stock > 0 ? '#1a1157' : 'red';

            // Check if sold out
            if (stock <= 0) {
                el.classList.add('disabled', 'sold-out');
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
                el.style.filter = 'grayscale(100%)';

                // Optional: Add "Sold Out" text
                if (!el.querySelector('.sold-out-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'sold-out-badge';
                    badge.textContent = 'SOLD OUT';
                    badge.style.position = 'absolute';
                    badge.style.top = '10px';
                    badge.style.left = '50%';
                    badge.style.transform = 'translateX(-50%)';
                    badge.style.background = 'red';
                    badge.style.color = 'white';
                    badge.style.padding = '4px 8px';
                    badge.style.borderRadius = '4px';
                    badge.style.fontWeight = 'bold';
                    badge.style.zIndex = '20';
                    el.appendChild(badge);
                }
            } else {
                // Determine if we need to reset stats if re-fetching
                el.classList.remove('disabled', 'sold-out');
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                el.style.filter = 'none';
                const badge = el.querySelector('.sold-out-badge');
                if (badge) badge.remove();
            }
        });

    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }
}

/**
 * Initialize the product page
 */
function init() {
    renderAssortments();
    renderGiftOptions();
    setBoxBackgroundFromProduct();
    updatePrice();
    attachEventListeners();
    fetchInventoryStatus(); // Check stock on load
}

/**
 * Render assortment selection tiles
 */
function buildAssortmentTooltip(option, extraText) {
    const origin = option.madeIn || (option.name.includes('-') ? option.name.split('-')[1].trim() : '');
    const desc = option.description || `Sweet pick inspired by ${origin || 'global favorites'}.`;
    const allergy = option.allergyInfo || 'May contain milk, eggs, wheat, peanuts, tree nuts.';
    const isSoldOut = (option.stock !== undefined && option.stock <= 0);

    return `
        <div class="assortment-tooltip">
            ${option.image ? `<img class="tooltip-image" src="${option.image}" alt="${option.name}">` : ''}
            <div class="tooltip-title">${option.name} ${isSoldOut ? '<span style="color:red">(SOLD OUT)</span>' : ''}</div>
            <div class="tooltip-subtitle">${origin ? `Made in ${origin}` : 'Handcrafted with care'}</div>
            <div class="tooltip-text">${desc}</div>
            <div class="tooltip-heading">More Information</div>
            <div class="tooltip-text"><strong>Price:</strong> ${extraText}</div>
             <div class="tooltip-text"><strong>Stock:</strong> ${option.stock !== undefined ? option.stock : 'Checking...'}</div>
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

        // Disable if stock is 0 (and not already selected to allow removing)
        const isSoldOut = (option.stock !== undefined && option.stock <= 0);
        const isDisabled = isSoldOut && qty === 0;

        return `
            <button 
                class="assortment-tile ${qty > 0 ? 'active' : ''}"
                data-assortment-id="${option.id}"
                ${isDisabled ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            >
                <img class="assortment-thumb" src="${option.image || ''}" alt="${option.name}">
                <div class="assortment-name">${option.name} 
                    ${isSoldOut ? '<span style="color:red; font-size:0.8em">(Sold Out)</span>' :
                option.stock !== undefined ? `<span style="color:#666; font-size:0.8em">(${option.stock} left)</span>` : ''}
                </div>
                <span class="assortment-extra">${extraText}${qty > 0 ? ` · x${qty}` : ''}</span>
                ${buildAssortmentTooltip(option, extraText)}
            </button>
        `;
    }).join('');

    container.querySelectorAll('.assortment-tile').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', handleAssortmentAdd);
        }

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
        itemNumber: `ITIUK2122${Math.floor(Math.random() * 1000)}`,
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

        // --- NEW: Deduct Inventory Logic ---
        // 1. Deduct Box (Quantity 1 per cart addition usually, or cartItem.quantity if that existed)
        // Wait, the logic above sets quantity: 1. So we deduct 1 box.
        const boxNameEl = document.querySelector('.box-option.selected .box-option-name');
        if (boxNameEl) {
            const boxName = boxNameEl.textContent.trim();
            // Call API to deduct 1 box
            fetch('http://127.0.0.1:8000/admin/warehouse/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: boxName, quantity_change: -1 })
            }).catch(e => console.error('Failed to deduct box stock', e));
        }

        // 2. Deduct Assortment Items
        pickedAssortments.forEach(item => {
            fetch('http://127.0.0.1:8000/admin/warehouse/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: item.name, quantity_change: -item.quantity })
            }).catch(e => console.error('Failed to deduct assortment stock', e));
        });

        // 3. Refresh Inventory Display after short delay to allow DB to update
        setTimeout(() => {
            fetchInventoryStatus();
        }, 500);
        // -----------------------------------

        // Immediately refresh cart badge on header (product page)
        if (window.updateCartBadge && typeof window.updateCartBadge === 'function') {
            window.updateCartBadge();
        }

        // Show success message
        alert(`Added to cart! Inventory updated. Total: $${finalPrice.toFixed(2)}`);

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

