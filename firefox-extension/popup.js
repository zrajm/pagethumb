//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, activeIcons } from './shared.js'

// Get category of current page.
const getCategory = () => browser.runtime.sendMessage(['getCategory'])

// Move current page to given category.
const setCategory = x => browser.runtime.sendMessage(['setCategory', x])

// On click: Set category and close popup.
document.querySelector('#menu').addEventListener('click', ({ target }) => {
  const button = target.closest('button')
  if (button) {
    setCategory(button.id)
    window.close()
  }
})

// On background script message: Close popup.
browser.runtime.onMessage.addListener(([funcName]) => {
  if (funcName === 'closePopup') { window.close() }
})

// On popup open: Make sure category is set, and hilite corresponding button.
getCategory()
  .then(category => category ?? setCategory('👍')) // set to 👍 if unset
  .then(category => {
    if (!category) { return }
    // Hilite active category button in popup.
    const  btn  = document.getElementById(category)
    const [img] = btn.children
    btn.title = activeIcons[category].text     // set button mouseover text
    img.src   = activeIcons[category].path     // set button icon
  })

//EOF
