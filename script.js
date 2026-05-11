// ===== DATA =====
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Americano", price: 2.80, category: "cafe", color: "#f5f5f5" },
    { id: 2, name: "Caffè Macchiato", price: 3.20, category: "cafe", color: "#f5f5f5" },
    { id: 3, name: "Cappuccino", price: 3.50, category: "cafe", color: "#f5f5f5" },
    { id: 4, name: "Espresso", price: 1.50, category: "cafe", color: "#f5f5f5" },
    { id: 5, name: "Flat White", price: 3.80, category: "cafe", color: "#f5f5f5" },
    { id: 6, name: "Latte", price: 3.60, category: "cafe", color: "#f5f5f5" },
    { id: 7, name: "Croissant", price: 1.90, category: "desserts", color: "#fff3e0" },
    { id: 8, name: "Pain au chocolat", price: 2.10, category: "desserts", color: "#fff3e0" },
    { id: 9, name: "Tarte aux fruits", price: 4.50, category: "desserts", color: "#fce4ec" },
    { id: 10, name: "Crumble pomme", price: 6.30, category: "desserts", color: "#fce4ec" },
    { id: 11, name: "Fondant chocolat", price: 5.80, category: "desserts", color: "#fff3e0" },
    { id: 12, name: "Muffin", price: 3.20, category: "desserts", color: "#f5f5f5" },
    { id: 13, name: "Gelato Deluxe", price: 4.90, category: "desserts", color: "#e3f2fd" },
    { id: 14, name: "Thé glacé", price: 3.50, category: "boissons", color: "#e0f2f1" },
    { id: 15, name: "Chai Latte glacé", price: 4.20, category: "boissons", color: "#e0f2f1" },
    { id: 16, name: "Milkshake", price: 5.50, category: "boissons", color: "#f3e5f5" },
    { id: 17, name: "Smoothie", price: 5.80, category: "boissons", color: "#e8f5e9" },
    { id: 18, name: "Jus d'orange", price: 3.80, category: "boissons", color: "#fff3e0" },
    { id: 19, name: "Limonade", price: 3.20, category: "boissons", color: "#fffde7" },
    { id: 20, name: "Eau pétillante", price: 2.00, category: "boissons", color: "#e3f2fd" },
    { id: 21, name: "Cookie", price: 2.50, category: "snacks", color: "#fff3e0" },
    { id: 22, name: "Brownie", price: 3.80, category: "snacks", color: "#fff3e0" },
    { id: 23, name: "Sandwich club", price: 6.50, category: "snacks", color: "#e8f5e9" },
    { id: 24, name: "Quiche lorraine", price: 5.20, category: "snacks", color: "#fffde7" },
];

const VAT_RATE = 0.20;

// ===== STATE =====
let products = [];
let cart = [];
let nextProductId = 100;
let activeCategory = "all";
let editMode = false;
let searchOpen = false;
let editingProductId = null;
let selectedPaymentMethod = null;

// ===== INIT =====
function init() {
    loadProducts();
    renderProducts();
    bindEvents();
    updateCart();
}

// ===== PERSISTENCE =====
function loadProducts() {
    const saved = localStorage.getItem("pos_products");
    if (saved) {
        products = JSON.parse(saved);
        nextProductId = Math.max(...products.map(p => p.id), 99) + 1;
    } else {
        products = [...DEFAULT_PRODUCTS];
        saveProducts();
    }
}

function saveProducts() {
    localStorage.setItem("pos_products", JSON.stringify(products));
}

function loadCart() {
    const saved = localStorage.getItem("pos_cart");
    if (saved) {
        cart = JSON.parse(saved);
    }
}

function saveCart() {
    localStorage.setItem("pos_cart", JSON.stringify(cart));
}

// ===== RENDERING =====
function renderProducts() {
    const grid = document.getElementById("products-grid");
    const searchQuery = document.getElementById("search-input").value.toLowerCase().trim();

    let filtered = products;

    if (activeCategory !== "all") {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    grid.innerHTML = "";

    filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = `product-card${editMode ? " editing" : ""}`;
        card.style.background = product.color || "#f5f5f5";
        card.dataset.id = product.id;

        // Badge showing quantity in cart
        const cartItem = cart.find(c => c.id === product.id);
        const badgeCount = cartItem ? cartItem.qty : 0;

        card.innerHTML = `
            <div class="product-badge${badgeCount > 0 ? " visible" : ""}">${badgeCount}</div>
            <span class="product-name">${escapeHtml(product.name)}</span>
            <span class="product-price-tag">${formatPrice(product.price)}</span>
        `;

        card.addEventListener("click", () => {
            if (editMode) {
                openEditProductModal(product.id);
            } else {
                addToCart(product.id);
            }
        });

        grid.appendChild(card);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <p>Aucun produit trouvé</p>
            </div>
        `;
    }
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const emptyState = document.getElementById("cart-empty");

    // Remove all cart item elements (keep empty state)
    container.querySelectorAll(".cart-item").forEach(el => el.remove());

    if (cart.length === 0) {
        if (emptyState) emptyState.style.display = "";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;

        const row = document.createElement("div");
        row.className = "cart-item";
        row.dataset.id = item.id;

        const totalItemPrice = product.price * item.qty;

        row.innerHTML = `
            <span class="cart-item-qty">${item.qty}</span>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(product.name)}</div>
                ${item.qty > 1 ? `<div class="cart-item-unit-price">${formatPrice(product.price)}</div>` : ""}
            </div>
            <span class="cart-item-price">${formatPrice(totalItemPrice)}</span>
            <div class="cart-item-actions">
                <button class="cart-item-action-btn minus" title="Retirer 1" data-id="${item.id}">−</button>
                <button class="cart-item-action-btn plus" title="Ajouter 1" data-id="${item.id}">+</button>
                <button class="cart-item-action-btn remove" title="Supprimer" data-id="${item.id}">×</button>
            </div>
        `;

        container.appendChild(row);
    });

    // Bind cart item action buttons
    container.querySelectorAll(".cart-item-action-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (btn.classList.contains("plus")) {
                addToCart(id);
            } else if (btn.classList.contains("minus")) {
                removeFromCart(id, 1);
            } else if (btn.classList.contains("remove")) {
                removeFromCart(id, Infinity);
            }
        });
    });
}

function updateTotals() {
    let subtotal = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            subtotal += product.price * item.qty;
        }
    });

    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;

    document.getElementById("subtotal").textContent = formatPrice(subtotal);
    document.getElementById("vat").textContent = formatPrice(vat);

    const chargeBtn = document.getElementById("charge-btn");
    chargeBtn.querySelector(".charge-text").textContent = `Encaisser ${formatPrice(total)} €`;
    chargeBtn.disabled = cart.length === 0;
}

function updateCart() {
    renderCart();
    updateTotals();
    renderProducts(); // re-render to update badges
    saveCart();
}

// ===== CART ACTIONS =====
function addToCart(productId) {
    const existing = cart.find(c => c.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    updateCart();

    // Animate the product card
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        card.style.transform = "scale(0.93)";
        setTimeout(() => {
            card.style.transform = "";
        }, 150);
    }
}

function removeFromCart(productId, count) {
    const idx = cart.findIndex(c => c.id === productId);
    if (idx === -1) return;

    if (count === Infinity || cart[idx].qty <= count) {
        cart.splice(idx, 1);
    } else {
        cart[idx].qty -= count;
    }
    updateCart();
}

function clearCart() {
    if (cart.length === 0) return;
    cart = [];
    updateCart();
    showToast("Panier vidé");
}

// ===== EVENTS =====
function bindEvents() {
    // Categories
    document.querySelectorAll(".category-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.category;
            renderProducts();
        });
    });

    // Search toggle
    document.getElementById("search-toggle-btn").addEventListener("click", () => {
        searchOpen = !searchOpen;
        const container = document.getElementById("search-container");
        const input = document.getElementById("search-input");
        container.classList.toggle("open", searchOpen);
        if (searchOpen) {
            setTimeout(() => input.focus(), 300);
        } else {
            input.value = "";
            renderProducts();
        }
    });

    // Search input
    document.getElementById("search-input").addEventListener("input", () => {
        renderProducts();
    });

    // Add product button
    document.getElementById("add-product-btn").addEventListener("click", openAddProductModal);

    // Edit mode toggle
    document.getElementById("edit-mode-btn").addEventListener("click", () => {
        editMode = !editMode;
        document.getElementById("edit-mode-btn").classList.toggle("active", editMode);
        renderProducts();
        if (editMode) {
            showToast("Mode édition activé — cliquez sur un produit pour le modifier");
        } else {
            showToast("Mode édition désactivé");
        }
    });

    // Clear cart
    document.getElementById("clear-cart-btn").addEventListener("click", () => {
        clearCart();
    });

    // Charge button -> open payment
    document.getElementById("charge-btn").addEventListener("click", () => {
        if (cart.length === 0) return;
        openPaymentModal();
    });

    // Keypad button (quick add by price)
    document.getElementById("keypad-btn").addEventListener("click", () => {
        openQuickAddModal();
    });

    // ===== ADD PRODUCT MODAL =====
    document.getElementById("modal-add-close").addEventListener("click", closeAddProductModal);
    document.getElementById("modal-add-cancel").addEventListener("click", closeAddProductModal);
    document.getElementById("modal-add-confirm").addEventListener("click", confirmAddProduct);

    // Color picker for add modal
    document.querySelectorAll("#color-picker .color-swatch").forEach(swatch => {
        swatch.addEventListener("click", () => {
            document.querySelectorAll("#color-picker .color-swatch").forEach(s => s.classList.remove("active"));
            swatch.classList.add("active");
        });
    });

    // ===== EDIT PRODUCT MODAL =====
    document.getElementById("modal-edit-close").addEventListener("click", closeEditProductModal);
    document.getElementById("modal-edit-cancel").addEventListener("click", closeEditProductModal);
    document.getElementById("modal-edit-confirm").addEventListener("click", confirmEditProduct);
    document.getElementById("modal-edit-delete").addEventListener("click", deleteProduct);

    // Color picker for edit modal
    document.querySelectorAll("#edit-color-picker .color-swatch").forEach(swatch => {
        swatch.addEventListener("click", () => {
            document.querySelectorAll("#edit-color-picker .color-swatch").forEach(s => s.classList.remove("active"));
            swatch.classList.add("active");
        });
    });

    // ===== PAYMENT MODAL =====
    document.getElementById("modal-payment-close").addEventListener("click", closePaymentModal);
    document.getElementById("modal-payment-cancel").addEventListener("click", closePaymentModal);
    document.getElementById("validate-payment").addEventListener("click", validatePayment);

    // Payment methods
    document.querySelectorAll(".payment-method-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".payment-method-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedPaymentMethod = btn.dataset.method;

            const cashSection = document.getElementById("cash-section");
            const validateBtn = document.getElementById("validate-payment");

            if (selectedPaymentMethod === "cash") {
                cashSection.classList.remove("hidden");
                document.getElementById("cash-given").value = "";
                document.getElementById("change-display").classList.add("hidden");
                validateBtn.disabled = true;
                setTimeout(() => document.getElementById("cash-given").focus(), 100);
            } else {
                cashSection.classList.add("hidden");
                validateBtn.disabled = false;
            }
        });
    });

    // Cash given input
    document.getElementById("cash-given").addEventListener("input", () => {
        const cashGiven = parseFloat(document.getElementById("cash-given").value) || 0;
        const total = getCartTotal();
        const changeDisplay = document.getElementById("change-display");
        const changeAmount = document.getElementById("change-amount");
        const validateBtn = document.getElementById("validate-payment");

        if (cashGiven >= total) {
            const change = cashGiven - total;
            changeDisplay.classList.remove("hidden");
            changeAmount.textContent = formatPrice(change) + " €";
            validateBtn.disabled = false;
        } else {
            changeDisplay.classList.add("hidden");
            validateBtn.disabled = true;
        }
    });

    // Success modal
    document.getElementById("btn-new-sale").addEventListener("click", () => {
        closeModal("modal-success");
        cart = [];
        updateCart();
    });

    // Close modals on overlay click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("visible");
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.querySelectorAll(".modal-overlay.visible").forEach(m => m.classList.remove("visible"));
        }
    });
}

// ===== MODAL HELPERS =====
function openModal(id) {
    document.getElementById(id).classList.add("visible");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("visible");
}

// ===== ADD PRODUCT MODAL =====
function openAddProductModal() {
    document.getElementById("product-name").value = "";
    document.getElementById("product-price").value = "";
    document.getElementById("product-category").value = "cafe";
    document.querySelectorAll("#color-picker .color-swatch").forEach((s, i) => {
        s.classList.toggle("active", i === 0);
    });
    openModal("modal-add-product");
    setTimeout(() => document.getElementById("product-name").focus(), 300);
}

function closeAddProductModal() {
    closeModal("modal-add-product");
}

function confirmAddProduct() {
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const category = document.getElementById("product-category").value;
    const color = document.querySelector("#color-picker .color-swatch.active")?.dataset.color || "#f5f5f5";

    if (!name) {
        showToast("Veuillez entrer un nom de produit");
        document.getElementById("product-name").focus();
        return;
    }

    if (isNaN(price) || price <= 0) {
        showToast("Veuillez entrer un prix valide");
        document.getElementById("product-price").focus();
        return;
    }

    const newProduct = {
        id: nextProductId++,
        name,
        price: Math.round(price * 100) / 100,
        category,
        color
    };

    products.push(newProduct);
    saveProducts();
    renderProducts();
    closeAddProductModal();
    showToast(`"${name}" ajouté avec succès`);
}

// ===== EDIT PRODUCT MODAL =====
function openEditProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;

    document.getElementById("edit-product-name").value = product.name;
    document.getElementById("edit-product-price").value = product.price;
    document.getElementById("edit-product-category").value = product.category;

    document.querySelectorAll("#edit-color-picker .color-swatch").forEach(s => {
        s.classList.toggle("active", s.dataset.color === product.color);
    });

    openModal("modal-edit-product");
    setTimeout(() => document.getElementById("edit-product-name").focus(), 300);
}

function closeEditProductModal() {
    closeModal("modal-edit-product");
    editingProductId = null;
}

function confirmEditProduct() {
    if (!editingProductId) return;

    const name = document.getElementById("edit-product-name").value.trim();
    const price = parseFloat(document.getElementById("edit-product-price").value);
    const category = document.getElementById("edit-product-category").value;
    const color = document.querySelector("#edit-color-picker .color-swatch.active")?.dataset.color || "#f5f5f5";

    if (!name) {
        showToast("Veuillez entrer un nom de produit");
        return;
    }

    if (isNaN(price) || price <= 0) {
        showToast("Veuillez entrer un prix valide");
        return;
    }

    const product = products.find(p => p.id === editingProductId);
    if (product) {
        product.name = name;
        product.price = Math.round(price * 100) / 100;
        product.category = category;
        product.color = color;
        saveProducts();
        renderProducts();
        showToast(`"${name}" modifié avec succès`);
    }

    closeEditProductModal();
}

function deleteProduct() {
    if (!editingProductId) return;

    const product = products.find(p => p.id === editingProductId);
    const name = product ? product.name : "";

    products = products.filter(p => p.id !== editingProductId);
    cart = cart.filter(c => c.id !== editingProductId);

    saveProducts();
    updateCart();
    closeEditProductModal();
    showToast(`"${name}" supprimé`);
}

// ===== PAYMENT MODAL =====
function openPaymentModal() {
    const total = getCartTotal();
    document.getElementById("payment-amount").textContent = formatPrice(total) + " €";

    // Reset state
    selectedPaymentMethod = null;
    document.querySelectorAll(".payment-method-btn").forEach(b => b.classList.remove("selected"));
    document.getElementById("cash-section").classList.add("hidden");
    document.getElementById("change-display").classList.add("hidden");
    document.getElementById("cash-given").value = "";
    document.getElementById("validate-payment").disabled = true;

    openModal("modal-payment");
}

function closePaymentModal() {
    closeModal("modal-payment");
}

function validatePayment() {
    if (!selectedPaymentMethod) return;

    const total = getCartTotal();
    const methodLabels = {
        card: "Paiement par carte accepté",
        cash: "Paiement en espèces accepté",
        other: "Paiement accepté"
    };

    closePaymentModal();

    // Show success
    document.getElementById("success-method-text").textContent = methodLabels[selectedPaymentMethod];
    document.getElementById("success-amount").textContent = formatPrice(total) + " €";
    openModal("modal-success");
}

// ===== QUICK ADD (Keypad) =====
function openQuickAddModal() {
    // Simple prompt-based quick add for a custom amount
    const input = prompt("Montant à ajouter (€) :");
    if (input === null) return;
    
    const price = parseFloat(input.replace(",", "."));
    if (isNaN(price) || price <= 0) {
        showToast("Montant invalide");
        return;
    }

    // Add as a temporary "Divers" product
    const tempProduct = {
        id: nextProductId++,
        name: `Divers (${formatPrice(price)} €)`,
        price: Math.round(price * 100) / 100,
        category: "snacks",
        color: "#f5f5f5"
    };

    products.push(tempProduct);
    saveProducts();
    addToCart(tempProduct.id);
    showToast(`Article ajouté : ${formatPrice(price)} €`);
}

// ===== UTILITIES =====
function getCartTotal() {
    let subtotal = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) subtotal += product.price * item.qty;
    });
    return subtotal + subtotal * VAT_RATE;
}

function formatPrice(amount) {
    return amount.toFixed(2).replace(".", ",");
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== START =====
document.addEventListener("DOMContentLoaded", init);
