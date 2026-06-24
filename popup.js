//-*- js-indent-level: 2 -*-
// Copyright 2026 by zrajm. License: GPLv2 (code).

import { getCurrentTab, folderIcons } from './shared.js';

// Load state and icons, then render
async function initPopup() {
  const tab = await getCurrentTab();
  if (!tab || !tab.url) {
    document.body.textContent = "No active tab";
    return;
  }

  let state = await browser.runtime.sendMessage({ type: "getState" });

  // Autolike: For unbookmarked pages, save in 👍 as soon as user opens popup.
  if (!state.folder) {
    await browser.runtime.sendMessage({ type: "setFolder", folder: '👍' });
    state = await browser.runtime.sendMessage({ type: "getState" });
  }
  // Helper to set button image and tooltip
  function setupButton(folder) {
    const { name, normal, hilite } = folderIcons[folder]
    const img = document.getElementById(`img-${name}`);
    const btn = document.getElementById(`btn-${name}`);
    // Set image src, and button's loot tip.
    [img.src, btn.title] = state.folder === folder ? hilite : normal;
    btn.addEventListener("click", async () => {
      await browser.runtime.sendMessage({ type: "setFolder", folder });
      window.close(); // close popup after action
    });
  }
  setupButton('👍');
  setupButton("👎");
  setupButton("⭐");
}

initPopup();

//EOF
