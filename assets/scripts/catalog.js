import { addToCart } from "./cart.js";
import { formatPrice } from "./utils.js";

document.addEventListener("DOMContentLoaded", function () {
    showSkeletons();
    fetchItems();
});

function showSkeletons() {
    const skeletonGrid = document.getElementById("skeleton-grid");
    let i = 0;

    while (i < 6) {
        const card = document.createElement("div");
        card.className = "skeleton-card";
        card.innerHTML = `<div>
            <div class="skeleton-line" style="width: 40%; height: 18px; margin-bottom: 16px;"></div>
            <div class="skeleton-line" style="width: 75%; height: 20px; margin-bottom: 10px;"></div>
            <div class="skeleton-line" style="width: 95%; height: 14px;"></div>
            </div>
            <div class="skeleton-line" style="width: 100%; height: 34px;"></div>`;
        skeletonGrid.appendChild(card);
        i = i + 1;
    }
}

function setStatus(mode, iconClass, message) {
    const statusElement = document.getElementById("status-message");
    statusElement.className = mode;
    statusElement.innerHTML = `<div class="status-icon"><i class="${iconClass}"></i></div>
        <span>${message}</span>`;
}

async function fetchItems() {
    const statusElement = document.getElementById("status-message");
    const skeletonGrid = document.getElementById("skeleton-grid");

    try {
        const response = await fetch("http://localhost:8000/api/item/fetch/all");

        if (!response.ok) {
            throw new Error("Failed to load inventory");
        }

        const result = await response.json();

        skeletonGrid.innerHTML = "";

        if (result.success === true) {
            statusElement.style.display = "none";
            renderItems(result.data);
        } else {
            setStatus("error", "ri-error-warning-line", result.message || "Something went wrong.");
        }

    } catch (error) {
        console.log("Fetch error:", error);
        skeletonGrid.innerHTML = "";
        setStatus("error", "ri-wifi-off-line", "Unable to connect to product server.");
    }
}

function renderItems(itemsList) {
    const gridElement = document.getElementById("product-grid");
    const countElement = document.getElementById("item-count");
    const countText = document.getElementById("item-count-text");
    gridElement.innerHTML = "";

    if (itemsList.length === 0) {
        const statusElement = document.getElementById("status-message");
        statusElement.style.display = "flex";
        setStatus("empty", "ri-inbox-line", "No products found.");
        return;
    }

    countElement.style.display = "flex";
    countText.innerHTML = `<strong>${itemsList.length}</strong> items available`;

    let i = 0;

    while (i < itemsList.length) {
        const item = itemsList[i];
        const formattedPrice = formatPrice(item.basePrice, item.taxApplicable);

        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `<div>
            <div class="card-top">
            <span class="sku-tag">${item.SKU}</span>
            <span class="tax-tag">${item.taxApplicable}% GST</span>
            </div>
            <h2 class="product-title">${item.name}</h2>
            <p class="product-notes">${item.notes || ""}</p>
            </div>
            <div class="card-bottom">
            <div class="price-container">
            <span class="price-label">Price</span>
            <span class="price-value">${formattedPrice}</span>
            </div>
            <button class="btn-buy">Add to Cart<i class="ri-shopping-cart-2-line"></i></button>
            </div>`;

        const addButton = card.querySelector(".btn-buy");
        addButton.addEventListener("click", function () {
            addToCart(item);
        });

        gridElement.appendChild(card);
        i = i + 1;
    }
}
