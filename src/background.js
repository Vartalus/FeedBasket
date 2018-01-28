class Background {	
	constructor() {
		this.rssFeeds = [ ];
		this.settings = new Settings();
		this.bookmarkParentId = "";
		this.fillRssUrls = this.fillRssUrls.bind(this);
		this.processParentFolder = this.processParentFolder.bind(this);
		this.checkFolder = this.checkFolder.bind(this);
		this.addRss = this.addRss.bind(this);
		this.initialize = this.initialize.bind(this);
		this.monitorLoop = this.monitorLoop.bind(this);
		//this.getIcon = this.getIcon.bind(this);
		//this.handleUpdated = this.handleUpdated.bind(this);
	
		this.initialize();
		this.monitorLoop();
	}
	
	initialize() {
		let _this = this;
		console.log("initialize");
		browser.browserAction.setBadgeBackgroundColor({color: "gray"});
		browser.bookmarks.search({title: "FeedBasket"}).then(this.checkFolder, this.onRejected);
		
		//browser.theme.getCurrent().then((themeInfo) => console.log("Theme: " + JSON.stringify(themeInfo)));
		//browser.theme.onUpdated.addListener(({ theme, windowId }) => {
		//	console.log("theme changed");
		//	browser.browserAction.setIcon({path: getIcon(theme.colors.accentcolor)});
		//});
		//browser.theme.onUpdated.addListener(this.handleUpdated);
		
		this.settings.load();
		//this.settings.load().then(function() {
		//	_this.settings.followFeeds.map(feed => {
		//		_this.addRss(feed);
		//	});
		//});
		
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if(message.type === "feed_request") {
				let result = new Object();
				result.rssFeeds = JSON.parse(JSON.stringify(_this.rssFeeds));
				result.followFeeds = JSON.parse(JSON.stringify(_this.settings.followFeeds));
				result.showDetails = JSON.parse(JSON.stringify(_this.settings.showDetails));
				result.showControls = JSON.parse(JSON.stringify(_this.settings.showControls));
				result.darkMode = JSON.parse(JSON.stringify(_this.settings.darkMode));
				sendResponse(result);
			}
			else if(message.type === "addUrl") {
				let result = _this.addRss(message.url);
				sendResponse(result);
			}
			else if(message.type === "showDetails") {
				console.log("setting showDetails to: " + message.showDetails);
				_this.settings.showDetails = message.showDetails;
				_this.settings.save();
				sendResponse(_this.settings.showDetails);
			}
			else if(message.type === "showControls") {
				console.log("setting showControls to: " + message.showControls);
				_this.settings.showControls = message.showControls;
				_this.settings.save();
				sendResponse(_this.settings.showControls);
			}
			else if(message.type === "darkMode") {
				console.log("setting darkMode to: " + message.darkMode);
				_this.settings.darkMode = message.darkMode;
				_this.settings.save();
				sendResponse(_this.settings.darkMode);
				browser.browserAction.setIcon({path: _this.settings.darkMode ? 'images/feed-basket-white.svg' : 'images/feed-basket.svg'});
			}
			else if(message.type === "followFeed") {
				if(_this.settings.followFeeds.includes(message.url)) {
					let index = _this.settings.followFeeds.indexOf(message.url)
					let result = _this.settings.followFeeds.splice(index, 1);
					sendResponse(false);
				}
				else {
					let result = _this.settings.followFeeds.push(message.url);
					sendResponse(true);
				}
				_this.settings.save();
			}
		});
	}
  
	onRejected(error) {
		console.log(error);
	}
	
	//handleUpdated(updateInfo) {
	//  if (updateInfo.theme.colors) {
	//	console.log('Theme was applied');
	//  } else {
	//	console.log('Theme was removed');
	//  }
	//}
	
	//getIcon(hexcolor) {
	//	let r = parseInt(hexcolor.substr(0,2),16);
	//	let g = parseInt(hexcolor.substr(2,2),16);
	//	let b = parseInt(hexcolor.substr(4,2),16);
	//	let yiq = ((r*299)+(g*587)+(b*114))/1000;
	//	console.log("theme: " + yiq);
	//	return (yiq >= 128) ? 'images/feed-basket.svg' : 'images/feed-basket-white.svg';
	//}
	
	fillRssUrls(bookmarkItems) {
		console.log("fillRssUrls");
		let _this = this;
		if(bookmarkItems !== 'undefined' || bookmarkItems.length > 0) {
			bookmarkItems[0].children.map(function(object) {
				let feed = new RssFeed(object.url, object.title || object.url);
				feed.update();
				_this.rssFeeds.push(feed);
			});
		}
	}

	processParentFolder(parentBookmark) {
		console.log("processParentFolder");
		browser.bookmarks.getSubTree(parentBookmark.id).then(this.fillRssUrls, this.onRejected);
		this.bookmarkParentId = parentBookmark.id;
	}
  
	checkFolder(bookmarkItems) {
		console.log("checkFolder");
		if(bookmarkItems === 'undefined' || bookmarkItems.length === 0)
			browser.bookmarks.create({title:"FeedBasket", index: 1, parentId:"menu________"}).then(this.processParentFolder, this.onRejected);
		else {
			this.processParentFolder(bookmarkItems[0]);
		}
	}
	
	addRss(url) {
		let _this = this;
		console.log("addRss");
		let result = undefined;
		if(url) {
			if(!this.rssFeeds.some(feed => feed.url === url)) {			
				if(!url.startsWith("http"))
					url = "http://" + url;
					
				let feed = new RssFeed(url);
				feed.update().then(function() {
					console.log("addRss2");
					_this.rssFeeds.push(feed);
					console.log("feed title: " + feed.rssTitle);
					browser.bookmarks.create({title:feed.rssTitle, url:url, parentId: _this.bookmarkParentId});
					browser.runtime.sendMessage({ type:"re-render" });
				}, _this.onRejected);
				
				if(!_this.settings.followFeeds.includes(feed.url)) {
					this.settings.followFeeds.push(url);
					this.settings.save();
				}
			}
			else result = "Feed Already Exists!";
		}
		else result = "Empty URL!"
		return result;
	}
	
	monitorLoop(){
		console.log("monitorLoop");
		let _this = this;
		setInterval(function() {
			_this.rssFeeds.map(function(feed) {
				console.log(feed);
				feed.update();
			});
		}, 30 * 60 * 1000 ) //30 minutes
		
		setInterval(function() {
			let historySearch = [];
			let cnt = 0;
			
			_this.rssFeeds.forEach(function(feed){
				if(_this.settings.followFeeds.includes(feed.url)) {
					feed.entries.forEach(function(entry){
						historySearch.push(browser.history.getVisits({url: entry.link}).then(function(result) {
							return result;
						}));
					});
				}
			});
			
			Promise.all(historySearch).then(function(search){
				search.forEach(function(historyItem){
					if(historyItem.length === 0) {
						cnt += 1;
					}
				});
			}).then(x => browser.browserAction.setBadgeText({ text: "" + (cnt > 0 ? cnt : "") }));
			
			
		}, 10000 ) //10 second(s)
	}
}

class Settings {
	constructor() {
		this.followFeeds = [];
		this.showDetails = false;
		this.showControls = true;
		this.darkMode = false;
	}
	
	save() {
		let saveItems = {followFeeds: this.followFeeds.slice(), showDetails: this.showDetails, showControls: this.showControls, darkMode: this.darkMode };
		browser.storage.sync.set(saveItems);
	}
	
	load() {
		let _this = this;
		return new Promise((resolve, reject) => {
			let getItems = browser.storage.sync.get(["followFeeds", "showDetails", "showControls", "darkMode"]).then(item => {
					console.log("loading: " + JSON.stringify(item));
				if(item) {
					if(item.followFeeds) {
						console.log("loaded followFeeds: " + JSON.stringify(item.followFeeds));
						_this.followFeeds = item.followFeeds.slice();
					}
					console.log("loaded showDetails: " + JSON.stringify(item.showDetails));
					_this.showDetails = item.showDetails;
					console.log("loaded showControls: " + JSON.stringify(item.showControls));
					_this.showControls = item.showControls;
					console.log("loaded darkMode: " + JSON.stringify(item.darkMode));
					_this.darkMode = item.darkMode;
				}
				resolve();
			})
		});
	}
}

class RssFeed {
	constructor(url, title) {
		this.url = url;
		this.rssTitle = title;
		this.entries = [ ];
		this.unreadCount = 0;
		this.update = this.update.bind(this);
	}
	
	calculateUnread() {
		let _this = this;
		this.unreadCount = 0;
		_this.entries.map(function(entry) {
			browser.history.search({text: entry.link + " " + entry.title}).then(historyItems => { 
				if(historyItems.length === 0) {
					_this.unreadCount += 1;
				}
			});
		});
	}
  
	update(){
		//console.log($("#rss-feeds").rss('https://news.google.com/news/rss/headlines/section/topic/TECHNOLOGY?ned=us&hl=en&gl=US'));
		let _this = this;
		let NOT_SAFE_IN_XML_1_0 = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;
		return new Promise((resolve, reject) => {
			if(_this.url) {
				$.get(_this.url, function(data) {
					let $xml = $($.parseXML(data.replace(NOT_SAFE_IN_XML_1_0, '')));
					let array = [];
					_this.rssTitle = _this.rssTitle || $xml.find("title").first().text();
					console.log("Xml loaded for " + _this.url)
					$xml.find("item, entry").each(function() {
						let $this = $(this),
							item = {
								title: $this.find("title").text(),
								link: $this.find("link").attr('href') ? $this.find("link").attr('href') : $this.find("link").text(),
								//description: $($this.find("description, summary").text()).text(),
								description: $this.find("description, summary, media\\:description").text(),
								pubDate: $this.find("pubDate, published").text(),
								author: $this.find("author").text()
						}
						if(item) {
							array.push(item);
						}
					});
					
					_this.entries = array;
					resolve();
				}, "text");
			}
			else reject("Invalid url");
		});
	}
}

const background = new Background();