//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, errorIcon, defaultIcon, folderIcons } from './shared.js'

const UNFILED = "unfiled_____"
let upFolderId, downFolderId, starFolderId

function getYoutubeVideoId(url) {
  try {
    const url = new URL(url)
    if (!url.hostname.includes('youtube.com')) { return null }
    const v = url.searchParams.get('v')        // video id parameter
    if (v) { return v }
    // Handle /shorts/ paths (convert to watch?v=ID)
    const match = url.pathname.match(/^\/shorts\/([^/?]+)/)
    if (match) { return match[1] }
    return null
  } catch (_) {
    return null
  }
}

function normalizeYoutubeUrl(url) {
  const id = getYoutubeVideoId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : url
}

// Initialisation – create three folders
let readyPromise = (async () => {
  // 👍 folder
  let results = await browser.bookmarks.search({ title: "👍" })
  upFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id
  if (!upFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👍", type: "folder" })
    upFolderId = folder.id
  }
  // 👎 folder
  results = await browser.bookmarks.search({ title: "👎" })
  downFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id
  if (!downFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "👎", type: "folder" })
    downFolderId = folder.id
  }
  // ⭐ folder
  results = await browser.bookmarks.search({ title: "⭐" })
  starFolderId = results.find(f => f.type === "folder" && f.parentId === UNFILED)?.id
  if (!starFolderId) {
    const folder = await browser.bookmarks.create({ parentId: UNFILED, title: "⭐", type: "folder" })
    starFolderId = folder.id
  }
})()

// Utility: wait for folders
async function ensureReady() {
  await readyPromise
}

// Get the current state for a URL: { folder, bookmarkIds }
async function getBookmarkFolder(url) {
  await ensureReady()

  // Normalize the URL (YouTube videos become canonical)
  url = normalizeYoutubeUrl(url)

  let bookmarks
  try {
    bookmarks = await browser.bookmarks.search({ url })
  } catch {
    // Couldn't fetch bookmarks (a protected page?)
    return null
  }
  const bookmarkIds = bookmarks.map(b => b.id)

  // Is page bookmarked in 👍, or 👎?
  for (const [name, id] of [['👍', upFolderId], ['👎', downFolderId]]) {
    if (bookmarks.some(({ parentId }) => parentId === id)) {
      return { folder: name, bookmarkIds }
    }
  }
  // Page has at least one bookmark elsewhere.
  if (bookmarks.length > 0) {
    return { folder: '⭐', bookmarkIds }
  }
  // Page not bookmarked at all.
  return { folder: '', bookmarkIds }
}

// Get state & update button icon and badge
async function getState(tabId, url) {
  const state = await getBookmarkFolder(url)
  const { folder } = state ?? {}
  const count = state?.bookmarkIds?.length ?? 0
  const [path, title, popup] =
        !state  ? [...errorIcon, ""]  : // error
        !folder ? [defaultIcon[0], null, null]
                : [folderIcons[folder].hilite[0], null, null]
  await browser.action.setTitle({              // button hover text
    tabId,
    title: count > 1 ? 'Page has multiple bookmarks\nAll are moved/deleted together' : title
  })
  await browser.action.setPopup({ tabId, popup }) // enable/disable popup
  await browser.action.setIcon ({ tabId, path  })

  // Show badge if there is more than one bookmark
  await browser.action.setBadgeTextColor({ tabId, color: 'white' })
  await browser.action.setBadgeBackgroundColor({ tabId, color: '#a00' })
  await browser.action.setBadgeText({ tabId, text: `${count > 1 ? count : ''}` })
  return state
}

// ---- Handle messages from popup ----
browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "getState") {
    const tab = await getCurrentTab()
    if (!tab || !tab.url) {
      return { folder: null, bookmarkIds: [] }
    }
    return await getState(tab.id, tab.url)
  }
  if (msg.type === "setFolder") {
    const { folder } = msg
    const { id, url, title } = await getCurrentTab()
    const state = await getState(id, url)
    const targetFolder = folder === '👍' ? upFolderId :
                         folder === '👎' ? downFolderId : starFolderId

    if (state.folder === folder) {
      // Hilited button clicked, delete bookmark(s)
      for (const bmId of state.bookmarkIds) {
        await browser.bookmarks.remove(bmId)
      }
    } else {
      // Normal button clicked, create or move
      if (state.bookmarkIds.length > 0) {
        // Move existing bookmark(s) to target folder
        for (const bmId of state.bookmarkIds) {
          await browser.bookmarks.move(bmId, { parentId: targetFolder })
        }
      } else {
        // No bookmark at all – create new, using normalized URL for YouTube
        const bookmarkUrl = normalizeYoutubeUrl(url)
        await browser.bookmarks.create({
          parentId: targetFolder,
          title: title ?? url,
          url: bookmarkUrl
        })
      }
    }
    return { success: true }
  }
})

// When tab was updated
browser.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
  if (status !== "complete") { return }
  getState(tabId, url)
})
browser.tabs.onActivated.addListener(({ tabId }) => {
  browser.tabs.get(tabId).then(({ id, url }) => getState(id, url))
})

// When a bookmark change
function refreshActiveTabIcon() {
  getCurrentTab().then(({ id, url }) => getState(id, url))
}
browser.bookmarks.onCreated.addListener(refreshActiveTabIcon)
browser.bookmarks.onRemoved.addListener(refreshActiveTabIcon)
browser.bookmarks.onMoved.addListener(refreshActiveTabIcon)

// When extension is loaded
getCurrentTab().then(({ id, url }) => getState(id, url))

//EOF
