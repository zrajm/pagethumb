# Pagethumb

Pagethumb is a bookmark/rating extension for Firefox. It'll give you a thumbs
up / thumbs down symbol in the navigation mark, allowing you note whether you
like/dislike. On later visits to the same page you'll be able to immediately
see your previous rating. -- Think of this as personal like/dislike feature,
but for the web at large. You likes are not shared with anybody (but your own
future self).

Internally Pagethumb stores likes/dislikes as bookmarks (meaning that they'll
automatically sync between your devices when your bookmarks do). A page a liked
page is bookmarked in the folder '👍', and a disliked page in '👎'. If a page
bookmarked, but not in any of these categories it'll show up as '⭐'.


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
