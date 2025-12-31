// TabQueue Sidebar - Main UI Logic

// State
let tabGroups = [];
const UNIFIED_GROUP_NAME = 'Other Sites';
let hasAutoCapture = false; // Track auto-capture in memory

// SVG Icons
const SVG_ICONS = {
  chevronDown: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 4l4 4 4-4z"/></svg>',
  chevronRight: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M4 2l4 4-4 4z"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M14 1.41L12.59 0 7 5.59 1.41 0 0 1.41 5.59 7 0 12.59 1.41 14 7 8.41 12.59 14 14 12.59 8.41 7z"/></svg>',
  favicon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('TabQueue Sidebar initialized');
  initializeUI();
  loadGroups();
  
  // Auto-capture on first open only (use memory flag to avoid race condition)
  if (!hasAutoCapture) {
    hasAutoCapture = true;
    setTimeout(() => {
      handleCaptureTabs();
    }, 500);
  }
});

/**
 * Initialize UI event listeners
 */
function initializeUI() {
  document.getElementById('captureBtn').addEventListener('click', handleCaptureTabs);
  document.getElementById('restoreAllBtn').addEventListener('click', handleRestoreAll);
  document.getElementById('expandCollapseBtn').addEventListener('click', handleExpandCollapseAll);
}

/**
 * Capture all tabs
 */
async function handleCaptureTabs() {
  console.log('Requesting tab capture...');
  
  const captureBtn = document.getElementById('captureBtn');
  captureBtn.disabled = true;
  captureBtn.innerHTML = `<span>Capturing...</span>`;
  
  chrome.runtime.sendMessage({ action: 'captureTabs' }, (response) => {
    captureBtn.disabled = false;
    captureBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 4h12v1H2zm0 3h12v1H2zm0 3h12v1H2zm0 3h12v1H2z"/>
      </svg>
      <span>Queue All Tabs</span>
    `;
    
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.success) {
      console.log(`Capture response:`, response);
      console.log(`Captured ${response.count} tabs, closed ${response.closedCount} tabs`);
      console.log(`Groups:`, response.groups);
      loadGroups();
    } else {
      console.error('Failed to capture tabs:', response?.error);
    }
  });
}

/**
 * Load groups from storage
 */
async function loadGroups() {
  try {
    const result = await chrome.storage.local.get(['tabGroups']);
    tabGroups = result.tabGroups || [];
    console.log('Groups loaded:', tabGroups.length);
    renderGroups();
  } catch (error) {
    console.error('Error loading groups:', error);
    showError('Failed to load tabs. Please try refreshing.');
  }
}

/**
 * Save groups to storage
 */
async function saveGroups() {
  try {
    await chrome.storage.local.set({ tabGroups });
    console.log('Groups saved');
    updateBadge();
  } catch (error) {
    console.error('Error saving groups:', error);
    showError('Failed to save changes. Please try again.');
  }
}

/**
 * Render groups list
 */
function renderGroups() {
  const groupsList = document.getElementById('groupsList');
  
  if (tabGroups.length === 0) {
    groupsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <p>No tabs queued</p>
        <p class="hint">Click "Queue All Tabs" to organize your open tabs</p>
      </div>
    `;
    return;
  }
  
  // Separate single-tab groups for unified group
  const regularGroups = tabGroups.filter(g => g.tabs.length > 1);
  const singleTabGroups = tabGroups.filter(g => g.tabs.length === 1);
  
  // Sort groups by tab count (descending)
  regularGroups.sort((a, b) => b.tabs.length - a.tabs.length);
  
  let html = '';
  
  // Render regular groups
  regularGroups.forEach(group => {
    html += renderGroup(group);
  });
  
  // Render unified group if there are single-tab groups
  if (singleTabGroups.length > 0) {
    const unifiedGroup = {
      domain: UNIFIED_GROUP_NAME,
      tabs: singleTabGroups.flatMap(g => g.tabs),
      collapsed: false
    };
    html += renderGroup(unifiedGroup, true);
  }
  
  groupsList.innerHTML = html;
  attachEventListeners();
}

/**
 * Render a single group
 */
function renderGroup(group, isUnified = false) {
  const isCollapsed = group.collapsed || false;
  const tabCount = group.tabs.length;
  const chevron = isCollapsed ? SVG_ICONS.chevronRight : SVG_ICONS.chevronDown;
  
  let html = `
    <div class="group ${isCollapsed ? 'collapsed' : ''}" data-domain="${escapeHtml(group.domain)}" role="listitem">
      <div class="group-header" role="button" aria-expanded="${!isCollapsed}" aria-label="${escapeHtml(group.domain)} group with ${tabCount} tabs">
        <button class="group-toggle" aria-hidden="true" tabindex="-1">
          ${chevron}
        </button>
        <div class="group-title">
          <span class="domain-name">${escapeHtml(group.domain)}</span>
          <span class="tab-count">(${tabCount})</span>
        </div>
      </div>
      <div class="group-content" role="list" aria-label="Tabs in ${escapeHtml(group.domain)}">
  `;
  
  group.tabs.forEach(tab => {
    html += renderTab(tab, group.domain, isUnified);
  });
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

/**
 * Render a single tab
 */
function renderTab(tab, groupDomain, isUnified) {
  const favicon = tab.favicon || '';
  const hasFavicon = !!tab.favicon && isValidFaviconUrl(favicon);
  
  return `
    <div class="tab-item" data-tab-id="${tab.id}" data-url="${escapeHtml(tab.url)}" data-domain="${escapeHtml(groupDomain)}" data-unified="${isUnified}" role="listitem" tabindex="0" aria-label="Open ${escapeHtml(tab.title)}">
      ${hasFavicon 
        ? `<img src="${escapeHtml(favicon)}" alt="" class="tab-favicon" loading="lazy" data-fallback="true" aria-hidden="true">` 
        : `<span class="tab-favicon" aria-hidden="true">${SVG_ICONS.favicon}</span>`
      }
      <div class="tab-info">
        <div class="tab-title">${escapeHtml(tab.title)}</div>
      </div>
      <button class="tab-remove" title="Remove" aria-label="Remove ${escapeHtml(tab.title)} from queue" tabindex="0">
        ${SVG_ICONS.close}
      </button>
    </div>
  `;
}

/**
 * Attach event listeners using delegation
 */
function attachEventListeners() {
  const groupsList = document.getElementById('groupsList');
  
  // Remove existing listener if any
  if (groupsList._clickHandler) {
    groupsList.removeEventListener('click', groupsList._clickHandler);
  }
  if (groupsList._keyHandler) {
    groupsList.removeEventListener('keydown', groupsList._keyHandler);
  }
  
  // Create and store the click handler
  groupsList._clickHandler = (e) => {
    const groupHeader = e.target.closest('.group-header');
    const tabItem = e.target.closest('.tab-item');
    const tabRemove = e.target.closest('.tab-remove');
    
    // Check if clicking on group header (entire header is now clickable)
    if (groupHeader && !tabItem && !tabRemove) {
      const group = groupHeader.closest('.group');
      const domain = group.dataset.domain;
      toggleGroup(domain);
    } else if (tabRemove) {
      e.stopPropagation();
      const tabItem = tabRemove.closest('.tab-item');
      const tabId = tabItem.dataset.tabId;
      const domain = tabItem.dataset.domain;
      const isUnified = tabItem.dataset.unified === 'true';
      removeTab(tabId, domain, isUnified);
    } else if (tabItem) {
      const url = tabItem.dataset.url;
      const tabId = tabItem.dataset.tabId;
      const domain = tabItem.dataset.domain;
      const isUnified = tabItem.dataset.unified === 'true';
      openTabAndRemove(url, tabId, domain, isUnified);
    }
  };
  
  // Create and store the keyboard handler
  groupsList._keyHandler = (e) => {
    const tabItem = e.target.closest('.tab-item');
    const groupHeader = e.target.closest('.group-header');
    
    // Handle Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
      if (tabItem) {
        const url = tabItem.dataset.url;
        const tabId = tabItem.dataset.tabId;
        const domain = tabItem.dataset.domain;
        const isUnified = tabItem.dataset.unified === 'true';
        openTabAndRemove(url, tabId, domain, isUnified);
      } else if (groupHeader) {
        const group = groupHeader.closest('.group');
        const domain = group.dataset.domain;
        toggleGroup(domain);
      }
    }
  };
  
  // Add the new listeners
  groupsList.addEventListener('click', groupsList._clickHandler);
  groupsList.addEventListener('keydown', groupsList._keyHandler);
  
  // Handle favicon errors
  const faviconImages = groupsList.querySelectorAll('img.tab-favicon[data-fallback="true"]');
  faviconImages.forEach(img => {
    img.addEventListener('error', function() {
      // Replace with SVG icon on error
      const span = document.createElement('span');
      span.className = 'tab-favicon';
      span.setAttribute('aria-hidden', 'true');
      span.innerHTML = SVG_ICONS.favicon;
      this.parentNode.replaceChild(span, this);
    }, { once: true }); // Use { once: true } to prevent multiple error handlers
  });
}

/**
 * Toggle group collapse state
 */
function toggleGroup(domain) {
  const group = tabGroups.find(g => g.domain === domain);
  if (group) {
    group.collapsed = !group.collapsed;
    saveGroups();
    renderGroups();
  }
}

/**
 * Open tab and remove from queue
 */
async function openTabAndRemove(url, tabId, domain, isUnified) {
  console.log('Opening tab:', url);
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'openTab', url });
    
    if (response && response.success) {
      // Remove tab from queue
      removeTab(tabId, domain, isUnified);
    } else {
      showError('Failed to open tab. Please try again.');
    }
  } catch (error) {
    console.error('Error opening tab:', error);
    showError('Failed to open tab. Please try again.');
  }
}

/**
 * Remove tab from queue
 */
function removeTab(tabId, domain, isUnified) {
  if (isUnified) {
    // Find and remove from any single-tab group
    tabGroups.forEach(group => {
      if (group.tabs.length === 1) {
        group.tabs = group.tabs.filter(t => t.id !== tabId);
      }
    });
  } else {
    // Remove from specific group
    const group = tabGroups.find(g => g.domain === domain);
    if (group) {
      group.tabs = group.tabs.filter(t => t.id !== tabId);
    }
  }
  
  // Remove empty groups
  tabGroups = tabGroups.filter(g => g.tabs.length > 0);
  
  saveGroups();
  renderGroups();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate favicon URL to prevent XSS
 */
function isValidFaviconUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    // Only allow http, https, and chrome-extension protocols for favicons
    const allowedProtocols = ['http:', 'https:', 'chrome-extension:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Restore all tabs from queue
 */
async function handleRestoreAll() {
  if (tabGroups.length === 0) return;
  
  const totalTabs = getTotalTabCount();
  if (!confirm(`Restore all ${totalTabs} tabs? This will open all queued tabs and clear the queue.`)) {
    return;
  }
  
  const restoreBtn = document.getElementById('restoreAllBtn');
  restoreBtn.disabled = true;
  
  try {
    // Open all tabs
    for (const group of tabGroups) {
      for (const tab of group.tabs) {
        try {
          await chrome.runtime.sendMessage({ action: 'openTab', url: tab.url });
        } catch (error) {
          console.error('Error opening tab:', tab.url, error);
        }
      }
    }
    
    // Clear all groups
    tabGroups = [];
    await saveGroups();
    renderGroups();
  } catch (error) {
    console.error('Error restoring tabs:', error);
    showError('Failed to restore all tabs. Some tabs may not have opened.');
  } finally {
    restoreBtn.disabled = false;
  }
}

/**
 * Toggle expand/collapse all groups
 */
function handleExpandCollapseAll() {
  const allCollapsed = tabGroups.every(g => g.collapsed);
  const expandCollapseText = document.getElementById('expandCollapseText');
  
  // Toggle all groups
  tabGroups.forEach(group => {
    group.collapsed = !allCollapsed;
  });
  
  expandCollapseText.textContent = allCollapsed ? 'Collapse All' : 'Expand All';
  saveGroups();
  renderGroups();
}

/**
 * Get total tab count across all groups
 */
function getTotalTabCount() {
  return tabGroups.reduce((sum, group) => sum + group.tabs.length, 0);
}

/**
 * Update badge count
 */
function updateBadge() {
  chrome.storage.local.get(['tabGroups'], (result) => {
    const groups = result.tabGroups || [];
    const totalTabs = groups.reduce((sum, group) => sum + group.tabs.length, 0);
    
    chrome.runtime.sendMessage({ 
      action: 'updateBadge', 
      count: totalTabs 
    });
  });
}

/**
 * Show error message to user
 */
function showError(message) {
  // Create error toast notification
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}