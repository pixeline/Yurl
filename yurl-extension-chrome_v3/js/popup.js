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
				// node.favicon = (node.descr === 'Bookmarklet') ? '' : '<img class="favicon" src="chrome://favicon/' + node.url + '"> ';
				const img = document.createElement('img');
				img.src = faviconURL(node.url);
				img.width = 25;
				img.style = "padding-right: 10px;";
				node.favicon = img.outerHTML;
				str = '<li tabindex="' + (i + 1) + '" class="bookmark"><a href="' + node.url + '"><h3>' + node.favicon + node.title + '</h3></a><p>' + node.descr.trunc(55, true) + '<span data-bookmark="' + node.id + '" class="delete" title="Delete Bookmark"></span></p></li>';
				html.push(str);
			}
		}
		var myHTMLString = '<ul id="bookmarkslist">' + html.join('') + '</ul>';
	} else {
		var myHTMLString = '<p class="error">Sorry, no result.</p>';
	}

	document.getElementById('bookmarks').innerHTML = myHTMLString;
	// store the results in chrome storage
	chrome.storage.local.set({ search: query, results: myHTMLString, timestamp: new Date().getTime() });
}
/*

	RUNTIME

*/
// Search the bookmarks when entering the search keyword.
jQuery(function ($) {
	var searchField = document.getElementById("search");

	chrome.storage.local.get(["results", "timestamp", "search"]).then((data) => {

		var now = new Date().getTime().toString();
		if (data.search && data.timestamp && ((now - data.timestamp.toString()) < 120000)) {
			searchField.value = data.search;
			document.getElementById('bookmarks').innerHTML = data.results;
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
			$thisLI.html('<p>Bookmark deleted...</p>').fadeOut("slow", function () {
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


function faviconURL(u) {
	const url = new URL(chrome.runtime.getURL("/_favicon/"));
	url.searchParams.set("pageUrl", u);
	url.searchParams.set("size", "32");
	return url.toString();
}