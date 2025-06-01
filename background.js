// background.js
// Reserved for future features (e.g., notifications, periodic checks) 

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

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
    justification: 'Scrape cart totals from cart pages in the background.'
  });
}

async function fetchCartTotal(siteKey) {
  await ensureOffscreenDocument();
  return new Promise((resolve) => {
    const listener = (msg) => {
      if (msg.type === 'cartTotalResult' && msg.site === siteKey) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(msg.total);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    chrome.runtime.sendMessage({ type: 'scrapeCartTotal', site: siteKey });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTotals') {
    (async () => {
      const totals = {};
      for (const site of SITES) {
        try {
          totals[site.key] = await fetchCartTotal(site.key);
        } catch {
          totals[site.key] = 0;
        }
      }
      sendResponse(totals);
    })();
    return true;
  }
}); 