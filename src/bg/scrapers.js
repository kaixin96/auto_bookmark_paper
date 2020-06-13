
function bibtexParser(url, pageUrl, options={}){
	getUrl(pageUrl, function(req){
		bibtexParserString(url, req.responseText, options);
	});
}

function bibtexParserString(url, bibtexString, options={}){
	if (options == null)
		options = {};
	
	if (options['titleName'] == null)
		options['titleName'] = 'title';
	if (options['authorsName'] == null)
		options['authorsName'] = 'author';
	if (options['yearName'] == null)
		options['yearName'] = 'year';
	
	if (options['callback'] == null)
		options['callback'] = AddBookmarks;
	
	var data = parseBibFile(bibtexString);
	var key = Object.keys(data.entries$)[0];
	var entry = data.entries$[key];
	
	var title = entry.getFieldAsString('Title');
	var authorField = entry.getField("author");

	var authors = [];
	authorField.authors$.map((author, i) => 
		authors.push(author.firstNames + ' ' + author.lastNames)
	);
	
	var year = entry.getFieldAsString('Year');
	options['callback'](url, title, authors, year);
}


function metaParser(url, pageUrl, options = {}) {
    if (options == null)
        options = {};

    if (options['titleName'] == null)
        options['titleName'] = 'citation_title';
    if (options['authorsName'] == null)
        options['authorsName'] = 'citation_author';
    if (options['arxiv_id'] == null)
        options['arxiv_id'] = 'citation_arxiv_id';

    if (options['callback'] == null)
        options['callback'] = AddBookmarks;

    getDom(pageUrl, function (dom) {
        var title = getElementByName(dom, 'meta', options['titleName'])[0].content;
        var authorsHtml = getElementByName(dom, 'meta', options['authorsName']);
        var authors = [];
        for (var i = 0; i < authorsHtml.length; i++) {
            if (!authors.includes(authorsHtml[i]))
                authors.push(authorsHtml[i].content);
        }

        var arxiv_id = getElementByName(dom, 'meta', options['arxiv_id'])[0].content;

        options['callback'](pageUrl, title, authors, arxiv_id);
    });
}

function metaParserSingleAuthor(url, pageUrl, delimiter, options){
	if (options == null)
		options = {};
	var theirCallback = options['callback'];
	if (theirCallback == null)
		theirCallback = AddBookmarks;
	
	options['callback'] = function(url, title, authors, year){
		var authors = authors.split(delimiter);
		callback(url, title, authors, year);
	}
	
	metaParser(url, pageUrl, options);
}

function arxivScraper(tab, url){
	if (!url.endsWith('.pdf'))
		return;
	
    var pageUrl = url.replace('/pdf/', '/abs/').replace('.pdf', '');
	metaParser(url, pageUrl);
}

function mlrScraper(tab, url){
	if (url.indexOf('.pdf') == -1)
		return;
	
	var pageUrl = url.replace('.pdf', '.html');
	getUrl(pageUrl, function(req){
		var parser = new DOMParser ();
		var responseDoc = parser.parseFromString (req.responseText, "text/html");
		var bibtexString = responseDoc.getElementById('bibtex').innerHTML;
		console.log(bibtexString);
		bibtexParserString(url, bibtexString);
	});
}


//////////////////////////////////////////////////////

function getUrl(url, callback){
	var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onreadystatechange = function() {
		if (req.readyState == 4) {
			if (req.status == 200) {
				callback(req);
            }
          }
        };
	req.send();
}

function getDom(pageUrl, callback){
	getUrl(pageUrl, function(req){
		var dom = document.createElement( 'html' );
		dom.innerHTML = req.responseText;
		callback(dom);
	});
}



function cleanSpaces(text){
	return text.replace(/ +(?= )/g,'');
}

function getInitials(authors){
	if (authors.length == 1){
		var lastName = getLastPart(authors[0], ' ');
		if (lastName.length >= 3)
			return lastName.substring(0,3);
		else
			return lastName;
	}
	
	var str = '';
	for (i = 0; i < authors.length; i++){
		var parts = authors[i].split(' ');
		var last = parts[parts.length-1];
		var letter = last.substring(0,1);
		str += letter;
	}
	return str;
}

function getLastPart(str, del){
	var parts = str.split(del);
	return parts[parts.length-1];
}

function getPartFromEnd(str, del, num){
	var parts = str.split(del);
	return parts[parts.length-1-num];
}

function getElementByName(dom, tag, name){
	var els = dom.getElementsByTagName(tag);
	var res = [];
	for (var i = 0; i < els.length; i++){
		if (els[i].name == name){
			res.push(els[i]);
		}
	}
	return res;
}

function getElementWithHref(dom, name){
	var els = dom.getElementsByTagName('a');
	var res = [];
	for (var i = 0; i < els.length; i++){
		if (els[i].href.indexOf(name) != -1){
			
			res.push(els[i]);
		}
	}
	return res;
}

function getElementByTagAndId(dom, tag, id){
	var els = dom.getElementsByTagName(tag);
	
	for (var i = 0; i < els.length; i++){
		if (els[i].id == id){
			return els[i];
		}
	}
	return null;
}