const SITES = [
  {
    key: 'amazon',
    name: 'Amazon',
    cartUrl: 'https://www.amazon.com/gp/cart/view.html',
  },
  {
    key: 'ebay',
    name: 'eBay',
    cartUrl: 'https://cart.ebay.com/',
  },
  {
    key: 'microcenter',
    name: 'Micro Center',
    cartUrl: 'https://cart.microcenter.com/',
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const cartList = document.getElementById('cart-list');
  const grandTotalDiv = document.getElementById('grand-total');
  cartList.textContent = 'Loading...';

  chrome.runtime.sendMessage({ type: 'getTotals' }, (totals) => {
    cartList.innerHTML = '';
    let grandTotal = 0;
    for (const site of SITES) {
      const amount = totals[site.key] || 0;
      grandTotal += amount;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `<span>${site.name}</span><span>$${amount.toFixed(2)}</span>`;
      cartList.appendChild(div);
    }
    grandTotalDiv.textContent = `Grand Total: $${grandTotal.toFixed(2)}`;
  });
}); 