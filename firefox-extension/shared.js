//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

export const getCurrentTab = () =>
  browser.tabs.query({ active: true, currentWindow: true }).then(([x]) => x)

export const errorIcon   = ['pic/like-error.svg',  'Unsupported page']
export const defaultIcon = ['pic/like-normal.svg', 'Like page']
export const folderIcons = {
    '👍': {
        name: 'up',
        normal: ['pic/like-normal.svg', 'Like page'],
        hilite: ['pic/like-hilite.svg', 'Remove like'],
    },
    '👎': {
        name: 'down',
        normal: ['pic/dislike-normal.svg', 'Dislike page'],
        hilite: ['pic/dislike-hilite.svg', 'Remove dislike'],
    },
    '⭐': {
        name: 'star',
        normal: ['pic/star-normal.svg', 'Star page'],
        hilite: ['pic/star-hilite.svg', 'Remove star'],
    },
}

//EOF
