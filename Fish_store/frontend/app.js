const API = {
  products: '../backend/products.php',
  login: '../login.php',
  register: '../register.php',
  order: '../place_order.php'
};

const money = (value) => `$${Number(value || 0).toLocaleString('en-US')}`;
const getProductId = () => new URLSearchParams(window.location.search).get('id');
const fishIcon = () => `<svg viewBox="0 0 240 140" fill="none" aria-hidden="true"><path d="M23 70c31-38 81-46 126-19l50-30-13 35 29 14-29 14 13 35-50-30C104 116 54 108 23 70Z" stroke="currentColor" stroke-width="4"/><circle cx="70" cy="57" r="4" fill="currentColor"/><path d="M112 49c14 13 14 29 0 42" stroke="currentColor" stroke-width="3"/></svg>`;
const fishImages = {
  1: 'https://a-z-animals.com/media/2022/04/shutterstock_228322159.jpg',
  2: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXl9LfIIzF1SqUUcoW__MBJZSulb1SivbLfyHAuR7xeT7LrHP8et3-5iA&s=10',
  3: 'https://cdn.shopify.com/s/files/1/0794/9497/1635/files/GID629_PA_3.jpg?v=1764167297',
  5: 'https://biogeodb.stri.si.edu/caribbean/resources/img/images/species/3514_9458.jpg',
  4: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyCFpXoCWkbd-B-LcKEJbrclF2Jx7cqSGvHBu8UPxK0lSdZwsnMx6utp0&s=10',
  6: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR9Jpl1zZVDdq21j2O1ZYg-9W2EkwLx4zBIXJFoPu_Wi0DLFgz5wH7b0fu&s=10'
};

const fishVisual = (product, imageClass = '') => {
  const imageUrl = fishImages[product.id];
  if (!imageUrl) return fishIcon();
  return `<img class="${imageClass}" src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${fishIcon()}</span>`;
};

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Please check that MAMP is running.');
    throw new Error('Unable to reach the PHP service. Please use the MAMP URL on port 8888.');
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.status === 'error') throw new Error(data?.message || 'Unable to complete the request.');
  return data;
}

function productCard(product) {
  const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" data-reveal><div class="product-visual">${fishVisual(product)}</div><div><div class="product-meta"><h3>${escapeHtml(product.name)}</h3><span class="price">${money(product.price)}</span></div><p class="description">${escapeHtml(product.description || 'A considered selection from the deep.')}</p><div class="actions"><a class="button secondary" href="${productUrl}">View specimen</a><button class="button" type="button" data-add-to-cart data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}" data-product-price="${escapeHtml(product.price)}">Add to cart</button></div></div></article>`;
}

function showCartNotice(message) {
  let notice = document.querySelector('[data-cart-notice]');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'cart-notice';
    notice.dataset.cartNotice = '';
    notice.setAttribute('role', 'status');
    document.body.append(notice);
  }
  notice.textContent = message;
  notice.classList.add('is-visible');
  window.clearTimeout(notice.timeoutId);
  notice.timeoutId = window.setTimeout(() => notice.classList.remove('is-visible'), 2400);
}

function bindAddToCartButtons() {
  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      addToCart({ id: button.dataset.productId, name: button.dataset.productName, price: button.dataset.productPrice });
      showCartNotice(`${button.dataset.productName} added to your cart.`);
    });
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function loadProducts() {
  const target = document.querySelector('[data-products]');
  if (!target) return;
  const status = document.querySelector('[data-db-status]');
  const raw = document.querySelector('[data-raw-json]');
  const message = document.querySelector('[data-monitor-message]');
  const setStatus = (label, state) => {
    if (!status) return;
    status.textContent = `Database Status: ${label}`;
    status.dataset.state = state;
  };
  setStatus('Checking...', 'loading');
  try {
    const products = await request(API.products);
    if (!Array.isArray(products)) throw new Error('The database returned an unexpected response.');
    target.innerHTML = products.length ? products.map(productCard).join('') : '<div class="empty-state">The collection is being prepared. Please return shortly.</div>';
    bindAddToCartButtons();
    if (raw) raw.textContent = JSON.stringify(products, null, 2);
    if (message) message.textContent = '';
    setStatus('Connected', 'connected');
  } catch (error) {
    target.innerHTML = `<div class="error-state">${escapeHtml(error.message)} Please check the PHP service and try again.</div>`;
    if (raw) raw.textContent = JSON.stringify({ status: 'error', message: error.message }, null, 2);
    if (message) message.textContent = 'The live database query could not be completed.';
    setStatus('Unavailable', 'error');
  }
}

async function loadProductDetail() {
  const target = document.querySelector('[data-product-detail]');
  if (!target) return;
  const id = getProductId();
  if (!id) { target.innerHTML = '<div class="error-state">No specimen was selected.</div>'; return; }
  try {
    const products = await request(API.products);
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) throw new Error('This specimen could not be found.');
    target.innerHTML = `<div class="detail-visual">${fishVisual(product)}</div><div class="detail-copy"><p class="kicker">Private collection / specimen ${escapeHtml(product.id)}</p><h1>${escapeHtml(product.name)}</h1><span class="price">${money(product.price)}</span><p class="description">${escapeHtml(product.description || 'A rare selection, held to exacting standards and ready for a considered table.')}</p><div class="actions"><button class="button" type="button" data-add-to-cart data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}" data-product-price="${escapeHtml(product.price)}">Add to cart</button><a class="button secondary" href="products.html">Back to collection</a></div></div>`;
    bindAddToCartButtons();
  } catch (error) { target.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
}

async function loadCheckout() {
  const summary = document.querySelector('[data-order-summary]');
  if (!summary) return;
  const form = document.querySelector('[data-checkout-form]');
  const message = document.querySelector('[data-form-message]');
  const render = () => {
    const cart = getCart();
    if (!cart.length) {
      summary.innerHTML = '<div class="empty-state"><p>Your cart is waiting for a considered selection.</p><a class="button" href="products.html">Browse the collection</a></div>';
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }
    summary.innerHTML = `<p class="kicker">Your selection</p><h1>Cart summary.</h1><div class="cart-list">${cart.map((item) => `<div class="cart-item"><div class="cart-item-visual">${fishVisual(item, 'cart-item-image')}</div><div class="cart-item-details"><h2>${escapeHtml(item.name)}</h2><p>${money(item.price)} each</p></div><div class="cart-item-controls"><label>Quantity <input type="number" min="1" max="999" value="${item.quantity}" data-cart-quantity="${escapeHtml(item.id)}"></label><strong>${money(item.price * item.quantity)}</strong><button class="text-button" type="button" data-remove-item="${escapeHtml(item.id)}">Remove item</button></div></div>`).join('')}</div><div class="summary-row total"><span>Total</span><strong>${money(getCartTotal())}</strong></div><button class="button secondary cart-clear" type="button" data-clear-cart>Clear cart</button>`;
    form.querySelector('button[type="submit"]').disabled = false;
    summary.querySelectorAll('[data-cart-quantity]').forEach((input) => input.addEventListener('change', () => { updateCartItemQuantity(input.dataset.cartQuantity, input.value); render(); }));
    summary.querySelectorAll('[data-remove-item]').forEach((button) => button.addEventListener('click', () => { removeFromCart(button.dataset.removeItem); render(); }));
    summary.querySelector('[data-clear-cart]').addEventListener('click', () => { clearCart(); render(); });
  };
  render();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userId = localStorage.getItem('user_id');
    if (!userId) { message.textContent = 'Please sign in before placing an order.'; return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = '';
    try {
      const orderResponse = await request('../backend/checkout.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: Number(userId), items: getCart().map(({ id, quantity }) => ({ id, quantity })) }) });
      const firstItem = orderResponse.items[0];
      const quantity = orderResponse.items.reduce((total, item) => total + item.quantity, 0);
      const orderDetails = { order_id: orderResponse.order_id, name: orderResponse.items.map((item) => item.name).join(', '), quantity, price: firstItem.price, total: orderResponse.total_price, created_at: orderResponse.created_at || new Date().toISOString() };
      localStorage.setItem('last_order', JSON.stringify(orderDetails));
      clearCart();
      const params = new URLSearchParams({ order_id: orderDetails.order_id, product_name: orderDetails.name, quantity: orderDetails.quantity, item_price: orderDetails.price, total_price: orderDetails.total, created_at: orderDetails.created_at });
      window.location.href = `success.html?${params.toString()}`;
    } catch (error) { message.textContent = error.message; button.disabled = false; }
  });
}

function bindForm(selector, endpoint, successPath) {
  const form = document.querySelector(selector);
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const message = form.querySelector('[data-form-message]');
    const defaultLabel = button.textContent;
    button.disabled = true; button.textContent = 'Checking...'; message.textContent = '';
    try {
      const data = await request(endpoint, { method: 'POST', body: new FormData(form) });
      if (data.user_id) localStorage.setItem('user_id', data.user_id);
      window.location.href = successPath;
    } catch (error) { message.textContent = error.message; button.disabled = false; button.textContent = defaultLabel; }
  });
}

function renderSuccess() {
  const card = document.querySelector('[data-confirmation-card]');
  if (!card) return;
  const params = new URLSearchParams(window.location.search);
  let storedOrder = null;
  try { storedOrder = JSON.parse(localStorage.getItem('last_order') || 'null'); } catch (error) { storedOrder = null; }
  const order = { ...storedOrder, order_id: params.get('order_id') || storedOrder?.order_id, name: params.get('product_name') || storedOrder?.name, quantity: params.get('quantity') || storedOrder?.quantity, price: params.get('item_price') || storedOrder?.price, total: params.get('total_price') || storedOrder?.total, created_at: params.get('created_at') || storedOrder?.created_at };
  if (!order.name || !order.total) {
    card.hidden = true;
    const empty = document.querySelector('[data-confirmation-empty]');
    if (empty) empty.hidden = false;
    window.setTimeout(() => { window.location.href = 'products.html'; }, 2600);
    return;
  }
  const dollars = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const timestamp = order.created_at ? new Date(order.created_at) : null;
  const fields = { reference: order.order_id ? `#ORD-${String(order.order_id).padStart(4, '0')}` : '#ORD-PENDING', item: `${order.name}`, quantity: Number(order.quantity || 1), price: dollars(order.price || Number(order.total) / Number(order.quantity || 1)), timestamp: timestamp && !Number.isNaN(timestamp.valueOf()) ? timestamp.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now', total: dollars(order.total) };
  document.querySelector('[data-success-summary]').textContent = `${fields.item} · ${dollars(order.total)}`;
  document.querySelector('[data-order-reference]').textContent = fields.reference;
  document.querySelector('[data-order-item]').textContent = fields.item;
  document.querySelector('[data-order-quantity]').textContent = fields.quantity;
  document.querySelector('[data-order-price]').textContent = fields.price;
  document.querySelector('[data-order-timestamp]').textContent = fields.timestamp;
  document.querySelector('[data-order-total]').textContent = fields.total;
  document.querySelector('[data-print-receipt]')?.addEventListener('click', () => window.print());
}

function initializeApp() {
  loadProducts(); loadProductDetail(); loadCheckout(); renderSuccess();
  bindForm('[data-login-form]', API.login, 'products.html');
  bindForm('[data-register-form]', API.register, 'login.html');
}

function loadCartScript() {
  if (typeof getCart === 'function') {
    initializeApp();
    return;
  }
  const cartScript = document.createElement('script');
  cartScript.src = 'cart.js';
  cartScript.addEventListener('load', initializeApp, { once: true });
  document.head.append(cartScript);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCartScript, { once: true });
else loadCartScript();
