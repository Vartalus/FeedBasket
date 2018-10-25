import React from 'react';
import ReactDOM from 'react-dom';

import Modal from 'react-modal';

import FaCheck from 'react-icons/lib/fa/check'
import FaClose from 'react-icons/lib/fa/close'
import FaEye from 'react-icons/lib/fa/eye'
import FaEyeSlash from 'react-icons/lib/fa/eye-slash'
import FaTrashO from 'react-icons/lib/fa/trash-o'
import FaCaretRight from 'react-icons/lib/fa/caret-right'
import FaCaretDown from 'react-icons/lib/fa/caret-down'


export default class Accordion extends React.Component {  
	constructor(props) {
		super(props);
		this.state = {
			index: typeof props.selectedIndex !== 'undefined' ? props.selectedIndex : -1, dialogText: "", dialogUrl: ""
		};
		this.nodes = [];
		this.addToHistory = this.addToHistory.bind(this);
		this.followFeed = this.followFeed.bind(this);
		this.updateUnread = this.updateUnread.bind(this);
		this.deleteFeed = this.deleteFeed.bind(this);
		this.renderModal = this.renderModal.bind(this);
		this.deleteAndCloseModal = this.deleteAndCloseModal.bind(this);
		this.closeModal = this.closeModal.bind(this);
	}
	
	static defaultProps = {
		transitionDuration: 500,
		transitionTimingFunction: 'ease',
		openClassName: 'open',
		changeOnClick: true,
		bookmarkParentId: ""
	}
	
	componentWillReceiveProps(props) {
		if (typeof props.selectedIndex !== 'undefined' && this.state.index !== props.selectedIndex) {
			this.toggle(props.selectedIndex)
		}
	}
	
	componentWillUnmount() {
		//clearTimeout(this.timeout)
	}
	
	componentDidMount() {
		this.updateUnread();
	}
	
	componentDidUpdate() {
		this.updateUnread();
	}
	
	addAllToHistory(entries) {
		if(entries !== 'undefined') {
			entries.map(this.addToHistory);
		}
		
		setTimeout(() => { 
			if(this.props.onUpdate !== 'undefined') {
				this.props.onUpdate();
			}
		}, 100);
	}
	
	deleteFeed(url) {
		this.setState({ dialogText: "Are you sure you want to delete the feed from: " + url + " ?", dialogUrl: url });
	}
  
	addToHistory(entry) {
		browser.history.addUrl({url: entry.link, title: (entry.title || entry.link)});
	}
	
	updateUnread() {
			setTimeout(() => { 
				$(".acc-Node").each(function(index) {
					var cnt = $(this).find(".acc-Content").children().children(".entry-unvisited").length;
					if(!cnt || cnt === 0)
						cnt = "";
					else
						cnt = cnt + " new";
					
					$(this).find(".acc-UnreadCnt").text(cnt);
				});
			}, 500);
	}
	
	followFeed(url) {
		var _this = this;
		browser.runtime.sendMessage({ type:"followFeed", url:url }).then((result) => {
			console.log("followFeed result: " + result);
			if(this.props.onUpdate !== 'undefined') {
				this.props.onUpdate();
			}
		});
	}
	
	toggle(index, click) {
		//clearTimeout(this.timeout) 

		if (click) {
			if (this.props.onChange) this.props.onChange(index, this.state.index !== index, this.state.index !== index ? index : -1)
			if (!this.props.changeOnClick) return
		}

		if (this.state.index > -1) {
			const content = this.nodes[this.state.index].ref.children[1]
			//content.style.height = `${content.children[0].offsetHeight}px` // Set fixed height before collapse of current open item
		}

		if (this.state.index === index || index === -1) {
			setTimeout(() => { this.setState({ index: -1 }) }, 50)
		} else {
			setTimeout(() => {
				this.setState({ index })
				//this.timeout = setTimeout(() => {
				//	this.nodes[index].ref.children[1].style.height = 'auto' // Set auto height after expand
				//}, this.props.transitionDuration)
			}, 50)
		}
    }
	
	deleteAndCloseModal() {
		let _this = this;
		let _dialogUrl = _this.state.dialogUrl;
		
		if(_dialogUrl && _dialogUrl.length > 0) {
			browser.bookmarks.getChildren(_this.props.bookmarkParentId).then((result) => {
				if(result.length > 0) {
					result.forEach(function(bookmark){
					console.log("bookmark.url: " + bookmark.url + ", _dialogUrl: " + _dialogUrl);
						if(bookmark.url == _dialogUrl) {
							console.log("Removing Bookmark ID" + bookmark.id);
							browser.bookmarks.remove(bookmark.id);
							browser.runtime.reload();
						}
					});
				}
			});
			
			this.closeModal();
		}
		
		this.closeModal();
	}
	
	closeModal() {
		this.setState({ dialogText: "", dialogUrl: "" })
	}
	
	renderModal() {
		let _this = this;
		let bckColor = this.props.darkMode ? 'rgba(25, 25, 25, 0.75)' : 'rgba(255, 255, 255, 0.75)';
		let textColor = this.props.darkMode ? ' white' : ' black';
		
		return <Modal isOpen={this.state.dialogText.length > 0} style={{overlay:{backgroundColor:bckColor, zIndex: 999},content:{backgroundColor:bckColor, color:{textColor}, "max-height": '180px'}}}>
				<h1>Delete Confirmation</h1>
				<p>{this.state.dialogText}</p>
				<button className='modal-Btn' style={{color: textColor}} title="Confirm and Delete" onClick={this.deleteAndCloseModal}><FaCheck color={textColor} size={26}/> Yes</button>
				<button className='modal-Btn' style={{color: textColor}} title="Cancel" onClick={this.closeModal}><FaClose color={textColor} size={26}/> No</button>
			   </Modal>;
	}

	render() {
		let _this = this;
		let btnHideClass = this.props.showControls ? 'acc-Btn-NoHide' : 'btnHideOnNotHovered';
		let btnThemeClass =  this.props.darkMode ? ' acc-Btn-Dark' : ' acc-Btn-Light';
		let headerHideClass = this.props.showControls ? 'acc-Header-NoHide' : ''
		
		const nodes = React.Children.map(this.props.children, (child, index) => (
			<div key={index} ref={div => { this.nodes[index] = { ref: div } }} className={this.state.index === index ? "acc-Node acc-Node-Open" : "acc-Node acc-Node-Closed"}>
				<div className={headerHideClass + " acc-Header " + (_this.props.darkMode ? 'acc-Header-Dark' : 'acc-Header-Light')}>
					{this.state.index !== index && <FaCaretRight color={_this.props.darkMode ? 'white' : 'black'} size={14} style={{marginBottom: '2px'}}/>}
					{this.state.index === index && <FaCaretDown color={_this.props.darkMode ? 'white' : 'black'} size={14}/>}
					<span className="acc-Title" title={child.props['data-header']} onClick={() => this.toggle(index, true)}>
						{child.props['data-header']}
					</span>
					<span className="acc-UnreadCnt" onClick={() => this.toggle(index, true)}></span>
				</div>
				<button className={btnHideClass + btnThemeClass + " acc-Btn acc-Btn-markAllRead"} title="Mark All As Read" onClick={function(){_this.addAllToHistory(child.props['data-entries'])}}><FaCheck color={_this.props.darkMode ? 'white' : 'black'} size={20}/></button>
				<button className={btnHideClass + btnThemeClass + " acc-Btn acc-Btn-follow"} title="Follow Feed" onClick={function(){_this.followFeed(child.props['data-url'])}}>
					{child.props['data-follow'] && <FaEye color={_this.props.darkMode ? 'white' : 'black'} size={20}/>}
					{!child.props['data-follow'] && <FaEyeSlash color={_this.props.darkMode ? 'white' : 'black'} size={20}/>}
				</button>
				<button className={btnHideClass + btnThemeClass + " acc-Btn acc-Btn-deleteFeed"} title="Delete Feed" onClick={function(){_this.deleteFeed(child.props['data-url'])}}><FaTrashO color={_this.props.darkMode ? 'white' : 'black'} size={20}/></button>
				<div className={"acc-Content " + (_this.props.darkMode ? 'acc-Content-Dark' : 'acc-Content-Light')}>{child}</div>
			</div>
		))
		return <div className='accordion'>{nodes}{this.renderModal()}</div>
	}
 }