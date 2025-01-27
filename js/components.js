import SingleRangeSlider from './components/single-range-slider/index.js';
import DoubleSlider from './components/double-slider/index.js';
import Tabs from './components/tabs/index.js';
import Switch from './components/toggle-switch/index.js';
import Carousel from './components/carousel/index.js';

window.customElements.define('single-range-slider', SingleRangeSlider);
window.customElements.define('double-slider', DoubleSlider);
window.customElements.define('tab-system', Tabs);
window.customElements.define('toggle-switch', Switch);
window.customElements.define('custom-carousel', Carousel);