const yurlStorage = { query: '', results: '', timestamp: '' };

// DISPLAY TOTAL AMOUNT OF BOOKMARKS AS A BADGE...

function updateBookmarkCount() {
	var bookmarkCounter = 0;

	function countBookmarks(bookmarks) {
		bookmarks.forEach(function (bookmark) {
			if (bookmark.url) {
				bookmarkCounter += 1;
			}
			if (bookmark.children) {
				countBookmarks(bookmark.children);
			}
		});
	}
	chrome.bookmarks.getTree(function (bookmarks) {
		countBookmarks(bookmarks);
		console.log("BookmarkCount = " + bookmarkCounter);
		chrome.action.setBadgeBackgroundColor({
			color: '#111111'
		});
		chrome.action.setBadgeText({
			text: bookmarkCounter.toString()
		});
	});
}
updateBookmarkCount();
// Update badge when bookmarks are added/removed
chrome.bookmarks.onCreated.addListener(function () {
	updateBookmarkCount();
});
chrome.bookmarks.onRemoved.addListener(function () {
	updateBookmarkCount();
});
/*
	SHOW MESSAGES ON INSTALL / ON UPDATE
	http://stackoverflow.com/questions/2399389/detect-chrome-extension-first-run-update

*/
function onInstall() {
	console.log("Extension Installed");
}

function onUpdate() {
	console.log("Extension Updated");
}

chrome.storage.sync.onChanged.addListener(function (changes, namespace) {
	// Useful for debugging
	var error = chrome.runtime.lastError;
	if (error) {
		// alert(error);
		console.log(error);
	}
});
