
// Search the bookmarks when entering the search keyword.
$(function() {
  var query='';
  
  $('#search').keyup(function() {
      $('#bookmarks').empty();
      query = $('#search').val();

      chrome.bookmarks.search(query, function (results){
        var total = results.length;
        $('#total').html(total+' urls');
        if(total>0){
          var html = new Array();
          for(i=0; i<total ;i++){
            var node = results[i];
            var className = (node.children) ? 'folder':'link';
            if(className=='folder'){
              str = '<li class="'+className+'">'+node.title + ' ['+ node.url +']</li>';
            }else{
              // !todo: handle bookmarklets correctly
              str = '<li class="'+className+'"><a href="'+ node.url +'" class="bookmark"><h3>'+node.title + '</h3><span class="details">'+ node.url +'</span></a></li>';
            }
            
            html.push(str);
          }
          $('#bookmarks').html('<ol id="bookmarkslist">'+html.join('')+'</ol>');
        }else{
          $('#bookmarks').html('<p style="text-align:center">Sorry, no result.</p>');
        }
     });

  });
  $(document).on('click', 'a.bookmark', function(){
      chrome.tabs.create({url: $(this).attr('href')});
  });
});

chrome.omnibox.onInputChanged.addListener(
    function(text, suggest) {
      var result = new Array();
      chrome.bookmarks.search(text, function (results){
        for(i=0; i<results.length ;i++){
          var node = results[i];
          result.push({content: node.url, description: node.title});
        }
      });
      suggest(result);
    }
);
chrome.omnibox.onInputEntered.addListener(
    function(text) {
        navigate(text, "newForegroundTab");
    });
function navigate(url) {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, {url: url});
    });
};





