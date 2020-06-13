// created by Eylon Yogev.

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		try
		{
			console.log(changeInfo.status);
			HandleTab(tab);
		}
		catch(err){
			console.log(err);
		}
	}
});

var handlers = {};
init();


function init(){
	handlers['arxiv.org'] = arxivScraper;
}


function HandleTab(tab){
	var url = tab.url;
	chrome.bookmarks.search(url, function(results) {
		if (results.length == 0){
			try{
				var host = getHost(url);
				if (handlers[host] != null){
					handlers[host](tab, url);
				}
			}
			catch(err){
				console.log(err);
			}
		}
		else{
			var t = tab;
		}
	});
}

function getHost(url){
	var parser = document.createElement('a');
	parser.href = url;
	return parser.host;
}


function AddBookmarks(url, title, authors, arxiv_id) {
    var ref = '[' + arxiv_id + ']';
    var fullTitle = ref + ' - ' + title + " - " + authors.join(' and ');

    getYearFolderId(arxiv_id, function (id) {
        AddBookmark(url, fullTitle, id);
    });
}


function getYearFolderId(arxiv_id, callback) {
    var year = '20' + arxiv_id.substr(0, 2);
    var month = arxiv_id.substr(2, 2);
    getPapersFolderId(function (id) {
        chrome.bookmarks.getChildren(id, function (children) {
            var found_year = false;
            children.forEach(element => {
                if (element.title == year) {
                    found_year = true;
                    chrome.bookmarks.getChildren(element.id, function (grandchildren) {
                        var found_month = false;
                        grandchildren.forEach(subelement => {
                            if (subelement.title == month) {
                                callback(subelement.id);
                                found_month = true;
                                return;
                            }
                        });
                        if (!found_month) {
                            chrome.bookmarks.create({
                                'parentId': element.id,
                                'title': month
                            },
                                function (newfolder) {
                                    callback(newfolder.id);
                                });
                        }
                    });
                }
            });
            if (!found_year) {
                chrome.bookmarks.create({
                    'parentId': id,
                    'title': year
                },
                    function (newfolder) {
                        chrome.bookmarks.create({
                            'parentId': newfolder.id,
                            'title': month
                        },
                            function (newsubfolder) {
                                callback(newsubfolder.id);
                            }
                        );
                    }
                );
            }
        });
    });
}

function getPapersFolderId(callback){
	console.log('new');
	chrome.bookmarks.search("arxiv log", function(results) {
		var found = false;
		for (var i = 0; i < results.length; i++){
			if (results[i].title == "arxiv log"){
				found = true;
				var id = results[i].id;
				callback(id);
			}
		}
		if (!found){
			chrome.bookmarks.create({
				'parentId': '1',
				'title': 'arxiv log'},
				function(newfolder){
					console.log(newfolder);
					callback(newfolder.id);
			});
		}
	});
}


function AddBookmark(url, title, folderId){
	chrome.bookmarks.getChildren(folderId, function(children) {
		var found = false;
		children.forEach(function(bookmark) { 
			if (bookmark.url == url)
				found = true;
		});
		if (!found){
			chrome.bookmarks.create({
				'parentId': folderId,
				'title': title,
				'url': url,
				'index': 0}
			);
		}
	});
}