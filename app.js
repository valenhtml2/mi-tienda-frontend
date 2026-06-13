// IMPORTANTE CONFIGURACIÓN:
// Reemplaza esto por tu Public Key real de Mercado Pago (Prod o Sandbox)
const MP_PUBLIC_KEY = "APP_USR-5d5f8e9c-fa44-48e6-8549-82a226ac26b2"; 
// Reemplaza esto por la URL que te dará Render cuando subas el backend
const BACKEND_URL = "https://tienda-pagos-30sg.onrender.com"; 

const productos = [
    { id: 1, title: "Remera Oversize Minimal", price: 25000, category: "remeras", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=500" },
    { id: 2, title: "Pantalón Cargo Negro", price: 45000, category: "pantalones", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500" },
    { id: 3, title: "Campera Denim Classic", price: 65000, category: "camperas", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=500" },
    { id: 4, title: "Remera Essential Blanca", price: 20000, category: "remeras", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=500" },
    { id: 5, title: "Chinos Relaxed Fit", price: 40000, category: "pantalones", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=500" },
    { id: 6, title: "Campera Bomber Urbana", price: 80000, category: "camperas", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=500" }
];

let carrito = [];

const productsContainer = document.getElementById('products-container');
const cartTrigger = document.getElementById('cart-icon-trigger');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCount = document.getElementById('cart-count');
const cartTotalAmount = document.getElementById('cart-total-amount');
const categoryBtns = document.querySelectorAll('.category-btn');
const checkoutModal = document.getElementById('checkout-modal');
const btnCheckout = document.getElementById('btn-checkout');
const closeModalBtn = document.getElementById('close-modal');
const checkoutForm = document.getElementById('checkout-form');

// Inicializar Mercado Pago
let mp;
if (MP_PUBLIC_KEY !== "Pon tus datos aquí") {
    mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
}

function renderProducts(filter = "todos") {
    productsContainer.innerHTML = "";
    const filtered = filter === "todos" ? productos : productos.filter(p => p.category === filter);
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">$${product.price.toLocaleString('es-AR')}</p>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">Agregar al Carrito</button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

window.addToCart = function(id) {
    const product = productos.find(p => p.id === id);
    const item = carrito.find(i => i.id === id);
    if (item) { item.quantity++; } else { carrito.push({ ...product, quantity: 1 }); }
    updateCartUI();
    openCart();
};

window.removeFromCart = function(id) {
    carrito = carrito.filter(i => i.id !== id);
    updateCartUI();
};

function updateCartUI() {
    cartItemsContainer.innerHTML = "";
    let total = 0, count = 0;
    carrito.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <img src="${item.image}" class="cart-item-img">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <p class="cart-item-price">$${item.price.toLocaleString('es-AR')}</p>
                <p class="cart-item-qty">Cant: ${item.quantity}</p>
            </div>
            <i class='bx bx-trash remove-item' onclick="removeFromCart(${item.id})"></i>
        `;
        cartItemsContainer.appendChild(div);
    });
    cartCount.textContent = count;
    cartTotalAmount.textContent = `$${total.toLocaleString('es-AR')}`;
}

function openCart() { cartSidebar.classList.add('open'); cartOverlay.classList.add('open'); }
function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('open'); }

cartTrigger.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderProducts(e.target.dataset.category);
    });
});

btnCheckout.addEventListener('click', () => {
    if (carrito.length === 0) { alert("Tu carrito está vacío."); return; }
    closeCart();
    checkoutModal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => { checkoutModal.classList.remove('open'); });

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!mp) { alert("Falta configurar la clave pública de Mercado Pago en app.js"); return; }
    
    const btnSubmit = document.getElementById('btn-generar-pago');
    btnSubmit.innerText = "Conectando con Mercado Pago...";
    btnSubmit.disabled = true;

    const orderData = {
        items: carrito.map(item => ({
            title: item.title,
            quantity: Number(item.quantity),
            unit_price: Number(item.price)
        })),
        payer: {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value
        }
    };

    try {
        const response = await fetch(`${BACKEND_URL}/create_preference`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
        });

        const preference = await response.json();
        createCheckoutButton(preference.id);
        btnSubmit.style.display = "none";
    } catch (error) {
        alert("Error de conexión con el servidor de pagos.");
        btnSubmit.innerText = "Generar Enlace de Pago";
        btnSubmit.disabled = false;
    }
});

function createCheckoutButton(preferenceId) {
    const bricksBuilder = mp.bricks();
    const renderComponent = async () => {
        if (window.checkoutButton) window.checkoutButton.unmount();
        window.checkoutButton = await bricksBuilder.create("wallet", "wallet_container", {
            initialization: { preferenceId: preferenceId },
            customization: { texts: { valueProp: 'smart_option' } }
        });
    };
    renderComponent();
}

document.addEventListener("DOMContentLoaded", () => { renderProducts(); });