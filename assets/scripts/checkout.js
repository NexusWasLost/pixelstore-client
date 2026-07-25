import { getCartItems, getCartTotals, clearCart } from "./cart.js";
import { formatPrice, calculateLineTotal } from "./utils.js";

// Razorpay's key_id is meant to be public and safe to expose client-side.
// Replace with your actual test key_id (starts with rzp_test_...)
const RAZORPAY_KEY_ID = "rzp_test_TF13P6PL244jWe";

const outputEl = document.getElementById("output");

function log(label, data) {
    outputEl.textContent += `\n${label}:\n${JSON.stringify(data, null, 2)}\n`;
}

// Checks the name and contact fields, shows inline errors, returns true only if both are valid
function validateCheckoutFields() {
    const nameInput = document.getElementById("orderName");
    const emailInput = document.getElementById("orderEmail");
    const nameError = document.getElementById("orderNameError");
    const emailError = document.getElementById("orderEmailError");

    let isValid = true;

    nameInput.classList.remove("invalid");
    emailInput.classList.remove("invalid");
    nameError.innerHTML = "";
    emailError.innerHTML = "";

    const nameValue = nameInput.value.trim();
    const emailValue = emailInput.value.trim();

    if (nameValue.length === 0) {
        nameInput.classList.add("invalid");
        nameError.innerHTML = "Name is required";
        isValid = false;
    }

    console.log(emailValue);
    if (emailValue.length === 0) {
        emailInput.classList.add("invalid");
        emailError.innerHTML = "Email is required";
        isValid = false;
    }

    return isValid;
}

function buildCartData() {
    const items = getCartItems();
    const cartItems = [];
    let i = 0;

    while (i < items.length) {
        cartItems.push({
            itemId: items[i].id,
            itemName: items[i].name,
            quantity: items[i].quantity
        });
        i += 1;
    }

    const nameOnOrder = document.getElementById("orderName").value.trim();
    const email = document.getElementById("orderEmail").value.trim();

    return {
        nameOnOrder: nameOnOrder,
        email: email,
        cartItems: cartItems
    };
}

function renderOrderSummary() {
    const items = getCartItems();
    const container = document.getElementById("order-summary-items");
    const totalElement = document.getElementById("order-summary-total");
    const createOrderBtn = document.getElementById("createOrderBtn");

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div class="cart-empty"><i class="ri-shopping-cart-line"></i><span>Your cart is empty.</span></div>`;
        totalElement.innerHTML = formatPrice(0, 0);
        createOrderBtn.disabled = true;
        return;
    }

    createOrderBtn.disabled = false;
    let i = 0;

    while (i < items.length) {
        const item = items[i];
        const lineTotal = calculateLineTotal(item.price, item.quantity, item.taxApplicable);
        const row = document.createElement("div");
        row.className = "order-summary-row";
        row.innerHTML = `<div class="order-summary-row-info">
            <span class="order-summary-row-name">${item.name}</span>
            <span class="order-summary-row-sku">${item.sku} &times; ${item.quantity}</span>
            </div>
            <span class="order-summary-row-price">${formatPrice(lineTotal, 0)}</span>`;
        container.appendChild(row);
        i = i + 1;
    }

    totalElement.innerHTML = formatPrice(getCartTotals().subtotal, 0);
}

async function createOrder() {
    const fieldsValid = validateCheckoutFields();
    if (!fieldsValid) {
        return;
    }

    try {
        const response = await fetch("http://localhost:8000/api/order/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(buildCartData())
        });

        const result = await response.json();
        log("Create Order Response", result);

        if (!response.ok) {
            return;
        }

        const razorpayOrder = result.data;
        openCheckout(razorpayOrder);

    } catch (error) {
        log("Create Order Error", { message: error.message });
    }
}

function openCheckout(dbOrder) {
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(dbOrder.total * 100),
        currency: "INR",
        order_id: dbOrder.razorpayOrderId,
        name: "Test Store",
        description: "Test Transaction",
        handler: function (response) {
            log("Checkout Success Response", response);
            verifyOrder(response);
        },
        modal: {
            ondismiss: function () {
                log("Checkout Dismissed", { message: "User closed the payment window" });
            }
        }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (response) {
        log("Payment Failed", response.error);
    });

    rzp.open();
}

async function verifyOrder(paymentResponse) {
    try {
        const response = await fetch("http://localhost:8000/api/order/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
            })
        });

        const result = await response.json();
        log("Verify Order Response", result);

        if (result.success) clearCart();

    }
    catch (error) {
        log("Verify Order Error", { message: error.message });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    renderOrderSummary();
    document.getElementById("createOrderBtn").addEventListener("click", createOrder);
});

document.addEventListener("cart-updated", function () {
    renderOrderSummary();
});
