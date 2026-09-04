//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

export const getCurrentTab = () =>
  browser.tabs.query({ active: true, currentWindow: true }).then(([x]) => x)

export const errorIcon   = ['pic/thumbsup.svg', 'Unsupported page']
export const defaultIcon = ['pic/thumbsup.svg', 'Like page']
export const categoryIcons = {
    '👍': {
        name: 'up',
        normal: ['pic/thumbsup.svg', 'Like page'],
        hilite: ['pic/thumbsup-active.svg', 'Remove like'],
    },
    '👎': {
        name: 'down',
        normal: ['pic/thumbsdn.svg', 'Dislike page'],
        hilite: ['pic/thumbsdn-active.svg', 'Remove dislike'],
    },
    '⭐': {
        name: 'star',
        normal: ['pic/bookmark.svg', 'Star page'],
        hilite: ['pic/bookmark-active.svg', 'Remove star'],
    },
}

//EOF
