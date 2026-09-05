//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

export const getCurrentTab = () =>
  browser.tabs.query({ active: true, currentWindow: true }).then(([x]) => x)

export const activeIcons = {
  '👍': { path: 'pic/thumbsup-active.svg', text: 'Remove like' },
  '👎': { path: 'pic/thumbsdn-active.svg', text: 'Remove dislike' },
  '⭐': { path: 'pic/bookmark-active.svg', text: 'Remove bookmark' },
}

//EOF
