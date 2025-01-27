const template = document.createElement('template');

template.innerHTML = `
  <link rel="stylesheet" href="./js/components/double-slider/style.css" />
  <div class="double-slider" style="visibility: hidden;">
    <input type="text" inputmode="numeric" name="input_min" readonly>
    <div class="wrap">
      <input name="slider_min" type="range">
      <input name="slider_max" type="range">
    </div>
    <input type="text" inputmode="numeric" name="input_max" readonly>
    <!--<div><input type="number" name="input_min"> - <input type="number" name="input_max"></div>-->
  </div>
`;

class DoubleSlider extends HTMLElement {
  range_color = '#C6C6C6';
	active_range_color = '#82b338';
  el_slider_min = null;
  el_slider_max = null;
  el_input_min = null;
  el_input_max = null;
  input_min_value = 0;
  input_max_value = 0;

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.el_slider_min = this.shadowRoot.querySelector('input[name="slider_min"]');
    this.el_slider_max = this.shadowRoot.querySelector('input[name="slider_max"]');
    this.el_input_min = this.shadowRoot.querySelector('input[name="input_min"]');
    this.el_input_max = this.shadowRoot.querySelector('input[name="input_max"]');

    //this.el_slider_max.setAttribute = 
  }
  static get observedAttributes() {
    return ['value', 'min', 'max', 'range_color', 'active_range_color'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'value':
      case 'min':
      case 'max':
      case 'name':
        this.el_slider_min.setAttribute(name, newValue);
        this.el_slider_max.setAttribute(name, newValue);
        this.el_input_min.setAttribute(name, newValue);
        this.el_input_max.setAttribute(name, newValue);
        if (name === 'value') {
          this.el_slider_min.value = newValue;
          this.el_slider_max.value = newValue;
          this.el_input_min.value = newValue;
          this.el_input_max.value = newValue;
        }
        if (name === 'max') {
          this.el_input_max.setAttribute('value', newValue);
          this.el_slider_max.setAttribute('value', newValue);
          this.el_input_max.value = newValue;
          this.el_slider_max.value = newValue;
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
  connectedCallback() {
		this.colorizeActiveRange();
    this.setToggleAccessible(this.el_slider_min);

    this.el_slider_min.addEventListener('input', this.controlFromSlider);
    this.el_slider_max.addEventListener('input', this.controlToSlider);
    this.el_input_min.addEventListener('change', this.controlFromInput);
    this.el_input_max.addEventListener('change', this.controlToInput);

    this.el_slider_min.addEventListener('input', this.returnSliderMinEvent);
    this.el_slider_max.addEventListener('input', this.returnSliderMaxEvent);
    this.el_input_min.addEventListener('input', this.returnInputMinEvent);
    this.el_input_max.addEventListener('input', this.returnInputMaxEvent);

    this.el_slider_min.addEventListener('change', this.returnSliderMinEvent);
    this.el_slider_max.addEventListener('change', this.returnSliderMaxEvent);
    this.el_input_min.addEventListener('change', this.returnInputMinEvent);
    this.el_input_max.addEventListener('change', this.returnInputMaxEvent);
  }

  connectedCallback() {
    this.colorizeActiveRange();
    this.setToggleAccessible(this.el_slider_min);

    this.el_slider_min.addEventListener('input', this.controlFromSlider);
    this.el_slider_max.addEventListener('input', this.controlToSlider);
    this.el_input_min.addEventListener('change', this.controlFromInput);
    this.el_input_max.addEventListener('change', this.controlToInput);

    this.el_slider_min.addEventListener('input', this.returnSliderMinEvent);
    this.el_slider_max.addEventListener('input', this.returnSliderMaxEvent);
    this.el_input_min.addEventListener('input', this.returnInputMinEvent);
    this.el_input_max.addEventListener('input', this.returnInputMaxEvent);

    this.el_slider_min.addEventListener('change', this.returnSliderMinEvent);
    this.el_slider_max.addEventListener('change', this.returnSliderMaxEvent);
    this.el_input_min.addEventListener('change', this.returnInputMinEvent);
    this.el_input_max.addEventListener('change', this.returnInputMaxEvent);
  }


  returnSliderMinEvent = (e) => {
    this.returnEvent(e.type, this.el_slider_min.value);
  }
  returnSliderMaxEvent = (e) => {
    this.returnEvent(e.type, this.el_slider_max.value);
  }
  returnInputMinEvent = (e) => {
    this.returnEvent(e.type, this.el_input_min.value);
  }
  returnInputMaxEvent = (e) => {
    this.returnEvent(e.type, this.el_input_max.value);
  }
  returnEvent(type, value) {
    console.log('events', type, value);
    this.dispatchEvent(new CustomEvent(type, {
      detail: { value: value },
      bubbles: true,
      composed: true
    }));
  }
  get values() {
    return {
      input_min: this.el_input_min.value,
      input_max: this.el_input_max.value,
    };
  }

  disconnectedCallback() {
    this.el_slider_min.removeEventListener('input', this.controlFromSlider);
    this.el_slider_max.removeEventListener('input', this.controlToSlider);
    this.el_input_min.removeEventListener('input', this.controlFromInput);
    this.el_input_max.removeEventListener('input', this.controlToInput);

    this.el_slider_min.removeEventListener('input', this.returnSliderMinEvent);
    this.el_slider_max.removeEventListener('input', this.returnSliderMaxEvent);
    this.el_input_min.removeEventListener('input', this.returnInputMinEvent);
    this.el_input_max.removeEventListener('input', this.returnInputMaxEvent);

    this.el_slider_min.removeEventListener('change', this.returnSliderMinEvent);
    this.el_slider_max.removeEventListener('change', this.returnSliderMaxEvent);
    this.el_input_min.removeEventListener('change', this.returnInputMinEvent);
    this.el_input_max.removeEventListener('change', this.returnInputMaxEvent);
  }
  controlFromInput = (e) => {
		const [from, to] = this.getParsed(this.el_input_min, this.el_input_max);
		this.colorizeActiveRange();
		if (from > to) {
			this.el_slider_min.value = to;
			this.el_input_min.value = to;
		} else {
			this.el_slider_min.value = from;
		}
    this.input_min_value = from;
    this.input_max_value = to;
	}
	controlToInput = (e) => {
		const [from, to] = this.getParsed(this.el_input_min, this.el_input_max);
		this.colorizeActiveRange();
		this.setToggleAccessible(this.el_input_max);
		if (from <= to) {
			this.el_slider_max.value = to;
			this.el_input_max.value = to;
		} else {
			this.el_input_max.value = from;
		}
    this.input_min_value = from;
    this.input_max_value = to;
	}
	controlFromSlider = (e) => {
		const [from, to] = this.getParsed(this.el_slider_min, this.el_slider_max);
		this.colorizeActiveRange();
		if (from > to) {
			this.el_slider_min.value = to;
			this.el_input_min.value = to;
		} else {
			this.el_input_min.value = from;
		}
	}
	controlToSlider = (e) => {
		const [from, to] = this.getParsed(this.el_slider_min, this.el_slider_max);
		this.colorizeActiveRange();
		this.setToggleAccessible(this.el_slider_max);
		if (from <= to) {
			this.el_slider_max.value = to;
			this.el_input_max.value = to;
		} else {
			this.el_input_max.value = from;
			this.el_slider_max.value = from;
		}
	}
	getParsed(currentFrom, currentTo) {
		const from = parseInt(currentFrom.value, 10);
		const to = parseInt(currentTo.value, 10);
		return [from, to];
	}
	colorizeActiveRange() {
		const rangeDistance = this.el_slider_max.max - this.el_slider_max.min;
		const fromPosition = this.el_slider_min.value - this.el_slider_min.min;
		const toPosition = this.el_slider_max.value - this.el_slider_max.min;
		this.el_slider_max.style.background = 'linear-gradient(\
			to right,\
			'+this.range_color+' 0%,\
			'+this.range_color+' '+(fromPosition)/(rangeDistance)*100+'%,\
			'+this.active_range_color+' '+((fromPosition)/(rangeDistance))*100+'%,\
			'+this.active_range_color+' '+(toPosition)/(rangeDistance)*100+'%,\
			'+this.range_color+' '+(toPosition)/(rangeDistance)*100+'%,\
			'+this.range_color+' 100%)';
	}
	setToggleAccessible(currentTarget) {		
		if (Number(currentTarget.value) <= 0 ) {
			this.el_slider_max.style.zIndex = 2;
		} else {
			this.el_slider_max.style.zIndex = 0;
		}
	}
}

export default DoubleSlider;