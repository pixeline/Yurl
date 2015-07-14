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
		myHTMLString = '',
		total = 0;
		
	if (localStorage.getItem("yurl") !== null ) {
		
		var yurl_cache = JSON.parse(localStorage.getItem("yurl"));
		var now = new Date().getTime().toString();
		
		if (yurl_cache.results !== '' && ((now - yurl_cache.timestamp.toString()) < 120000) ) {
			$('#search').val(yurl_cache.search);
			$('#bookmarks')[0].innerHTML = yurl_cache.results;
		} else {
			localStorage.setItem('yurl', null);
		}
	}
	$('#search').keyup(function() {
		delay(function() {
			$('#bookmarks').empty();
			query = $('#search').val();
			chrome.bookmarks.search(query, function(results) {
				total = results.length;
				var str = '';
				$('#total')[0].innerHTML = total + ' urls';
				if (total > 0) {
					var html = [];
					for (var i = 0; i < total; i++) {
						var node = results[i];
						var className = (node.children) ? 'folder' : 'link';
						if (className !== 'folder' && (typeof node.url !== 'undefined')) {
							// handle bookmarklets correctly
							node.descr = (node.url.substring(0, 10) === "javascript") ? 'Bookmarklet' : node.url;
							str = '<li tabindex="' + (i + 1) + '" class="bookmark"><a href="' + node.url + '"><h3>' + node.title + '</h3></a><p>' + node.descr.trunc(55, true) + '<span data-bookmark="' + node.id + '" class="delete" title="Delete Bookmark"></span></p></li>';
							html.push(str);
						}
					}
					myHTMLString = '<ul id="bookmarkslist">' + html.join('') + '</ul>';
				} else {
					myHTMLString = '<p class="error">Sorry, no result.</p>';
				}
				//THIS IS FASTER THAN JQUERY'S HTML() function
				$('#bookmarks')[0].innerHTML = myHTMLString;
				yurl_cache = JSON.stringify({
					search: query,
					results: myHTMLString,
					timestamp: new Date().getTime()
				});
				localStorage.setItem('yurl', yurl_cache);
			});
		}, 400);
		// End keyup callback
	});
	$(document).on('click.delete', '.delete', function(e) {
		e.preventDefault();
		var $this = $(this);
		var $thisLI = $(this).parents('li.bookmark');
		var nodeid = $this.data('bookmark');
		$thisLI.find('*').animate({
			backgroundColor: '#FFFFFF',
			color: '#000000',
			borderColor: '#FFFFFF'
		}, "slow", function() {
			chrome.bookmarks.remove(nodeid.toString(), function() {
				$thisLI.html('<p>Bookmark deleted...</p>').fadeOut(5000, function() {
					$(this).remove();
					total = $('.bookmark').length;
					$('#total').text(total + ' urls');
				});
			});
		});
		return false;
	});
	// Keyboard Interaction
	$(document).on('keydown', '.bookmark', function(e) {
		var e = window.event ? event : e;
		if (e.which === 38) {
			// Arrow Up
			$(this).prev('.bookmark').focus();
		}
		if (e.which === 40) {
			// Arrow Down 
			$(this).next('.bookmark').focus();
		}
		if (e.which === 9) {
			if (e.shiftKey) {
				//  SHIFT+Tab
				$(this).prev('.bookmark').focus();
			} else {
				// Tab
				$(this).next('.bookmark').focus();
			}
		}
		if (e.which === 46 || e.which === 8) {
			// Delete key
			$(this).find('.delete').trigger('click.delete');
		}
		if (e.which === 13 || e.which === 32) {
			// Enter or Space -> open link
			chrome.tabs.create({
				url: $(this).find('a').attr('href')
			});
		}
		e.preventDefault();
		return false;
	});
	$(document).on('click', '.bookmark', function() {
		chrome.tabs.create({
			url: $(this).find('a').attr('href')
		});
	});
	chrome.omnibox.onInputEntered.addListener(function(text) {
		navigate(text, "newForegroundTab");
	});
});