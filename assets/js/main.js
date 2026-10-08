/* 
  ================================================================
  Savoria — Local Dining & Restaurant Discovery Platform JavaScript
  ================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
  initCartSystem();
  initRestaurantFilters();
  initFoodDetailsCustomization();
  initOrderTrackingProgress();
  initLiveChatModal();
  initFormsAndToasts();
  initBackToTop();
});

/* ================================================================
   1. SAVED DINING ITINERARY & TASTING CART
   ================================================================ */
const cartState = [
  { id: 1, name: 'Truffle Glazed Duck Breast & Morel Reduction', price: 850, qty: 1, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80', restaurant: 'The Copper Hearth' },
  { id: 2, name: 'Woodfired Burrata & Heirloom Fig Flatbread', price: 520, qty: 1, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80', restaurant: 'Trattoria Bella Vista' }
];

function initCartSystem() {
  updateCartUI();

  // Add event listener for remove buttons using event delegation
  const cartContainer = document.getElementById('cartItemsContainer');
  if (cartContainer) {
    cartContainer.addEventListener('click', (e) => {
      const target = e.target.closest('.remove-cart-item');
      if (target) {
        const id = parseInt(target.dataset.id);
        removeFromCart(id);
      }
    });
  }
}

function updateCartUI() {
  const badgeEls = document.querySelectorAll('.cart-badge');
  const totalQty = cartState.reduce((acc, item) => acc + item.qty, 0);
  
  badgeEls.forEach(b => {
    b.textContent = totalQty;
    if (totalQty === 0) {
      b.style.display = 'none';
    } else {
      b.style.display = 'flex';
    }
  });

  const cartContainer = document.getElementById('cartItemsContainer');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTotalEl = document.getElementById('cartTotal');

  if (!cartContainer) return;

  if (cartState.length === 0) {
    cartContainer.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-compass text-muted display-1"></i>
        <h5 class="mt-3">Your Tasting Bag is Empty</h5>
        <p class="text-muted small">Explore top-rated local dining spots and curate your tasting itinerary!</p>
        <a href="restaurants.html" class="btn btn-crave-primary mt-2">Discover Restaurants</a>
      </div>
    `;
    if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
    if (cartTotalEl) cartTotalEl.textContent = '₹0';
    return;
  }

  let subtotal = 0;
  let itemsHTML = '';

  cartState.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    itemsHTML += `
      <div class="cart-item-row">
        <img src="${item.img}" alt="${item.name}" class="cart-item-img">
        <div class="flex-grow-1">
          <h6 class="mb-0 fw-bold" style="font-size:0.95rem;">${item.name}</h6>
          <small class="text-muted d-block">${item.restaurant}</small>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <span class="fw-bold" style="color:var(--primary);">₹${item.price}</span>
            <div class="quantity-control py-0 px-2" style="transform: scale(0.85); transform-origin: left;">
              <span class="qty-btn" onclick="updateItemQty(${item.id}, -1)">-</span>
              <span class="fw-bold px-1">${item.qty}</span>
              <span class="qty-btn" onclick="updateItemQty(${item.id}, 1)">+</span>
            </div>
          </div>
        </div>
        <button class="btn text-danger p-1 remove-cart-item" data-id="${item.id}" title="Remove">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `;
  });

  cartContainer.innerHTML = itemsHTML;

  const reservationServiceFee = subtotal > 1200 ? 0 : 50;
  const taxes = Math.round(subtotal * 0.05);
  const discount = 100; // Gourmet discovery promo
  const finalTotal = Math.max(0, subtotal + reservationServiceFee + taxes - discount);

  if (cartSubtotalEl) cartSubtotalEl.textContent = `₹${subtotal}`;
  if (cartTotalEl) cartTotalEl.textContent = `₹${finalTotal}`;

  const deliveryFeeEl = document.getElementById('cartDeliveryFee');
  if (deliveryFeeEl) {
    deliveryFeeEl.textContent = reservationServiceFee === 0 ? 'COMPLIMENTARY' : `₹${reservationServiceFee}`;
    if (reservationServiceFee === 0) deliveryFeeEl.className = 'text-success fw-bold';
  }
}

window.updateItemQty = function(id, change) {
  const item = cartState.find(i => i.id === id);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      updateCartUI();
    }
  }
};

function removeFromCart(id) {
  const index = cartState.findIndex(i => i.id === id);
  if (index > -1) {
    cartState.splice(index, 1);
    updateCartUI();
    showToast('Item removed from tasting bag');
  }
}

window.addToCart = function(product) {
  const existing = cartState.find(i => i.id === product.id);
  if (existing) {
    existing.qty += product.qty || 1;
  } else {
    cartState.push({
      id: product.id || Date.now(),
      name: product.name,
      price: product.price,
      qty: product.qty || 1,
      img: product.img || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
      restaurant: product.restaurant || 'The Copper Hearth'
    });
  }
  updateCartUI();
  showToast(`Added "${product.name}" to Tasting Bag! 🍷`);
  
  const cartBsOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
  if (cartBsOffcanvas) {
    cartBsOffcanvas.show();
  } else {
    const offcanvasEl = document.getElementById('cartOffcanvas');
    if (offcanvasEl) {
      new bootstrap.Offcanvas(offcanvasEl).show();
    }
  }
};

/* ================================================================
   2. RESTAURANT FILTERS (ON RESTAURANTS PAGE)
   ================================================================ */
function initRestaurantFilters() {
  const searchInput = document.getElementById('restaurantSearchInput');
  const filterPills = document.querySelectorAll('.filter-pill-btn');
  const cuisineSelect = document.getElementById('cuisineSelect');
  const restaurantCards = document.querySelectorAll('.restaurant-grid-col');

  if (!restaurantCards.length) return;

  let activeFilter = 'all';
  let searchTerm = '';
  let selectedCuisine = 'all';

  function applyFilters() {
    restaurantCards.forEach(col => {
      const card = col.querySelector('.restaurant-card');
      const name = card.dataset.name ? card.dataset.name.toLowerCase() : '';
      const cuisine = card.dataset.cuisine ? card.dataset.cuisine.toLowerCase() : '';
      const isVeg = card.dataset.veg === 'true';
      const isFast = card.dataset.fast === 'true';
      const isTop = parseFloat(card.dataset.rating || 0) >= 4.7;
      const isFree = card.dataset.freedelivery === 'true';

      let matchesSearch = name.includes(searchTerm) || cuisine.includes(searchTerm);
      let matchesCuisine = selectedCuisine === 'all' || cuisine.includes(selectedCuisine.toLowerCase());
      let matchesCategory = true;

      if (activeFilter === 'veg') matchesCategory = isVeg;
      else if (activeFilter === 'fast') matchesCategory = isFast;
      else if (activeFilter === 'top') matchesCategory = isTop;
      else if (activeFilter === 'free') matchesCategory = isFree;

      if (matchesSearch && matchesCuisine && matchesCategory) {
        col.style.display = 'block';
        col.style.opacity = '1';
        col.style.transform = 'scale(1)';
      } else {
        col.style.display = 'none';
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  if (cuisineSelect) {
    cuisineSelect.addEventListener('change', (e) => {
      selectedCuisine = e.target.value;
      applyFilters();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active', 'btn-crave-primary'));
      filterPills.forEach(p => p.classList.add('btn-crave-secondary'));
      
      pill.classList.remove('btn-crave-secondary');
      pill.classList.add('active', 'btn-crave-primary');
      
      activeFilter = pill.dataset.filter;
      applyFilters();
    });
  });
}

/* ================================================================
   3. FOOD DETAILS & CHEF TASTING CUSTOMIZATION
   ================================================================ */
function initFoodDetailsCustomization() {
  const basePrice = 850;
  let currentQty = 1;
  
  const spiceBtns = document.querySelectorAll('.spice-btn');
  const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
  const qtyValEl = document.getElementById('dishQtyVal');
  const addToCartBtnPriceEl = document.getElementById('addToCartPrice');
  const addToCartMainBtn = document.getElementById('mainAddToCartBtn');

  if (!addToCartMainBtn) return;

  spiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      spiceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  function calculateTotal() {
    let addonsTotal = 0;
    addonCheckboxes.forEach(cb => {
      if (cb.checked) {
        addonsTotal += parseInt(cb.dataset.price || 0);
      }
    });

    const total = (basePrice + addonsTotal) * currentQty;
    if (addToCartBtnPriceEl) {
      addToCartBtnPriceEl.textContent = `₹${total}`;
    }
    return total;
  }

  addonCheckboxes.forEach(cb => {
    cb.addEventListener('change', calculateTotal);
  });

  window.changeDishQty = function(change) {
    currentQty += change;
    if (currentQty < 1) currentQty = 1;
    if (qtyValEl) qtyValEl.textContent = currentQty;
    calculateTotal();
  };

  addToCartMainBtn.addEventListener('click', () => {
    const finalPrice = calculateTotal();
    addToCart({
      id: 101,
      name: 'Truffle Glazed Duck Breast & Morel Reduction',
      price: Math.round(finalPrice / currentQty),
      qty: currentQty,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
      restaurant: 'The Copper Hearth'
    });
  });
}

/* ================================================================
   4. LIVE DINING RESERVATION & COURSE PROGRESSION
   ================================================================ */
function initOrderTrackingProgress() {
  const trackerSection = document.getElementById('liveOrderTracker');
  if (!trackerSection) return;

  const steps = trackerSection.querySelectorAll('.timeline-step');
  const progressBar = trackerSection.querySelector('.tracking-timeline-progress');
  
  let currentStep = 1; // Default step 2 active (Table Prep & Sommelier)

  window.advanceOrderStep = function() {
    currentStep++;
    if (currentStep > 3) currentStep = 3; // Cap at Seated & Served

    steps.forEach((step, idx) => {
      if (idx < currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (idx === currentStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('completed', 'active');
      }
    });

    if (progressBar) {
      const percentage = (currentStep / (steps.length - 1)) * 80;
      if (window.innerWidth <= 768) {
        progressBar.style.height = `${percentage + 10}%`;
      } else {
        progressBar.style.width = `${percentage + 10}%`;
      }
    }

    const etaText = document.getElementById('orderEtaText');
    if (etaText) {
      if (currentStep === 1) etaText.textContent = 'Table Ready in 20 min';
      else if (currentStep === 2) etaText.textContent = 'Sommelier Pairing in Progress';
      else if (currentStep === 3) etaText.textContent = 'Welcome to Your Table!';
    }
    
    showToast('Dining experience status updated!');
  };
}

/* ================================================================
   5. LIVE CHAT MODAL & CONCIERGE INTERACTION
   ================================================================ */
function initLiveChatModal() {
  const sendChatBtn = document.getElementById('sendChatMsgBtn');
  const chatInput = document.getElementById('chatMsgInput');
  const chatBody = document.getElementById('chatMessagesBody');

  if (!sendChatBtn || !chatInput) return;

  function handleSend() {
    const txt = chatInput.value.trim();
    if (!txt) return;

    // User Message
    const userMsgHTML = `
      <div class="d-flex justify-content-end mb-3">
        <div class="bg-primary text-white p-3 rounded-4" style="max-width: 80%;">
          ${txt}
          <div class="text-end mt-1" style="font-size:0.7rem; opacity:0.8;">Just now</div>
        </div>
      </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', userMsgHTML);
    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Concierge Bot Response simulation
    setTimeout(() => {
      const botMsgHTML = `
        <div class="d-flex align-items-start gap-2 mb-3">
          <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:36px; height:36px;">
            <i class="bi bi-headset"></i>
          </div>
          <div class="bg-light p-3 rounded-4 border" style="max-width: 80%;">
            <strong class="d-block mb-1 text-dark" style="font-size:0.85rem;">Savoria Concierge (Elena)</strong>
            Warm greetings! I have logged your dining inquiry. A dedicated restaurant curator is reviewing your table preferences now.
            <div class="mt-1 text-muted" style="font-size:0.7rem;">Just now</div>
          </div>
        </div>
      `;
      chatBody.insertAdjacentHTML('beforeend', botMsgHTML);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
  }

  sendChatBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

/* ================================================================
   6. FORMS & TOAST NOTIFICATIONS
   ================================================================ */
function initFormsAndToasts() {
  // Ticket Priority Pills Toggle
  const priorityBtns = document.querySelectorAll('.priority-pill-btn');
  priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Ticket Submission Form
  const contactForm = document.getElementById('contactHelpForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('ticketUserName')?.value || 'Alexander Sterling';
      const subject = document.getElementById('ticketSubjectInput')?.value || 'Table Reservation Inquiry';
      const orderId = document.getElementById('ticketOrderId')?.value || '#SAV-' + Math.floor(100000 + Math.random() * 900000);
      const msg = document.getElementById('ticketMsgInput')?.value || 'Private tasting menu query for upcoming anniversary.';

      const displaySubject = document.getElementById('ticketDisplaySubject');
      if (displaySubject) {
        displaySubject.textContent = `Inquiry: ${subject} (${orderId})`;
      }

      const timeline = document.getElementById('ticketActivityTimeline');
      if (timeline) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsgHTML = `
          <div class="ticket-msg-bubble">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="small text-dark">${name} (Guest)</strong>
              <span class="text-muted" style="font-size:0.7rem;">Today, ${timeNow}</span>
            </div>
            <p class="small mb-0 text-secondary">${msg}</p>
          </div>
        `;
        timeline.insertAdjacentHTML('beforeend', newMsgHTML);
        timeline.scrollTop = timeline.scrollHeight;
      }

      showToast(`Inquiry ${orderId} submitted! Concierge assigned. 🥂`);
      contactForm.reset();
    });
  }

  // Ticket Reply Form
  const ticketReplyForm = document.getElementById('ticketReplyForm');
  if (ticketReplyForm) {
    ticketReplyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const replyInput = document.getElementById('ticketReplyInput');
      const msg = replyInput ? replyInput.value.trim() : '';
      if (!msg) return;

      const timeline = document.getElementById('ticketActivityTimeline');
      if (timeline) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsgHTML = `
          <div class="ticket-msg-bubble">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="small text-dark">Alexander Sterling (Guest)</strong>
              <span class="text-muted" style="font-size:0.7rem;">Today, ${timeNow}</span>
            </div>
            <p class="small mb-0 text-secondary">${msg}</p>
          </div>
        `;
        timeline.insertAdjacentHTML('beforeend', userMsgHTML);

        setTimeout(() => {
          const agentMsgHTML = `
            <div class="ticket-msg-bubble agent">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="small" style="color:var(--primary);"><i class="bi bi-check-circle-fill me-1"></i> Sarah Miller (Savoria Concierge Lead)</strong>
                <span class="text-muted" style="font-size:0.7rem;">Just now</span>
              </div>
              <p class="small mb-0 text-dark">Thank you for your response! I have coordinated with the Executive Chef regarding your tasting preferences.</p>
            </div>
          `;
          timeline.insertAdjacentHTML('beforeend', agentMsgHTML);
          timeline.scrollTop = timeline.scrollHeight;
        }, 1000);

        timeline.scrollTop = timeline.scrollHeight;
      }

      showToast('Response added to concierge ticket thread!');
      replyInput.value = '';
    });
  }

  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Subscribed to Savoria Epicurean Gazette! 🥂');
      form.reset();
    });
  });
}

function showToast(message) {
  let toastContainer = document.getElementById('craveToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'craveToastContainer';
    toastContainer.style.cssText = 'position: fixed; bottom: 25px; right: 25px; z-index: 1100; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast show align-items-center text-white bg-dark border-0 shadow-lg';
  toast.style.cssText = 'border-radius: 12px; font-family: var(--font-body); min-width: 280px; backdrop-filter: blur(8px); border-left: 4px solid var(--accent) !important;';
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-patch-check-fill text-warning fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

/* ================================================================
   7. BACK TO TOP BUTTON FUNCTIONALITY
   ================================================================ */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
