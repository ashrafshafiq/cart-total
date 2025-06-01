function extractAmazonCartTotal() {
  const subtotal = document.querySelector('#sc-subtotal-amount-activecart');
  if (subtotal) {
    const match = subtotal.textContent.match(/([0-9,.]+)/);
    if (match) return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getCartTotal') {
    sendResponse({ total: extractAmazonCartTotal() });
  }
}); 