/** Cashfree JS SDK loader (shared by StoragePlans, MediaList, etc.) */
const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js';

export const loadCashfree = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Cashfree requires browser'));
  }
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${CASHFREE_SCRIPT}"]`)) {
      const wait = (attempts) => {
        if (window.Cashfree) return resolve(window.Cashfree);
        if (attempts <= 0) return reject(new Error('Cashfree not ready'));
        setTimeout(() => wait(attempts - 1), 50);
      };
      wait(40);
      return;
    }
    const s = document.createElement('script');
    s.src = CASHFREE_SCRIPT;
    s.async = true;
    s.onload = () => resolve(window.Cashfree);
    s.onerror = () => reject(new Error('Failed to load Cashfree'));
    document.head.appendChild(s);
  });
};
