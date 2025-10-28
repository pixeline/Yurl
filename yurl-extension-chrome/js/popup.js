var query, myHTMLString, total = 0;

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
				node.url = (node.url.length < 1) ? node.title.substring(0, 1).toUpperCase() : node.url;
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
};
/*

	RUNTIME

*/
// Search the bookmarks when entering the search keyword (vanilla JS)
document.addEventListener('DOMContentLoaded', function () {
	var searchField = document.getElementById('search');
	var bookmarksContainer = document.getElementById('bookmarks');

	function updateTotal() {
		total = document.querySelectorAll('.bookmark').length;
		var totalEl = document.getElementById('total');
		if (totalEl) {
			totalEl.textContent = total + ' urls';
		}
	}

	chrome.storage.local.get(["results", "timestamp", "search"], function (data) {
		var now = new Date().getTime();
		if (data && data.search && data.timestamp && ((now - Number(data.timestamp)) < 120000)) {
			searchField.value = data.search;
			bookmarksContainer.innerHTML = data.results;
		}
	});

	function safeFocus(el) {
		if (!el || el.disabled) return;
		// Defer focus to avoid MV3 popup timing issues; ignore failures
		setTimeout(function () {
			try { el.focus({ preventScroll: true }); } catch (e) { }
		}, 0);
	}
	safeFocus(searchField);

	// Latest tab behavior
	var latestTab = document.getElementById('tab-latest');
	var tabSearch = document.querySelector('#searchform .tab-search');
	var searchForm = document.getElementById('searchform');

	function renderSearchForCurrentInput() {
		bookmarksContainer.innerHTML = '';
		var value = searchField && searchField.value ? searchField.value.trim() : '';
		query = value;
		if (value) {
			chrome.bookmarks.search(value, renderTheResults);
		} else {
			var totalEl = document.getElementById('total');
			if (totalEl) totalEl.textContent = '0 urls';
		}
	}
	function activateSearchTab() {
		tabSearch.classList.add('active');
		latestTab.classList.remove('active');
		tabSearch.classList.remove('disabled');
		if (searchField) searchField.disabled = false;
		safeFocus(searchField);
		if (searchForm) searchForm.classList.remove('latest-active');
	}
	function activateLatestTab() {
		tabSearch.classList.remove('active');
		latestTab.classList.add('active');
		tabSearch.classList.add('disabled');
		if (searchField) {
			searchField.disabled = true;
			if (typeof searchField.blur === 'function') searchField.blur();
		}
		if (searchForm) searchForm.classList.add('latest-active');
	}
	function showLatest() {
		bookmarksContainer.innerHTML = '';
		activateLatestTab();
		chrome.bookmarks.getRecent(100, renderTheResults);
	}
	if (latestTab) {
		latestTab.addEventListener('click', showLatest);
	}
	if (tabSearch) {
		tabSearch.addEventListener('click', function () {
			if (latestTab.classList.contains('active')) {
				// when latest is active, clicking anywhere in search tab reactivates search
				activateSearchTab();
				searchField.focus();
				renderSearchForCurrentInput();
			}
		});
	}

	searchField.addEventListener('keyup', function () {
		delay(function () {
			bookmarksContainer.innerHTML = '';
			query = searchField.value;
			chrome.bookmarks.search(query, renderTheResults);
			activateSearchTab();
		}, 400);
	});

	// Delegated click: handle delete first, then bookmark open
	document.addEventListener('click', function (e) {
		var del = e.target.closest && e.target.closest('.delete');
		if (del) {
			e.preventDefault();
			var li = del.closest('li.bookmark');
			if (!li) return;
			var nodeid = del.getAttribute('data-bookmark');
			chrome.bookmarks.remove(String(nodeid), function () {
				// simple fade-out then remove
				li.classList.add('fade-out');
				li.addEventListener('transitionend', function () {
					if (li && li.parentNode) li.parentNode.removeChild(li);
					updateTotal();
				}, { once: true });
			});
			return;
		}

		var liClick = e.target.closest && e.target.closest('li.bookmark');
		if (liClick) {
			e.preventDefault();
			var a = liClick.querySelector('a');
			if (a && a.href) {
				chrome.tabs.create({ url: a.href });
			}
		}
	});

	// Keyboard Interaction on focused bookmark items
	document.addEventListener('keydown', function (e) {
		var li = e.target && e.target.closest && e.target.closest('li.bookmark');
		if (!li) return;
		var key = e.which || e.keyCode;
		if (key === 38) {
			// Arrow Up
			var prev = li.previousElementSibling;
			while (prev && !prev.classList.contains('bookmark')) prev = prev.previousElementSibling;
			if (prev) prev.focus();
			e.preventDefault();
			return false;
		}
		if (key === 40) {
			// Arrow Down
			var next = li.nextElementSibling;
			while (next && !next.classList.contains('bookmark')) next = next.nextElementSibling;
			if (next) next.focus();
			e.preventDefault();
			return false;
		}
		if (key === 9) {
			// Tab / Shift+Tab
			if (e.shiftKey) {
				var prevT = li.previousElementSibling;
				while (prevT && !prevT.classList.contains('bookmark')) prevT = prevT.previousElementSibling;
				if (prevT) prevT.focus();
			} else {
				var nextT = li.nextElementSibling;
				while (nextT && !nextT.classList.contains('bookmark')) nextT = nextT.nextElementSibling;
				if (nextT) nextT.focus();
			}
			e.preventDefault();
			return false;
		}
		if (key === 46 || key === 8) {
			// Delete or Backspace
			var delBtn = li.querySelector('.delete');
			if (delBtn) delBtn.click();
			e.preventDefault();
			return false;
		}
		if (key === 13 || key === 32) {
			// Enter or Space -> open link
			var a = li.querySelector('a');
			if (a && a.href) {
				chrome.tabs.create({ url: a.href });
			}
			e.preventDefault();
			return false;
		}
	});
	// Default view: Latest first on load
	showLatest();
});


function faviconURL(u) {
	const url = new URL(chrome.runtime.getURL("/_favicon/"));
	url.searchParams.set("pageUrl", u);
	url.searchParams.set("size", "32");
	return url.toString();
}