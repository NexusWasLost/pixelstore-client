import { formatPrice, calculateLineTotal } from "./utils.js";

const STORAGE_KEY = "cart-items";
let cartItems = loadCart();

// Reads the cart from localStorage on page load, returns [] if empty or corrupted
function loadCart() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        console.log("Cart parse error:", error);
        return [];
    }
}

// Persists the current cart to localStorage
function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
}

// Broadcasts a "cart-updated" event so other pages/scripts can react without a refresh
function notifyCartUpdated() {
    document.dispatchEvent(new CustomEvent("cart-updated"));
}

// Finds a cart item's index by product id, -1 if not found
function findCartIndex(itemId) {
    let i = 0;
    while (i < cartItems.length) {
        if (cartItems[i].id === itemId) return i;
        i += 1;
    }
    return -1;
}

// Adds a product to the cart, or increments its quantity if already present
export const addToCart = function (item) {
    const existingIndex = findCartIndex(item._id);

    if (existingIndex > -1) {
        cartItems[existingIndex].quantity = cartItems[existingIndex].quantity + 1;
    } else {
        cartItems.push({
            id: item._id,
            name: item.name,
            sku: item.SKU,
            price: Number(item.basePrice) || 0,
            taxApplicable: Number(item.taxApplicable) || 0,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    pulseCartButton();
    notifyCartUpdated();
};

// Increases or decreases a cart item's quantity, removing it if it drops to 0 or below
function changeQuantity(itemId, quantityChange) {
    const index = findCartIndex(itemId);
    if (index === -1) return;

    cartItems[index].quantity = cartItems[index].quantity + quantityChange;
    if (cartItems[index].quantity <= 0) cartItems.splice(index, 1);

    saveCart();
    renderCart();
    notifyCartUpdated();
}

// Removes a cart item entirely, regardless of quantity
function removeFromCart(itemId) {
    const index = findCartIndex(itemId);
    if (index === -1) return;

    cartItems.splice(index, 1);
    saveCart();
    renderCart();
    notifyCartUpdated();
}

// Empties the cart, used after a successful checkout
export const clearCart = function () {
    cartItems = [];
    saveCart();
    renderCart();
    notifyCartUpdated();
};

// Read-only access to the current cart array for other pages/scripts
export const getCartItems = function () {
    return cartItems;
};

// Computes total item count and tax-inclusive subtotal across the whole cart
export function getCartTotals() {
    let totalQuantity = 0;
    let subtotal = 0;
    let i = 0;

    while (i < cartItems.length) {
        totalQuantity = totalQuantity + cartItems[i].quantity;
        subtotal = subtotal + calculateLineTotal(cartItems[i].price, cartItems[i].quantity, cartItems[i].taxApplicable);
        i = i + 1;
    }

    return { totalQuantity: totalQuantity, subtotal: subtotal };
}

// Retriggers the pulse animation on the cart icon (used as add-to-cart feedback)
function pulseCartButton() {
    const button = document.getElementById("cart-toggle");
    button.classList.remove("pulse");
    void button.offsetWidth;
    button.classList.add("pulse");
}

// Updates the small item-count badge on the cart icon
function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    const totals = getCartTotals();

    if (totals.totalQuantity > 0) {
        badge.style.display = "flex";
    } else {
        badge.style.display = "none";
    }

    badge.innerHTML = totals.totalQuantity;
}

// Rebuilds the cart drawer's contents from the current cart state
function renderCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    const subtotalElement = document.getElementById("cart-subtotal");
    const checkoutButton = document.getElementById("cart-checkout");
    updateCartBadge();

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `<div class="cart-empty"><i class="ri-shopping-cart-line"></i><span>Your cart is empty.</span></div>`;
        subtotalElement.innerHTML = formatPrice(0, 0);
        checkoutButton.disabled = true;
        return;
    }

    checkoutButton.disabled = false;
    cartItemsContainer.innerHTML = "";
    let i = 0;

    while (i < cartItems.length) {
        const cartItem = cartItems[i];
        const lineTotal = calculateLineTotal(cartItem.price, cartItem.quantity, cartItem.taxApplicable);
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `<div class="cart-item-info">
            <span class="cart-item-name">${cartItem.name}</span>
            <span class="cart-item-sku">${cartItem.sku}</span>
            <span class="cart-item-price">${formatPrice(lineTotal, 0)}</span>
            </div>
            <div class="cart-item-controls">
            <button class="qty-btn" data-action="decrease"><i class="ri-subtract-line"></i></button>
            <span class="qty-value">${cartItem.quantity}</span>
            <button class="qty-btn" data-action="increase"><i class="ri-add-line"></i></button>
            </div>
            <button class="cart-item-remove"><i class="ri-delete-bin-line"></i></button>`;

        row.querySelector(`[data-action="decrease"]`).addEventListener("click", function () { changeQuantity(cartItem.id, -1); });
        row.querySelector(`[data-action="increase"]`).addEventListener("click", function () { changeQuantity(cartItem.id, 1); });
        row.querySelector(".cart-item-remove").addEventListener("click", function () { removeFromCart(cartItem.id); });

        cartItemsContainer.appendChild(row);
        i += 1;
    }

    subtotalElement.innerHTML = formatPrice(getCartTotals().subtotal, 0);
}

// Slides the cart drawer into view and locks page scroll
function openCart() {
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
}

// Slides the cart drawer out of view and restores page scroll
function closeCart() {
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
}

// Placeholder for the drawer's own checkout button — you're wiring this up yourself
function handleCheckout() {
    console.log("Checkout with items:", cartItems);
}

document.addEventListener("DOMContentLoaded", function () {
    renderCart();
    document.getElementById("cart-toggle").addEventListener("click", openCart);
    document.getElementById("cart-close").addEventListener("click", closeCart);
    document.getElementById("cart-overlay").addEventListener("click", closeCart);
    document.getElementById("cart-checkout").addEventListener("click", handleCheckout);
});
