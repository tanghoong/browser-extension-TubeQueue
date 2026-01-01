// TabQueue Service Worker - Background Logic

console.log('TabQueue service worker loaded');

/**
 * Extension icon clicked - open sidebar
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked');
  
  // Open the side panel (Chrome handles toggle automatically)
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

/**
 * Handle messages from sidebar
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'captureTabs') {
    captureAndCloseTabs().then(result => {
      sendResponse({ success: true, ...result });
    }).catch(error => {
      console.error('Error capturing tabs:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'openTab') {
    openTab(request.url).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error opening tab:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'updateBadge') {
    const count = request.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Capture all open tabs (excluding pinned) from all windows and close them
 */
async function captureAndCloseTabs() {
  console.log('Capturing tabs from all windows...');
  
  try {
    // Query all tabs from ALL windows (excluding pinned tabs)
    // Remove currentWindow parameter to get tabs from all windows
    const allTabs = await chrome.tabs.query({ 
      pinned: false
    });
    
    console.log(`Found ${allTabs.length} non-pinned tabs across all windows`);
    console.log('Tabs:', allTabs.map(t => ({ title: t.title, url: t.url })));
    
    if (allTabs.length === 0) {
      console.log('No tabs to capture');
      return { count: 0, groups: [], closedCount: 0 };
    }
    
    // Extract tab data and group by domain
    const tabs = allTabs
      .map(tab => extractTabData(tab))
      .filter(t => t !== null);
    
    console.log(`Extracted ${tabs.length} valid tabs (filtered out ${allTabs.length - tabs.length} internal tabs)`);
    
    if (tabs.length === 0) {
      console.log('No valid tabs to queue after filtering');
      return { count: 0, groups: [], closedCount: 0 };
    }
    
    // Group tabs by domain
    const groupedTabs = groupTabsByDomain(tabs);
    console.log(`Grouped into ${groupedTabs.length} domain groups`);
    
    // Get current queue
    const result = await chrome.storage.local.get(['tabGroups']);
    let existingGroups = result.tabGroups || [];
    console.log(`Existing groups: ${existingGroups.length}`);
    
    // Merge new tabs with existing groups
    const mergedGroups = mergeTabGroups(existingGroups, groupedTabs);
    console.log(`After merge: ${mergedGroups.length} total groups`);
    
    // Auto-sort groups by tab count (descending) and tabs within each group by title
    const sortedGroups = sortGroups(mergedGroups);
    console.log('Groups sorted');
    
    // Save updated groups
    await chrome.storage.local.set({ tabGroups: sortedGroups });
    console.log('Groups saved to storage');
    
    // Update badge with total tab count
    updateBadgeCount(sortedGroups);
    
    // Close all captured tabs (exclude sidebar tab itself)
    const tabIdsToClose = allTabs
      .filter(tab => !tab.url.includes('sidebar.html'))
      .map(tab => tab.id);
    
    if (tabIdsToClose.length > 0) {
      await chrome.tabs.remove(tabIdsToClose);
      console.log(`Closed ${tabIdsToClose.length} tabs`);
    }
    
    return { 
      count: tabs.length, 
      groups: sortedGroups,
      closedCount: tabIdsToClose.length
    };
    
  } catch (error) {
    console.error('Error capturing tabs:', error);
    throw error;
  }
}

/**
 * Extract tab data from browser tab
 */
function extractTabData(tab) {
  try {
    const url = new URL(tab.url);
    
    // Block dangerous protocols and internal Chrome pages
    const dangerousProtocols = ['chrome:', 'chrome-extension:', 'javascript:', 'data:', 'vbscript:', 'about:'];
    if (dangerousProtocols.some(proto => url.protocol === proto)) {
      return null;
    }
    
    let domain;
    let title = tab.title;
    
    // Handle local file:// URLs
    if (url.protocol === 'file:') {
      domain = 'Local Files';
      // Extract filename from path
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1] || 'file';
      title = title || decodeURIComponent(filename);
    } else {
      // All domains allowed: google.com, youtube.com, github.com, etc.
      domain = url.hostname.replace(/^www\./, '');
      title = title || url.hostname;
    }
    
    return {
      id: generateId(),
      url: tab.url,
      title: title,
      favicon: tab.favIconUrl || '',
      domain: domain,
      addedAt: Date.now()
    };
  } catch (error) {
    console.error('Error extracting tab data:', tab, error);
    return null;
  }
}

/**
 * Group tabs by domain
 */
function groupTabsByDomain(tabs) {
  const groups = {};
  
  tabs.forEach(tab => {
    const domain = tab.domain;
    
    if (!groups[domain]) {
      groups[domain] = {
        domain: domain,
        tabs: [],
        collapsed: false
      };
    }
    
    groups[domain].tabs.push(tab);
  });
  
  return Object.values(groups);
}

/**
 * Merge new tab groups with existing ones
 */
function mergeTabGroups(existing, newGroups) {
  const groupMap = {};
  
  // Add existing groups to map
  existing.forEach(group => {
    groupMap[group.domain] = group;
  });
  
  // Merge new groups
  newGroups.forEach(newGroup => {
    if (groupMap[newGroup.domain]) {
      // Merge tabs, avoiding duplicates by URL
      const existingUrls = new Set(groupMap[newGroup.domain].tabs.map(t => t.url));
      const newTabs = newGroup.tabs.filter(t => !existingUrls.has(t.url));
      groupMap[newGroup.domain].tabs.push(...newTabs);
    } else {
      // New group
      groupMap[newGroup.domain] = newGroup;
    }
  });
  
  return Object.values(groupMap);
}

/**
 * Open a tab from the queue
 */
async function openTab(url) {
  try {
    // Validate URL before opening (consistent with extractTabData)
    const parsedUrl = new URL(url);
    const dangerousProtocols = ['chrome:', 'chrome-extension:', 'javascript:', 'data:', 'vbscript:', 'about:'];
    
    if (dangerousProtocols.includes(parsedUrl.protocol)) {
      console.error('Blocked attempt to open dangerous URL:', url);
      throw new Error('Cannot open URL with dangerous protocol');
    }
    
    await chrome.tabs.create({ url: url });
    console.log('Tab opened:', url);
  } catch (error) {
    console.error('Error opening tab:', error);
    throw error;
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('TabQueue installed:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize storage with empty groups
    chrome.storage.local.set({
      tabGroups: []
    });
    chrome.action.setBadgeText({ text: '' });
  }
});

/**
 * Sort groups by tab count (descending) and tabs within each group alphabetically
 */
function sortGroups(groups) {
  // Sort each group's tabs alphabetically by title
  groups.forEach(group => {
    group.tabs.sort((a, b) => a.title.localeCompare(b.title));
  });
  
  // Sort groups by tab count (descending)
  groups.sort((a, b) => b.tabs.length - a.tabs.length);
  
  return groups;
}

/**
 * Update extension badge with total tab count
 */
function updateBadgeCount(groups) {
  const totalTabs = groups.reduce((sum, group) => sum + group.tabs.length, 0);
  
  if (totalTabs > 0) {
    chrome.action.setBadgeText({ text: totalTabs.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge count on startup
chrome.storage.local.get(['tabGroups'], (result) => {
  const groups = result.tabGroups || [];
  updateBadgeCount(groups);
});
