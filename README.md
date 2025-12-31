# TabQueue

> Organize all your browser tabs by domain into a persistent, manageable queue.

A Chrome Extension that transforms your chaotic multi-tab workflow into an organized, domain-categorized system with automatic tab management and persistent storage.

---

## Problem

Knowledge workers, developers, and researchers often open **dozens of tabs across multiple windows**, but:

- Tabs accumulate and become overwhelming
- No easy way to organize tabs by domain/website
- Important tabs get lost in the clutter
- Closing tabs means losing context
- No persistent organization exists across browser restarts

**Result:** Browser slowdown, lost context, and difficulty managing multiple research sessions or projects.

---

## Solution

**TabQueue** is a tab management and organization tool that:

- Automatically captures all open tabs (excluding pinned) from all windows
- Organizes tabs by domain into categorized groups
- Displays tabs in a minimal, space-efficient sidebar
- Allows one-click tab restoration from the queue
- Automatically closes tabs once added to the queue
- Removes tabs from the queue once successfully opened
- Persists tab organization across browser restarts (local-first)

---

## Features

### Core Features (MVP)

| Feature | Description |
|---------|-------------|
| **Auto Tab Capture** | One-click capture of all open tabs from all windows |
| **Domain Grouping** | Automatically organizes tabs by domain (e.g., github.com, stackoverflow.com) |
| **Tab Count Display** | Shows number of tabs in each domain group |
| **Unified Group** | Single tabs without group go into "Other Sites" |
| **Auto Tab Close** | Automatically closes tabs after adding to queue |
| **Auto Remove on Open** | Removes tabs from queue when successfully opened |
| **Minimal UI** | Space-efficient design with inline SVG icons (no emoji) |
| **Collapsible Groups** | Expand/collapse domain groups for better organization |
| **Persistent Storage** | Local-first queue preservation across restarts |

### Post-MVP Enhancements

- Search/filter tabs across all groups
- Bulk operations (open all in group, delete group)
- Custom group naming
- Drag & drop reordering within groups
- Export queue as bookmarks or JSON
- Tab visit frequency tracking
- Auto-archive old tabs
- Keyboard shortcuts
- Session snapshots

---

## How It Works

### 1. Capture
1. Open multiple tabs across different windows
2. Click **"Queue All Tabs"** in extension toolbar
3. All tabs (excluding pinned) are extracted, grouped by domain, and queued
4. **Tabs are automatically closed** after being added to queue
5. Sidebar opens automatically showing organized groups

### 2. Browse & Open
1. Sidebar displays domain groups with tab counts (e.g., "github.com (5)")
2. Groups are collapsible for better space management
3. Click any tab to open it in a new browser tab
4. **Tab is removed from queue** upon successful opening
5. Manual remove option available (X button)

### 3. Persist
- Close browser → Reopen browser
- Queue state fully restored with all domain groups and tabs preserved

---

## Technical Architecture

```
Chrome Extension (Manifest V3)
├─ Service Worker
│  ├─ Tab scanning & collection
│  ├─ Tab closing automation
│  └─ Queue state management
│
├─ Sidebar (HTML + Vanilla JS)
│  ├─ Domain-grouped list UI
│  ├─ Collapsible groups
│  └─ Minimal design with inline SVG
│
└─ Storage Layer
   └─ chrome.storage.local
```

**Tech Stack:** Vanilla HTML/CSS/JavaScript (no frameworks)

---

## Requirements

- **Browser:** Chrome (Manifest V3 compatible)
- **Permissions:**
  - `tabs` - Scan open tabs from all windows
  - `storage` - Persist queue locally
  - `sidePanel` - Display sidebar UI

---

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/browser-extension-TabQueue.git
   cd browser-extension-TabQueue
   ```

2. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the extension directory

3. Pin the extension to your toolbar for easy access

### For Users

*(Coming soon: Chrome Web Store link)*

---

## Usage

1. **Capture Tabs:**
   - Open tabs across different websites
   - Click the TabQueue icon
   - Select "Queue All Tabs"
   - Tabs will be closed and added to organized groups

2. **Manage Queue:**
   - View tabs organized by domain in right sidebar
   - See tab count for each domain group (e.g., "github.com (5)")
   - Expand/collapse groups as needed
   - Click any tab to open it (auto-removes from queue)
   - Remove tabs manually with the X button

3. **Unified Group:**
   - Single tabs without domain partners go to "Other Sites"
   - Keeps your queue organized even for one-off tabs

---

## Target Users

### Primary
- Developers & Engineers (managing documentation, Stack Overflow, GitHub tabs)
- Knowledge workers (research across multiple sites)
- Students & self-learners (organizing learning resources)
- Product/UX researchers (competitive analysis tabs)

### Secondary
- Content creators (managing reference materials)
- Anyone with 20+ open tabs regularly

---

## Design Principles

- **Workflow-first, not browser-centric** - Enhances tab management without replacing browser functionality
- **Local-first persistence** - No external servers, no data leakage
- **Minimal permissions** - Only what's absolutely necessary
- **Deterministic behavior** - Predictable and reliable queue management
- **Minimal UI with maximum utility** - Space-efficient, distraction-free interface

---

## Success Metrics

- Tab capture: < 1 click, < 300ms for 50 tabs
- Zero queue loss after browser restart
- Tab opening reliability: 100%
- Minimal UI with high information density

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Acknowledgments

Built to solve a real daily workflow pain for knowledge workers everywhere. Inspired by the need for better browser-level tab management and organization.

---

## Contact

**Issues:** [GitHub Issues](https://github.com/yourusername/browser-extension-TabQueue/issues)

---

**Made for productivity-focused professionals**
