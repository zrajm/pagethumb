<!--
Author: Zrajm
Favicon: firefox-extension/pic/thumbsup-active.svg
License: <a href="https://gnu.org/licenses/gpl-2.0.html">GNU General Public License, version 2</a>.
Created: 2026-06-25 20:16:34 +02:00
Updated: 2026-09-05 08:03:59 +02:00
-->


# Pagethumb: 👍 Bookmark Extension for Firefox

> This is a Firefox bookmark extension, that instead of just showing you the
> default ⭐, lets you indicate whether you like a page or not using 👍 or 👎.
> The next time you visit your rating is the first thing you'll see.—This
> extension does not share your bookmarks or upload them anywhere. If your
> bookmarks are setup to sync between devices, then your ratings are also
> synced.

Download: [`pagethumb-latest.xpi`][latest]

<toc heading=Contents class=toc>

-------------------------------------------------------------------------------


# What Does It Look Like?

Here’s what the extension looks like in its various states:

<div></div>

![disabled]\
![default]\
![thumbsup]\
![thumbsdown]\
![bookmarked]\
![menu]


# Decluttering Firefox

I find Firefox’s default appearance too cluttered, and creating this extension
is part of trying to fix that for myself. Even better is using Pagethumb *plus*
removing the bookmark (⭐) and reader buttons from Firefox’s URL field.—If you
also want this, do the following:

**Enable user customizations**

1. Go to `about:config`
2. Set `toolkit.legacyUserProfileCustomizations.stylesheets` to `true`.

**Add the customizations you want**

3. Put CSS into
   `~/.mozilla/firefox/<RANDOM>.default-release/chrome/userChrome.css` (the
   `<RANDOM>` part was decided by Firefox on its first startup, just use
   whatever you find on your machine).

~~~css
/* Remove bookmark ⭐ button from URL field. */
#star-button-box { display: none !important; }

/* Remove 'reader' button from the URL field. */
#reader-mode-button { display: none !important; }
~~~

That’s it! There’s a gazillion other things you can change too, but I’ll leave
that as an exercise for the reader.


# A Confusion of Bookmarks

Internally Pagethumb stores likes/dislikes as bookmarks (meaning that they’ll
automatically sync between your devices if you have set up your bookmarks to do
so). Liked pages are saved in the bookmark folder 👍, and disliked pages in 👎.
And finally, if a page has been bookmarked outside of these folders it’ll show
up as <img src="firefox-extension/pic/bookmark-active.svg" style="height:1rem;
filter:invert(calc(1 - var(--darkmode))) grayscale(1) contrast(2);"
alt=bookmark>. Saving a page in this category will create (or move) the
relevant bookmark into the ⭐ folder.


## If There Are Multiple Bookmarks

A page might have multiple bookmarks. This is how Pagethumb deals with that.

A page is considered to be in category 👍 if there is at least one bookmark to
(the normalized URL of) that page in a bookmark folder by the same name.
Categories are in strict order, so that the first category a page is found in
is the only category it is considered part of (i.e. if there are bookmarks in
several different folders, only the first one counts). If there is a bookmark
to a page outside of any category folders, it belongs to the last category. If
a page is not bookmarked it does not belong to any category.


## URL Normalization

Pagethumb normalizes all URLs. This strips well-known URL parameters used for
tracking and simplifies Youtube URLs. Internally Pagethumb only uses normalized
URLs, so that, for example, if you have manually bookmarked the Youtube video
https://www.youtube.com/watch?v=yuXVu595DBI&t=214 (with a timestamp parameter
`t=214`) Pagethumb will ignore that bookmark (when visiting the page it will
not show up as ⭐, and Pagethumb will never modify or move that bookmark). And
if you do go to that page and give it a thumbs up Pagethumb will save a new
bookmark https://www.youtube.com/watch?v=yuXVu595DBI (without the `t`
parameter).


# History

**v0.7** – Improved extension button: Button status updates quicker on page
change. Button availability is now toggled using `browser.action.enable()` and
`.disable()` instead home-built system. (2026-09-05 05:13:14 +02:00)

<div></div>

**v0.6** – New icons: Removed unnecessary details from all SVG icons (for
speed) and adjusted icon colors to match Firefox defaults. Dropped the
Firefox-centric ⭐ symbol for bookmarks, and replaced it with the more
traditional <img src="firefox-extension/pic/bookmark-active.svg"
style="height:1rem; filter:invert(calc(1 - var(--darkmode))) grayscale(1)
contrast(2);" alt=bookmark>. (2026-09-04 18:08:38 +02:00)

<div></div>

**v0.5** – Support for single-page app (SLA) webpages (e.g. Youtube).
Previously the status of the extension were only updated on pageload, but not
when navigating inside SLA pages, now all URL updates handled, regardless of
type. (2026-08-27 15:48:22 +02:00)

<div></div>

**v0.4** – Fixed race condition in button status update. Switching tabs now
automatically closes the popup. (2026-06-30 03:12:47 +02:00)

<div></div>

**v0.3** – Minor speed ups, permissions updated. (2026-06-29 22:27:42 +02:00)

<div></div>

**v0.2** – Basic functionality implemented. (2026-06-28 14:02:40 +02:00)


-------------------------------------------------------------------------------

[bookmark]: firefox-extension/pic/bookmark.svg?darkmode=no
[bookmarked]: pic/bookmarked.png?darkmode=no
[default]: pic/default.png?darkmode=no
[disabled]: pic/disabled.png?darkmode=no
[latest]: releases/pagethumb-latest.xpi
[menu]: pic/menu.png?darkmode=no
[thumbsdown]: pic/thumbsdown.png?darkmode=no
[thumbsup]: pic/thumbsup.png?darkmode=no

<!--EOF-->
