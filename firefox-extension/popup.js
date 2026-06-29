//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, categoryIcons } from './shared.js'

// Get category of current page.
const getCategory = () => browser.runtime.sendMessage(['getCategory'])

// Move current page to given category.
const setCategory = x => browser.runtime.sendMessage(['setCategory', x])

document.querySelector('#menu').addEventListener('click', ({ target }) => {
  const button = target.closest('button')
  if (button) {
    setCategory(button.id)
    window.close()
  }
})

getCategory()
  .then(category => category ?? setCategory('👍')) // set to 👍 if unset
  .then(category => {
    if (category) {                          // hilite current category button
      const { hilite } = categoryIcons[category]
      const  btn  = document.querySelector(`button#${category}`)
      const [img] = btn.children
      ;[img.src, btn.title] = hilite         // set image & mouseover text
    }
  })

//EOF
