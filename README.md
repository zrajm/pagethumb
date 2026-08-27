Pagethumb
=========
Download: [`pagethumb-latest.xpi`][latest]

This is a Firefox extension for bookmarking & rating web pages. Whenever you
visit a web page you’ll immediately see whether you have previously liked or
disliked the page.—It’s a personal like/dislike feature for the web at large.
Your likes are not shared with anybody (except your own future self).

<toc heading=Contents class=toc>


What Does It Look Like?
-----------------------
Here’s the extension at work.

![default]\
![like]\
![dislike]\
![bookmark]\
![menu]


Decluttering Firefox
--------------------
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


A Confusion of Bookmarks
------------------------
Internally Pagethumb stores likes/dislikes as bookmarks (meaning that they’ll
automatically sync between your devices when your bookmarks do). A liked page
is saved in the bookmark folder 👍, and a disliked page in 👎. If a page has
been bookmarked outside of these folders it’ll show up as ⭐.


### If There Are Multiple Bookmarks

A page might have multiple bookmarks. This is how Pagethumb deals with that.

A page is considered to be in category 👍 if there is at least one bookmark to
(the normalized URL of) that page in a bookmark folder by the same name.
Categories are in strict order, so that the first category a page is found in
is the only category it is considered part of (i.e. if there are bookmarks in
several different folders, only the first one counts). If there is a bookmark
to a page outside of any category folders, it belongs to the last category. If
a page is not bookmarked it does not belong to any category.


### URL Normalization

Pagethumb normalizes all URLs. This strips well-known URL parameters used for
tracking and simplifies Youtube URLs. Internally Pagethumb only uses normalized
URLs, so that, for example, if you have manually bookmarked the Youtube video
https://www.youtube.com/watch?v=yuXVu595DBI&t=214 (with a timestamp parameter
`t=214`) Pagethumb will ignore that bookmark (when visiting the page it will
not show up as ⭐, and Pagethumb will never modify or move that bookmark). And
if you do go to that page and give it a thumbs up Pagethumb will save a new
bookmark https://www.youtube.com/watch?v=yuXVu595DBI (without the `t`
parameter).

[bookmark]: pic/bookmark.png
[default]: pic/default.png
[dislike]: pic/dislike.png
[latest]: releases/pagethumb-latest.xpi
[like]: pic/like.png
[menu]: pic/menu.png

<!--EOF-->
