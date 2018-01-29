import React from 'react';
import ReactDOM from 'react-dom';
import ReactBody from 'react-body';

import FaPlus from 'react-icons/lib/fa/plus'
import FaNewspaperO from 'react-icons/lib/fa/newspaper-o'
import FaSliders from 'react-icons/lib/fa/sliders'
import FaMoonO from 'react-icons/lib/fa/moon-o'
import FaSunO from 'react-icons/lib/fa/sun-o'
import FaRefresh from 'react-icons/lib/fa/refresh'

import FeedEntry from './feedEntry';
import Accordion from './accordion';

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {bookmarkParentId: "", inputValue: "", rssFeeds: [ ], followFeeds: [ ], showDetails: false, showControls: true, darkMode: false, rotation: 0 };
	this.updateInputValue = this.updateInputValue.bind(this);
	this.logTree = this.logTree.bind(this);
	this.addRss = this.addRss.bind(this);
	this.toggleDetails = this.toggleDetails.bind(this);
	this.toggleControls = this.toggleControls.bind(this);
	this.toggleDarkMode = this.toggleDarkMode.bind(this);
	this.refreshFeeds = this.refreshFeeds.bind(this);
	this.updateFeeds = this.updateFeeds.bind(this);
  }
  
  logTree(item) { 
    console.log("LogTree1: " + item);
    console.log("LogTree2: " + item.background);
    console.log("LogTree3: " + JSON.stringify(item));
  }
  
  onRejected(error) {
    console.log("OnReject: " + error);
  }

  componentDidMount() {	
	this.refreshFeeds();
	
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log("popup: " + message);
		if(message.type === "re-render")
			this.refreshFeeds();
	});

	//$('body').addClass(_this.state.darkMode ? 'darkMode' : 'lightMode');
  }
  
  refreshFeeds() {
	let _this = this;
	browser.runtime.sendMessage({ type:"feed_request" }).then((result) => {
      this.setState({rssFeeds : result.rssFeeds, followFeeds: result.followFeeds, showDetails: result.showDetails, showControls: result.showControls, darkMode: result.darkMode });
	});
  }
  
  updateFeeds() {
	let _this = this;
	browser.runtime.sendMessage({ type:"updateFeeds" });
	_this.refreshFeeds();
	_this.setState({rotation: 360 + _this.state.rotation })
  }
  
  addRss() {
	browser.runtime.sendMessage({ type:"addUrl", url:this.state.inputValue }).then((result) => {
	  this.setState({
	    inputValue: ""
	  });
	
      if(result)
		alert("Error while adding rss url: " + result);
	});
	//if(this.state.inputValue) {
	//	if(!this.state.rssFeeds.includes(this.state.inputValue)) {
	//		var url = this.state.inputValue;
	//	
	//		if(!url.startsWith("http"))
	//			url = "http://" + url;
	//			
	//		var rssFeeds = this.state.rssFeeds.slice();
	//		rssFeeds.push(url);
	//		this.parseRss(url);
	//		browser.bookmarks.create({title:url, url:url, parentId: this.state.bookmarkParentId})
	//		this.setState({ rssFeeds: rssFeeds });
	//	}
	//	else alert("Feed Already Exists! ");
	//}
  }
  
  updateInputValue(evt) {
    this.setState({
      inputValue: evt.target.value
	});
  }
  
  toggleDetails() {
	browser.runtime.sendMessage({ type:"showDetails", showDetails: !this.state.showDetails });
    this.setState({
      showDetails: !this.state.showDetails
	});
  }
  
  toggleControls() {
	browser.runtime.sendMessage({ type:"showControls", showControls: !this.state.showControls });
    this.setState({
      showControls: !this.state.showControls
	});
  }
  
  toggleDarkMode() {
	browser.runtime.sendMessage({ type:"darkMode", darkMode: !this.state.darkMode });
    this.setState({
      darkMode: !this.state.darkMode
	});
  }

  render() {
	let _this = this;
	let defaultBtnColor = _this.state.darkMode ? 'white' : 'black';
	let icon = _this.state.darkMode ? "images/feed-basket-white.svg" : "images/feed-basket.svg";
	let style = {transform: 'rotate(' + _this.state.rotation + 'deg)'};
    return ( 
      <div className="mainDiv">
		<ReactBody className="darkMode" if={_this.state.darkMode} />
		<ReactBody className="lightMode" if={!_this.state.darkMode} />
		<div className="header">
			<img src={icon} />
			<h1>FeedBasket</h1>
			<button className="btnRefresh" style={style} title="Refresh Feeds" onClick={this.updateFeeds}>
				<FaRefresh color={defaultBtnColor} size={26}/>
			</button>
			<button className="btnDarkMode" title="Toggle Light/Dark Mode" onClick={this.toggleDarkMode}>
				{_this.state.darkMode && <FaMoonO color={defaultBtnColor} size={26}/>}
				{!_this.state.darkMode && <FaSunO color={defaultBtnColor} size={26}/>}
			</button>
			<button className="btnDetails" title="View Details" onClick={this.toggleDetails}>
				{<FaNewspaperO color={_this.state.showDetails ? defaultBtnColor : 'gray'} size={26}/>}
			</button>
			<button className="btnControls" title="View Details" onClick={this.toggleControls}>
				{<FaSliders color={_this.state.showControls ? defaultBtnColor : 'gray'} size={26}/>}
			</button>
			{/*<h4 className="cbxDescription"><input type="checkbox" onClick={this.toggleDetails} /> Descriptions</h4>*/}
		</div>
		<div className="subheader">
			<input className="inputField" type="text" autofocus="autofocus" value={this.state.inputValue} onChange={this.updateInputValue}/>
			<button className="addRssButton btn btn-block" title="Add RSS Feed" onClick={this.addRss}><FaPlus color={defaultBtnColor} size={26}/></button>
		</div>
		{this.state.rssFeeds.length == 0 && <div className="noFeeds">No Feeds</div>}
		{this.state.rssFeeds.length > 0 && <Accordion onUpdate={function(){_this.refreshFeeds();}} showControls={_this.state.showControls} darkMode={_this.state.darkMode}>
			{this.state.rssFeeds.map(function(object){
				return <div data-header={object.rssTitle} data-url={object.url} data-entries={object.entries} data-follow={_this.state.followFeeds.includes(object.url)}>
					{/*console.log(JSON.stringify(_this.state.rssData))*/}
					{object.entries.length > 0 && object.entries.map(function(item) {
						return <FeedEntry title={item.title} url={item.link} description={_this.state.showDetails ? item.description : undefined} preview={true} onUpdate={function(){_this.refreshFeeds();}} darkMode={_this.state.darkMode}/>
					})}
					{object.entries.length === 0 && "No Entries"}
				</div>
			})}
		</Accordion>}
		<div className="footer"></div>
      </div>
    );
  }
}

ReactDOM.render(<Popup/>, document.getElementById('app'));
