/**
 * @fileoverview Data models and mock data for the Bakery E-commerce application
 * @module models
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - Unique identifier for the cart item
 * @property {string} productId - Identifier of the product
 * @property {string} productName - Name of the product
 * @property {string} productImage - Image URL of the product
 * @property {string} itemNumber - Item number/SKU
 * @property {number} basePrice - Base price of the product (before addons)
 * @property {number} quantity - Quantity of the item (default: 1)
 * @property {Array<Object>} selectedOptions - Array of selected gift addons
 * @property {number} finalPrice - Calculated final price (basePrice + sum of addon prices) per unit
 * @property {string|null} shippingAddressId - ID of the shipping address (nullable)
 * @property {Object} shippingAddress - Full shipping address object (editable)
 * @property {string} recipientRelationship - Relationship to recipient (e.g., "Dad", "Mom", "Friend")
 * @property {string} recipientOccasion - Occasion (e.g., "Birthday - February/16, 2025")
 * @property {string} giftMessage - Personal gift message (optional)
 * @property {string} giftMessageType - Type of gift message ("printed" or "complimentary")
 * @property {string|null} deliveryDate - Scheduled delivery date (YYYY-MM-DD format)
 * @property {string|null} pickDateSelected - Date selected by user in pick-date method (preserved when switching methods)
 * @property {string} shippingMethod - Shipping method selected
 */

/**
 * @typedef {Object} Address
 * @property {string} id - Unique identifier for the address
 * @property {string} name - Display name of the address
 * @property {string} fullAddress - Full address string
 */

/**
 * @typedef {Object} GiftOption
 * @property {string} id - Unique identifier for the gift option
 * @property {string} name - Display name of the gift option
 * @property {number} price - Price of the gift option
 */

/**
 * Mock shipping addresses for testing multi-recipient functionality
 * @type {Array<Address>}
 */
export const MOCK_ADDRESSES = [
    {
        id: 'address-1',
        name: 'My Home',
        fullAddress: '123 Main Street, District 1, Ho Chi Minh City'
    },
    {
        id: 'address-2',
        name: "Mom's House",
        fullAddress: '456 Oak Avenue, District 3, Ho Chi Minh City'
    },
    {
        id: 'address-3',
        name: "Boss's Office",
        fullAddress: '789 Business Tower, District 7, Ho Chi Minh City'
    }
];

/**
 * Available gift addon options for products
 * @type {Array<GiftOption>}
 */
export const GIFT_OPTIONS = [
    {
        id: 'happy-birthday-card',
        name: 'Happy Birthday Card',
        price: 6.00,
        image: 'https://www.bakedbymelissa.com/cdn/shop/files/swatch-bdaycard.webp?v=1739561270&width=320'
    },
    {
        id: 'birthday-candles',
        name: 'Birthday Candles',
        price: 6.00,
        image: 'https://www.bakedbymelissa.com/cdn/shop/files/swatch-candles_fe593c35-f543-4bfa-9d3b-8c3b2aee2604.jpg?v=1744659579&width=320'
    },
    {
        id: 'merry-christmas-card',
        name: 'Merry Christmas Card',
        price: 6.00,
        image: 'https://www.bakedbymelissa.com/cdn/shop/files/dec23-swatches-holiday-card-christmas.jpg?v=1741825540&width=320'
    },
    {
        id: 'happy-holidays-card',
        name: 'Happy Holidays Card',
        price: 6.00,
        image: 'https://www.bakedbymelissa.com/cdn/shop/files/dec23-swatches-holiday-card-holiday.jpg?v=1741825539&width=320'
    },
    {
        id: 'mid-autumn-card',
        name: 'Happy Mid-Autumn Card',
        price: 6.00,
        image: 'https://c7.alamy.com/comp/PHEEH3/happy-mid-autumn-festival-mid-autumn-vector-banner-background-and-poster-PHEEH3.jpg'
    }
];

/**
 * Shipping methods with pricing
 * @type {Array<Object>}
 */
export const SHIPPING_METHODS = [
    {
        id: 'pick-date',
        name: 'Pick a Date - Schedule Delivery',
        price: 15.95,
        description: 'Schedule your delivery for a specific date'
    },
    {
        id: 'standard',
        name: 'Standard Shipping',
        price: 15.95,
        description: '5-7 business days'
    },
    {
        id: 'express',
        name: 'Express Shipping',
        price: 29.95,
        description: '2-3 business days'
    }
];

/**
 * Calculate delivery date based on shipping method
 * Uses current device date/time
 * @param {string} shippingMethodId - Shipping method ID
 * @param {Date} selectedDate - Selected delivery date (for pick-date method)
 * @returns {Date} Estimated delivery date
 */
export function calculateDeliveryDate(shippingMethodId, selectedDate = null) {
    // Get current date/time from device
    const today = new Date();
    // Create a new date object starting from today to avoid timezone issues
    const deliveryDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (shippingMethodId === 'pick-date' && selectedDate) {
        return new Date(selectedDate);
    } else if (shippingMethodId === 'express') {
        // Express: +2 days (e.g., 12/12/2025 → 14/12/2025)
        deliveryDate.setDate(deliveryDate.getDate() + 2);
    } else if (shippingMethodId === 'standard') {
        // Standard: +3 days (e.g., 12/12/2025 → 15/12/2025)
        deliveryDate.setDate(deliveryDate.getDate() + 3);
    } else {
        // Default: +3 days for standard
        deliveryDate.setDate(deliveryDate.getDate() + 3);
    }

    return deliveryDate;
}

/**
 * Get minimum selectable date (today + processing time)
 * @returns {Date} Minimum date
 */
export function getMinDeliveryDate() {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 2); // At least 2 days for processing
    return minDate;
}

/**
 * Format date to "Day, Mon DD" format (e.g., "Thu, Dec 11")
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export function formatDeliveryDate(date) {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    const day = dateObj.getDate();

    return `${dayName}, ${monthName} ${day}`;
}

/**
 * Generate a unique ID for cart items
 * @returns {string} A unique identifier
 */
export function generateCartItemId() {
    return `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate the final price of a cart item
 * @param {number} basePrice - Base price of the product
 * @param {Array<GiftOption>} selectedOptions - Selected gift addons
 * @returns {number} Final calculated price
 */
export function calculateFinalPrice(basePrice, selectedOptions) {
    const addonTotal = selectedOptions.reduce((sum, option) => sum + option.price, 0);
    return basePrice + addonTotal;
}

