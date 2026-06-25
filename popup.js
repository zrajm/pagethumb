//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, folderIcons } from './shared.js'

// Get bookmark folder of current page.
const getFolder = () => browser.runtime.sendMessage(['getFolder'])

// Move current page to given bookmark folder.
const setFolder = folder => browser.runtime.sendMessage(['setFolder', folder])

getFolder()
  .then(folder => folder ?? setFolder('👍'))   // set folder to 👍 if unset
  .then(folder => {
    document.querySelector('#menu').addEventListener('click', ({ target }) => {
      const button = target.closest('button')
      if (button) {
        const folder = button.id
        setFolder(folder)
        window.close()
      }
    })
    if (folder) {                              // hilite current folder button
      const { hilite } = folderIcons[folder]
      const  btn  = document.querySelector(`button#${folder}`)
      const [img] = btn.children
      ;[img.src, btn.title] = hilite           // set image & mouseover text
    }
  })

//EOF
