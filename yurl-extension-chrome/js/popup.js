/*
// UNCOMMENT TO DISPLAY TOTAL AMOUNT OF BOOKMARKS AS A BADGE...
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

*/

function navigate(url) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
};
/*

	RUNTIME	
	
*/
// Search the bookmarks when entering the search keyword.
jQuery(function($) {
	var query = '', myHTMLString ='';
	$('#search').keyup(function() {
		$('#bookmarks').empty();
		query = $('#search').val();
		chrome.bookmarks.search(query, function(results) {
			var total = results.length;
			var str = '';
			$('#total')[0].innerHTML =total + ' urls';
			if (total > 0) {
				var html = [];
				for (var i = 0; i < total; i++) {
					var node = results[i];
					var className = (node.children) ? 'folder' : 'link';
					if (className == 'folder') {
						str = '<p class="' + className + '">' + node.title + ' [' + node.url + ']</p>';
					} else {
						// handle bookmarklets correctly
						node.descr = (node.url.substring(0, 10) == "javascript") ? 'Bookmarklet': node.url;
						
						str = '<a href="' + node.url + '" class="bookmark"><h3>' + node.title + '</h3><p>' + node.descr + '</p></a>';
					}
					html.push(str);
				}
				myHTMLString = '<div id="bookmarkslist">' + html.join('') + '</div>';
			} else {
				myHTMLString = '<p class="error">Sorry, no result.</p>';
			}
			//THIS IS FASTER THAN JQUERY'S HTML() function
			$('#bookmarks')[0].innerHTML = myHTMLString;

		});
	});
	$(document).on('click', 'a.bookmark', function() {
		chrome.tabs.create({
			url: $(this).attr('href')
		});
	});
});
/*
chrome.omnibox.onInputChanged.addListener(
	function(text, suggest) {
		var result = new Array();
		chrome.bookmarks.search(text, function(results) {
			for (i = 0; i < results.length; i++) {
				var node = results[i];
				result.push({
					content: node.url,
					description: node.title
				});
			}
	});
	suggest(result);
});
*/
chrome.omnibox.onInputEntered.addListener(function(text) {
	navigate(text, "newForegroundTab");
});