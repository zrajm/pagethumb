Pagethumb
=========
This is a Firefox extension, for bookmarking & rating web pages. Whenever you
visit a web page you'll immediately see whether you have previously liked or
disliked the page.—It's a personal like/dislike feature for the web at large.
Your likes are not shared with anybody (except your own future self).

<toc heading=Contents class=toc>


A Confusion of Bookmarks
------------------------
Internally Pagethumb stores likes/dislikes as bookmarks (meaning that they'll
automatically sync between your devices when your bookmarks do). A page a liked
page is bookmarked in the folder '👍', and a disliked page in '👎'. If a page
bookmarked, but not in any of these categories it'll show up as '⭐'.

A page might be have multiple bookmarks. This in how Thumbcrumb deals with
that.

A page is considered to be in category '👍' if there are at least one bookmark
to (the normalized URL of) that page in a bookmark folder by the same name.
Categories in strict order, so that the first category a page is found in is
the only category it is considered part of (i.e. if there are bookmarks in
several different folders, only the first one counts). If there is a bookmark
to a page outside of any category folders, it belongs to the last category. If
a page is not bookmarked it does not belong to any category.

Only normalized URLs are considered. For example, if a Youtube video is
bookmarked as 'https://www.youtube.com/watch?v=yuXVu595DBI&t=214' it will NOT
count, because the normalization strips all non-'v' values. Only the plain
'https://www.youtube.com/watch?v=yuXVu595DBI' URL counts. Non-normalized URLs
are never moved, or counted in any way.

<!--EOF-->
