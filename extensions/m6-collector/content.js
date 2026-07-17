/**
 * Purpose: Content script for MediaFactory M6 Collector.
 * Responsibilities: Shortcut detection, Validation pipeline execution, Toast display.
 */

let isCollecting = false;
let validationServiceModule = null;

async function getValidationService() {
  if (!validationServiceModule) {
    const url = chrome.runtime.getURL('managers/ValidationService.js');
    validationServiceModule = await import(url);
  }
  return validationServiceModule.ValidationService;
}

function showToast(message, isError = false) {
  let container = document.querySelector('.m6-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'm6-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `m6-toast ${isError ? 'm6-toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('m6-toast-show');
  });

  setTimeout(() => {
    toast.classList.remove('m6-toast-show');
    setTimeout(() => toast.remove(), 250);
  }, 2000);
}

function getErrorMessage(reason) {
  switch (reason) {
    case 'UNSUPPORTED_PLATFORM':
      return 'Unsupported Page';
    case 'INVALID_URL':
      return 'Invalid URL';
    case 'NOT_SHORT_CONTENT':
      return 'Not Short Content';
    case 'NOT_READY':
      return 'Page Not Ready';
    default:
      return 'Unable to Collect';
  }
}

async function triggerCollect() {
  if (isCollecting) {
    return;
  }

  isCollecting = true;
  try {
    const validator = await getValidationService();
    let currentUrl = window.location.href;

    // Resolve active video URL when browsing TikTok feed (/en/, /foryou, etc.)
    if (currentUrl.includes('tiktok.com') && !currentUrl.includes('/video/')) {
      let foundUrl = null;
      
      // Attempt 1: Find any link directly
      const activeVideoLink = document.querySelector('a[href*="/video/"]');
      if (activeVideoLink && activeVideoLink.href) {
        foundUrl = activeVideoLink.href;
      }
      
      // Attempt 2: Regex the ENTIRE document for the video ID (handles escaped JSON in <head> scripts)
      if (!foundUrl) {
        const robustRegex = /@([\w.-]+)(?:\\\/|\/|%2F|\\u002F)video(?:\\\/|\/|%2F|\\u002F)(\d{15,25})/;
        let match = document.documentElement.innerHTML.match(robustRegex);
        if (match && match[1] && match[2]) {
           foundUrl = `https://www.tiktok.com/@${match[1]}/video/${match[2]}`;
        } else {
           // Attempt 3: Look for any 19-digit video ID in the page's JSON state
           const idMatch = document.documentElement.innerHTML.match(/(?:"item_id"|"itemId"|"id")\s*:\s*"(\d{18,20})"/);
           if (idMatch && idMatch[1]) {
               // We can use a dummy username 'a' because TikTok only cares about the video ID!
               foundUrl = `https://www.tiktok.com/@a/video/${idMatch[1]}`;
           }
        }
      }
      
      if (foundUrl) currentUrl = foundUrl;
    }

    const validation = validator.validate(currentUrl);

    if (!validation.valid) {
      showToast(getErrorMessage(validation.reason), true);
      return;
    }

    const response = await chrome.runtime.sendMessage({
      action: 'COLLECT_URL',
      url: currentUrl
    });

    if (response && response.success) {
      showToast('✓ Added to M6');
    } else {
      showToast('Backend Offline', true);
    }
  } catch (err) {
    console.error('[M6 Collector] Error:', err);
    showToast('Error: ' + err.message, true);
  } finally {
    isCollecting = false;
  }
}

window.addEventListener('keydown', (event) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === 'q'
  ) {
    triggerCollect();
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'TRIGGER_COLLECT') {
    triggerCollect();
  }
});
