var chrome = chrome;
String.prototype.trunc = String.prototype.trunc ||
function(n) {
	return this.length > n ? this.substr(0, n - 1) + '&hellip;' : this;
};

function navigate(url) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}
/*
	Small delay to wait for user keydown pausing
	http://stackoverflow.com/questions/1909441/jquery-keyup-delay
*/
var delay = (function() {
	var timer = 0;
	return function(callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
})();
/*

	RUNTIME	
	
*/
// Search the bookmarks when entering the search keyword.
jQuery(function($) {
	var query = '',
		myHTMLString = '';
	$('#search').keyup(function() {
		delay(function() {
			$('#bookmarks').empty();
			query = $('#search').val();
			chrome.bookmarks.search(query, function(results) {
				var total = results.length;
				var str = '';
				$('#total')[0].innerHTML = total + ' urls';
				if (total > 0) {
					var html = [];
					for (var i = 0; i < total; i++) {
						var node = results[i];
						var className = (node.children) ? 'folder' : 'link';
						if (className === 'folder') {
							str = '<p class="' + className + '">' + node.title + ' [' + node.url + ']</p>';
						} else {
							// handle bookmarklets correctly
							node.descr = (node.url.substring(0, 10) === "javascript") ? 'Bookmarklet' : node.url;
							str = '<a href="' + node.url + '" class="bookmark"><h3>' + node.title + '</h3><p>' + node.descr.trunc(65, true) + '</p></a>';
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
		}, 400);
		// End keyup callback
	});
	$(document).on('click', 'a.bookmark', function() {
		chrome.tabs.create({
			url: $(this).attr('href')
		});
	});
});
chrome.omnibox.onInputEntered.addListener(function(text) {
	navigate(text, "newForegroundTab");
});