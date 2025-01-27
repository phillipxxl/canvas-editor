const template = document.createElement('template');

template.innerHTML = `
  <link rel="stylesheet" href="./js/components/carousel/style.css" />
  <link rel="stylesheet" href="./css/style.css" />
  <div class="carousel" style="visibility: hidden;">
    <nav class="arrows"><button type="button" data-action="slide-prev"></button><button type="button" data-action="slide-next"></button></nav>
    <nav class="dots"></nav>
    <div class="wrap">
      <div class="slides" style="display: none;"></div>
    </div>
  </div>
`;

class Carousel extends HTMLElement {
  arrow_icon = '#C6C6C6';
  count_slides = 0;

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
  static get observedAttributes() {
    return ['arrow-icon', 'class'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'arrow-icon':
        this.arrow_icon = newValue || this.arrow_icon;
        this.shadowRoot.querySelectorAll('.carousel nav.arrows button').forEach(el => {
          el.innerHTML = '<img src="'+this.arrow_icon+'" />';
        });
        //style.setProperty('--arrow-icon', this.arrow_icon);
        break;
      case 'class':
        this.shadowRoot.querySelector('.carousel').classList.add(newValue);
        break;
    }
  }
  getIndex(target) {
    let index = parseInt(Array.from(target.parentElement.children).indexOf(target)) + 1;
    return index;
  }
  eventSlide = (e = null) => {
    let index = 1;
    if (e != null) {
      index = this.getIndex(e.target);
    } else {
      e = {
        target: this.shadowRoot.querySelector('nav.dots > button:nth-child('+index+')'),
      };
    }
    
    if (e.target.matches('[data-action="slide-prev"]')) {
      index = this.getIndex(this.shadowRoot.querySelector('.slides > div.active'));
      index--;
      if (index <= 0) {
        index = this.count_slides;
      }
    } else if (e.target.matches('[data-action="slide-next"]')) {
      index = this.getIndex(this.shadowRoot.querySelector('.slides > div.active'));
      index++;
      if (index > this.count_slides) {
        index = 1;
      }
    } 
    let target = this.shadowRoot.querySelector('.slides > div:nth-child('+index+')');
    this.shadowRoot.querySelector('.slides > div.active').classList.remove('active');
    target.classList.add('active');
    this.shadowRoot.querySelector('nav.dots > button.active').classList.remove('active');
    this.shadowRoot.querySelector('nav.dots > button:nth-child('+index+')').classList.add('active');

    target.scrollIntoView({ behavior: "smooth" });
    this.dispatchEvent(new CustomEvent('slided', {
      detail: { target: e.target },
      bubbles: true,
      composed: true
    }));
  }
  findParentWidth(el) {
    var w;
    var counter = 0;
    do { 
      counter++;
      el = el.parentNode;
      w = el.getBoundingClientRect().width;
    }
    while(w == 0 && counter < 10);
    return w || 100;
  }
  connectedCallback() {
    // create dots
    this.count_slides = this.querySelectorAll('slide').length;
    for (let i = 0; i < this.count_slides; i++) {
      this.shadowRoot.querySelector('nav.dots').innerHTML += '<button type="button"></button>';
    }

    // create slides
    this.querySelectorAll('slide').forEach((slide, index) => {
      index = parseInt(index);
      // create content for item
      const new_item = document.createElement('div');
      new_item.innerHTML = '<div>'+slide.innerHTML+'</div>';
      this.shadowRoot.querySelector('.carousel .slides').appendChild(new_item);

      // preset display
      if (slide.classList.contains('active') || (!slide.classList.contains('active') && index == 0)) {
        new_item.classList.add('active');
        this.shadowRoot.querySelector('nav.dots > button:nth-child('+(index+1)+')').classList.add('active');
      }

      // events
      //nav_item.addEventListener('click', this.eventSlide);
      this.shadowRoot.querySelectorAll('nav.arrows > button').forEach((button) => {
        button.addEventListener('click', this.eventSlide);
      });
      this.shadowRoot.querySelectorAll('nav.dots > button').forEach((button) => {
        button.addEventListener('click', this.eventSlide);
      });
    });

    //let slide_w = window.getComputedStyle(this.parentNode, null).getPropertyValue('width');
    let slide_w = this.findParentWidth(this);
    this.shadowRoot.querySelector('.carousel').style.setProperty('--container-w', (slide_w-40)+'px');
    this.style['width'] = slide_w;
    this.style['display'] = 'block';

    // reset scroll
    setTimeout(() => {
      this.shadowRoot.querySelector('.wrap').scrollLeft = 0;
    }, 100);
    /*
    setTimeout(() => {
      this.eventSlide();
    }, 500);
    */
  }
  disconnectedCallback() {
    this.shadowRoot.querySelectorAll('nav.arrows > button').forEach((button) => {
      button.removeEventListener('click', this.eventSlide);
    });
    this.shadowRoot.querySelectorAll('nav.dots > button').forEach((button) => {
      button.removeEventListener('click', this.eventSlide);
    });
  }
}

export default Carousel;