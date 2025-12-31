# Installation & Testing Guide

## Quick Start - Load Extension in Chrome

### Step 1: Create Temporary Icons
Since we don't have icon files yet, create simple placeholders:

**Windows (PowerShell):**
```powershell
cd icons
# This creates empty files - Chrome will use default icons
New-Item icon16.png, icon32.png, icon48.png, icon128.png
```

Or skip this step - the extension will load without icons (Chrome will show a default icon).

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to your project folder:
   ```
   C:\Users\user\Documents\GitHub\browser-extension-TubeQueue
   ```
6. Click **"Select Folder"**

### Step 3: Verify Installation

✅ You should see:
- Extension card titled "TubeQueue Sidebar"
- Version 1.0.0
- "Turn scattered YouTube tabs into a persistent, focused watch queue"

⚠️ If you see errors:
- Check the errors panel in chrome://extensions/
- Most common: Missing icon files (safe to ignore for now)
- Click "Errors" button to see detailed logs

### Step 4: Pin Extension (Optional but Recommended)

1. Click the **puzzle piece icon** in Chrome toolbar
2. Find "TubeQueue Sidebar"
3. Click the **pin icon** next to it

## Testing the Extension

### Test 1: Open Sidebar
1. Click the TubeQueue icon in toolbar
2. Sidebar should open on the right side
3. You should see "No videos in queue" message

### Test 2: Capture YouTube Tabs
1. Open multiple YouTube video tabs, for example:
   - https://www.youtube.com/watch?v=dQw4w9WgXcQ
   - https://www.youtube.com/watch?v=9bZkp7q19f0
   - https://www.youtube.com/watch?v=kJQP7kiw5Fk

2. Click TubeQueue icon to open sidebar
3. Click **"📹 Capture Tabs"** button
4. Videos should appear in the queue list

### Test 3: Playback
1. Click the ▶️ play button on any video
2. Video should load in the embedded player
3. Test Next/Previous buttons
4. Let a video play to the end (or skip to end)
5. It should mark as ✅ Completed
6. After 5 seconds, next video should auto-play

### Test 4: Persistence
1. Add videos to queue
2. Close Chrome completely
3. Reopen Chrome
4. Open TubeQueue sidebar
5. Queue should be restored with all videos

## Viewing Console Logs

To debug issues:

**Service Worker Logs:**
1. Go to `chrome://extensions/`
2. Find TubeQueue
3. Click "service worker" link
4. Developer console opens

**Sidebar Logs:**
1. Open TubeQueue sidebar
2. Right-click in sidebar area
3. Select "Inspect"
4. Check Console tab

## Common Issues & Fixes

### Icons not showing
- Expected on first run
- Create placeholder .png files in icons/ folder
- Or download proper icons later

### Sidebar won't open
- Check service worker for errors
- Verify manifest.json is valid
- Check Chrome version supports sidePanel API (Chrome 114+)

### Videos not captured
- Ensure YouTube tabs are fully loaded
- Check that URLs match pattern: `youtube.com/watch?v=*`
- Check service worker console for errors

### Player not loading
- Check internet connection
- Verify YouTube IFrame API loaded (check Network tab)
- Check for Content Security Policy errors

## Next Steps

Once basic testing works:
- [ ] Add proper icons to icons/ folder
- [ ] Test with 10+ YouTube tabs
- [ ] Test edge cases (invalid URLs, shorts, playlists)
- [ ] Begin Phase 2 enhancements

---

**Happy testing! 🚀**
