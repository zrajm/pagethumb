const UNFILED = "unfiled_____";
let upFolderId, downFolderId, starFolderId;

// Initialisation – create three folders
let readyPromise = (async () => {
  // 👍 folder
  let results = await browser.bookmarks.search({ title: "👍" });
  upFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id;
  if (!upFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👍", type: "folder" });
    upFolderId = folder.id;
  }
  // 👎 folder
  results = await browser.bookmarks.search({ title: "👎" });
  downFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id;
  if (!downFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👎", type: "folder" });
    downFolderId = folder.id;
  }
  // ⭐ folder
  results = await browser.bookmarks.search({ title: "⭐" });
  starFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id;
  if (!starFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "⭐", type: "folder" });
    starFolderId = folder.id;
  }
})();

// Utility: wait for folders
async function ensureReady() {
  await readyPromise;
}

// Get the current state for a URL: { category, bookmarkId }
async function getState(url) {
  await ensureReady();
  const bookmarks = await browser.bookmarks.search({ url });
  for (const bm of bookmarks) {
    if (bm.parentId === upFolderId) return { category: "up", bookmarkId: bm.id };
  }
  for (const bm of bookmarks) {
    if (bm.parentId === downFolderId) return { category: "down", bookmarkId: bm.id };
  }
  // Any bookmark (anywhere) triggers "star"
  const first = bookmarks[0];
  if (first) return { category: "star", bookmarkId: first.id };
  return { category: null, bookmarkId: null };
}

// Update this extension's page action icon
async function updateIcon(tabId, url) {
  // --- Unsupported URL (non‑HTTP) ---
  if (!url || !/^https?:\/\//i.test(url)) {
    await browser.action.setIcon({ tabId, path: "pic/like-error.svg" });
    await browser.action.setTitle({ tabId, title: "Unsupported URL" });
    // Disable popup for this tab (click does nothing)
    await browser.action.setPopup({ tabId, popup: "" });
    return;
  }

  // --- Supported URL ---
  await ensureReady();
  const state = await getState(url);
  let iconPath;
  if (state.category === "up") iconPath = "pic/like-hilite.svg";
  else if (state.category === "down") iconPath = "pic/dislike-hilite.svg";
  else if (state.category === "star") iconPath = "pic/star-hilite.svg";
  else iconPath = "pic/like-normal.svg";
  await browser.action.setIcon({ tabId, path: iconPath });
  // Restore default tooltip (from manifest)
  await browser.action.setPopup({ tabId, popup: null });
}

// ---- Handle messages from popup ----
browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "getState") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return { category: null, bookmarkId: null };
    return await getState(tab.url);
  }

  if (msg.type === "setCategory") {
    const { category } = msg;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;
    const url = tab.url;
    const state = await getState(url);

    const targetFolder = category === "up" ? upFolderId :
                         category === "down" ? downFolderId : starFolderId;

    if (state.category === category) {
      // Active – remove the bookmark
      if (state.bookmarkId) {
        await browser.bookmarks.remove(state.bookmarkId);
      }
    } else {
      // Inactive – move or create
      if (state.bookmarkId) {
        // Move existing bookmark to target folder
        await browser.bookmarks.move(state.bookmarkId, { parentId: targetFolder });
      } else {
        // No bookmark at all – create new
        await browser.bookmarks.create({
          parentId: targetFolder,
          title: tab.title || url,
          url
        });
      }
    }
    // Update icon for this tab
    await updateIcon(tab.id, url);
    return { success: true };
  }
});

// ---- Tab events ----
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) updateIcon(tabId, tab.url);
});
browser.tabs.onActivated.addListener(activeInfo => {
  browser.tabs.get(activeInfo.tabId).then(tab => {
    if (tab.url) updateIcon(tab.id, tab.url);
  });
});

// ---- Bookmark events (update icon) ----
async function refreshActiveTabIcon() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) updateIcon(tab.id, tab.url);
}

browser.bookmarks.onCreated.addListener(refreshActiveTabIcon);
browser.bookmarks.onRemoved.addListener(refreshActiveTabIcon);
browser.bookmarks.onMoved.addListener(refreshActiveTabIcon);

// ---- Update icon when loading the extension ----
browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
  if (tabs.length > 0 && tabs[0].url) {
    updateIcon(tabs[0].id, tabs[0].url);
  }
});

//EOF
