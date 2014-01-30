chrome.commands.onCommand.addListener(function(command) {
  alert('Command:'+ command);
});


// DISPLAY TOTAL AMOUNT OF BOOKMARKS AS A BADGE...
var bookmarkCounter = 0;
function countBookmarks(bookmarks) {
	bookmarks.forEach(function(bookmark) {
		if (bookmark.url) {
			bookmarkCounter += 1;
		}
		if (bookmark.children) {
			countBookmarks(bookmark.children);
		}
	});
}
chrome.bookmarks.getTree(function(bookmarks) {
		countBookmarks(bookmarks);
		console.log("et voilà, bookmarkCount = " + bookmarkCounter);
		chrome.browserAction.setBadgeBackgroundColor({
		color: '#111111'
	});
	chrome.browserAction.setBadgeText({
		text: bookmarkCounter.toString()
	});
});