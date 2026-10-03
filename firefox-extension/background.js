//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, activeIcons } from './shared.js'

const UNFILED = 'unfiled_____'

// Category names, in priority order (last one is the catch-all).
const CATEGORIES = ['👍', '👎', '⭐']

// Find (or create) the bookmark folder for a category, resolves to its ID.
const ensureFolder = title => browser.bookmarks.search({ title })
  .then(matches =>
    matches.find(x => x.type === 'folder' && x.parentId === UNFILED)
      ?? browser.bookmarks.create({ title, type: 'folder', parentId: UNFILED }))
  .then(({ id }) => id)

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
    // Category is found by the title of the folder(s) containing the page.
    return browser.bookmarks.get([...new Set(bookmarks.map(x => x.parentId))])
      .then(parents => {
        const titles = new Set(
          parents.filter(x => x.parentId === UNFILED).map(x => x.title))
        // <category> is first bookmark folder (of '👍' or '👎') which contains
        // current page. Or, if none found, the last (catch-all) category
        // ('⭐').
        const category = CATEGORIES.find(x => titles.has(x)) ?? CATEGORIES.at(-1)
        return { category, bookmarks }
      })
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
  .then(state => state?.category || null)

// setCategory(CATEGORY) -- Returns promise. Move the bookmark(s) of the
// current page into CATEGORY ('👍', '👎' or '⭐') and resolve the returned
// promise with that emoji. If CATEGORY is already the current category of the
// page, the page bookmark(s) are instead deleted and promise resolves to ''.
// Resolves to `null` on failure (e.g. if the bookmark API is unavailable).
// (This does not update the toolbar button -- events listening for bookmark
// changes does that elsewhere.)
const setCategory = (category) => getCurrentTab()
  .then(({ id, url, title }) => updateToolbarButton(id, url)
    .then(state => ({ tab: { id, url, title }, state }))
  )
  .then(({ tab, state }) => {
    if (!state) { return null }                // bookmark API unavailable
    const target = CATEGORIES.includes(category) ? category : CATEGORIES.at(-1)

    // Hilited button clicked: Delete bookmark(s).
    if (state.category === category) {
      return Promise.all(state.bookmarks.map(
        ({ id }) => browser.bookmarks.remove(id))).then(() => '')
    }
    // Unhilited button clicked: Make sure target folder exists, then...
    return ensureFolder(target).then(targetFolderId => {
      // ...move existing bookmark(s) to target.
      if (state.bookmarks.length > 0) {
        return Promise.all(state.bookmarks.map(
          ({ id }) => browser.bookmarks.move(id, { parentId: targetFolderId })))
      }
      // ...or, if no bookmark exists, create one.
      return browser.bookmarks.create({
        parentId: targetFolderId,
        title   : tab.title ?? tab.url,
        url     : normalizeUrl(tab.url),
      })
    }).then(() => target)
  })

// When a bookmark change.
const updateToolbarButtonEvent = () => {
  getCurrentTab().then(({ id, url }) => updateToolbarButton(id, url))
}

// Tell popup to close itself.
const closePopup = () => {
  browser.runtime.sendMessage(['closePopup']).catch(() => {})
}

// URL change (page loaded, or single-page app changed URL).
browser.tabs.onUpdated.addListener((tabId, { url }, tab) => {
  if (tab.active) { closePopup() }
  updateToolbarButton(tabId, url)
}, { properties: ['url'] })

// Browser switched to new tab.
browser.tabs.onActivated.addListener(({ tabId }) => {
  browser.tabs.get(tabId).then(({ id, url }) => {
    closePopup()
    return updateToolbarButton(id, url)
  })
})

// Bookmark was updated (by us or someone else).
browser.bookmarks.onCreated.addListener(updateToolbarButtonEvent)
browser.bookmarks.onRemoved.addListener(updateToolbarButtonEvent)
browser.bookmarks.onMoved  .addListener(updateToolbarButtonEvent)

// Listen for messages from popup.
browser.runtime.onMessage.addListener(([funcName, ...args]) =>
  ({ getCategory, setCategory }[funcName](...args))
)

// Set text badge color in extension button.
Promise.allSettled([                           // ignore rejections
  browser.action.setBadgeTextColor      ({ color: '#fff' }),
  browser.action.setBadgeBackgroundColor({ color: '#a00' }),
])

// When extension is loaded.
getCurrentTab().then(({ id, url }) => updateToolbarButton(id, url))

//EOF
