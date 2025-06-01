import { SITES } from './utils/sites.js';

const extractors = {
  amazon: function(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const subtotal = doc.querySelector('#sc-subtotal-amount-activecart');
    if (subtotal) {
      const match = subtotal.textContent.match(/([0-9,.]+)/);
      if (match) return parseFloat(match[1].replace(/,/g, ''));
    }
    // Fallback: look for 'Subtotal' and next price
    const elements = Array.from(doc.querySelectorAll('body *')).filter(el => /Subtotal/i.test(el.textContent));
    for (const el of elements) {
      let sibling = el.nextElementSibling;
      while (sibling) {
        const match = sibling.textContent.match(/\$([0-9,.]+)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
        sibling = sibling.nextElementSibling;
      }
      const match = el.textContent.match(/\$([0-9,.]+)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return 0;
  },
  ebay: function(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Find all elements containing 'Subtotal'
    const elements = Array.from(doc.querySelectorAll('body *')).filter(el => /Subtotal/i.test(el.textContent));
    for (const el of elements) {
      // Try next siblings first (common case)
      let sibling = el.nextElementSibling;
      while (sibling) {
        const match = sibling.textContent.match(/\$([0-9,.]+)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
        sibling = sibling.nextElementSibling;
      }
      // Try previous siblings (sometimes subtotal is below the amount)
      let prev = el.previousElementSibling;
      while (prev) {
        const match = prev.textContent.match(/\$([0-9,.]+)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
        prev = prev.previousElementSibling;
      }
      // Try within the element itself
      const match = el.textContent.match(/\$([0-9,.]+)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    // Fallback: look for 'Subtotal' in text and grab the closest $ amount after it
    const text = doc.body.textContent;
    const subtotalIndex = text.search(/Subtotal/i);
    if (subtotalIndex !== -1) {
      // Find all $ amounts after 'Subtotal'
      const after = text.slice(subtotalIndex);
      const match = after.match(/\$([0-9,.]+)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
      // Or before 'Subtotal'
      const before = text.slice(0, subtotalIndex);
      const matches = [...before.matchAll(/\$([0-9,.]+)/g)];
      if (matches.length > 0) {
        return parseFloat(matches[matches.length - 1][1].replace(/,/g, ''));
      }
    }
    return 0;
  },
  microcenter: function(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Micro Center: look for 'Subtotal' and the next price, or a price in the same element
    const elements = Array.from(doc.querySelectorAll('body *')).filter(el => /Subtotal/i.test(el.textContent));
    for (const el of elements) {
      // Try next siblings
      let sibling = el.nextElementSibling;
      while (sibling) {
        const match = sibling.textContent.match(/\$([0-9,.]+)/);
        if (match) {
          return parseFloat(match[1].replace(/,/g, ''));
        }
        sibling = sibling.nextElementSibling;
      }
      // Try within the element itself
      const match = el.textContent.match(/\$([0-9,.]+)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    // Fallback: look for any price in the document after 'Subtotal'
    const priceMatch = doc.body.textContent.match(/Subtotal[^\d$]*\$([0-9,.]+)/i);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    // New fallback: look for 'Cart (X item): $Y (before tax & fees)'
    const cartMatch = doc.body.textContent.match(/Cart \(.*?\):\s*\$([0-9,.]+)/i);
    if (cartMatch) {
      return parseFloat(cartMatch[1].replace(/,/g, ''));
    }
    return 0;
  }
};

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === 'scrapeCartTotal' && msg.site && extractors[msg.site]) {
    try {
      const site = SITES.find(site => site.key === msg.site);
      const response = await fetch(site.cartUrl, { credentials: 'include' });
      const html = await response.text();
      const total = extractors[msg.site](html);
      chrome.runtime.sendMessage({ type: 'cartTotalResult', site: msg.site, total });
    } catch (e) {
      chrome.runtime.sendMessage({ type: 'cartTotalResult', site: msg.site, total: 0 });
    }
  }
}); 