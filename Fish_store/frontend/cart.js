const CART_STORAGE_KEY = 'fish_store_cart';

function getCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(storedCart)) return [];
    return storedCart
      .map((item) => ({
        id: String(item.id),
        name: String(item.name || 'Unnamed selection'),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1))
      }))
      .filter((item) => item.id && item.price >= 0);
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find((item) => String(item.id) === String(product.id));
  if (existingItem) {
    existingItem.quantity += Math.max(1, Math.floor(Number(product.quantity) || 1));
  } else {
    cart.push({
      id: String(product.id),
      name: String(product.name),
      price: Number(product.price) || 0,
      quantity: Math.max(1, Math.floor(Number(product.quantity) || 1))
    });
  }
  saveCart(cart);
  return cart;
}

function updateCartItemQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => String(entry.id) === String(productId));
  if (!item) return cart;
  item.quantity = Math.max(1, Math.floor(Number(quantity) || 1));
  saveCart(cart);
  return cart;
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => String(item.id) !== String(productId));
  saveCart(cart);
  return cart;
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartQuantity() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function updateCartBadge() {
  document.querySelectorAll('.nav').forEach((nav) => {
    if (nav.querySelector('[data-cart-count]')) return;
    const link = document.createElement('a');
    link.className = 'cart-link';
    link.href = 'checkout.html';
    link.innerHTML = 'Cart <span class="cart-count" data-cart-count hidden>0</span>';
    nav.insertBefore(link, nav.querySelector('.nav-cta') || null);
  });
  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    const count = getCartQuantity();
    badge.textContent = count;
    badge.hidden = count === 0;
    badge.setAttribute('aria-label', `${count} item${count === 1 ? '' : 's'} in cart`);
  });
}

window.addEventListener('storage', updateCartBadge);
window.addEventListener('cart:updated', updateCartBadge);
document.addEventListener('DOMContentLoaded', updateCartBadge);
