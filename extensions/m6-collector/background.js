/**
 * Purpose: Background service worker for MediaFactory M6 Collector MVP.
 * Responsibilities: Receive collect messages, invoke ApiClient, handle Chrome commands.
 */

import { ApiClient } from './transport/ApiClient.js';
import { Logger } from './managers/Logger.js';

Logger.info('M6 Collector Background Service Worker started');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'COLLECT_URL' && request.url) {
    Logger.info(`Received COLLECT_URL for: ${request.url}`);
    ApiClient.collect(request.url)
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        Logger.error('Unhandled collect error:', err);
        sendResponse({ success: false, error: 'UNKNOWN' });
      });
    return true; // Keep message channel open for async response
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-collect') {
    Logger.info('Command triggered: quick-collect');
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_COLLECT' }, () => {
        // Ignore error if content script not injected
      });
    }
  }
});
