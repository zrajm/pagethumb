# Thumbcrumb Bookmarks

This is a Firefox extension.

I'll give you a thumbs up/thumbs down symbol in he navigation bar. Whenever you
visit a page you've visited before you'll be able to see whether you've liked
or disliked it on a previous visit.

Internally Thumbcrumb uses bookmarks to keep track of this information. A page
is bookmarked in the folder '👍' if you like it, or '👎' if you dislike it. If
a page bookmarked, but not in any of these categories it'll be marked as '⭐'.


A Confusion of Bookmarks
------------------------
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
