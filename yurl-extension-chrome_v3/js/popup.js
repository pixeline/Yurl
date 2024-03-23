var query, myHTMLString, total = 0;
var chrome = chrome;

String.prototype.trunc = String.prototype.trunc ||
	function (n) {
		return this.length > n ? this.substr(0, n - 1) + '&hellip;' : this;
	};

function navigate(url) {
	chrome.tabs.getSelected(null, function (tab) {
		chrome.tabs.update(tab.id, {
			url: url
		});
	});
}
/*
	Small delay to wait for user keydown pausing
	http://stackoverflow.com/questions/1909441/jquery-keyup-delay
*/
var delay = (function () {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
})();
/*
	Function that renders the bookmark node tree
*/
renderTheResults = function (results) {
	total = results.length;
	var str = '';
	//$('#total')[0].innerHTML = total + ' urls';
	document.getElementById('total').innerHTML = total + ' urls';
	if (total > 0) {
		var html = [];
		for (var i = 0; i < total; i++) {
			var node = results[i];
			var className = (node.children) ? 'folder' : 'link';
			if (className !== 'folder' && (typeof node.url !== 'undefined')) {
				// handle bookmarklets correctly
				node.url = (node.url.length < 1) ? node.title(substring(0, 1)).toUpperCase() : node.url;
				node.descr = (node.url.substring(0, 10) === "javascript") ? 'Bookmarklet' : node.url;
				node.favicon = (node.descr === 'Bookmarklet') ? '' : '<img class="favicon" src="chrome://favicon/' + node.url + '"> ';
				str = '<li tabindex="' + (i + 1) + '" class="bookmark"><a href="' + node.url + '"><h3>' + node.favicon + node.title + '</h3></a><p>' + node.descr.trunc(55, true) + '<span data-bookmark="' + node.id + '" class="delete" title="Delete Bookmark"></span></p></li>';
				html.push(str);
			}
		}
		var myHTMLString = '<ul id="bookmarkslist">' + html.join('') + '</ul>';
	} else {
		var myHTMLString = '<p class="error">Sorry, no result.</p>';
	}

	document.getElementById('bookmarks').innerHTML = myHTMLString;

	var yurl_cache = JSON.stringify({
		search: query,
		results: myHTMLString,
		timestamp: new Date().getTime()
	});
	chrome.storage.sync.set({ 'yurl': yurl_cache }, function () {
		console.log('yurl query saved: ' + yurl_cache);
	});
	//localStorage.setItem('yurl', yurl_cache);
}
/*

	RUNTIME

*/
// Search the bookmarks when entering the search keyword.
jQuery(function ($) {
	var searchField = document.getElementById("search");

	chrome.storage.sync.get(['yurl'], function (result) {
		console.log('Value currently is ' + result.yurl);
		var yurl_cache = JSON.parse(result.yurl);
		var now = new Date().getTime().toString();
		if (yurl_cache && yurl_cache.search && yurl_cache.timestamp && ((now - yurl_cache.timestamp.toString()) < 120000)) {
			//$('#search').val(yurl_cache.search);
			searchField.value = yurl_cache.search;
			document.getElementById('bookmarks').innerHTML = yurl_cache.results;
		}


	});
	searchField.focus();

	$('#history').on('click', function () {
		$('#bookmarks').empty();
		chrome.bookmarks.getRecent(100, renderTheResults);
	});
	$('#search').keyup(function () {
		delay(function () {
			$('#bookmarks').empty();
			query = $('#search').val();
			chrome.bookmarks.search(query, renderTheResults);
		}, 400);


		// End keyup callback

	});
	$(document).on('click.delete', '.delete', function (e) {
		e.preventDefault();
		var $this = $(this);
		var $thisLI = $(this).parents('li.bookmark');
		var nodeid = $this.data('bookmark');
		$thisLI.find('*').animate({
			backgroundColor: '#FFFFFF',
			color: '#000000',
			borderColor: '#FFFFFF'
		}, "slow", function () {
			chrome.bookmarks.remove(nodeid.toString(), function () {
				$thisLI.html('<p>Bookmark deleted...</p>').fadeOut(5000, function () {
					$(this).remove();
					total = $('.bookmark').length;
					$('#total').text(total + ' urls');
				});
			});
		});
		return false;
	});
	// Keyboard Interaction
	$(document).on('keydown', '.bookmark', function (e) {
		e = window.event ? event : e;
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
	$(document).on('click', '.bookmark', function () {
		chrome.tabs.create({
			url: $(this).find('a').attr('href')
		});
	});
});
