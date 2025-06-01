export const extractors = [
  {
    name: 'Amazon',
    match: url => url.includes('amazon.com/gp/cart/view.html'),
    script: 'content_scripts/amazon.js'
  }
  // Add more extractors here as you add sites
]; 