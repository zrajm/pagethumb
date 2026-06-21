const UNFILED = "unfiled_____";
let upFolderId, downFolderId;

// ----- Auto‑detect which button this is -----
const manifest = browser.runtime.getManifest();
const myVote = manifest.name.includes("Down") ? "down" : "up";

// Initialisation promise – ensures folders exist before any vote logic
let readyPromise = (async () => {
  let results = await browser.bookmarks.search({ title: "👍" });
  upFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id;
  if (!upFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👍", type: "folder" });
    upFolderId = folder.id;
  }
  results = await browser.bookmarks.search({ title: "👎" });
  downFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id;
  if (!downFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👎", type: "folder" });
    downFolderId = folder.id;
  }
})();

// Utility: wait for folders
async function ensureReady() {
  await readyPromise;
}

// Get the current vote for a URL
async function getVote(url) {
  await ensureReady();
  const bookmarks = await browser.bookmarks.search({ url });
  for (const bm of bookmarks) {
    if (bm.parentId === upFolderId) return "up";
    if (bm.parentId === downFolderId) return "down";
  }
  return null;
}

// Update this extension's page action icon
async function updateIcon(tabId, url) {
  if (!/^https?:\/\//i.test(url)) return;
  await ensureReady();
  const vote = await getVote(url);
  const icon = (vote === myVote) ? "hilite.svg" : "normal.svg";
  await browser.pageAction.setIcon({ tabId, path: icon });
  await browser.pageAction.show(tabId);
}

// ---- Click handler (exactly as specified) ----
browser.pageAction.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.startsWith("http")) return;
  await ensureReady();

  const url = tab.url;
  // Find any existing bookmark in our folders
  const bookmarks = await browser.bookmarks.search({ url });
  let currentVote = null;
  for (const bm of bookmarks) {
    if (bm.parentId === upFolderId) currentVote = "up";
    else if (bm.parentId === downFolderId) currentVote = "down";
    if (currentVote) break;
  }

  // Remove all existing bookmarks for this URL (from both folders)
  for (const bm of bookmarks) {
    if (bm.parentId === upFolderId || bm.parentId === downFolderId) {
      await browser.bookmarks.remove(bm.id);
    }
  }

  const myFolder = myVote === "up" ? upFolderId : downFolderId;
  const otherVote = myVote === "down" ? "up" : "down";

  // Now apply the rule
  if (currentVote === null) {
    // No button selected → bookmark in this folder
    await browser.bookmarks.create({ parentId: myFolder, title: tab.title || url, url });
  } else if (currentVote === otherVote) {
    // Other button selected → move to this folder
    await browser.bookmarks.create({ parentId: myFolder, title: tab.title || url, url });
  }
  // If currentVote === myVote, we already removed everything – that deselects
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

// ---- Bookmark events (update icon immediately) ----
browser.bookmarks.onCreated.addListener(async (id, bookmark) => {
  await ensureReady();
  const myFolder = myVote === "up" ? upFolderId : downFolderId;
  // Only react if the bookmark was added to our folder
  if (bookmark.parentId !== myFolder) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url === bookmark.url) updateIcon(tab.id, tab.url);
});

browser.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
  await ensureReady();
  const myFolder = myVote === "up" ? upFolderId : downFolderId;
  // Only react if the removed bookmark was from our folder
  if (removeInfo.node.parentId !== myFolder) return;
  const url = removeInfo.node.url;
  if (!url) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url === url) updateIcon(tab.id, tab.url);
});
