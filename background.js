//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, errorIcon, defaultIcon, folderIcons } from './shared.js'

const UNFILED = 'unfiled_____'

// Key = category name, value = bookmark folder ID.
let CATEGORIES = new Map([['👍'], ['👎'], ['⭐']])

// Create bookmark folders (if needed) & cache their IDs in CATEGORIES.
const setupBookmarkFolders = () => Promise.all(
  [...CATEGORIES.keys()].map(title =>
    browser.bookmarks.search({ title })
      .then(matches =>
        matches.find(x => x.type === 'folder' && x.parentId === UNFILED)
          ?? browser.bookmarks.create({ title, type: 'folder', parentId: UNFILED }))
      .then(({ id, title }) => CATEGORIES.set(title, id))))

const normalizeUrl = url => {
  try { url = new URL(url) } catch { return url }
  if (/^(www\.|m\.)?youtube\.com$/.test(url.hostname)) {
    const v = url.pathname.match(/^\/shorts\/([^/?]+)/)?.[1]
           ?? url.searchParams.get('v')
    return v ? `https://www.youtube.com/watch?v=${v}` : url.origin + url.pathname
  }
  // Remove tracking / analytics junk
  `_ga _gl campaign dclid embeds_referring_origin fbclid feature gclid gclsrc
    igshid mc_cid mc_eid ref si source trk utm_campaign utm_content utm_medium
    utm_source utm_term`.split(' ').forEach(p => url.searchParams.delete(p))
  url.searchParams.sort()
  url.hash = ''
  return url.href
}

// getBookmarkFolder(URL) -- Return `{ folder, bookmarks }`. name of extension
// folder + list of all bookmarks IDs matching URL (= the bookmarks to modify).
const getBookmarkFolder = (url) => Promise.resolve()
  .then(() => browser.bookmarks.search({ url: normalizeUrl(url) }))
  .then(bookmarks => {
    if (bookmarks.length === 0) {              // non-bookmarked page
      return { folder: '', bookmarks: [] }
    }
    let remain = CATEGORIES.size - 1
    for (const [folder, id] of CATEGORIES) {
      if (!remain || bookmarks.some(({ parentId }) => parentId === id)) {
        // a) Return first folder which contains a bookmark.
        // b) If none, return the last (catch-all) folder.
        return { folder, bookmarks }
      }
      remain -= 1
    }
  })
  .catch(() => null)                           // bookmark API unavailable

// Get state & update button icon and badge.
const getState = (tabId, url) => getBookmarkFolder(url).then(state => {
  const { folder } = state ?? {}
  let [path, title, popup] =
        !state  ? [...errorIcon, '']  : // error
        !folder ? [defaultIcon[0], null, null]
                : [folderIcons[folder].hilite[0], null, null]

  // Build mouseover text for extension button.
  const count = state?.bookmarks?.length ?? 0
  if (count > 0) {
    title = 'Bookmarked on:' + state.bookmarks.map(x => x.dateAdded)
      .sort((a, b) => b - a)
      .map(x => '\n - ' + (new Date(x).toLocaleString(
        undefined, { dateStyle: 'medium', timeStyle: 'short' }))).join('')
    if (count > 1) {
      title += `\nAll are moved/deleted together`
    }
  }
  return Promise.allSettled([
    browser.action.setPopup({ tabId, popup }), // enable/disable popup
    browser.action.setIcon({ tabId, path }),
    // Show badge if there is more than one bookmark for this page.
    browser.action.setBadgeTextColor({ tabId, color: 'white' }),
    browser.action.setBadgeBackgroundColor({ tabId, color: '#a00' }),
    browser.action.setBadgeText({ tabId, text: `${count > 1 ? count : ''}` }),
    browser.action.setTitle({ tabId, title }),
  ]).then(() => state)
})

const getFolder = () => getCurrentTab()
  .then(tab => getBookmarkFolder(tab?.url))
  .then(({ folder }) => folder || null)

const setFolder = (folder) => getCurrentTab()
  .then(({ id, url, title }) =>
    getState(id, url).then(state => ({ tab: { id, url, title }, state })))
  .then(({ tab, state }) => {
    const targetFolderId = CATEGORIES.get(folder)
      ?? CATEGORIES.get([...CATEGORIES.keys()].pop())

    // Hilited button clicked: Delete bookmark(s)
    if (state.folder === folder) {
      return Promise.all(state.bookmarks.map(
        ({ id }) => browser.bookmarks.remove(id)))
    }
    // Unhilited button clicked: Move existing bookmark(s) to target
    if (state.bookmarks.length > 0) {
      return Promise.all(state.bookmarks.map(
        ({ id }) => browser.bookmarks.move(id, { parentId: targetFolderId })))
    }
    // Unhilited button clicked: None exsisting -- create new
    return browser.bookmarks.create({
      parentId: targetFolderId,
      title   : tab.title ?? tab.url,
      url     : normalizeUrl(tab.url),
    })
  }).then(() => folder)

// When a bookmark change
const refreshToolbarButton = () => {
  getCurrentTab().then(({ id, url }) => getState(id, url))
}

// Main.
const main = () => {

  // Receive 'getFolder' & 'setFolder' calls from popup.js.
  browser.runtime.onMessage.addListener(([funcName, ...args]) =>
    ({ getFolder, setFolder }[funcName](...args)))

  // New page loaded in tab.
  browser.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
    if (status !== 'complete') { return }
    getState(tabId, url)
  })

  // Tab focused.
  browser.tabs.onActivated.addListener(({ tabId }) => {
    browser.tabs.get(tabId).then(({ id, url }) => getState(id, url))
  })

  // Bookmark was updated (by us or someone else).
  browser.bookmarks.onCreated.addListener(refreshToolbarButton)
  browser.bookmarks.onRemoved.addListener(refreshToolbarButton)
  browser.bookmarks.onMoved.addListener(refreshToolbarButton)

  // When extension is loaded.
  getCurrentTab().then(({ id, url }) => getState(id, url))
}

setupBookmarkFolders().then(main)

//EOF
