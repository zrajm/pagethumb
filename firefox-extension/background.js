//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, activeIcons } from './shared.js'

const UNFILED = 'unfiled_____'

// Key = category name, value = bookmark folder ID.
const CATEGORIES = new Map([['👍'], ['👎'], ['⭐']])

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

// getBookmarks(URL) -- Returns promise which resolves to `null` on failure, or
// `{ category, bookmarks }` on success. (<category> is either '👍', '👎' or
// '⭐' if URL has been bookmarked before, or '' if it hasn't. <bookmarks> is
// an array of bookmarks of URL, as returned by `browser.bookmarks.search()`).
const getBookmarks = (url) => Promise.resolve()
  .then(() => browser.bookmarks.search({ url: normalizeUrl(url) }))
  .then(bookmarks => {
    if (bookmarks.length === 0) {              // non-bookmarked page
      return { category: '', bookmarks: [] }
    }
    let remain = CATEGORIES.size - 1
    for (const [category, id] of CATEGORIES) {
      if (!remain || bookmarks.some(({ parentId }) => parentId === id)) {
        // <category> is first bookmark folder (of '👍' or '👎') which contains
        // current page. Or, if none found, the last (catch-all) category
        // ('⭐').
        return { category, bookmarks }
      }
      remain -= 1
    }
  })
  .catch(() => null)                           // bookmark API unavailable

// Return unambiguous date string (e.g. '4 Sept 2025, 21:55')
const prettyDate = x => new Date(x).toLocaleString(
  undefined, { dateStyle: 'medium', timeStyle: 'short' })

// updateToolbarButton(TABID, URL) -- Get state & update button icon and badge.
// Returns the same as getBookmarks(URL).
const updateToolbarButton = (tabId, url) => getBookmarks(url).then(state => {
  const { category, bookmarks } = state ?? {}
  const path  = activeIcons[category]?.path    // manifest action.default_icon
  const count = bookmarks?.length ?? 0
  const text  = `${count > 1 ? count : ''}`
  const title =
    (!state ? 'Unsupported page' :
     !count ? null               :             // manifest action.default_title
     ('Bookmarked on:' + bookmarks
      .map(x => x.dateAdded)
      .sort((a, b) => b - a)
      .map(x => `\n - ${prettyDate(x)}`)
      .join('')))
  // Update extension toolbar button.
  Promise.allSettled([                         // ignore rejections
    browser.action[state ? 'enable' : 'disable'](tabId), // toggle button
    browser.action.setIcon     ({ tabId, path  }), // extension button icon
    browser.action.setTitle    ({ tabId, title }), // mouseover text
    browser.action.setBadgeText({ tabId, text  }), // bookmark count (if > 1)
  ])
  return state
})

const getCategory = () => getCurrentTab()
  .then(tab => getBookmarks(tab?.url))
  .then(({ category }) => category || null)

const setCategory = (category) => getCurrentTab()
  .then(({ id, url, title }) => updateToolbarButton(id, url)
    .then(state => ({ tab: { id, url, title }, state }))
  )
  .then(({ tab, state }) => {
    const targetFolderId = CATEGORIES.get(category)
      ?? CATEGORIES.get([...CATEGORIES.keys()].pop())

    // Hilited button clicked: Delete bookmark(s)
    if (state.category === category) {
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
  }).then(() => category)

// When a bookmark change
const updateToolbarButtonEvent = () => {
  getCurrentTab().then(({ id, url }) => updateToolbarButton(id, url))
}

// Tell popup to close itself.
const closePopup = () => {
  browser.runtime.sendMessage(['closePopup']).catch(() => {})
}

// Main.
const main = () => {

  // URL change (page loaded, or single-page app changed URL).
  browser.tabs.onUpdated.addListener((tabId, { url }) => {
    if (!url) { return }
    closePopup()
    updateToolbarButton(tabId, url)
  })

  // Browser switched to new tab.
  browser.tabs.onActivated.addListener(({ tabId }) => {
    browser.tabs.get(tabId).then(({ id, url }) => {
      closePopup()
      updateToolbarButton(id, url)
    })
  })

  // Bookmark was updated (by us or someone else).
  browser.bookmarks.onCreated.addListener(updateToolbarButtonEvent)
  browser.bookmarks.onRemoved.addListener(updateToolbarButtonEvent)
  browser.bookmarks.onMoved.addListener(updateToolbarButtonEvent)

  // Set text badge color in extension button.
  Promise.allSettled([                         // ignore rejections
    browser.action.setBadgeTextColor      ({ color: '#fff' }),
    browser.action.setBadgeBackgroundColor({ color: '#a00' }),
  ])

  // When extension is loaded.
  getCurrentTab().then(({ id, url }) => updateToolbarButton(id, url))
}

// Make sure bookmark folders exist for all categories.
const setupPromise = setupBookmarkFolders()

// Listen for popup messages; wait for folders to exist before answering.
browser.runtime.onMessage.addListener(([funcName, ...args]) =>
  setupPromise.then(() => ({ getCategory, setCategory }[funcName](...args)))
)

// When category folders exist, run main.
setupPromise.then(main)

//EOF
