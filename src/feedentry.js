import React from 'react';
import FaCheck from 'react-icons/lib/fa/check'
import FaClose from 'react-icons/lib/fa/close'

export default class FeedEntry extends React.Component {  
  constructor(props) {
	 super(props);
	 this.state = {hasVisited: false};
	this.linkClick = this.linkClick.bind(this);
	this.addToHistory = this.addToHistory.bind(this);
	this.removeFromHistory = this.removeFromHistory.bind(this);
	this.updateParent = this.updateParent.bind(this);
  }

  componentDidMount() {
    // Get the active tab and store it in component state.
    browser.history.getVisits({url: this.props.url}).then(historyItems => {
	  if(historyItems.length > 0)
		this.setState({hasVisited: true});
    });	
  }
  
  componentDidUpdate(previousProps, previousState) {
    browser.history.getVisits({url: this.props.url}).then(historyItems => {
	  if(historyItems.length > 0 && !previousState.hasVisited)
		this.setState({hasVisited: true});
	  else if(historyItems.length === 0 && previousState.hasVisited)
		this.setState({hasVisited: false});
    });	
  }
  
  addToHistory() {
    browser.history.addUrl({url: this.props.url, title: this.props.title || this.props.url});
	this.setState({hasVisited: true});
	this.updateParent();
  }
  
  removeFromHistory() {
    browser.history.deleteUrl({url: this.props.url});
	this.setState({hasVisited: false});
	this.updateParent();
  }
  
  updateParent() {
	if(this.props.onUpdate !== 'undefined') {
		this.props.onUpdate();
	}
  }
  
  //<a href="#" onClick={this.handleClick}>Click me!</a>
  linkClick() {
	this.setState({hasVisited: true});
    //browser.tabs.create({
	//	url:this.props.url
	//});
  }
	
  render() {
    return (
      <div className={this.state.hasVisited ? 'entry-visited' : 'entry-unvisited'}>
		<p className={(this.state.hasVisited ? 'link visited' : 'link') + (this.props.darkMode ? ' link-Dark' : ' link-Light')}>
		  <a href={this.props.url} target="_blank" title={this.props.title || this.props.url} onClick={this.linkClick}>
			<h3>{this.props.title || this.props.url}</h3>
			{this.props.description &&
				<p>
					{this.props.preview ? 
					<span dangerouslySetInnerHTML={{__html: this.props.description || "<p>No Description</p>"}}></span> 
					: 
					<span>{$(this.props.description).text() || "No Description"}</span>}
					
				</p>
			}
		  </a>
		  {!this.state.hasVisited && <button className="markReadButton" title="Mark As Read" onClick={this.addToHistory}><FaCheck size={26}/></button>/*&#10003;*/} 
		  {this.state.hasVisited && <button className="markUnreadButton" title="Mark As Unread" onClick={this.removeFromHistory}><FaClose size={26} /></button>/*&#10007;*/} 
		</p>
      </div>
    );
  }
}
