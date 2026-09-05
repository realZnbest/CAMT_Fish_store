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
  const checkoutUrl = `checkout.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" data-reveal><div class="product-visual">${fishVisual(product)}</div><div><div class="product-meta"><h3>${escapeHtml(product.name)}</h3><span class="price">${money(product.price)}</span></div><p class="description">${escapeHtml(product.description || 'A considered selection from the deep.')}</p><div class="actions"><a class="button secondary" href="${productUrl}">View specimen</a><a class="button" href="${checkoutUrl}">Buy now</a></div></div></article>`;
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
    target.innerHTML = `<div class="detail-visual">${fishIcon()}</div><div class="detail-copy"><p class="kicker">Private collection / specimen ${escapeHtml(product.id)}</p><h1>${escapeHtml(product.name)}</h1><span class="price">${money(product.price)}</span><p class="description">${escapeHtml(product.description || 'A rare selection, held to exacting standards and ready for a considered table.')}</p><div class="actions"><a class="button" href="checkout.html?id=${encodeURIComponent(product.id)}">Buy now</a><a class="button secondary" href="products.html">Back to collection</a></div></div>`;
  } catch (error) { target.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
}

async function loadCheckout() {
  const summary = document.querySelector('[data-order-summary]');
  if (!summary) return;
  const id = getProductId();
  if (!id) { summary.innerHTML = '<div class="error-state">No item was selected for checkout.</div>'; return; }
  try {
    const products = await request(API.products);
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) throw new Error('This specimen could not be found.');
    summary.innerHTML = `<div class="checkout-product-visual">${fishVisual(product, 'checkout-product-image')}</div><p class="kicker">Your selection</p><h2>${escapeHtml(product.name)}</h2><div class="summary-row"><span>Unit price</span><strong>${money(product.price)}</strong></div><div class="summary-row"><span>Quantity</span><strong data-quantity-label>1</strong></div><div class="summary-row total"><span>Total</span><strong data-total>${money(product.price)}</strong></div>`;
    const quantityInput = document.querySelector('[name="quantity"]');
    const update = () => { const quantity = Math.max(1, Number(quantityInput.value || 1)); document.querySelector('[data-quantity-label]').textContent = quantity; document.querySelector('[data-total]').textContent = money(Number(product.price) * quantity); };
    quantityInput.addEventListener('input', update);
    document.querySelector('[data-checkout-form]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.querySelector('[data-form-message]');
      const userId = localStorage.getItem('user_id');
      if (!userId) { message.textContent = 'Please sign in before placing an order.'; return; }
      const quantity = Math.max(1, Number(quantityInput.value || 1));
      const formData = new FormData();
      formData.append('user_id', userId); formData.append('product_id', product.id); formData.append('quantity', quantity); formData.append('total_price', Number(product.price) * quantity);
      try { await request(API.order, { method: 'POST', body: formData }); localStorage.setItem('last_order', JSON.stringify({ name: product.name, total: Number(product.price) * quantity })); window.location.href = 'success.html'; }
      catch (error) { message.textContent = error.message; }
    });
  } catch (error) { summary.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`; }
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
  const target = document.querySelector('[data-success-summary]');
  if (!target) return;
  const order = JSON.parse(localStorage.getItem('last_order') || 'null');
  target.textContent = order ? `${order.name} · ${money(order.total)}` : 'Your order has been received.';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(); loadProductDetail(); loadCheckout(); renderSuccess();
  bindForm('[data-login-form]', API.login, 'products.html');
  bindForm('[data-register-form]', API.register, 'login.html');
});
