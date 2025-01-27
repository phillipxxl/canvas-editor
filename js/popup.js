class Plugin_Popup {
	constructor() {
		Helper.addEvent(document, 'keydown', function(e) {
			if (e.key === 'Escape') {
				if (document.querySelector('.xxl-overlay') != null) {
					xxlPopup.close();
				}
			}
		});
	}
  create(params) {
		if (typeof params.close_btn == 'undefined') {
			params.close_btn = true;
		}
		if (typeof params.opacity == 'undefined') {
			params.opacity = 0.6;
		}

		var html = document.createElement('div');
		html.className = 'xxl-overlay finished';
		if (params.data.class != null) {
			html.className += ' '+params.data.class;
		}

		var render = '<div class="wrapper">';
		if (params.close_btn) {
			render += '<div class="js-xxloverlay-close">×</div>';
		}
		render += '<output class="active"></output></div>';
		html.innerHTML = render;
		Helper.addClass('body', 'overlay-active');
		document.querySelector('body').insertBefore(html, null);

		if (params.data.html instanceof HTMLTemplateElement || params.data.html instanceof DocumentFragment || params.data.html instanceof HTMLElement) {
			html.querySelector('output').appendChild(params.data.html);
		} else {
			html.querySelector('output').innerHTML = params.data.html;
		}

		html.style.cssText = 'background-color: rgba(0,0,0,'+params.opacity+')';
		if (params.ready != null) {
			//call(params.callback);
			params.ready.call(this);
		}

		Helper.addEvent(html, 'click', (e) => {
			if (e.target.matches('.js-xxloverlay-close')) {
				if (params.close != null) {
					params.close.call(this);
				}
				this.close();
			}
		});
		Helper.addEvent(html, 'click', (e) => {
			if (e.target.matches('.xxl-overlay')) {
				if (params.close != null) {
					params.close.call(this);
				}
				this.close();
			}
		});
	}
	close() {
		let nodes = document.querySelectorAll('.xxl-overlay');
		let last = nodes[nodes.length-1];
		last.parentNode.removeChild(last);
		if (document.querySelector('.xxl-overlay') == null) {
			Helper.removeClass('body', 'overlay-active');
		}
	}
}
const xxlPopup = new Plugin_Popup();