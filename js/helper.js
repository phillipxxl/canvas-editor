class Helper_Functions {
  addEvent(selector, type, handler) {
		if (typeof selector == 'object') {
			var elements = [selector];
		} else {
			var elements = document.querySelectorAll(selector);
		}
		elements.forEach((el) => {
			if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
		});
	}
	removeEvent(selector, type, handler) {
		if (typeof selector == 'object') {
			var elements = [selector];
		} else {
			var elements = document.querySelectorAll(selector);
		}
		elements.forEach((el) => {
			if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
		});
	}
	hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
  }
  addClass(selector, className) {
		if (typeof selector !== 'undefined' && selector !== null) {
			if (typeof selector == 'object') {
				var elements = [selector];
			} else {
				var elements = document.querySelectorAll(selector);
			}
			elements.forEach((el) => {
				if (el.classList) el.classList.add(className);
				else if (!Helper.hasClass(el, className)) el.className += ' ' + className;
			});
		}
  }
	removeClass(selector, className) {
		if (typeof selector !== 'undefined' && selector !== null) {
			if (typeof selector == 'object') {
				var elements = [selector];
			} else {
				var elements = document.querySelectorAll(selector);
			}
			elements.forEach((el) => {
				if (el.classList) el.classList.remove(className);
				else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
			});
		}
  }
	toggleClass(selector, className) {
		if (typeof selector !== 'undefined' && selector !== null) {
			if (typeof selector == 'object') {
				var elements = [selector];
			} else {
				var elements = document.querySelectorAll(selector);
			}
			elements.forEach((el) => {
				el.classList.toggle('active');
			});
		}
  }
  getSiblings(el, filter) {
    var siblings = [];
    el = el.parentNode.firstChild;
    do { if (!filter || filter(el)) siblings.push(el); } while (el = el.nextSibling);
    return siblings;
  }
	getRandomNumber(min, max) {
		const minCeiled = Math.ceil(min);
		const maxFloored = Math.floor(max);
		return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
	}
	triggerEvent(el, type){
		var e = document.createEvent('HTMLEvents');
		e.initEvent(type, false, true);
		el.dispatchEvent(e);
	}
	upperCaseFirst(str){
		return str.charAt(0).toUpperCase() + str.substring(1);
	}
	cookieExists(name) {
		return document.cookie.split(';').some((cookie) => {
			return cookie.trim().startsWith(name + '=');
		});
	}
	getFormatBySize(w, h) {
		let result;
		let ratio;
		if (w > h) {
				ratio = w / h;
		} else {
				ratio = h / w;
		}

		if (ratio >= 1 && ratio < 1.15) {
				result = 11;
		} else if (ratio >= 1.15 && ratio < 1.3) {
				result = 54;
		} else if (ratio >= 1.3 && ratio < 1.4) {
				result = 43;
		} else if (ratio >= 1.4 && ratio < 1.7) {
				result = 32;
		} else if (ratio >= 1.7 && ratio < 2.5) {
				result = 21;
		} else if (ratio >= 2.5 && ratio < 3.5) {
				result = 31;
		} else if (ratio >= 3.5 && ratio < 4.5) {
				result = 41;
		} else if (ratio >= 4.5 && ratio < 5.5) {
				result = 51;
		} else if (ratio >= 5.5 && ratio < 6.5) {
				result = 61;
		} else if (ratio >= 6.5 && ratio < 7.5) {
				result = 71;
		} else if (ratio >= 7.5 && ratio < 8.5) {
				result = 81;
		} else {
				result = null;
		}
		return result;
	}
}
const Helper = new Helper_Functions();