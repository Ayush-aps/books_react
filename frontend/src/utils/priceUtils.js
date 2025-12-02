/**
 * Price Rounding Utility
 * Rounds prices according to business rules:
 * - 145.3 -> 145
 * - 145.5 -> 146
 * - Basically: Math.round() for standard rounding
 */

/**
 * Round a price to the nearest integer
 * @param {number} price - The price to round
 * @returns {number} - The rounded price
 */
export const roundPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
        return 0;
    }
    return Math.round(price);
};

/**
 * Format a price with currency symbol and rounding
 * @param {number} price - The price to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency = '₹') => {
    const rounded = roundPrice(price);
    return `${currency}${rounded}`;
};

/**
 * Calculate total with tax and round the final amount
 * @param {number} subtotal - Subtotal before tax
 * @param {number} taxRate - Tax rate (e.g., 0.08 for 8%)
 * @returns {object} - Object with subtotal, tax, and total (all rounded)
 */
export const calculateTotalWithTax = (subtotal, taxRate = 0.08) => {
    const roundedSubtotal = roundPrice(subtotal);
    const tax = roundPrice(roundedSubtotal * taxRate);
    const total = roundedSubtotal + tax;

    return {
        subtotal: roundedSubtotal,
        tax: tax,
        total: total
    };
};

/**
 * Round an array of prices
 * @param {number[]} prices - Array of prices
 * @returns {number[]} - Array of rounded prices
 */
export const roundPrices = (prices) => {
    return prices.map(price => roundPrice(price));
};
