// Formats a base amount plus a tax percentage into a display-ready ₹ string
export const formatPrice = function (amount, tax) {
    const taxPercent = Number(tax) || 0;
    amount = Number(amount) || 0;
    const taxAmount = Math.round(amount * (taxPercent / 100));
    const numericAmount = (amount + taxAmount) / 100;
    return "₹" + numericAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Computes a tax-inclusive line total for price * quantity, given a tax percentage
export const calculateLineTotal = function (price, quantity, taxApplicable) {
    const base = Number(price) * Number(quantity);
    const taxPercent = Number(taxApplicable) || 0;
    const taxAmount = Math.round(base * (taxPercent / 100));
    return base + taxAmount;
};
