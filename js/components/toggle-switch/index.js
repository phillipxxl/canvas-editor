const template = document.createElement('template');

template.innerHTML = `
  <link rel="stylesheet" href="./js/components/toggle-switch/style.css" />
  <link rel="stylesheet" href="./css/style.css" />
  <label class="switch" style="visibility: hidden;">
    <input type="checkbox">
    <span class="slider"></span>
  </label>
`;

class Switch extends HTMLElement {
  color = '#0f0';
  width = '50px';
  height = '24px';
  checked = false;
  el_input = null;

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.el_input = this.shadowRoot.querySelector('input');
  }
  static get observedAttributes() {
    return ['color', 'width', 'height', 'checked'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'color':
        this.color = newValue || this.color;
        this.shadowRoot.querySelector('.switch').style.setProperty('--color', this.color);
        break;
      case 'width':
        this.width = newValue || this.width;
        this.shadowRoot.querySelector('.switch').style.setProperty('--width', this.width);
        break;
      case 'height':
        this.height = newValue || this.height;
        this.shadowRoot.querySelector('.switch').style.setProperty('--height', this.height);
        break;
      case 'checked':
        this.checked = newValue || this.checked;
        //this.shadowRoot.querySelector('input').setProperty('checked', this.checked);
        this.shadowRoot.querySelector('input').setAttribute('checked', this.checked);
        break;
    }
  }
  eventToggled = (e) => {
    this.dispatchEvent(new CustomEvent('change', {
      detail: { target: e.target },
      bubbles: true,
      composed: true
    }));
  }
  connectedCallback() {
    this.el_input.addEventListener('change', this.eventToggled);
  }
  disconnectedCallback() {
    this.el_input.removeEventListener('change', this.eventToggled);
  }
}

export default Switch;