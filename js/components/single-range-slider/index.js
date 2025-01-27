const template = document.createElement('template');

template.innerHTML = `
  <!--<link rel="stylesheet" href="./css/style.css" />-->
  <link rel="stylesheet" href="./js/components/single-range-slider/style.css" />
  <div class="single-range-slider" style="visibility: hidden;">
    <div class="wrap">
      <input name="base" type="range" disabled>
      <input name="slider" type="range">
    </div>
  </div>
`;

class SingleRangeSlider extends HTMLElement {
  range_color = '#C6C6C6';
	active_range_color = '#82b338';
	base_value = 0;
  el_slider = null;
  el_base = null;

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.el_slider = this.shadowRoot.querySelector('input[type="range"]:not([disabled])');
    this.el_base = this.shadowRoot.querySelector('input[type="range"][disabled]');
  }
  static get observedAttributes() {
    return ['value', 'min', 'max', 'name', 'range_color', 'active_range_color'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'value':
      case 'min':
      case 'max':
      case 'name':
        this.el_slider.setAttribute(name, newValue);
        this.el_base.setAttribute(name, newValue);
        if (name === 'value') {
          this.el_slider.value = newValue;
          this.el_base.value = newValue;
        }
        break;
      case 'range_color':
        this.range_color = newValue || this.range_color;
        this.colorizeActiveRange();
        break;
      case 'active_range_color':
        this.active_range_color = newValue || this.active_range_color;
        this.colorizeActiveRange();
        break;
    }
  }
  eventSliderInput = (e) => {
    this.colorizeActiveRange();
    this.dispatchEvent(new CustomEvent('input', {
      detail: { value: this.el_slider.value },
      bubbles: true,
      composed: true
    }));
  }
  eventSliderChanged = (e) => {
    this.colorizeActiveRange();
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: this.el_slider.value },
      bubbles: true,
      composed: true
    }));
  }
  connectedCallback() {
    //this.shadowRoot.querySelector('.single-range-slider').className += ' loaded';
		this.colorizeActiveRange();
    this.shadowRoot.querySelector('input[type="range"]:not([disabled])').addEventListener('input', this.eventSliderInput);
    this.shadowRoot.querySelector('input[type="range"]:not([disabled])').addEventListener('change', this.eventSliderChanged);
  }
  disconnectedCallback() {
    this.shadowRoot.querySelector('input[type="range"]:not([disabled])').removeEventListener('input', this.eventSliderInput);
    this.shadowRoot.querySelector('input[type="range"]:not([disabled])').removeEventListener('change', this.eventSliderChanged);
  }

  colorizeActiveRange() {
    var rangeDistance = this.el_slider.max - this.el_slider.min;
    var fromPosition = this.base_value - this.el_slider.min;
    var toPosition = this.el_slider.value - this.el_slider.min;
    if (toPosition < fromPosition) {
      [fromPosition, toPosition] = [toPosition, fromPosition];
    }
    this.el_slider.style.background = `linear-gradient(
      to right,
      ${this.range_color} 0%,
      ${this.range_color} ${(fromPosition) / rangeDistance * 100}%,
      ${this.active_range_color} ${(fromPosition) / rangeDistance * 100}%,
      ${this.active_range_color} ${(toPosition) / rangeDistance * 100}%,
      ${this.range_color} ${(toPosition) / rangeDistance * 100}%,
      ${this.range_color} 100%
    )`;
  }
}

export default SingleRangeSlider;