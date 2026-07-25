// Formats a base amount plus a tax percentage into a display-ready ₹ string
export const formatPrice = function (amount, tax) {
    const taxPercent = Number(tax) || 0;
    amount = Number(amount) || 0;
    const numericAmount = amount + (amount * (taxPercent / 100)) || 0;
    return "₹" + numericAmount.toLocaleString("en-IN");
};

// Computes a tax-inclusive line total for price * quantity, given a tax percentage
export const calculateLineTotal = function (price, quantity, taxApplicable) {
    const base = Number(price) * Number(quantity);
    const taxPercent = Number(taxApplicable) || 0;
    return base + (base * (taxPercent / 100));
};
