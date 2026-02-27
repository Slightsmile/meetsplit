const CURRENCY_SYMBOLS: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
};

/**
 * Format a number as currency using the symbol (e.g. ৳232 instead of BDT 232.00).
 * Falls back to Intl.NumberFormat if the currency code is unknown.
 */
export function formatCurrency(amount: number, currency: string): string {
    const symbol = CURRENCY_SYMBOLS[currency];
    if (symbol) {
        // Round to 2 decimal places, drop trailing .00
        const rounded = Math.round(amount * 100) / 100;
        const formatted = rounded % 1 === 0
            ? rounded.toLocaleString("en-US", { maximumFractionDigits: 0 })
            : rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `${symbol}${formatted}`;
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
