//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

const UNFILED = "unfiled_____";
const iconPaths = {
  down: "pic/dislike-hilite.svg",
  error: "pic/like-error.svg",
  normal: "pic/like-normal.svg",
  star: "pic/star-hilite.svg",
  up: "pic/like-hilite.svg",
}
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

const getCurrentTab = () =>
  browser.tabs.query({ active: true, currentWindow: true }).then(([x]) => x);

// Get the current state for a URL: { category, bookmarkId }
async function getBookmarkCategory(url) {
  await ensureReady();
  let bookmarks;
  try {
    bookmarks = await browser.bookmarks.search({ url });
  } catch {
    // Couldn't fet bookmarks (a protected page?).
    return { category: 'error', bookmarkId: null };
  }
  // Is paged bookmarked in 👍, or 👎?
  for (const [name, id] of [['up', upFolderId], ['down', downFolderId]]) {
    const found = bookmarks.find(({ parentId }) => parentId === id);
    if (found) {
      return { category: name, bookmarkId: found.id };
    }
  }
  // Page has at least one bookmark elsewhere.
  if (bookmarks.length > 0) {
    const [{ id }] = bookmarks;
    return { category: "star", bookmarkId: id };
  }
  // Page not bookmarked at all.
  return { category: null, bookmarkId: null };
}

// Get state & update button icon
async function getState(tabId, url) {
  const state = await getBookmarkCategory(url);
  const [title, popup] = state.category === 'error'
    ? ["Unsupported Page", ""] : [null, null];
  await browser.action.setTitle({ tabId, title });
  await browser.action.setPopup({ tabId, popup }); // enable/disable popup
  await browser.action.setIcon ({ tabId, path: iconPaths[state.category] });
  return state;
}

// ---- Handle messages from popup ----
browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "getState") {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) return { category: null, bookmarkId: null };
    return await getState(tab.id, tab.url);
  }
  if (msg.type === "setCategory") {
    const { category } = msg;
    const { id, url, title } = await getCurrentTab();
    const state = await getState(id, url);
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
          title: title ?? url,
          url
        });
      }
    }
    return { success: true };
  }
});

// When tab was updated
browser.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
  if (status !== "complete") { return }
  getState(tabId, url);
});
browser.tabs.onActivated.addListener(({ tabId }) => {
  browser.tabs.get(tabId).then(({ id, url }) => getState(id, url));
});

// When a bookmark change
function refreshActiveTabIcon() {
  getCurrentTab().then(({ id, url }) => getState(id, url));
}
browser.bookmarks.onCreated.addListener(refreshActiveTabIcon);
browser.bookmarks.onRemoved.addListener(refreshActiveTabIcon);
browser.bookmarks.onMoved.addListener(refreshActiveTabIcon);

// When extension is loaded
getCurrentTab().then(({ id, url }) => getState(id, url));

//EOF
