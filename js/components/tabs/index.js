const template = document.createElement('template');

template.innerHTML = `
  <link rel="stylesheet" href="./js/components/tabs/style.css" />
  <link rel="stylesheet" href="./css/style.css" />
  <div class="tabs" style="visibility: hidden;">
    <nav></nav>
    <div class="content"></div>
  </div>
`;

class Tabs extends HTMLElement {
  range_color = '#C6C6C6';
	active_range_color = '#82b338';
  el_tabs = null;
  el_content = null;

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.el_tabs = this.shadowRoot.querySelector('nav');
    this.el_content = this.shadowRoot.querySelector('.content');
  }
  eventTabSwitch = (e) => {
    var index = parseInt(Array.from(this.el_tabs.children).indexOf(e.target));
    if (this.el_tabs.querySelector('.active') != null) {
      this.el_tabs.querySelector('.active').classList.remove('active');
    }
    e.target.classList.add('active');    
    this.shadowRoot.querySelector('.content > .active').classList.remove('active');
    this.shadowRoot.querySelector('.content > div:nth-child('+(index+1)+')').classList.add('active');
    this.dispatchEvent(new CustomEvent('tabChanged', {
      detail: { target: e.target },
      bubbles: true,
      composed: true
    }));
  }
  connectedCallback() {
    this.querySelectorAll('item').forEach((item, index) => {
      // create tab button for item
      const nav_item = document.createElement('button');
      nav_item.textContent = item.getAttribute('name');
      nav_item.classList = item.classList;
      this.el_tabs.appendChild(nav_item);

      // create content for item
      const new_item = document.createElement('div');
      new_item.innerHTML = item.innerHTML;
      this.el_content.appendChild(new_item);

      // preset display
      if (item.classList.contains('active')) {
        new_item.classList.add('active');
        nav_item.classList.add('active');
      }

      // events
      nav_item.addEventListener('click', this.eventTabSwitch);
    });
  }
  disconnectedCallback() {
    this.shadowRoot.querySelectorAll('.nav > button').forEach((button) => {
      button.removeEventListener('click', this.eventTabSwitch);
    });
  }
}

export default Tabs;