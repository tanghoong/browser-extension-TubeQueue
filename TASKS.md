# TubeQueue Sidebar - Implementation Tasks

> Task breakdown for MVP development of the TubeQueue Chrome Extension

---

## 📦 Phase 1: Project Setup & Foundation

### 1.1 Extension Scaffolding
- [ ] Create project directory structure
- [ ] Initialize `manifest.json` (Manifest V3)
  - Define extension metadata (name, version, description)
  - Configure permissions: `tabs`, `storage`, `sidePanel`
  - Set up service worker
  - Configure sidebar panel
- [ ] Create basic HTML files:
  - `sidebar.html` (main sidebar UI)
  - `popup.html` (extension popup, optional)
- [ ] Create placeholder JavaScript files:
  - `service-worker.js` (background logic)
  - `sidebar.js` (sidebar UI logic)
- [ ] Create `styles.css` for sidebar styling
- [ ] Add extension icons (16x16, 32x32, 48x48, 128x128)

### 1.2 Development Environment
- [ ] Set up Git repository
- [ ] Create `.gitignore` file
- [ ] Load extension in Chrome for testing
- [ ] Verify basic extension loads without errors

**Deliverable:** Working extension skeleton that can be loaded in Chrome

---

## 🎯 Phase 2: Tab Capture & Queue Management

### 2.1 YouTube Tab Detection
- [ ] Implement tab scanning in service worker
  - Query all open tabs using `chrome.tabs.query()`
  - Filter for YouTube video URLs (pattern: `youtube.com/watch?v=*`)
  - Extract video IDs from URLs
- [ ] Create tab data extraction function
  - Parse `videoId` from URL
  - Extract video title from tab title
  - Generate thumbnail URL from `videoId`
- [ ] Add deduplication logic
  - Check for duplicate `videoId` values
  - Skip already queued videos

### 2.2 Queue State Management
- [ ] Design queue data structure
  ```javascript
  {
    videos: [
      {
        id: "videoId",
        title: "Video Title",
        thumbnail: "https://...",
        duration: null, // optional
        status: "pending" | "completed",
        addedAt: timestamp
      }
    ],
    currentIndex: 0,
    lastUpdated: timestamp
  }
  ```
- [ ] Implement queue operations:
  - Add videos to queue
  - Remove video by ID
  - Mark video as completed
  - Get next/previous video
  - Clear completed videos (optional)
- [ ] Add sorting functionality
  - Default: by `addedAt` (chronological)
  - Optional: by title (alphabetical)

### 2.3 Storage Integration
- [ ] Implement `chrome.storage.local` wrapper functions
  - `saveQueue(queueData)`
  - `loadQueue()`
  - `updateVideoStatus(videoId, status)`
  - `removeVideo(videoId)`
- [ ] Add storage error handling
- [ ] Test persistence across browser restarts

**Deliverable:** Functional tab capture system with persistent queue storage

---

## 🎨 Phase 3: Sidebar UI Development

### 3.1 Sidebar Layout
- [ ] Create HTML structure in `sidebar.html`
  - Top section: YouTube player container
  - Bottom section: Scrollable queue list
  - Header: Queue title and controls
- [ ] Style sidebar with CSS
  - Responsive layout (player + list)
  - Dark/light theme (optional)
  - Scrollable queue area
  - Fixed player section

### 3.2 YouTube Player Integration
- [ ] Embed YouTube iframe player
  ```html
  <iframe id="player" 
          src="https://www.youtube.com/embed/VIDEO_ID?enablejsapi=1" 
          frameborder="0" 
          allow="autoplay; picture-in-picture">
  </iframe>
  ```
- [ ] Initialize YouTube IFrame API
- [ ] Implement player event listeners:
  - `onReady` - Player initialization
  - `onStateChange` - Play/pause/ended detection
  - `onEnded` - Trigger auto-advance
- [ ] Create player control functions:
  - `loadVideo(videoId)`
  - `playVideo()`
  - `pauseVideo()`
  - `getPlayerState()`

### 3.3 Queue List UI
- [ ] Create queue item template
  ```html
  <div class="queue-item" data-video-id="...">
    <img src="thumbnail" alt="thumbnail">
    <div class="info">
      <h3>Video Title</h3>
      <span class="status">⏳ Pending</span>
    </div>
    <button class="play-btn">▶</button>
    <button class="remove-btn">❌</button>
  </div>
  ```
- [ ] Render queue list dynamically
  - Iterate through queue data
  - Highlight currently playing video
  - Show completion status icons
- [ ] Add item interaction handlers:
  - Click to play specific video
  - Remove button functionality
  - Visual feedback (hover, active states)

### 3.4 UI Controls
- [ ] Add playback controls to sidebar
  - Play/Pause button
  - Next button
  - Previous button
- [ ] Add queue management buttons
  - "Capture Tabs" button
  - "Clear Completed" button (optional)
- [ ] Implement control event handlers

**Deliverable:** Fully functional sidebar UI with player and queue list

---

## ⚡ Phase 4: Playback Logic & Auto-Advance

### 4.1 Video Playback Management
- [ ] Implement video loading sequence
  - Load video into player by `videoId`
  - Update current index in queue state
  - Highlight current video in UI
- [ ] Handle manual navigation
  - Next video: Load `queue[currentIndex + 1]`
  - Previous video: Load `queue[currentIndex - 1]`
  - Boundary checks (first/last video)

### 4.2 Auto-Advance Logic
- [ ] Listen for `onEnded` event from YouTube player
- [ ] Implement 5-second delay timer
  ```javascript
  player.addEventListener('onStateChange', (event) => {
    if (event.data === YT.PlayerState.ENDED) {
      markAsCompleted(currentVideoId);
      setTimeout(() => {
        playNextVideo();
      }, 5000);
    }
  });
  ```
- [ ] Update video status to "completed"
- [ ] Auto-load next pending video
- [ ] Handle end of queue (stop or loop - TBD)

### 4.3 Completion Tracking
- [ ] Mark video as completed when ended
  - Update queue data structure
  - Save to `chrome.storage.local`
  - Update UI status icon (⏳ → ✅)
- [ ] Add visual indicators
  - Completed: Green checkmark ✅
  - Pending: Hourglass ⏳
  - Currently playing: Highlight/border
- [ ] Test completion state persistence

**Deliverable:** Reliable auto-advance system with completion tracking

---

## 🖼️ Phase 5: Picture-in-Picture (PiP)

### 5.1 PiP Window Creation
- [ ] Add PiP button to sidebar player
- [ ] Implement PiP trigger using Document Picture-in-Picture API
  ```javascript
  const pipWindow = await documentPictureInPicture.requestWindow({
    width: 400,
    height: 300
  });
  ```
- [ ] Clone player into PiP window
- [ ] Maintain player state during transition

### 5.2 PiP Controls
- [ ] Add control overlay to PiP window
  - Play/Pause button
  - Next button
  - Previous button
  - Close PiP button
- [ ] Sync controls with main queue
  - Control actions update queue state
  - Queue state updates reflect in PiP
- [ ] Handle PiP window close event
  - Return player to sidebar
  - Maintain playback position

### 5.3 Queue-Aware PiP
- [ ] Enable auto-advance in PiP mode
- [ ] Sync completion tracking
- [ ] Test PiP across tab switches
- [ ] Ensure PiP persists independently of sidebar

**Deliverable:** Functional Picture-in-Picture with queue awareness

---

## 🔧 Phase 6: Service Worker & Messaging

### 6.1 Background Service Worker
- [ ] Implement tab capture handler
  ```javascript
  chrome.action.onClicked.addListener(async () => {
    const tabs = await chrome.tabs.query({ url: "*://www.youtube.com/watch?v=*" });
    const videos = extractVideosFromTabs(tabs);
    await addToQueue(videos);
    await openSidebar();
  });
  ```
- [ ] Add message passing between sidebar and service worker
  - Request tab capture
  - Queue updates
  - State synchronization
- [ ] Handle extension icon click
  - Open sidebar
  - Show badge count (optional)

### 6.2 Sidebar Initialization
- [ ] Load queue data on sidebar open
- [ ] Restore last played video position
- [ ] Initialize player with current video
- [ ] Render queue list

**Deliverable:** Working communication between components

---

## ✅ Phase 7: Testing & Polish

### 7.1 Functional Testing
- [ ] Test tab capture with 1, 10, 20+ tabs
- [ ] Verify deduplication works correctly
- [ ] Test auto-advance through entire queue
- [ ] Verify completion tracking persists
- [ ] Test PiP functionality across tabs
- [ ] Test browser restart persistence
- [ ] Check edge cases:
  - Empty queue
  - Single video
  - All videos completed
  - Invalid YouTube URLs

### 7.2 Performance Testing
- [ ] Measure tab capture speed (target: < 200ms for 20 tabs)
- [ ] Test storage limits (large queues)
- [ ] Check memory usage in PiP mode
- [ ] Verify no memory leaks

### 7.3 Error Handling
- [ ] Handle invalid YouTube URLs gracefully
- [ ] Add error states for player failures
- [ ] Handle storage quota errors
- [ ] Add user-friendly error messages

### 7.4 UI/UX Polish
- [ ] Improve visual design
  - Consistent spacing and typography
  - Smooth transitions and animations
  - Responsive layout adjustments
- [ ] Add loading states
- [ ] Add empty state messaging
- [ ] Improve accessibility (ARIA labels, keyboard navigation)

### 7.5 Documentation
- [ ] Complete README.md with usage instructions
- [ ] Add inline code comments
- [ ] Create demo screenshots/GIF
- [ ] Write installation guide

**Deliverable:** Production-ready MVP

---

## 🚀 Phase 8: Post-MVP Enhancements (Future)

### Priority 1
- [ ] Resume playback position
- [ ] Skip already completed videos option
- [ ] Drag & drop reordering

### Priority 2
- [ ] Focus Mode (hide YouTube distractions)
- [ ] Queue export (Markdown/CSV)
- [ ] Session naming functionality

### Priority 3
- [ ] Watch-time analytics dashboard
- [ ] AI summary integration per video
- [ ] Smart video suggestions based on queue

---

## 📊 Success Criteria

**MVP is complete when:**
- ✅ Can capture 20 YouTube tabs in < 200ms
- ✅ Queue persists across browser restarts with zero data loss
- ✅ Auto-advance works 100% reliably
- ✅ PiP functions independently of sidebar
- ✅ All core features documented and tested

---

## 🛠️ Development Notes

**Tech Stack:**
- Vanilla JavaScript (ES6+)
- Chrome Extension Manifest V3
- YouTube IFrame Player API
- Document Picture-in-Picture API
- Chrome Storage API

**No external frameworks or libraries required for MVP.**

---

## 📅 Estimated Timeline

| Phase | Estimated Time |
|-------|----------------|
| Phase 1 | 2-4 hours |
| Phase 2 | 4-6 hours |
| Phase 3 | 6-8 hours |
| Phase 4 | 3-4 hours |
| Phase 5 | 4-6 hours |
| Phase 6 | 2-3 hours |
| Phase 7 | 4-6 hours |
| **Total MVP** | **25-37 hours** |

*Note: Times are estimates for an experienced developer. Adjust based on familiarity with Chrome Extensions and YouTube API.*

---

**Last Updated:** December 31, 2025
