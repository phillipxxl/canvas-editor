class Plugin_Collage_Maker_2 {
	canvas = null;
	db = null;
	cur_db_index = 1;
	api_url = 'https://canvasprint.se/api';
  //api_url = server_url;
	page_params = new URLSearchParams(new URL(window.location.href).search);
	media_query = window.matchMedia('(max-width: 960px)');
	worker = new Worker('js/worker.js');
	meta_data = {
		slot_color: '#ddd',
		canvas_zoom: 1,
	};


  constructor(params) {
		const self = this;

		// init language
		fetch('translate.json')
    .then(response => response.json()).then(data => {
			this.translate = data[params.language];
    });

		this.initSessid();
		this.initLocalDB();
		this.initCollageTemplates();
		this.initCanvas();
		this.loadUserPhotosFromDB();
		//this.buildLayout(363); // dev
		this.buildLayout(71); // dev
		/*
		this.updateHistoryArrows();
		this.updateUploadView();
		*/

		// setup responsive change event and media query
		Helper.addEvent(this.media_query, 'change', this.checkMobile);
		this.checkMobile(this.media_query);

		// set global screen size css variable
		document.documentElement.style.setProperty('--screen-w', window.innerWidth+'px');
		document.documentElement.style.setProperty('--screen-h', window.innerHeight+'px');
		document.documentElement.style.setProperty('--content-offset', '0px');

		// dom ready
		document.addEventListener('DOMContentLoaded', () => {

			// UI action events (delegated)
			document.addEventListener('click', (e) => {
				var el = e.target;
				if (!el.matches('.disabled') && !el.matches('[disabled]')) {
					//console.log('click event', el);
					if (el.matches('[data-action]')) {
						var target = el.getAttribute('data-action')
						/*
						switch(target) {
							case 'info':
								
						}
						*/
						if (target == 'info') {
							this.initInfoPopup('preview');
						} else if (target == 'save') {
							this.saveCanvas();
							//Helper.removeClass('form[name="link-code"]', 'active');
						} else if (target == 'clear') {
							this.clearCanvas();
						} else if (target == 'autofill') {
							console.log('auto fill');
							this.autofill();
						} else if (target == 'delete-all-uploads') {
							this.deleteAllUploads();
						} else if (target == 'blackwhite') {
							if (el.classList.contains('active')) {
								Helper.removeClass(el, 'active');
								this.removeGlobalFilter('blackwhite');
							} else {
								Helper.addClass(el, 'active');
								this.applyGlobalFilter('blackwhite');
							}
						} else if (target == 'zoom-in') {
							this.meta_data.canvas_zoom = this.meta_data.canvas_zoom + 0.1;
							if (this.meta_data.canvas_zoom >= 3.5) {
								this.meta_data.canvas_zoom = 3.5;
							}
							this.zoomCanvas();
						} else if (target == 'zoom-out') {
							this.meta_data.canvas_zoom = this.meta_data.canvas_zoom - 0.1;
							if (this.meta_data.canvas_zoom <= 0.3) {
								this.meta_data.canvas_zoom = 0.3;
							}
							this.zoomCanvas();
						} else if (['upload','templates','background'].includes(target)) {
							this.triggerToolzoneNew(target);
						} 
						//this.triggerToolzone(target);
					}
				}
			});
			document.addEventListener('change', (e) => {
				const el = e.target;
				if (!el.matches('.disabled') && !el.matches('[disabled]')) {
					console.log('change event', e.target);
					// todo
				}
			});

			// upload
			Helper.addEvent('.js-canvas-upload', 'click', (e) => {
				this.initUploadPopup();
			});

			// autofill
			Helper.addEvent('.js-autofill', 'click', (e) => {
				this.autofill();
			});


		});
  }

	triggerToolzoneNew(target) {
		const el = document.querySelector('.toolbar [data-action="'+target+'"]');
		Helper.removeClass('.toolbar > li.active', 'active');
		Helper.addClass(el, 'active');
		Helper.removeClass('.tool-zone > .active', 'active');
		Helper.addClass('.tool-zone [data-zone="'+target+'"]', 'active');
	}
	triggerToolzone(target, force_open = false) {
		let el = document.querySelector('.toolbar [data-action="'+target+'"]');
		let has_zone = true;
		if (target == 'autofill' || target == 'clear' || target == 'info' || target == 'save') {
			has_zone = false;
		}
		if (has_zone) {
			let show_toolzone = 1;
			if (this.is_mobile) {
				if (Helper.hasClass(el, 'active')) {
					show_toolzone = 0;
				} else {
					show_toolzone = 1;
				}
			}
			if (force_open) {
				show_toolzone = 1;
			}
			Helper.removeClass('.tool-zone', 'active');
			//Helper.removeClass(document.querySelector('.tool-zone [data-zone].active'), 'active');
			Helper.removeClass('.toolbar > li.active', 'active');
			if (show_toolzone == 1 && ((!this.is_mobile && target != 'text') || this.is_mobile)) {
				Helper.addClass(el, 'active');
				Helper.removeClass('.tool-zone [data-zone].active', 'active');
				document.querySelectorAll('.tool-zone, .tool-zone [data-zone="'+target+'"]').forEach(function(el) {
					Helper.addClass(el, 'active');
				});
			}
		}
	}
	initCollageTemplates() {
		fetch(this.api_url+"/get-template.php?all=1", {
			method: "GET",
		}).then((response) => response.json()).then((json) => {
			var data = json;
			var output = '';
			Array.from(data).forEach((item, index) => {
				var template_tags = '';
				if (item.visible == "1") {
					if (item.favorite == "1") {
						template_tags += '<div><div class="tag" data-tag="favorite">Beliebt</div></div>';
					}
					/*
					if (item.text == "1") {
						template_tags += '<div><div class="tag" data-tag="text">Text</div></div>';
					}
					if (item.mask == null && item.motif == null) {
						template_tags += '<div><div class="tag" data-tag="bgcolor">Farben</div></div>';
					}
					*/
					output += '<li data-id="'+item.ID+'" data-index-id="'+index+'" data-slots="'+item.slots+'" data-keywords="'+item.keywords+'" data-favorite="'+item.favorite+'">\
						<div class="thumb"><img loading="lazy" src="'+this.api_url+'/templates/thumbs/template-thumb-'+item.ID+'.jpg" alt="#'+item.ID+'" /></div>\
						<div class="tags">'+template_tags+'</div>\
					</li>';
				}
			});
			document.querySelector('[data-zone="templates"] > ul').innerHTML += output;

			// add template click events
			Helper.addEvent('.tool-zone [data-zone="templates"] li', 'click', (e) => {
				var el = e.target;
				var template_index = el.getAttribute('data-index-id');
				Helper.removeClass('.tool-zone [data-zone="templates"] li.active', 'active');
				Helper.addClass(el, 'active');
				this.showTemplatePrompt(data[template_index]); // shows prompt if it is needed
				document.querySelector('#collage-designer').scrollIntoView({ behavior: "smooth" });
			});
		});
	}
	showTemplatePrompt(template_data, callback = null) {
		var prompt_type = null;
		var prompt_content = '';
		var meta_data = {};
		if (typeof template_data == 'undefined') { // undefined = dyn
			prompt_type = 'dyn';
		} else {
			if (template_data.mask != null) {
				meta_data.overlay_type = 'mask';
			} else if (template_data.bg_motif != null) {
				meta_data.overlay_type = 'bg_motif';
			}
			if (typeof meta_data.overlay_type != 'undefined') {
				meta_data.temp_overlay = template_data[meta_data.overlay_type];
				var prompt_number = false;
				if (!Array.isArray(meta_data.temp_overlay)) {
					meta_data.temp_overlay = [{top: 0, left: 0, width: template_data.width, height: template_data.height, file: meta_data.temp_overlay}];
				}
				for (var overlay of meta_data.temp_overlay) {
					if (overlay.file.includes('classic_number')) {
						prompt_number = true;
					}
				}
				if (prompt_number) {
					prompt_type = 'classic_number';
				} else if (meta_data.temp_overlay[0].file.includes('happy_number')) {
					prompt_type = 'happy_number';
					const special_templates = ['happy_number_01', 'happy_number_02', 'happy_number_04', 'happy_number_06'];
					if (special_templates.some(num => meta_data.temp_overlay[0].file.includes(num))) {
						prompt_type = 'happy_number_special';
					}
				}
			}
		}

		if (prompt_type != null) {
			if (prompt_type == 'dyn') {
				prompt_content = '<form name="choose_template"><p>'+this.translate['prompt-text-headline']+'</p><div class="wrap"><input name="prompt-text" placeholder="'+this.translate['prompt-text-placeholder']+'"><button type="submit" class="cta">'+this.translate['prompt-button']+'</button></div></form>';
			} else if (prompt_type == 'classic_number') {
				prompt_content = '<form name="choose_template"><p>'+this.translate['prompt-number-headline']+'</p><div class="wrap"><input type="text" inputmode="numeric" maxlength="2" name="prompt-number" placeholder="30"><button type="submit" class="cta">'+this.translate['prompt-button']+'</button></div></form>';
			} else if (prompt_type == 'happy_number' || prompt_type == 'happy_number_special') {
				var prompt_content = '<form name="choose_template"><p>'+this.translate['prompt-number-headline']+'</p><div class="wrap"><div class="select"><select name="prompt-select">';
				for (let i = 10; i <= 90; i = i+10) {
					prompt_content += '<option value="'+i+'">'+i+'</option>';
					if (prompt_type == 'happy_number_special' && i == 10) {
						prompt_content += '<option value="'+18+'">'+18+'</option>';
					}
				}
				prompt_content += '</select></div><button type="submit" class="cta">'+this.translate['prompt-button']+'</button></div></form>';
			}
			xxlPopup.create({
				data: {
					html: prompt_content,
					class: 'collage-designer-theme-1'
				},
				ready: () => {
					document.querySelector('.xxl-overlay [name^="prompt-"]').focus();
					Helper.addEvent('.xxl-overlay form', 'submit', (e) => {
						e.preventDefault();
						if (prompt_type == 'dyn') {
							let new_input = document.querySelector('.xxl-overlay input').value;
							if (new_input != '') {
								this.letter_data = Array.from(new_input);
								this.buildDynLayout();
							}
						} else if (prompt_type == 'classic_number') {
							let new_number = document.querySelector('.xxl-overlay input').value;
							if (new_number.length == 2) {
								let numbers_arr = new_number.split('');
								let counter = 0;
								for (var overlay of temp_overlay) {
									overlay.file = overlay.file.replace('xxx', numbers_arr[counter])+'.png';;
									counter++;
								}
							} else {
								meta_data.temp_overlay[0] = {
									"width": 520,
									"height": 520,
									"left": 0,
									"top": 0,
									"file": "classic_number_single_"+new_number+".png"
								}
								delete meta_data.temp_overlay[1];
								meta_data.temp_overlay.splice(1, 1);
								console.log(meta_data);
								template_data.ID = 568; // switch to single number template
							}
							this.buildLayout(template_data.ID, {[meta_data.overlay_type]: meta_data.temp_overlay}, callback);
						} else if (prompt_type == 'happy_number' || prompt_type == 'happy_number_special') {
							let new_number = document.querySelector('.xxl-overlay select').value;
							meta_data.temp_overlay[0].file = meta_data.temp_overlay[0].file.replace('_30', '_'+new_number);
							console.log(meta_data);
							this.buildLayout(template_data.ID, {[meta_data.overlay_type]: meta_data.temp_overlay}, callback);
						}
						xxlPopup.close();
					});
				}
			});
		} else {
			this.buildLayout(template_data.ID);
		}
	}
	setEditorLoading(state, mode = 'default') {
		var selector = '.editor';
		if (mode == 'light') {
			selector = '#collage-designer .canvas-wrap';
		}
		if (state == 1) {
			Helper.addClass(selector, 'loading');
		} else {
			Helper.removeClass(selector, 'loading');
		}
	}
	setAutoFillLoading(state, text = null) {
		if (state == 1 && text == null) {
			const el = document.createElement('div');
			el.className = 'autofill-loading loading';
			document.querySelector('#collage-designer .editor').appendChild(el);
		}
		if (text != null) {
			document.querySelector('#collage-designer .editor > .autofill-loading').innerHTML = '<span>'+text+'</span>';
		}
		if (state == 0) {
			//document.querySelector('#collage-designer .editor .autofill-loading').remove();
		}
	}
	autofill() {
		//this.slot_upload = false;
		this.clearCanvas();
		//this.setAutoFillLoading(1);
		this.setEditorLoading(1, 'light');

		const slots = this.findCanvasObject({ type: 'slot' });
		console.log(slots);
		for (const el of slots) {
			let img_pool = document.querySelectorAll('.uploads .img-wrap[data-is-used="0"] img');
			if (img_pool.length > 0) {
				var nr = Helper.getRandomNumber(0, img_pool.length - 1);
				console.log(nr, image);
				var image = img_pool[nr];
				this.addImageToSlot(el, image, true);
			} else {
				console.log('nicht genug Bilder');
			}
		}

		//this.canvas.requestRenderAll();
		//this.setAutoFillLoading(0);
		this.setEditorLoading(0, 'light');
	}
	initCanvas() {
		this.setEditorLoading(1);
		this.canvas = new fabric.Canvas('collage-editor', {
			width: 1,
			height: 1,
			backgroundColor: '#ffffff',
			selectable: false,
			selection: false,
			preserveObjectStacking: true,
			allowTouchScrolling: true,
			renderOnAddRemove: false,
		});
		this.canvas.meta = {};
		//canvas.collage_id = intern.createCollageId();

		// add events to canvas
		this.canvas.on('object:moving', (e) => {
			this.handleCanvasObjectMoving(e);
		});
		this.canvas.on('object:modified', (e) => {

		});
	}
	resetCanvas() {
		this.hideUserTextOptions();
		this.removeSlotOptions();
		this.canvas.dispose();
		this.initCanvas();
		/*
		this.canvas.backgroundColor = '#ffffff';
		this.canvas.requestRenderAll();
		*/
		document.querySelectorAll('[data-zone="background"] span.active, [data-zone="text"] span.active').forEach((el) => {
			Helper.removeClass(el, 'active');
		});
	}
	clearCanvas() {
		document.querySelectorAll('.uploads .img-wrap[data-is-used="1"]').forEach((el) => {
			el.setAttribute('data-is-used', 0);
		});
		this.removeSlotOptions();
		this.canvas.getObjects().forEach((el) => {
			if ('meta' in el) {
				if (el.meta.type == 'slot-image') {
					this.canvas.remove(el);
				}
				// restore default bg color
				if (el.meta.type == 'slot') {
					el.set({
						fill: this.meta_data.slot_color,
					});
				}
			}
		});
		/*
		this.canvas.requestRenderAll();
		console.log('fill 22');
		this.updateFinishButton();
		document.querySelectorAll('.tool-zone .uploads .img-wrap').forEach(function(el) {
			el.setAttribute('data-is-used', 0);
		});
		this.updateImageUsedCounter();
		*/
		this.canvas.requestRenderAll();
	}
	saveCollageToDb(unset_borders = false) {
		return;
		// set zoom to default to bypass save errors
		let temp_zoom = this.meta_data.canvas_zoom;
		this.meta_data.canvas_zoom = 1;
		document.querySelector('#collage-designer .editor .canvas-wrap').style['scale'] = this.meta_data.canvas_zoom;
		if (unset_borders) {
			console.log('unset borders');
			this.findCanvasObject({type:'border'}, (border_obj) => {
				if(border_obj instanceof fabric.Object) {
					console.log('remove border', border_obj);
					this.canvas.remove(border_obj);
				} else if (Array.isArray(border_obj)) {
					border_obj.forEach((temp_border_obj) => {
						console.log('remove border', temp_border_obj);
						this.canvas.remove(temp_border_obj);
					});
				}
				this.canvas.requestRenderAll();
			});
		}

		// remove oldest save when more than x
		this.db.canvas.count().then((count) => {
			console.log(count);
			if (count > 30) {
				this.db.canvas.orderBy('id').first().then((entry) => {
					this.db.canvas.delete(entry.id);
				});
			}
		});

		// set default for some stuff to avoid bugs
		this.canvas.meta.zoom = this.canvas.getZoom();
		this.canvas.meta.viewportTransform = JSON.stringify(this.canvas.viewportTransform);
		var border_obj = null;
		this.findCanvasObject({type:'border'}, (temp_obj) => {
			if (!Array.isArray(temp_obj)) {
				border_obj = temp_obj;
				this.canvas.remove(temp_obj);
			}
		});

		// save
		let canvas_meta = this.canvas.meta;
		canvas_meta.active_drag_target = null;
		canvas_meta.last_active_slot = null;

		let canvas_data = {
			slot_images: [],
			text: null
		};
		Array.from(this.canvas.getObjects()).forEach((val) => {
			if (typeof val.meta !== 'undefined') {
				if (val.meta.type == 'slot-image') {
					var keys = ["angle", "left", "top", "width", "height", "scaleX", "scaleY", "flipX", "flipY", "meta"];
					var temp_data = {};
					keys.forEach(key => {
						temp_data[key] = val[key];
					});
					canvas_data.slot_images.push(temp_data);
				} else if (val.meta.type == 'inline-text') {
					var keys = ["text", "fill", "fontFamily", "fontSize", "meta"];
					var temp_data = {};
					keys.forEach(key => {
						temp_data[key] = val[key];
					});
					canvas_data.text = temp_data;
				}
			}
		});
		//console.log(canvas_data);

		console.log('canvas data added');
		this.db.canvas.add({ saveData: canvas_data, meta: canvas_meta }).then(() => {
			//console.log('Daten erfolgreich gespeichert');
		})
		.catch((error) => {
			//console.error('Fehler beim Speichern:', error);
		});;

		// restore old stuff
		this.meta_data.canvas_zoom = temp_zoom;
		document.querySelector('#collage-designer .editor .canvas-wrap').style['scale'] = this.meta_data.canvas_zoom;
		if (border_obj != null) {
			this.canvas.add(border_obj);
		}
	}
	hideUserTextOptions() {
		if (this.is_mobile) {
			Helper.removeClass('.tool-zone', 'active');
			Helper.removeClass('[data-zone].active', 'active');
		} else {
			Helper.removeClass('.text-tools', 'active');
		}
	}
	removeSlotOptions() {
		document.querySelectorAll('.editor .slot-options').forEach((el) => {
			el.parentNode.removeChild(el);
		}); 
	}
	updateCanvasMetaInfos(params) {
		this.canvas.meta.width = this.canvas.width;
		this.canvas.meta.height = this.canvas.height;
		if (this.canvas.meta.width > this.canvas.meta.height) {
			this.canvas.meta.ratio = this.canvas.meta.width / this.canvas.meta.height;
		} else {
			this.canvas.meta.ratio = this.canvas.meta.height / this.canvas.meta.width;
		}
		
		if (this.canvas.meta.ratio > 4.9) { // 51
			var render_w = 6000;
			var render_h = 1200;
		} else if (this.canvas.meta.ratio > 3.9) { // 41
			var render_w = 6000;
			var render_h = 1500;
		} else if (this.canvas.meta.ratio > 2.9) { // 31
			var render_w = 6000;
			var render_h = 2000;
		} else if (this.canvas.meta.ratio > 2.4 && this.canvas.meta.ratio < 2.6) { // 52
			var render_w = 851;
			var render_h = 315;    
		} else if (this.canvas.meta.ratio > 1.9) { // 21
			var render_w = 6000;
			var render_h = 3000;
		} else if (this.canvas.meta.ratio > 1.4 && this.canvas.meta.ratio < 1.6) { // 32
			var render_w = 6000;
			var render_h = 4000;
		} else if (this.canvas.meta.ratio > 1.3) { // 43
			var render_w = 6000;
			var render_h = 4500;
		} else if (this.canvas.meta.ratio >= 1) { // 11
			var render_w = 6000;
			var render_h = 6000;
		} 
		
		this.canvas.meta.render_w = render_w;
		this.canvas.meta.render_h = render_h;

		if (typeof params !== 'undefined') {
			Object.entries(params).forEach((val) => {
				this.canvas.meta[val[0]] = val[1];
			});
		}
	}
	async buildLayout(template_nr, modify_data, callback = null) {
		/*
		if (typeof modify_data !== 'undefined' && modify_data !== null) {
			this.resetCanvas();
			this.canvas.meta.type = 'default';
		}
		*/

		this.resetCanvas();

		// get template data
		const response = await fetch(this.api_url+"/get-template.php", {
			method: "POST",
			body: JSON.stringify({template: template_nr}),
		});
		const json = await response.json();
		var data = json[0];
		data = JSON.parse(data.style);
		console.log(data);

		// update toolbar depending on template
		this.updateToolbar(data);
		this.canvas.meta.type = 'default';
		//this.updateUsedImagesDisplay();

		// apply modified template data
		console.log('modify:', modify_data);
		if (typeof modify_data !== 'undefined') {;
			let temp_data = Object.assign(data, modify_data);
			data = temp_data;
		}
		
		this.canvas.setWidth(data.width);
		this.canvas.setHeight(data.height);
		this.updateCanvasMetaInfos({template_id: template_nr});
		Object.entries(data.slots).forEach((temp_val) => {
			let key = parseInt(temp_val[0]);
			let val = temp_val[1];

			var temp_slot = new fabric.Rect({
				left: val.left,
				top: val.top,
				fill: this.meta_data.slot_color,
				width: val.width,
				height: val.height,
				absolutePositioned: true,
				
				hasBorders: false,
				selectable: true,
				scalable: false,
				controls: false,
				lockMovementX: true,
				lockMovementY: true,
				objectCaching: false,
				//evented: false
				/*
				controls: false,
				lockMovementX: true,
				lockMovementY: true,
				*/
				meta: {
					type: 'slot',
					slot_id: key,
				}
			});
			this.addSlotUpload(temp_slot);
			//this.canvas.meta.slots.push(temp_slot);
			this.canvas.add(temp_slot);
			
			temp_slot.on('selected', () => {
				console.log('slot selected 2');
				this.toggleBorderSlot(temp_slot);
			});
			temp_slot.on('deselected', () => {
				console.log('slot deselected 2');
				this.toggleBorderSlot(temp_slot, true);
			});
		});
		
		// add mask to canvas
		if (typeof data.mask !== 'undefined') {
			this.canvas.meta.has_mask = true;
			this.canvas.meta.mask = data.mask;
			this.canvas.meta.fullImage = [];
			if (!Array.isArray(data.mask)) {
				data.mask = [{top: 0, left: 0, file: data.mask}];
			}
			var mask_obj = new fabric.Group([], {
				selectable: false,
				scalable: false,
				controls: false,
				absolutePositioned: true,
				//clipPath: canvas,
				perPixelTargetFind: true,
				evented: false,
				meta: {
					type: 'mask'
				}
			});
			for (var mask of data.mask) {
				console.log('in mask loop ');
				var mask_img = this.api_url+'/templates/artworks-thumbs/'+mask.file;
				//canvas.setOverlayImage(mask_img, canvas.requestRenderAll.bind(canvas));
				const myImg = await this.fabricLoadImageFromUrl(mask_img);
				var temp_mask = myImg.set({
					top: mask.top,
					left: mask.left,
				}, { crossOrigin: 'Anonymous' });
				//this.canvas.meta.fullImage.push(this.api_url+'/templates/artworks-full/'+mask.file);
				mask_obj.add(temp_mask);
			}
			this.canvas.add(mask_obj); 		
			if (this.canvas.meta.has_text) {
				let temp_obj = this.findCanvasObject({type:'inline-text'});
				this.canvas.bringObjectToFront(temp_obj);
			}
		}
		
		// add motif
		if (typeof data.bg_motif !== 'undefined') {
			this.canvas.meta.has_bg_motif = true;
			if (data.bg_motif.includes('xxx')) {
				data.bg_motif = data.bg_motif.replace('xxx', '50');
			}
			var bg_motif = this.api_url+'/templates/artworks-thumbs/'+data.bg_motif;
			console.log(bg_motif);
			fabric.Image.fromURL(bg_motif, (myImg) => {
				this.canvas.meta.bg_motif = myImg.set({
					top: 0,
					left: 0,
					selectable: false,
					scalable: false,
					controls: false,
				}, { crossOrigin: 'Anonymous' });
				this.canvas.meta.bg_motif_image = this.api_url+'/templates/artworks-full/'+data.bg_motif;
				this.canvas.meta.bg_motif.scaleToWidth(1);
				this.canvas.meta.bg_motif.scaleToWidth(this.canvas.width);
				this.canvas.meta.bg_motif.scaleToHeight(1);
				this.canvas.meta.bg_motif.scaleToHeight(this.canvas.height);
				
				this.canvas.add(this.canvas.meta.bg_motif); 
				this.canvas.meta.bg_motif.sendToBack();
				this.canvas.renderAll();
			});
		}
		
		this.addCanvasInlineText(data);
		//this.setEditorDefaultZoom();
		//this.updateEditorTools(data);
		/*
		setTimeout(()=>{
			this.setEditorDefaultZoom();
		}, 500);
		*/
		
		// fix responsive
		if (this.canvas.meta.type == 'default') {
			this.canvas.requestRenderAll();
			var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
			var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
			if (vw <= 960) {
				var max_w = document.querySelector('#collage-designer .editor').getBoundingClientRect().width;
				var old_zoom = this.canvas.getZoom();
				var ratio = this.canvas.getWidth() / max_w;
				//temp_default_zoom = old_zoom / ratio;
				this.canvas.setDimensions({ width: this.canvas.getWidth() / ratio, height: this.canvas.getHeight() / ratio });
				this.canvas.setZoom(old_zoom / ratio);
			}
		}

		this.canvas.requestRenderAll();
		this.setEditorLoading(0);
		if (callback != null) {
			callback();
		}
	}
	buildDynLayout(callback = null) {
		this.resetCanvas();
		this.canvas.meta.type = 'dyn';
		this.canvas.setZoom(1);

		var text_size = 300;
		var text = this.canvas.meta.letter_data.join('');
		text = text.toUpperCase();
		text = text.replace('{HEART}', '\u2764');
		var text_w = 0;
		var text_h = 0;
		var canvas_w = 0;
		var canvas_h = 0;
		var char_spacing = 20;
		var canvas_zoom_factor = 1;

		this.loadFont('Work Sans', () => {
			fetch("/collage-canvas-layouts-dyn.json", {
				method: "GET",
			}).then((response) => response.json()).then((json) => {
				var data = json;

				// make ghost canvas to determine dimensions
				do {
					var ghost_canvas = document.createElement('canvas');
					ghost_canvas = new fabric.Canvas(ghost_canvas, {width: 1000, height:1000});
					var ghost_text_overlay = new fabric.Text(text, {
						fontFamily: 'Work Sans',
						fontSize: text_size,
						controls: false,
						selectable: false,
						//stroke: 'black',
						//strokeWidth: 2,
						charSpacing: char_spacing,
						fill: 'white'
					});
					text_w = ghost_text_overlay.width;
					text_h = ghost_text_overlay.height;
					
					// check if text fits in format
          var format = this.getFormatByRatio(text_w, text_h);
					if (format == 51) {
						canvas_w = 880;
						canvas_h = 176;
					} else if (format == 41) {
						canvas_w = 880;
						canvas_h = 220;
					} else if (format == 31) {
						canvas_w = 879;
						canvas_h = 293;
					} else if (format == 21) {
						canvas_w = 880;
						canvas_h = 440;
					} else if (format == 32) {
						canvas_w = 560;
						canvas_h = 373;
					} else if (format == 43) {
						canvas_w = 560;
						canvas_h = 420;
					} else if (format == 11) {
						canvas_w = 520;
						canvas_h = 520;
					}
					
					var canvas_puffer_width = (canvas_w / 100) * 80; // shouldn't be bigger than 80% of canvas
					if (ghost_text_overlay.width * canvas_zoom_factor > canvas_puffer_width) {
						canvas_zoom_factor = canvas_zoom_factor - 0.02;
					} else {
						break;
					}
				} while (ghost_text_overlay.width * canvas_zoom_factor > canvas_puffer_width);
				ghost_canvas.dispose();
				ghost_canvas = null;
				ghost_text_overlay = null;
				
				// zoom to center to fit text in canvas
				this.canvas.zoomToPoint(new fabric.Point(canvas_w / 2, canvas_h / 2), canvas_zoom_factor);

				// change canvas siuze
				this.canvas.setWidth(canvas_w);
				this.canvas.setHeight(canvas_h);
				this.updateCanvasMetaInfos();
				
				// add letters
				var stroke_base = (text_size / 100);
				var last_text_pos_x = null;
				var last_text_w = null;
				var slot_border = 3;
				var slot_counter = 0;
				var initial_letter_size = 500;
				
				var group_slots = [];

				//jQuery.each(this.canvas.meta.letter_data, function(char_key, char) {
				Array.from(this.canvas.meta.letter_data).forEach((char, char_key) => {
					//var text_overlay = new fabric.Text(text.charAt(i), 
					char = char.toUpperCase().replace('{HEART}', '\u2764');
					var text_overlay = new fabric.Text(char, {
						fontFamily: 'Work Sans',
						fontSize: text_size,
						controls: false,
						selectable: false,
						//stroke: 'red',
      			//strokeWidth: stroke_base / 1.5,
						fill: 'white',
						absolutePositioned: true,
					});
					
					var puffer_x = (text_w / 100) * 1;
					var puffer_y = (text_h / 100) * 5;
					if (last_text_pos_x == null) {
						var text_x = ((this.canvas.width - text_w) / 2) - puffer_x;
						var text_y = ((this.canvas.height - text_h) / 2) + puffer_y;
					} else {
						var text_x = last_text_pos_x + last_text_w + (char_spacing / 1.5);
						var text_y = ((this.canvas.height - text_h) / 2) + puffer_y;
					}
					last_text_pos_x = text_x;
					last_text_w = text_overlay.width;
					text_overlay.set({
						left: text_x,
						top: text_y
					});
					//this.canvas.meta.letters_arr.push(text_overlay);
					group_slots.push(text_overlay);
				});
				
				// group all together and calc offset to middle them
				var letter_group = new fabric.Group(group_slots);
				var group_offset = (this.canvas.width - letter_group.width) / 2
				letter_group.set({
					left: group_offset,
				});
				
				// remove group and add letters again with new inherited offset positions
				var temp_items = letter_group.getObjects();
				letter_group.destroy();

				Array.from(temp_items).forEach((item, temp_key) => {
					this.canvas.add(item);
					item.isLetter = true;
					//char = char.toUpperCase().replace('{HEART}', '\u2764');
					var char = item.text.toUpperCase();
					if (char.toLowerCase() in data) {
						Array.from(data[char.toLowerCase()]).forEach((val, key) => {
							var scale_factor = initial_letter_size / item.height;
							var slot_w = val.width / scale_factor;
							var slot_h = val.height / scale_factor;
							var slot_x = (val.left / scale_factor) + item.left;
							var slot_y = (val.top / scale_factor) + item.top;
							
							// add border to slots
							slot_w = slot_w - slot_border;
							slot_h = slot_h - slot_border;
							slot_x = slot_x + (slot_border / 2);
							slot_y = slot_y + (slot_border / 2);
							
							var temp_slot = new fabric.Rect({
								left: slot_x,
								top: slot_y,
								fill: this.meta_data.slot_color,
								//fill: '#'+Math.floor(Math.random()*16777215).toString(16), // random color for dev
								width: slot_w,
								height: slot_h,

								absolutePositioned: true,
								hasBorders: false,
								selectable: true,
								scalable: false,
								controls: false,
								lockMovementX: true,
								lockMovementY: true,
								objectCaching: false,

								//opacity: 0.8,
								clipPath: item,
								meta: {
									type: 'slot',
									slot_id: slot_counter,
									slot_letter: char
								}
							});
							this.canvas.add(temp_slot);
							slot_counter++;
							
							// add slot to letter size to calc the real letter size later
							if (temp_key == 0) {
								//this.canvas.meta.canvas_letter_init_meta.arr.push({'h':slot_h,'y':slot_y});
							}
							
							// dev add text to slot to identify more easy
							/*
							var dev_text = new fabric.Text(String(temp_slot.slot_id), {
								fontFamily: 'Arial',
								fontSize: 20,
								controls: false,
								selectable: false,
								stroke: 'white',
										strokeWidth: stroke_base / 3,
								fill: 'black',
								left: slot_x + (slot_w / 2) - (stroke_base * 1.6666666666),
								top: slot_y + (slot_h / 2) - (stroke_base * 3.3333333333),
								absolutePositioned: true,
							});
							this.canvas.add(dev_text);
							*/
							
						});
					}
					
					// redraw letter - border
					var redraw_letter = new fabric.Text(char, {
						fontFamily: 'Work Sans',
						fontSize: text_size,
						controls: false,
						selectable: false,
						stroke: 'white',
      			strokeWidth: stroke_base * 2,
						fill: 'transparent',
						absolutePositioned: true,
					});
					redraw_letter.set({
						left: item.left - 2,
						top: item.top - 2
					});
					this.canvas.add(redraw_letter);
					redraw_letter.moveTo(1);
					
					// redraw letter - border-inset
					var redraw_letter_outer = new fabric.Text(char, {
						fontFamily: 'Work Sans',
						fontSize: text_size,
						controls: false,
						selectable: false,
						stroke: 'black',
						strokeWidth: (stroke_base * 3),
						fill: 'transparent',
						absolutePositioned: true,
						meta: {
							type: 'letter',
						}
					});
					redraw_letter_outer.set({
						left: item.left - (stroke_base * 1.16666666667),
						top: item.top - (stroke_base * 1.16666666667)
					});
					this.canvas.add(redraw_letter_outer);
					redraw_letter_outer.moveTo(0);
				});
				
				// calc real letter size
				//this.canvas.meta.canvas_letter_init_meta.coords = {min_y: 10000, min_h: 0, max_y: 0, max_h: 0};
				/*
				Array.from(this.canvas.meta.canvas_letter_init_meta.arr).forEach((val, key) => {
					if (val.y < this.canvas.meta.canvas_letter_init_meta.coords.min_y) {
						this.canvas.meta.canvas_letter_init_meta.coords.min_y = val.y;
						this.canvas.meta.canvas_letter_init_meta.coords.min_h = val.h;
					}
					if (val.y + val.h > this.canvas.meta.canvas_letter_init_meta.coords.max_y + this.canvas.meta.canvas_letter_init_meta.coords.max_h) {
						this.canvas.meta.canvas_letter_init_meta.coords.max_y = val.y;
						this.canvas.meta.canvas_letter_init_meta.coords.max_h = val.h;
					}
				});
				this.canvas.meta.canvas_letter_init_meta.size = this.canvas.meta.canvas_letter_init_meta.coords.max_y + this.canvas.meta.canvas_letter_init_meta.coords.max_h - this.canvas.meta.canvas_letter_init_meta.coords.min_y;
				*/
							
				// group slots to enable zoom stuff
				/*
				Array.from(this.canvas.getObjects()).forEach((val, key) => {
					if (typeof val.isLetter !== 'undefined' && (val.text.match(/[A-Z0-9ÖÜÖ&\?\!\.\+\-']/g) || val.text.charCodeAt(0) == 10084)) {
						var temp_w = val.lineCoords.tr.x - val.lineCoords.tl.x;
						var temp_h = val.lineCoords.bl.y - val.lineCoords.tl.y;
						var temp_x = val.lineCoords.tl.x;
						var temp_y = val.lineCoords.tl.y;
						//jQuery('.canvas-container').append('<div class="zoom-marker" data-width="'+val.width+'" data-height="'+val.height+'" data-left="'+val.left+'" data-top="'+val.top+'" style="left: '+(temp_x+(temp_w/2)-7)+'px; top: '+(temp_y-35)+'px;">+</div>');
						//jQuery('.canvas-container').append('<div class="zoom-marker" data-width="'+val.width+'" data-height="'+val.height+'" data-left="'+val.left+'" data-top="'+val.top+'" style="left: '+(val.left+(val.width/2)-5)+'px; top: '+(val.top-5)+'px;">+</div>');
					}
				});
				*/
				
				this.addCanvasInlineText();
				this.refreshCanvasUiPosition();
				this.setEditorLoading(0);
				//addWatermark();

				if (callback != null) {
					callback();
				}
				
				/*
				// fix responsive
				if (canvas_meta.type == 'dyn') {
					var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
			    var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
					if (vw <= 960) {
						setTimeout(function(){
							canvas.requestRenderAll();
							var max_w = jQuery('#collage-designer .editor').width();
							var old_zoom = canvas.getZoom();
							var ratio = canvas.getWidth() / max_w;
							//temp_default_zoom = old_zoom / ratio;
							canvas.setDimensions({ width: canvas.getWidth() / ratio, height: canvas.getHeight() / ratio });
							canvas.setZoom(old_zoom / ratio);
							canvas.requestRenderAll();
						}, 1000);
					}
				}
					*/

			});
			
		});
	}
	async fabricLoadImageFromUrl(url) {
		return new Promise((resolve, reject) => {
			const imgElement = new Image();
			imgElement.onload = () => {
				const fabricImg = new fabric.Image(imgElement);
				resolve(fabricImg);
			};
			imgElement.onerror = () => {
				reject(new Error('Failed to load image'));
			};
			imgElement.src = url;
			imgElement.crossOrigin = 'Anonymous';
		});
	}
	addCanvasInlineText(data = null) {
		if (this.canvas.meta.type == 'dyn') {
			// calc font size for dyn
			var canvas_bounds = this.canvas.calcViewportBoundaries();
			var letter_bounds = this.calcLetterBoundaries();

			var canvas_h = canvas_bounds.bl.y - canvas_bounds.tl.y;
			var empty_space_size = (canvas_h - letter_bounds.h) / 2;
			var dyn_font_size = (letter_bounds.h / 100) * 20;
			var text_y = canvas_bounds.tl.y + empty_space_size + letter_bounds.h + (empty_space_size / 2) - (dyn_font_size / 2);
			
			data = {
				text: {
					align: 'center',
					size: dyn_font_size,
					top: text_y
				}
			};
		}
		if (typeof data.text !== 'undefined') {
			this.canvas.meta.text_data = data.text;
			this.canvas.meta.has_text = true;
			this.canvas.meta.text_data.align = 'center';
			if (typeof data.text.align !== 'undefined') {
				this.canvas.meta.text_data.align = 'center';
			}
			if (typeof data.text.size == 'undefined') {
				this.canvas.meta.text_data.size = 20;
			}
			this.canvas.meta.text_data.size = Math.ceil(this.canvas.meta.text_data.size);
			var itext = new fabric.IText('Text', {
				top: this.canvas.meta.text_data.top,
				fill: '#1e1e1e',
				borderColor: '#82b338',
				editingBorderColor: '#82b338',
				borderScaleFactor: 2,
				isEditing: false,
				controls: false,
				lockMovementX: true,
				lockMovementY: true,
				textAlign: this.canvas.meta.text_data.align,
				originX: this.canvas.meta.text_data.align,
				fontFamily: 'Open Sans',
				fontSize: this.canvas.meta.text_data.size,
				left: this.canvas.getCenter().left,
				meta: {
					type: 'inline-text'
				}
			});
			if (typeof this.canvas.meta.text_data.left !== 'undefined') {
				itext.set({left: this.canvas.meta.text_data.left});
			}
			itext.setCoords();
			/*
			loadFont(family, function(){
				this.canvas.meta.text.set({fontFamily: family});
				canvas.requestRenderAll();
			});
			*/
			
			this.canvas.add(itext);
			this.meta_data.text_obj = itext;
			this.canvas.requestRenderAll();
			this.setUserTextOptionsDefaults();
			this.addUserTextEvents(itext);
		}		
	}
	toggleUserTextOptions(mode = 1) {
		if (mode == 1) {
			if (this.is_mobile) {
				Helper.removeClass('li.active', 'active');
				Helper.removeClass('[data-zone].active', 'active');
				Helper.addClass('.tool-zone', 'active');
				Helper.addClass('li[data-action="text"]', 'active');
				Helper.addClass('[data-zone="text"]', 'active');
			} else {
				this.refreshUserTextOptionsPosition();
				Helper.addClass('.text-tools', 'active');
			}
		} else {
			if (this.is_mobile) {
				Helper.removeClass('.tool-zone', 'active');
				Helper.removeClass('[data-zone].active', 'active');
			} else {
				Helper.removeClass('.text-tools', 'active');
			}
		}
	}
	setUserTextOptionsDefaults(el = null) {
		var size = this.canvas.meta.text_data.size;
		var family = 'Open Sans';
		var color = '#1e1e1e';
		if (el != null) {
			size = el.meta.size || size;
			family = el.meta.family || family;
			color = el.meta.color || color;
		}

		document.querySelector('.text-tools input[name="font-size"]').value = size;
		document.querySelector('.text-tools input[name="font-size"]').setAttribute('value', size);
		document.querySelector('.text-tools select[name="font-family"] option[value="'+family+'"]').selected = true;
		Helper.removeClass('.text-tools [data-color].active', 'active');
		Helper.addClass('.text-tools [data-color="'+color+'"]', 'active');
		this.setTextOptionsColorPreview();
	}
	setTextOptionsColorPreview(target = this.active_text) {
		let color = this.meta_data.text_obj.fill;
		document.querySelector('[data-zone="text"] .color-preview').style['background-color'] = color;
	}
	refreshUserTextOptionsPosition() {
		let zoom = 1;
		if (document.querySelector('.canvas-wrap').style['scale'] != null && document.querySelector('.canvas-wrap').style['scale'] != '') {
			zoom = parseFloat(document.querySelector('.canvas-wrap').style['scale']);
		} 
		let text_box = this.meta_data.text_obj.getBoundingRect();
		let text_options = document.querySelector('.text-tools');
		let text_options_position = text_options.getBoundingClientRect();
		let editor_scroll_top = document.querySelector('#collage-designer .editor').scrollTop;
		let editor_scroll_left = document.querySelector('#collage-designer .editor').scrollLeft;
		let editor_position = document.querySelector('#collage-designer .editor').getBoundingClientRect();
		let container_position = document.querySelector('#collage-designer .canvas-container').getBoundingClientRect();
		let x = container_position.left - editor_position.x + text_box.left + ((text_box.width / 2) - text_options_position.width / 2) + editor_scroll_left;
		let y = container_position.top - editor_position.y + text_box.top - text_options_position.height + editor_scroll_top;
		text_options.style['top'] = y+'px';
		text_options.style['left'] = x+'px';
	}
	addUserTextEvents(itext) {
		var old_text = '';
		itext.on('selected', () => {
			this.active_text = itext;
			this.toggleUserTextOptions(1);
		});
		itext.on('deselected', () => {
			this.toggleUserTextOptions(0);
		});
		itext.on('editing:entered', () => {
			old_text = itext.text;
			this.active_text = itext;
			if (itext.text == 'Text') {
				itext.set('text', '');
				itext.hiddenTextarea.value = '';
			}
		});
		itext.on('editing:exited', () => {
			this.active_text = null;
			if (itext.text == '') {
				itext.set('text', 'Text');
			}
			if (old_text != itext.text) {
				this.saveCollageToDb();
			}
		});
	}
	addSlotUpload(obj) {
		obj.on('selected', () => {
			if (this.slot_upload === true && !Helper.hasClass(document.querySelector('body'), 'dragging')) {
				this.triggerToolzone('upload', true);
				this.canvas.meta.last_active_slot = this.canvas.getActiveObject();
			}
		});
	}
	initUploadPopup() {
		var content = document.querySelector('#upload-wrapper').content.cloneNode(true);
		var guided = false;
		if (window.localStorage.getItem('editor_used') == null) {
			this.sess_id = window.localStorage.setItem('editor_used', 1);
			guided = true;
		}
		xxlPopup.create({
			close_btn: true,
			data: {
				html:content,
				class: 'collage-designer-theme-1'
			},
			ready: () => {
				const _startFileUpload = (event) => {
					var counter = 0;
					Helper.addClass('#collage-designer .uploads-wrap', 'loading');
					this.worker.onmessage = (e) => {
						counter++;
						if (!e.data.error) {
							this.addThumbToUploadZone(e.data)
						}
						if (event.files.length == counter) {
							Helper.removeClass('#collage-designer .uploads-wrap', 'loading');
						}
					};
					this.worker.postMessage({
						action: 'uploadUserPhotos',
						data: Array.from(event.files),
						sess_id: this.sess_id,
					});
					xxlPopup.close();
				}

				if (guided) {
					// clone canvas and restore default look as template preview
					let canvasJSON = JSON.stringify(this.canvas.toJSON());
					//document.querySelector('.upload-wrapper .view-0 output').innerHTML = '<canvas></canvas>';
					var canvas = new fabric.Canvas(document.querySelector('.view-0 canvas'));
					canvas.loadFromJSON(canvasJSON, () => {
						canvas.setWidth(this.canvas.meta.width);
						canvas.setHeight(this.canvas.meta.height);
						canvas.getObjects().forEach((val) => {
							if (typeof val.meta !== 'undefined') {
								if (val.meta.type == 'slot-image') {
									val.dispose();
								} else if (val.meta.type == 'slot') {
									val.set({
										fill: this.meta_data.slot_color,
									});
								} else if (val.meta.type == 'inline-text') {
									val.set({
										'text': 'Text',
										fill: '#1e1e1e',
										textAlign: this.canvas.meta.text_data.align,
										fontFamily: 'Open Sans',
										fontSize: this.canvas.meta.text_data.size,
										top: this.canvas.meta.text_data.top,
									});
								}
							}
						});
						canvas.setBackgroundImage(null, canvas.requestRenderAll.bind(canvas));
						canvas.setBackgroundColor('#fff');
						
						let preview_canvas = canvas.toDataURL({
							format: 'jpg',
							quality: 0.5,
						});
						canvas.dispose();
						document.querySelector('.upload-wrapper .view-0 output').innerHTML = '<img src="'+preview_canvas+'" />';
					});

					Helper.addEvent('.upload-wrapper .view-0 .js-back', 'click', () => {
						window.history.back();
					});
					Helper.addEvent('.upload-wrapper .view-0 button', 'click', () => {
						Helper.removeClass('.upload-wrapper .view-0', 'active');
						Helper.addClass('.upload-wrapper .view-1', 'active');
					});
					Helper.addClass('.upload-wrapper', 'guided');
					Helper.addClass('.upload-wrapper .view-0', 'active');
				} else {
					Helper.addClass('.upload-wrapper .view-1', 'active');
				}
				Helper.addEvent('.upload-wrapper .view-2 .js-back', 'click', () => {
					Helper.removeClass('.upload-wrapper .view-2', 'active');
					Helper.addClass('.upload-wrapper .view-1', 'active');
				});

				document.querySelectorAll('.upload-wrapper .view-0 .dragzone').forEach((el) => {
					el.addEventListener('dragover', (e) => {
						e.preventDefault();
						Helper.addClass(el, 'dragover');
					});
					el.addEventListener('dragleave', () => {
						Helper.removeClass(el, 'dragover');
					});
					el.addEventListener('drop', (e) => {
						e.preventDefault();
						Helper.removeClass(el, 'dragover');
						const new_event = e.dataTransfer;
						_startFileUpload(new_event);
					});
				});

				Helper.addEvent('.upload-wrapper input[type="file"', 'change', (e) => {
					_startFileUpload(e.target);
				});
				Helper.addEvent('.upload-wrapper .js-switch', 'click', (e) => {
					Helper.addClass('.upload-wrapper .view-2', 'active');
					Helper.removeClass('.upload-wrapper .view-1', 'active');

					// add qr code
					document.querySelector('.upload-wrapper .qr-code').innerHTML = '<img style="max-width: 200px;" src="'+this.api_url+'/gen-qr-code.php?sess_id='+this.sess_id+'" alt="qr-code" />';

					// check every x seconds if images are there and download them
					var temp_interval = setInterval(() => {
						fetch(this.api_url+"/scan-for-files.php?sessid="+this.sess_id, {
							method: "GET",
						}).then((response) => response.json()).then((json) => {
							if (!json.hasOwnProperty('error') && Object.keys(json).length >= 1) {
								clearInterval(temp_interval);
								Object.entries(json).forEach((val) => {
									val = val[1];
									// download image and save it in local db
									fetch(this.api_url+'/user-files/'+this.sess_id+'/photos/'+val)
									.then(response => response.blob()).then(blob => new Promise((resolve, reject) => {
											var reader = new FileReader();
											reader.onload = (e) => {
												this.db.uploads.add({ img_data: e.target.result }).then((index) => {
													this.db.uploads.where('id').equals(index).toArray().then((data) => {
														data = data[0];
														this.addThumbToUploadZone(data)

														// remove upload from server
														fetch(this.api_url+"/delete-user-file.php?sessid="+this.sess_id+'&file='+val, {
															method: "GET",
															//body: JSON.stringify({template: template_nr}),
														});
													});
												});
											}
											reader.readAsDataURL(blob);
									}));
									
								});
							}
						});
					}, 5000);
				});
			}
		});
	}
	async addImageToSlot(target_obj, img_data, autofill = false, callback = null) {
		if (typeof target_obj == 'undefined') {
			return;
		}

		// get correct img data
		if (img_data instanceof Element) {
			if (img_data.matches('.img-wrap')) {
				img_data = img_data.childNodes[0];
			}
			var img_src = img_data.getAttribute('src');
			var img_id = parseInt(img_data.parentNode.getAttribute('data-id'));
		} else {
			var img_src = img_data.img_data;
			var img_id = img_data.id;
		}
		document.querySelector('.tool-zone .uploads .img-wrap[data-id="'+img_id+'"]').setAttribute('data-is-used', 1);

		// remove background-color from slot
		if (target_obj.meta.type == 'slot') {
			target_obj.set({
				fill: 'transparent',
			});
		}

		if (target_obj.meta.type == 'slot-image') {
			// set slot obj to actual slot
			let temp_obj = this.findCanvasObject({type: 'slot', slot_id: target_obj.meta.slot_id});
			target_obj = temp_obj[0];

			// remove old slot-image
			temp_obj = this.findCanvasObject({type: 'slot-image', slot_id: target_obj.meta.slot_id});
			this.canvas.remove(temp_obj[0]);
		}
		
		if (typeof target_obj !== 'undefined') {
			// add image
			const slot_image = await this.fabricLoadImageFromUrl(img_src);
			slot_image.set({
				top: target_obj.top,
				left: target_obj.left,
				clipPath: target_obj,
				scalable: false,
				hasBorders: false,
				dirty: false,
				originX: 'center',
				originY: 'center',
				controls: false,
				perPixelTargetFind: true,
				meta: {
					type: 'slot-image',
					img_id: img_id,
					slot_id: target_obj.meta.slot_id,
				}
			});
			this.canvas.add(slot_image);

			// set slot event to false to make it easier to select slot-image
			target_obj.set({
				selectable: false,
				scalable: false,
				controls: false,
				evented: false,
			});

			this.canvas.requestRenderAll();

			// scale image to fit size of crop path
			this.fitImageInSlot(slot_image, target_obj); // todo: maybe skip this when canvas is loaded from save

			// add default filter
			//this.setImagePresetFilter(temp_slot);

			// add image slot events
			slot_image.on('selected', (e) => {
				console.log('slot image selected');
				this.canvas.meta.last_active_slot = slot_image;
				this.addSlotOptions(e.target);
				/*
				if (this.swap_slot !== null) {
						this.swapImage(null, slot_image)
				}
					*/
			});
			slot_image.on('deselected', (e) => {
				console.log('slot image deselected');
				this.removeSlotOptions();
			});

			// bring mask and text to front because dropping image will increase the stack
			if (this.canvas.meta.has_mask) {
				let temp_obj = this.findCanvasObject({type:'mask'});
				this.canvas.bringObjectToFront(temp_obj[0]);
			}
			if (this.canvas.meta.has_text) {
				let temp_obj = this.findCanvasObject({type:'inline-text'});
				this.canvas.bringObjectToFront(temp_obj[0]);
			}

			// finish
			this.canvas.calcOffset()
			/*
			this.updateFinishButton();
			this.updateImageUsedCounter();
			*/
			console.log('img added');
			this.canvas.requestRenderAll();
			if (callback != null) {
				callback(temp_slot);
			}
			
		}
	}
	imageActionZoom(slot_id, zoom_mode) {
		var obj = this.findCanvasObject({type: 'slot-image', slot_id: slot_id})[0];
		const zoom_ratio = 0.10;
		var new_scale_x;
		var new_scale_y;
		if (zoom_mode == 'in') {
			new_scale_x = 1 + zoom_ratio;
			new_scale_y = 1 + zoom_ratio;
		} else {
			new_scale_x = 1 - zoom_ratio;
			new_scale_y = 1 - zoom_ratio;
			if (obj.scaleX * new_scale_x < obj.meta.initial_zoom_x || obj.scaleY * new_scale_y < obj.meta.initial_zoom_y) {
				obj.scaleX = obj.meta.initial_zoom_x;
				obj.scaleY = obj.meta.initial_zoom_y;
				new_scale_x = new_scale_y = 1;
			}
		}
		obj.scaleX = obj.scaleX * new_scale_x;
		obj.scaleY = obj.scaleY * new_scale_y;
		//this.fixImageSlotPosition(obj);
		this.canvas.fire('object:moving', { target: obj });
		this.canvas.requestRenderAll();
	}
	imageActionRotate(slot_id) {
		var obj = this.findCanvasObject({type: 'slot-image', slot_id: slot_id})[0];
		if (obj !== null) {
			//this.canvas.meta.last_active_slot = obj;
			var new_angle = obj.angle + 90;
			if (new_angle >= 360) {
				new_angle = 0;
			}
			obj.set({
				angle: new_angle
			});
			
			this.fitImageInSlot(obj, obj.clipPath); 
			
			this.canvas.requestRenderAll();
			this.saveCollageToDb();
		}
	}
	imageActionSwap(slot_id = null, target_slot = null) {
		if (slot_id == null && target_slot != null) {
			let target_img_id = target_slot.meta.img_id;
			let swap_img_id = this.swap_slot.meta.img_id;
			this.imageActionRemove({slot_id:target_slot.meta.slot_id});
			this.imageActionRemove({slot_id:this.swap_slot.meta.slot_id});
			var obj = this.findCanvasObject({type: 'slot', slot_id: slot_id});
			if (obj.meta.slot_id == target_slot.meta.slot_id) {
				this.addImageToSlot(obj, document.querySelector('.uploads .img-wrap[data-id="'+swap_img_id+'"] img'));
			} else if (obj.meta.slot_id == this.swap_slot.meta.slot_id) {
				this.addImageToSlot(val, document.querySelector('.uploads .img-wrap[data-id="'+target_img_id+'"] img'));
			}
			this.swap_slot = null;
		} else {
			var obj = this.findCanvasObject({type: 'slot-image', slot_id: slot_id});
			this.swap_slot = obj;
			obj.set({
				opacity: 0.5
			});
			this.canvas.requestRenderAll();
		}
		
		/*
		setTimeout(()=> {
			console.log('swap image border toggle');
			this.toggleBorderSlotNew(null, true);
			this.canvas.discardActiveObject();
		}, 100);
		*/
	}
	imageActionRemove(params) {
		var img_id = null;
		if ('slot_id' in params) {
			var target = 'slot_id';
		} else {
			var target = 'img_id';
		}

		this.removeSlotOptions();
		var slot_img_obj = this.findCanvasObject({type: 'slot-image', [target]: params[target]});
		img_id = slot_img_obj.meta['img_id'];
		this.canvas.remove(slot_img_obj);

		// restore default bg color
		var slot_obj = this.findCanvasObject({type: 'slot', slot_id: params.slot_id})[0];
		slot_obj.set({
			fill: this.slot_color,
		});

		// check for more images to avoid wrong "image used" display
		var counter = 0;
		obj_arr = this.findCanvasObject({type: 'slot-image', img_id: img_id});
		obj_arr.forEach((obj) => {
			counter++;
		});
		if (counter == 0) {
			document.querySelector('.uploads .img-wrap[data-id="'+img_id+'"]').setAttribute('data-is-used', 0);
		}

		/*
		this.updateImageUsedCounter();
		this.updateFinishButton();
		*/
	}
	imageActionMirror(slot_id) {
		var obj = this.findCanvasObject({type: 'slot-image', slot_id: slot_id})[0];
		obj.set('flipX', !obj.flipX);
		this.canvas.requestRenderAll();
		this.saveCollageToDb();
	}
	imageActionEdit(slot_id) {
		const content = document.querySelector('#image-edit-wrap').content.cloneNode(true);
		const el = this.findCanvasObject({type: 'slot-image', slot_id: slot_id})[0];
		var edit_meta = {
			canvas: null,
			clip_path: null,
			crop_area: null,
			crop_area_mask: null,
			initial_data: null,
			bg_image: null,
			bg_image_raw: null,
			crop_move_icon_box: null,
			crop_aspect_ratio: 1,
			initial_filters: null,
			cropper_max_w: (this.is_mobile) ? 360 : 600,
			cropper_max_h: (this.is_mobile) ? 360 : 600,
			bg_image_scale_w: 0,
			bg_image_scale_h: 0,
			canvas_w: null,
			canvas_h: null,
		}

		const _animatePath = (path) => {
			const _animate = () => {
				path.set({
					strokeUniform: true,
				});
				path.strokeDashOffset -= 0.5;
				path.dirty = true;
				edit_meta.canvas.renderAll();
				requestAnimationFrame(_animate);
			};
			_animate();
		}
		const _updateBeforeAfter = function() {
			if (document.querySelector('.image-edit-wrap [data-action="beforeafter"]').classList.contains('active')) {
				document.querySelector('.image-edit-wrap [data-action="beforeafter"]').click();
			}
		}
		const _fixCropAreaInitalPosition = () => {
			let temp_obj = edit_meta.crop_area;
			edit_meta.canvas.fire('object:modified', {
				target: temp_obj,
				action: 'scale',
			});
			edit_meta.canvas.fire('object:modified', {
				target: temp_obj,
				action: 'drag',
			});
			edit_meta.canvas.requestRenderAll();
		}
		const _updateClippingMask = (fire_event = false) => {
			if (fire_event) {
				edit_meta.canvas.fire('object:moving', { target: edit_meta.crop_area });
			}
			if (edit_meta.bg_image_raw != null) {
				edit_meta.bg_image_raw.setPositionByOrigin(edit_meta.bg_image.getCenterPoint(), 'center', 'center');
				edit_meta.bg_image_raw.set({
					angle: edit_meta.bg_image.angle,
					flipX: edit_meta.bg_image.flipX,
					left: edit_meta.bg_image.left,
					top: edit_meta.bg_image.top,
					width: edit_meta.bg_image.width,
					height: edit_meta.bg_image.height,
				});
				edit_meta.bg_image_raw.setCoords();
			}
			if (edit_meta.crop_area_mask != null) {
				edit_meta.crop_area_mask.setPositionByOrigin(edit_meta.crop_area.getCenterPoint(), 'center', 'center');
				edit_meta.crop_area_mask.set({
					left: edit_meta.crop_area.left,
					top: edit_meta.crop_area.top,
					width: edit_meta.crop_area.getScaledWidth(),
					height: edit_meta.crop_area.getScaledHeight(),
				});
				edit_meta.crop_area_mask.setCoords();
			}
			_updateCropMoveIconBox();
		}
		const _handleBlackWhiteSwitch = (e) => {
			let is_active = false;
			if (typeof e.detail == 'object') {
				if (e.detail.target.checked) {
					is_active = true;
				}
			} else {
				Helper.toggleClass(e.target, 'active');
				if (e.target.classList.contains('active')) {
					is_active = true;
				}
			}
			if (is_active) {
				edit_meta.bg_image.meta.filters.blackwhite = 1;
			} else {
				edit_meta.bg_image.meta.filters.blackwhite = 0;
			}
			this.applyCropFilter(edit_meta.bg_image);
			if (typeof edit_meta.bg_image_raw !== 'undefined') {
				if (is_active) {
					edit_meta.bg_image_raw.meta.filters.blackwhite = 1;
				} else {
					edit_meta.bg_image_raw.meta.filters.blackwhite = 0;
				}
				this.applyCropFilter(edit_meta.bg_image_raw);
			}
			_updateBeforeAfter();
			edit_meta.canvas.requestRenderAll();
		}
		const _checkImageQuality = () => {
			let scale = 6000 / this.canvas.height;
			let w = edit_meta.bg_image.width * edit_meta.scaleX;
			let h = edit_meta.bg_image.height * edit_meta.scaleY;
			let factor;
			var quality = 1;
			if (w > h) {
				factor = w / (scale * el.clipPath.width);
			} else {
				factor = h / (scale * el.clipPath.height);
			}

			if (factor < 0.5) {
				quality = 3;
			} else if (factor < 1) {
				quality = 2;
			}
			document.querySelector('.xxl-overlay .cropper-wrap .quality').setAttribute('data-quality', quality);
			document.querySelector('.xxl-overlay .cropper-wrap .quality').setAttribute('title', this.translate['quality_'+quality]);
		}
		const _adjustBgImageAndCanvasRotation = () => {
			if (edit_meta.bg_image.angle == 90 || edit_meta.bg_image.angle == 270) {
				edit_meta.canvas.setWidth(edit_meta.canvas_h);
				edit_meta.canvas.setHeight(edit_meta.canvas_w);
				edit_meta.bg_image.scaleToHeight(edit_meta.canvas_w);
				edit_meta.bg_image_raw.scaleToHeight(edit_meta.canvas_w);
			} else {
				edit_meta.canvas.setWidth(edit_meta.canvas_w);
				edit_meta.canvas.setHeight(edit_meta.canvas_h);
				edit_meta.bg_image.scaleToHeight(edit_meta.canvas_h);
				edit_meta.bg_image_raw.scaleToHeight(edit_meta.canvas_h);
			}
			if (edit_meta.bg_image.angle == 90) {
				edit_meta.bg_image.set({
					originX: 'top',
					originY: 'right',
				});
				edit_meta.bg_image_raw.set({
					originX: 'top',
					originY: 'right',
				});
			} else if (edit_meta.bg_image.angle == 180) {
				edit_meta.bg_image.set({
					originX: 'bottom',
					originY: 'right',
				});
				edit_meta.bg_image_raw.set({
					originX: 'bottom',
					originY: 'right',
				});
			} else if (edit_meta.bg_image.angle == 270) {
				edit_meta.bg_image.set({
					originX: 'bottom',
					originY: 'left',
				});
				edit_meta.bg_image_raw.set({
					originX: 'bottom',
					originY: 'left',
				});
			} else {
				edit_meta.bg_image.set({
					originX: 'top',
					originY: 'left',
				});
				edit_meta.bg_image_raw.set({
					originX: 'top',
					originY: 'left',
				});
			}
			edit_meta.bg_image.setCoords();
			edit_meta.bg_image_raw.setCoords();
		}
		const _applyFilters = (obj, new_filters = null, init = false) => {
			if (typeof obj == 'undefined') {
				return;
			}
			var temp_filters = {
				brightness: 0,
				contrast: 0,
				saturation: 0,
				blackwhite: 0,
			};
			if (new_filters != null) {
				temp_filters = new_filters;
			}
			if (init == false) {
				for (const property of ['brightness','contrast','saturation']) {
					var value;
					if (this.is_mobile) {
						value = parseFloat(document.querySelector('.image-edit-wrap .settings > .mobile [data-target="'+property+'"] .filter-value').gettAttribute('data-value'));
					} else {
						var target = document.querySelector('.image-edit-wrap .settings > .filter [name="'+property+'"]');
						value = parseFloat(target.el_slider.value);
						target.nextElementSibling.innerHTML = value;
						target.innerHTML = value;
						target.setAttribute('data-value', value)
					}
					value = value / 100;
					temp_filters[property] = value;
				}
			}
			obj.meta.filters = {};
			Object.entries(temp_filters).forEach((val, index) => {
				var name = val[0];
				var value = val[1];
				obj.meta.filters[name] = value;
			});
			obj.filters = [
				new fabric.filters.Brightness({
					brightness: temp_filters.brightness
				}),
				new fabric.filters.Contrast({
					contrast: temp_filters.contrast
				}),
				new fabric.filters.Saturation({
					saturation: temp_filters.saturation
				})
			];
			if (obj.meta.filters.blackwhite == 1) {
				obj.filters.push(new fabric.Image.filters.Grayscale());
			}
			if (obj.meta.type == 'bg-image-raw') {
				const has_blend_filter = obj.filters.some(filter => filter instanceof fabric.filters.BlendColor);
				if (!has_blend_filter) {
					obj.filters.push(new fabric.filters.BlendColor({
						color: '#000',
						mode: 'tint',
						alpha: 0.5
					}));
				}
				
			}
			obj.applyFilters();
			
			if (typeof document.querySelector('.image-edit-wrap .settings') !== 'undefined' && document.querySelector('.image-edit-wrap .settings') != null && init === true) {
				document.querySelector('.image-edit-wrap .settings [name="brightness"]').setAttribute('value', temp_filters.brightness * 100);
				document.querySelector('.image-edit-wrap .settings [data-target="brightness"] .filter-value').setAttribute('data-value', temp_filters.brightness * 100)
				document.querySelector('.image-edit-wrap .settings [data-target="brightness"] .filter-value').innerHTML = temp_filters.brightness * 100;
				Helper.triggerEvent(document.querySelector('single-range-slider[name="brightness"]').el_slider, 'change');
				document.querySelector('.image-edit-wrap .settings [name="contrast"]').setAttribute('value', temp_filters.contrast * 100);
				document.querySelector('.image-edit-wrap .settings [data-target="contrast"] .filter-value').setAttribute('data-value', temp_filters.contrast * 100)
				document.querySelector('.image-edit-wrap .settings [data-target="contrast"] .filter-value').innerHTML = temp_filters.contrast * 100;
				Helper.triggerEvent(document.querySelector('single-range-slider[name="contrast"]').el_slider, 'change')
				document.querySelector('.image-edit-wrap .settings [name="saturation"]').setAttribute('value', temp_filters.saturation * 100);
				document.querySelector('.image-edit-wrap .settings [data-target="saturation"] .filter-value').setAttribute('data-value', temp_filters.saturation * 100);
				document.querySelector('.image-edit-wrap .settings [data-target="saturation"] .filter-value').innerHTML = temp_filters.saturation * 100;
				Helper.triggerEvent(document.querySelector('single-range-slider[name="saturation"]').el_slider, 'change');
				if (obj.meta.filters.blackwhite == 1) {
					Helper.addClass('.image-edit-wrap [data-action="blackwhite"]', 'active');
					document.querySelector('.image-edit-wrap .settings [data-target="blackwhite"] toggle-switch').setAttribute('checked', true);
				}
					
			}
		}
		const _updateCropMoveIconBox = () => {
			if (edit_meta.crop_move_icon_box != null) {
				edit_meta.crop_move_icon_box.set({
					left: edit_meta.crop_area.left + ((edit_meta.crop_area.width * edit_meta.crop_area.scaleX) / 2) - (edit_meta.crop_move_icon_box.width / 2),
					top: edit_meta.crop_area.top + ((edit_meta.crop_area.height * edit_meta.crop_area.scaleY) / 2) - (edit_meta.crop_move_icon_box.height / 2),
				});
				
				edit_meta.crop_move_icon_box.setCoords();
			}
		}
		const _setCropAreaCorners = () => {
			 // disable unwanted controls
			['ml', 'mr', 'mt', 'mb', 'mtr'].forEach((control) => edit_meta.crop_area.setControlVisible(control, false));

			// adjust corner position to align with edge
			const controlPixelOffset = 6;
			const controls = edit_meta.crop_area.controls;
			for (let controlName in controls) {
				const control = controls[controlName];
				control.positionHandler = (dim, finalMatrix, fabricObject) => {
					const width = fabricObject.width / 2;
					const height = fabricObject.height / 2;
					const scaleX = fabricObject.scaleX;
					const scaleY = fabricObject.scaleY;
					const offsetX = controlPixelOffset / scaleX;
					const offsetY = controlPixelOffset / scaleY;
					let x = 0;
					let y = 0;
					switch (controlName) {
						case 'tl':
							x = -width + offsetX;
							y = -height + offsetY;
							break;
						case 'tr':
							x = width - offsetX;
							y = -height + offsetY;
							break;
						case 'bl':
							x = -width + offsetX;
							y = height - offsetY;
							break;
						case 'br':
							x = width - offsetX;
							y = height - offsetY;
							break;
					}
					return fabric.util.transformPoint(
						{ x, y },
						fabric.util.multiplyTransformMatrices(
							fabricObject.calcTransformMatrix(),
							fabricObject.canvas.viewportTransform
						)
					);
				};
			}

			// make corners always visible
			const originalRender = edit_meta.crop_area.render;
			edit_meta.crop_area.render = function(ctx) {
				originalRender.call(this, ctx);
				ctx.save();
				this.drawControls(ctx);
				ctx.restore();
			};
			edit_meta.canvas.requestRenderAll();
			
			// add animation to edge border
			_animatePath(edit_meta.crop_area);
		}

		xxlPopup.create({
			data: {
				html: content,
				class: 'collage-designer-theme-1'
			},
			close: () => {
				edit_meta.canvas.dispose();
			},
			ready: () => {
				if (this.is_mobile) {
					let new_max_w = document.querySelector('.xxl-overlay.finished > .wrapper > output').getBoundingClientRect().width;
					edit_meta.cropper_max_w = edit_meta.cropper_max_h = new_max_w;
				}

				(async () => {
					const full_res_filename = document.querySelector('.uploads .img-wrap[data-id="'+el.meta.img_id+'"]').getAttribute('data-file');
					const full_res_src_url = this.api_url+'/user-files/'+this.sess_id+'/photos/'+full_res_filename;
					edit_meta.canvas_w = edit_meta.cropper_max_w;
					edit_meta.canvas_h = edit_meta.cropper_max_w / (el.width / el.height)
					if (el.height > el.width) {
						edit_meta.canvas_w = edit_meta.cropper_max_h / (el.height / el.width);
						edit_meta.canvas_h = edit_meta.cropper_max_h;
					}

					// init crop canvas
					document.querySelector('.image-edit-wrap .cropper').innerHTML = '<span class="quality" data-quality="0"></span><canvas id="cropper-canvas"></canvas></div>';
					edit_meta.canvas = new fabric.Canvas('cropper-canvas', {
						width: edit_meta.canvas_w,
						height: edit_meta.canvas_h,
						selectable: true,
						selection: false,
						preserveObjectStacking: true,
						allowTouchScrolling: true,
						uniScaleKey: 'ä',
					});
					edit_meta.canvas.backgroundColor = '#000';
				
					// add backgrund images to crop canvas
					edit_meta.bg_image = await this.fabricLoadImageFromUrl(full_res_src_url);
					edit_meta.bg_image.set({
						originX: 'top',
						originY: 'left',
						dirty: true,
						scalable: false,
						selectable: false,
						controls: false,
						objectCaching: false,
						angle: el.angle,
						meta: {
							filters: {}
						},
						filters: [],
					});
					if (el.width > el.height) {
						edit_meta.bg_image.scaleToWidth(edit_meta.cropper_max_w);
					} else {
						edit_meta.bg_image.scaleToHeight(edit_meta.cropper_max_h);
					}
					edit_meta.bg_image.setCoords();
					
					edit_meta.bg_image_raw = await edit_meta.bg_image.clone();
					edit_meta.bg_image_raw.set({
						dirty: true,
						scalable: false,
						selectable: false,
						controls: false,
						opacity: 0.5,
						angle: el.angle,
						meta: {
							type: 'bg-image-raw',
							filters: {}
						},
						filters: [
							new fabric.filters.BlendColor({
								color: '#000',
								mode: 'tint',
								alpha: 0.5
							})
						]
					});

					_adjustBgImageAndCanvasRotation();

					_applyFilters(edit_meta.bg_image, edit_meta.initial_filters);
					_applyFilters(edit_meta.bg_image_raw, edit_meta.initial_filters);
					edit_meta.canvas.add(edit_meta.bg_image_raw);
					edit_meta.canvas.add(edit_meta.bg_image);
					edit_meta.canvas.requestRenderAll();

					// add crop area and mask
					const slot_rect = el.getBoundingRect(true);
					var scale_factor = edit_meta.canvas.width / slot_rect.width;
					var clippath_aspect_ratio = el.clipPath.width / el.clipPath.height;
					var temp_x = (el.clipPath.left - slot_rect.left) * scale_factor;
					var temp_y = (el.clipPath.top - slot_rect.top) * scale_factor;
					var temp_w = edit_meta.canvas.width * (el.clipPath.width / slot_rect.width);
					var temp_h = temp_w / clippath_aspect_ratio;
					
					edit_meta.crop_area = new fabric.Rect({
						left: temp_x,
						top: temp_y,
						fill: 'transparent',
						//opacity: 0,
						opacity: 1,
						width: temp_w,
						height: temp_h,
						//angle: el.angle,
						stroke: '#fff',
						strokeWidth: 2,
						strokeDashArray: [5,5],
						strokeDashOffset: 0,
						lockScalingFlip: true,
						lockRotation: true,
						lockSkewingX: true,
						lockSkewingY: true,

						cornerColor: 'rgba(255,255,255,1)',
						cornerStrokeColor: 'rgba(255,255,255,1)',
						cornerSize: 12,
						cornerStyle: 'rect',
						transparentCorners: false
					});
					
					// adjust control display for crop area
					_setCropAreaCorners();

					// check quality
					_checkImageQuality();
					
					// add mask to crop_area to show only the upper background image
					edit_meta.crop_area_mask = new fabric.Rect({
						absolutePositioned: true,
						left: edit_meta.crop_area.left,
						top: edit_meta.crop_area.top,
						width: edit_meta.crop_area.getScaledWidth(),
						height: edit_meta.crop_area.getScaledHeight(),
						scalable: false,
						selectable: false,
						controls: false,
					});
					edit_meta.bg_image.set({
						clipPath: edit_meta.crop_area_mask
					});
					edit_meta.crop_area.on('moving', ({ e, transform, pointer }) => {
						_updateClippingMask();
					});
					edit_meta.crop_area.on('scaling', ({ e, transform, pointer }) => {
						_updateClippingMask();
					});
					edit_meta.canvas.add(edit_meta.crop_area);
					//edit_meta.canvas.setActiveObject(edit_meta.crop_area);
					//edit_meta.canvas.requestRenderAll();

					console.log(edit_meta.crop_area);

					// add custom move icon in center of crop area
					edit_meta.crop_move_icon_box = await this.fabricLoadImageFromUrl('images/button-icon-drag.svg');
					edit_meta.crop_move_icon_box.scaleToWidth(30);
					edit_meta.crop_move_icon_box.scaleToHeight(30);
					edit_meta.crop_move_icon_box.set({
						evented: false,
						selectable: false,
						scalable: false,
						left: edit_meta.crop_area.left + (edit_meta.crop_area.width / 2) - (edit_meta.crop_move_icon_box.width / 2),
						top: edit_meta.crop_area.top + (edit_meta.crop_area.height / 2) - (edit_meta.crop_move_icon_box.height / 2)
					});
					edit_meta.canvas.add(edit_meta.crop_move_icon_box);
					edit_meta.canvas.requestRenderAll();

					// add event to prevent scaling > canvas size
					edit_meta.crop_aspect_ratio = edit_meta.crop_area.width / edit_meta.crop_area.height;
					edit_meta.canvas.on('object:modified', function(e) {
						if (e.action == 'scale') {
							let obj = e.target;
							let canvas_w = edit_meta.canvas.getWidth();
							let canvas_h = edit_meta.canvas.getHeight();
							let new_w = obj.width * obj.scaleX;
							let new_h = obj.height * obj.scaleY;
							if (new_w > canvas_w || new_h > canvas_h) {
								if (edit_meta.crop_aspect_ratio > 1) {
									new_w = canvas_w;
									new_h = new_w / edit_meta.crop_aspect_ratio;
								} else {
									new_h = canvas_h;
									new_w = new_h * edit_meta.crop_aspect_ratio;
								}
								obj.scaleX = new_w / obj.width;
								obj.scaleY = new_h / obj.height;
								obj.canvas.fire('object:moving', {
									target: obj
								});
								_updateClippingMask();
								edit_meta.canvas.requestRenderAll();
							}
						}
					});

					// add events to crop area
					edit_meta.canvas.on('object:moving', (e) => {
						console.log('is moving');
						const obj = e.target;
						const min_x = 0;
						const max_x = edit_meta.canvas.getWidth() - (obj.width * obj.scaleX);
						const min_y = 0;
						const max_y = edit_meta.canvas.getHeight() - (obj.height * obj.scaleY);
						if (obj.left < min_x) {
							obj.set({
								left: min_x,
							})
						}
						if (obj.left > max_x) {
							obj.set({
								left: max_x,
							})
						}
						if (obj.top < min_y) {
							obj.set({
								top: min_y,
							})
						}
						if (obj.top > max_y) {
							obj.set({
								top: max_y,
							})
						}
						obj.setCoords();
					});

					// add image manipulation events
					var temp_elements = [
						document.querySelector('.image-edit-wrap [name="brightness"]'),
						document.querySelector('.image-edit-wrap [name="contrast"]'),
						document.querySelector('.image-edit-wrap [name="saturation"]'),
					]
					Array.prototype.forEach.call(temp_elements, (item) => {
						item.addEventListener('change', (e) => {
							_updateBeforeAfter();
							let type = e.target.getAttribute('name');
							let value = e.detail.value / 100;
							edit_meta.bg_image.meta.filters[type] = value;
							edit_meta.bg_image_raw.meta.filters[type] = value;
							_applyFilters(edit_meta.bg_image, null);
							_applyFilters(edit_meta.bg_image_raw, null);
							edit_meta.canvas.requestRenderAll();
						});
					});
					Helper.addEvent('.image-edit-wrap [data-action="blackwhite"]', 'click', (e) => {
						_handleBlackWhiteSwitch(e);
					});
					Helper.addEvent('.image-edit-wrap .tools-switcher [data-target="blackwhite"] toggle-switch', 'change', (e) => {
						_handleBlackWhiteSwitch(e);
					});
					Helper.addEvent('.image-edit-wrap [data-action="mirror"]', 'click', (e) => {
						edit_meta.bg_image.set('flipX', !edit_meta.bg_image.flipX);
						if (edit_meta.bg_image.meta.is_flipped === true) {
							edit_meta.bg_image.meta.is_flipped = false;
						} else {
							edit_meta.bg_image.meta.is_flipped = true;
						}
						_updateClippingMask(true);
						edit_meta.canvas.requestRenderAll();
					});
					Helper.addEvent('.image-edit-wrap [data-action="maximize"]', 'click', (e) => {
						let ratio = edit_meta.crop_area.width / edit_meta.crop_area.height;
						let max_w = edit_meta.bg_image.getScaledWidth();
						let max_h = edit_meta.bg_image.getScaledHeight();
						let new_w = max_w;
						let new_h = max_w / ratio;
						if (new_w <= max_w && new_h <= max_h) {
							edit_meta.crop_area.scaleToWidth(max_w);
						} else if (new_w <= max_w && new_h > max_h) {
							edit_meta.crop_area.scaleToHeight(max_h);
						}
						edit_meta.crop_area.setCoords();
						_updateClippingMask(true);
					});
					Helper.addEvent('.image-edit-wrap [data-action="rotate"]', 'click', (e) => {
						var new_angle = edit_meta.bg_image.angle + 90;
						if (new_angle >= 360) {
							new_angle = 0;
						}
						edit_meta.bg_image.set({
							angle: new_angle,
						});
						edit_meta.bg_image_raw.set({
							angle: new_angle,
						});

						edit_meta.bg_image.setCoords();
						edit_meta.bg_image_raw.setCoords();
						_adjustBgImageAndCanvasRotation();
						_updateClippingMask(true);
						edit_meta.canvas.requestRenderAll();
					});
					Helper.addEvent('.image-edit-wrap [data-action="beforeafter"]', 'click', (e) => {
						if (!e.target.classList.contains('active')) {
							edit_meta.bg_image.temp_filters = edit_meta.bg_image.meta.filters;
							edit_meta.bg_image_raw.temp_filters = edit_meta.bg_image.meta.filters;
							e.target.querySelector('img').src = 'images/filter-active-left.svg';
						} else {
							e.target.querySelector('img').src = 'images/filter-active-right.svg';
						}
						Helper.toggleClass(e.target, 'active');
						if (e.target.classList.contains('active')) {
							this.setImagePresetFilter(edit_meta.bg_image, null, false);
							this.setImagePresetFilter(edit_meta.bg_image_raw, null, false);
						} else {
							this.setImagePresetFilter(edit_meta.bg_image, edit_meta.bg_image.temp_filters, false);
							this.setImagePresetFilter(edit_meta.bg_image_raw, edit_meta.bg_image_raw.temp_filters, false);
						}
						edit_meta.canvas.requestRenderAll();
					});
					
					// add events to confirm/cancel buttons
					Helper.addEvent('.image-edit-wrap .js-confirm-extra', 'click', (e) => {
						Helper.toggleClass('.image-edit-wrap .confirm .hidden', 'active');
					});
					Helper.addEvent('.image-edit-wrap .confirm .js-trigger', 'click', (e) => {
						var bg_meta_filters = {};
						Object.entries(edit_meta.bg_image.meta.filters).forEach((val, index) => {
							var name = val[0];
							var value = val[1];
							bg_meta_filters[name] = value;
						});
						this.canvas.getObjects().forEach((el) => {
							if ('meta' in el) {
								if (el.meta.type == 'slot-image') {
									el.meta.filters = bg_meta_filters;
									el.filters = edit_meta.bg_image.filters;
									el.applyFilters();
								}
							}
						});
						this.canvas.requestRenderAll();
						console.log('fill 19');
						Helper.triggerEvent(document.querySelector('.image-edit-wrap .js-confirm'), 'click');
						//xxlPopup.close();
					});
					Helper.addEvent('.image-edit-wrap .js-confirm', 'click', (e) => {
						//_updateBeforeAfter();

						// apply mirror
						if (edit_meta.bg_image.meta.is_flipped === true) {
							el.set('flipX', !el.flipX);
						}

						// apply rotate
						if (edit_meta.bg_image.angle != null) {
							el.set({ angle: edit_meta.bg_image.angle });
							this.fitImageInSlot(el, el.clipPath); 
						}
						el.setCoords();

						// apply filter of preview to slot-image
						var bg_meta_filters = {};
						Object.entries(edit_meta.bg_image.meta.filters).forEach((val, index) => {
							var name = val[0];
							var value = val[1];
							bg_meta_filters[name] = value;
						});
						el.meta.filters = bg_meta_filters;
						el.filters = edit_meta.bg_image.filters;
						el.applyFilters();

						// apply crop of preview to slot-image
						console.log(edit_meta.crop_area);
						let crop_area_w = edit_meta.crop_area.width * edit_meta.crop_area.scaleX;						
						let crop_area_h = edit_meta.crop_area.height * edit_meta.crop_area.scaleY;						
						let img_w = edit_meta.canvas.width;
						let img_h = edit_meta.canvas.height;

						/////////////
						let x = 0 - edit_meta.crop_area.left;
						let y = 0 - edit_meta.crop_area.top;
						let scale_factor = edit_meta.crop_area.width / el.clipPath.width;
						
						// Erfassen der inversen Skalierungsfaktoren von crop_area
						let crop_scale = 1;
						if (edit_meta.canvas.width > edit_meta.canvas.height) {
							crop_scale = (edit_meta.crop_area.height * edit_meta.crop_area.scaleY) / edit_meta.canvas.getHeight();
						} else {
							crop_scale = (edit_meta.crop_area.width * edit_meta.crop_area.width) / edit_meta.canvas.getWidth();
						}
						let inverseScaleX = 1 / (crop_scale || 1);
						let inverseScaleY = 1 / (crop_scale || 1);
						
						// Inverse Skalierung von el
						el.scaleX *= inverseScaleX;
						el.scaleY *= inverseScaleY;
						
						function convertRelativeToClipPath(object, left, top, inverseScaleX, inverseScaleY) {
								const clipPathBoundingBox = object.clipPath.getBoundingRect();
								const relativeLeft = clipPathBoundingBox.left + left * inverseScaleX;
								const relativeTop = clipPathBoundingBox.top + top * inverseScaleY;
								const objectOffsetX = (object.width * object.scaleX) / 2;
								const objectOffsetY = (object.height * object.scaleY) / 2;
								return {
										left: relativeLeft + objectOffsetX,
										top: relativeTop + objectOffsetY
								};
						}
						
						const newCenterPosition = convertRelativeToClipPath(
								el,
								x / scale_factor,
								y / scale_factor,
								inverseScaleX,
								inverseScaleY
						);
						
						el.set({
								left: newCenterPosition.left,
								top: newCenterPosition.top,
						});
						el.setCoords();

						// SKALIERUNG PASST ABER POSITIONIERUNG NICHT MEHR GANZ NACH ZWEITEM MAL
						



						this.canvas.requestRenderAll();
						xxlPopup.close();
						this.triggerToast('Änderungen erfolgreich übernommen')

						/*
						// apply crop of preview to slot-image
						let new_scale_x = el.scaleX / edit_meta.crop_area.scaleX;
						let new_scale_y = el.scaleY / edit_meta.crop_area.scaleY;
						let el_width = el.width;
						let el_height = el.height;
						if (el.angle == 90 || el.angle == 270) {
							el_width = el.height;
							el_height = el.width;
						}
						let base_x = (el_width * new_scale_x) / 2;
						let base_y = (el_height * new_scale_y) / 2;

						el.set({
							scaleX: new_scale_x,
							scaleY: new_scale_y,
							left: base_x + el.clipPath.left - (edit_meta.crop_area.left / (edit_meta.crop_area.scaleX * edit_meta.bg_image_scale_w)),
							top: base_y + el.clipPath.top - (edit_meta.crop_area.top / (edit_meta.crop_area.scaleY * edit_meta.bg_image_scale_h))
						});

						el.setCoords();
						*/
					});
					Helper.addEvent('.image-edit-wrap .js-reset', 'click', (e) => {
						edit_meta.crop_area.set({
							/*
							left: (el.clipPath.left - realLineCoords.tl.x) * edit_meta.bg_image_scale_w,
							top: (el.clipPath.top - realLineCoords.tl.y) * edit_meta.bg_image_scale_h,
							*/
							left: 0,
							top: 0,
							width: el.clipPath.width * edit_meta.bg_image_scale_w,
							height: el.clipPath.height * edit_meta.bg_image_scale_h,
							scaleX: 1,
							scaleY: 1,
						});
						edit_meta.crop_area.setCoords();

						//this.setImagePresetFilter(bg_image, bg_image.meta.filters);
						this.setImagePresetFilter(edit_meta.bg_image);
						edit_meta.bg_image.applyFilters();
						_updateClippingMask();
						_fixCropAreaInitalPosition();
						edit_meta.canvas.requestRenderAll();
						//xxlPopup.close();
					});


				})();
				
				
				/*
					//console.log(img_clone);
					return;

					// add image as bg image
					fabric.Image.fromURL(img_clone, (img) => {
						this.canvas.requestRenderAll();
						console.log('fill 18');
						edit_meta.bg_image = img;
						edit_meta.bg_image.set({
							dirty: true,
							scalable: false,
							selectable: false,
							controls: false,
							objectCaching: false,
							meta: {
								filters: {}
							},
							filters: [],
						});
						edit_meta.canvas.add(edit_meta.bg_image);
						if (edit_meta.bg_image.width > edit_meta.bg_image.height) {
							edit_meta.bg_image.scaleToWidth(edit_meta.cropper_max_w);
						} else {
							edit_meta.bg_image.scaleToHeight(edit_meta.cropper_max_h);
						}
						edit_meta.canvas.requestRenderAll();
					});
					*/

				return;
				el.clone().then((img_clone) => {
					img_clone.meta = el.meta;
					var full_res_src = document.querySelector('.uploads .img-wrap[data-id="'+img_clone.meta.img_id+'"] img').getAttribute('src');
					edit_meta.clip_path = img_clone.clipPath;
					img_clone.clipPath = null;
					let img_clone_backup = img_clone;
					
					// backup old filters and remove them
					edit_meta.initial_filters = img_clone.meta.filters;
					img_clone.filters = [];
					img_clone.applyFilters();
					img_clone = img_clone.toDataURL();

					// add cropper
					document.querySelector('.image-edit-wrap .cropper').innerHTML = '<span class="quality" data-quality="0"></span><canvas id="cropper-canvas"></div>';
					edit_meta.canvas = new fabric.Canvas('cropper-canvas', {
						width: img_clone.width,
						height: img_clone.height,
						selectable: true,
						selection: false,
						preserveObjectStacking: true,
						allowTouchScrolling: true,
						uniScaleKey: "ä",
						fill: '#000',
					});

					

					// add bg image
					fabric.Image.fromURL(img_clone, (img) => {
						this.canvas.requestRenderAll();
						console.log('fill 18');
						edit_meta.bg_image = img;
						edit_meta.bg_image.set({
							dirty: true,
							scalable: false,
							selectable: false,
							controls: false,
							objectCaching: false,
							meta: {
								filters: {}
							},
							filters: [],
						});
						edit_meta.canvas.add(edit_meta.bg_image);
						if (edit_meta.bg_image.width > edit_meta.bg_image.height) {
							edit_meta.bg_image.scaleToWidth(edit_meta.cropper_max_w);
						} else {
							edit_meta.bg_image.scaleToHeight(edit_meta.cropper_max_h);
						}
						edit_meta.canvas.requestRenderAll();
						
						// preset filter
						this.setImagePresetFilter(edit_meta.bg_image, edit_meta.initial_filters);
						
						// set canvas size to image size
						edit_meta.bg_image_scale_w = edit_meta.bg_image.scaleX;
						edit_meta.bg_image_scale_h = edit_meta.bg_image.scaleY;
						edit_meta.canvas.setWidth(edit_meta.bg_image.width * edit_meta.bg_image_scale_w);
						edit_meta.canvas.setHeight(edit_meta.bg_image.height * edit_meta.bg_image_scale_h);
						edit_meta.canvas.requestRenderAll();

						// add crop area to cropper
						el.setCoords();
						el.clipPath.setCoords();

						//realLineCoords = this.calcRealLineCoords(el);
						/*
						let temp_y = (el.clipPath.top - realLineCoords.tl.y) * edit_meta.bg_image_scale_w;
						let temp_x = (el.clipPath.left - realLineCoords.tl.x) * edit_meta.bg_image_scale_h;
						*/
						let temp_y = 0;
						let temp_x = 0;
						let temp_w = edit_meta.clip_path.width * edit_meta.bg_image_scale_w;
						let temp_h = edit_meta.clip_path.height * edit_meta.bg_image_scale_h;

						if (this.canvas.meta.type == 'dyn') {
							let pos_slot = el.clipPath.getBoundingRect();
							let pos_image = el.getBoundingRect();

							temp_x = (pos_slot.left - pos_image.left) * edit_meta.bg_image_scale_w;
							temp_y = (pos_slot.top - pos_image.top) * edit_meta.bg_image_scale_h;
							let temp_w_percent = (100 / pos_slot.width) * pos_image.width;
							let temp_h_percent = (100 / pos_slot.height) * pos_image.height;
						}
						
						edit_meta.crop_area = new fabric.Rect({
							left: temp_x,
							top: temp_y,
							fill: 'transparent',
							/*fill: '#fff',*/
							//opacity: 0,
							opacity: 1,
							width: temp_w,
							height: temp_h,
							//angle: el.angle,
							stroke: '#fff',
							strokeWidth: 2,
							strokeDashArray: [5,5],
							strokeDashOffset: 0,
							lockScalingFlip: true,
							lockSkewingX: true,
							lockSkewingY: true,

							cornerColor: 'rgba(255,255,255,1)',
							cornerStrokeColor: 'rgba(255,255,255,1)',
							cornerSize: 12,
							cornerStyle: 'rect',
							transparentCorners: false
						});
						aspectRatio = edit_meta.crop_area.width / edit_meta.crop_area.height;

						// add custom move icon in center of crop area
						fabric.Image.fromURL('images/button-icon-drag.svg', (img) => {
							edit_meta.crop_move_icon_box = img;
							edit_meta.crop_move_icon_box.scaleToWidth(30);
							edit_meta.crop_move_icon_box.scaleToHeight(30);
							edit_meta.crop_move_icon_box.set({
								evented: false,
								selectable: false,
								scalable: false,
								left: edit_meta.crop_area.left + (edit_meta.crop_area.width / 2) - (edit_meta.crop_move_icon_box.width / 2),
								top: edit_meta.crop_area.top + (edit_meta.crop_area.height / 2) - (edit_meta.crop_move_icon_box.height / 2)
							});

							edit_meta.canvas.add(edit_meta.crop_move_icon_box);
							edit_meta.canvas.requestRenderAll();
						});

						// custom controls
						_animatePath(edit_meta.crop_area);
						edit_meta.initial_data = {
							width: edit_meta.clip_path.width * edit_meta.bg_image_scale_w,
							height: edit_meta.clip_path.height * edit_meta.bg_image_scale_h,
						}
						
						// set full resolution for cropper front
						edit_meta.bg_image.setSrc(full_res_src, () => {
							edit_meta.canvas.requestRenderAll();
							edit_meta.bg_image.scaleToWidth(edit_meta.canvas.width);
							edit_meta.bg_image.scaleToHeight(edit_meta.canvas.height);
							edit_meta.canvas.requestRenderAll();

								// add clipping mask for bg image
								edit_meta.bg_image.clone().then((temp_clone) => {
									edit_meta.bg_image_raw = temp_clone;
									edit_meta.bg_image_raw.set({
										clipPath: null,
										scalable: false,
										selectable: false,
										controls: false,
										//filters: [],
										//opacity: 0.5,
										/*
										filters: [
											new fabric.Image.filters.BlendColor({
												color: '#000',
												mode: 'tint',
												alpha: 0.5
											})
										],
										*/
										meta: {
											type: 'bg-image-raw',
											filters: {}
										},
									});
									this.setImagePresetFilter(edit_meta.bg_image_raw, edit_meta.initial_filters);
									edit_meta.bg_image_raw.applyFilters();
									
									edit_meta.crop_area_mask = new fabric.Rect({
										absolutePositioned: true,
										left: edit_meta.crop_area.left,
										top: edit_meta.crop_area.top,
										width: edit_meta.crop_area.getScaledWidth(),
										height: edit_meta.crop_area.getScaledHeight(),
										lockScalingFlip: true,
										lockSkewingX: true,
										lockSkewingY: true,
										scalable: false,
										selectable: false,
										controls: false,
									});
									edit_meta.bg_image.set({
										clipPath: edit_meta.crop_area_mask
									});
									edit_meta.crop_area.on('moving', ({ e, transform, pointer }) => {
										_updateClippingMask();
									});
									edit_meta.crop_area.on('scaling', ({ e, transform, pointer }) => {
										_updateClippingMask();
									});
									edit_meta.canvas.add(edit_meta.bg_image_raw);
									edit_meta.bg_image_raw.sendToBack();
									edit_meta.canvas.requestRenderAll();
								});
						});

						

						// finish setup
						edit_meta.canvas.add(edit_meta.crop_area);
						edit_meta.canvas.requestRenderAll();
						edit_meta.canvas.setActiveObject(edit_meta.crop_area);
						_fixCropAreaInitalPosition();

						// resize canvas to fill parent
						/*
						let cropper_size = document.querySelector('.image-edit-wrap .cropper').getBoundingClientRect();
						let wrapper_size = document.querySelector('.image-edit-wrap .cropper-wrap').getBoundingClientRect();
						let cropper_ratio = cropper_size.width / cropper_size.height;
						let wrapper_ratio = wrapper_size.width / wrapper_size.height;
						let wrapper_scale = 1;
						if (cropper_ratio > wrapper_ratio) {
							wrapper_scale = wrapper_size.width / cropper_size.width;
						} else {
							wrapper_scale = wrapper_size.height / cropper_size.height;
						}
						document.querySelector('.image-edit-wrap .cropper').style['scale'] = wrapper_scale;
						*/

					}, { crossOrigin: 'Anonymous' });

					// update edit pagination
					/*
					var pagination_cur = el.meta['slot_id'] + 1;
					var pagination_max = this.countSlotImages();
					document.querySelector('.image-edit-wrap .edit-pagination').innerHTML = pagination_cur+' / '+pagination_max;
					*/
						
					// add button events
					Helper.addEvent('.image-edit-wrap .top-bar [data-action="prev"]', 'click', (e) => {
						let new_slot = el.meta['slot_id'] - 1;
						let max_slots = this.countSlotImages() - 1;
						if (new_slot < 0) {
							new_slot = max_slots;
						}
						xxlPopup.close();
						collage_maker_2.editImage(new_slot);
					});
					Helper.addEvent('.image-edit-wrap .top-bar [data-action="next"]', 'click', (e) => {
						let new_slot = el.meta['slot_id'] + 1;
						let max_slots = this.countSlotImages() - 1;
						if (new_slot > max_slots) {
							new_slot = 0;
						}
						xxlPopup.close();
						collage_maker_2.editImage(new_slot);
					});

					///////////////////

					// add mobile events
					Helper.addEvent('.image-edit-wrap .settings > .mobile [data-target]', 'click', (e) => {
						let target = e.target.getAttribute('data-target');
						if (target != 'blackwhite' && target != null) {
							Helper.addClass('.image-edit-wrap .tools-wrap.filter', 'active');
							Helper.addClass('.image-edit-wrap .tools-wrap.filter div[data-target="'+target+'"]', 'active');
						}
					});
					Helper.addEvent('.image-edit-wrap .js-confirm-filter', 'click', (e) => {
						Helper.removeClass('.image-edit-wrap .tools-wrap.filter div[data-target].active', 'active');
						Helper.removeClass('.image-edit-wrap .tools-wrap.filter', 'active');
					});

					

					// add events to crop area
					edit_meta.canvas.on('object:moving', (e) => {
						var obj = e.target;
						var min_x = 0;
						var max_x = edit_meta.canvas.getWidth() - (obj.width * obj.scaleX);
						var min_y = 0;
						var max_y = edit_meta.canvas.getHeight() - (obj.height * obj.scaleY);

						if (obj.left < min_x) {
							obj.set({
								left: min_x,
							})
						}
						if (obj.left > max_x) {
							obj.set({
								left: max_x,
							})
						}
						if (obj.top < min_y) {
							obj.set({
								top: min_y,
							})
						}
						if (obj.top > max_y) {
							obj.set({
								top: max_y,
							})
						}
						obj.setCoords();
					});

				});
			}
		});
	}
	addSlotOptions(target) {
		this.removeSlotOptions();
		var slot = target.clipPath;
		slot.setCoords();
		
		var html = document.createElement('div');
		html.className = 'slot-options';
		html.style.cssText = 'opacity: 0;position: absolute;';
		html.innerHTML = `
		<div>
			<div>
				<button type="button" onclick="collage_maker_2.imageActionZoom(`+slot.meta.slot_id+`, 'in')"><img src="images/add-circle.svg" /></button>
				<span class="divider"></span>
				<button type="button" onclick="collage_maker_2.imageActionZoom(`+slot.meta.slot_id+`, 'out')"><img src="images/remove-circle.svg" /></button>
			</div>
			<label>Zoom</label>
		</div>
		<button type="button" onclick="collage_maker_2.imageActionRotate(`+slot.meta.slot_id+`)"><img src="images/rotate-right.svg" /><label>Drehen</label></button>
		<button type="button" onclick="collage_maker_2.imageActionMirror(`+slot.meta.slot_id+`)"><img src="images/flip-horizontal.svg" /><label>Spiegeln</label></button>
		<button type="button" onclick="collage_maker_2.imageActionEdit(`+slot.meta.slot_id+`)"><img src="images/preference-horizontal.svg" /><label>Bild anpassen</label></button>
		<button type="button" onclick="collage_maker_2.imageActionSwap(`+slot.meta.slot_id+`)"><img src="images/image-swap.svg" /><label>Bild tauschen</label></button>
		<button type="button" onclick="collage_maker_2.imageActionRemove({slot_id:`+slot.meta.slot_id+`})"><img src="images/delete.svg" /><label>Löschen</label></button>
		`;
		document.querySelector('.editor').insertBefore(html, null);
		if (this.is_mobile) {
			this.hideToolZone();
		}
		this.refreshSlotPositions();
	}
	removeSlotOptions() {
		document.querySelectorAll('.editor .slot-options').forEach((el) => {
			el.parentNode.removeChild(el);
		}); 
	}
	refreshSlotPositions() {
		if (this.is_mobile) {
			let slot_options = document.querySelector('.editor .slot-options');
			document.querySelector('.editor').append(slot_options);
			let x = parseFloat(window.getComputedStyle(document.querySelector('.canvas-wrap'), null).getPropertyValue('padding').replace('px', '')) - parseFloat(window.getComputedStyle(slot_options, null).getPropertyValue('padding-left').replace('px', ''));
			slot_options.style['opacity'] = 1;
		} else {
			let slot = this.canvas.getActiveObject();
			slot = slot.clipPath;
			let zoom = 1;
			if (document.querySelector('.canvas-wrap').style['scale'] != null && document.querySelector('.canvas-wrap').style['scale'] != '') {
				zoom = parseFloat(document.querySelector('.canvas-wrap').style['scale']);
			} 

			let slot_options = document.querySelector('.editor .slot-options');
			let slot_position = slot.getBoundingRect();
			let slot_options_position = slot_options.getBoundingClientRect();
			let editor_scroll_top = document.querySelector('#collage-designer .editor').scrollTop;
			let editor_scroll_left = document.querySelector('#collage-designer .editor').scrollLeft;
			let editor_position = document.querySelector('#collage-designer .editor').getBoundingClientRect();
			let container_position = document.querySelector('#collage-designer .canvas-container').getBoundingClientRect();
			let slot_w = slot_position.width * zoom;
			let slot_h = slot_position.height * zoom;
			let slot_x = slot_position.left * zoom;
			let slot_y = slot_position.top * zoom;
			var x = container_position.left - editor_position.x + slot_x + ((slot_w / 2) - slot_options_position.width / 2) + editor_scroll_left;
			var y = container_position.top - editor_position.y + slot_y + slot_h + editor_scroll_top;
			
			slot_options.style['top'] = y+'px';
			slot_options.style['left'] = x+'px';
			slot_options.style['opacity'] = 1;
		}
	}
	addThumbToUploadZone(data) {
		let temp_el = '<li><span class="tool js-delete" title="Löschen"></span><span class="tool js-preview-thumb" title="Vorschau"></span><span class="tool js-is-used" title="Wird verwendet"></span><span draggable="true" class="img-wrap" data-id="'+data.id+'" data-file="'+(data.file || '')+'" data-is-used="0"><img class="thumb" src="'+data.img_data+'" /></span></li>';
		document.querySelector('.uploads').innerHTML = temp_el + document.querySelector('.uploads').innerHTML;
		this.updateUploadCounter();
		this.updateUploadView();
	}
	updateUploadCounter() {
		const counter = document.querySelectorAll('.tool-zone .uploads li').length;
		let output = '';
		if (counter > 0) {
			output = '<span>'+counter+'</span>';
		}
		document.querySelector('.toolbar .counter').innerHTML = output;
	}
	updateUploadView() { // todo
		Helper.addClass('#collage-designer [data-zone="upload"] .view-2', 'active');
		Helper.removeClass('#collage-designer [data-zone="upload"] .view-1', 'active');
		this.db.uploads.count().then((count) => {
			if (count < 1) {
				var temp_interval = setInterval(() => {
					if (!Helper.hasClass(document.querySelector('.editor'), 'loading')) {
						clearInterval(temp_interval);
						if (document.querySelector('.xxl-overlay .upload-wrapper') == null) {
							this.initUploadPopup();
						}
					}
				}, 100);
			}
		});
	}
	updateToolbar(data) {
		if (typeof data.text == 'undefined') {
			Helper.addClass('.toolbar li[data-action="text"]', 'disabled');
		} else {
			Helper.removeClass('.toolbar li[data-action="text"]', 'disabled');
		}
	}
	loadUserPhotosFromDB(render = true, callback = null) {
		const _renderUserPhotos = (data) => {
			this.worker.onmessage = (e) => {
				Helper.addClass('.uploads-wrap', 'has-images');
				document.querySelector('.uploads').innerHTML = e.data;
				this.updateUploadCounter();
				this.updateUploadView();
				//this.updateUsedImagesDisplay();
				Helper.removeClass('.uploads-wrap', 'loading');
			};
			this.worker.postMessage({action: 'renderUserPhotos', data: data});
		}

		// check if entries are there
		this.db.uploads.limit(2).toArray().then((data) => {
			// load entries
			if (data.length) {
				Helper.addClass('#collage-designer .uploads-wrap', 'loading');
				this.db.uploads.reverse().toArray().then((data) => {
					if (render) {
						_renderUserPhotos(data);
					} else {
						if (callback != null) {
							callback(data);
						} else {
							return data;
						}
					}
				});
			}
		});
	}
	deleteAllUploads() {
		let content = `<style>
			.xxl-overlay.warning {
				text-align: center;
			}
		</style>
		<p>Achtung: Dabei wird auch deine Collage zurückgesetzt und alle bisherigen Änderungen verworfen.<br>Bist du dir sicher?</p><button class="cta passive js-back">Abbrechen</button><button class="cta js-continue">Ja, weiter</button>`;
		this.triggerWarning(content, () => {
			Helper.addEvent('.xxl-overlay.warning .js-back', 'click', () => {
				xxlPopup.close();
			});
			Helper.addEvent('.xxl-overlay.warning .js-continue', 'click', () => {
				this.db.canvas.clear();
				document.querySelectorAll('.tool-zone [data-zone="upload"] li .img-wrap').forEach((el) => {
					var id = parseInt(el.getAttribute('data-id'));
					this.db.uploads.delete(id).then(function(data) {
						let el_wrap = el.parentNode;
						el_wrap.parentNode.removeChild(el_wrap);
					});
				});
				xxlPopup.close();
			});
		});

		let canvas_meta = this.canvas.meta;
		this.resetCanvas();
		this.canvas.meta = canvas_meta;
		if (canvas_meta.type == 'dyn') {
			this.buildDynLayout();
		} else {
			this.buildLayout(canvas_meta.template_id);
		}
	}
	applyGlobalFilter(filter_name = 'blackwhite') {
		this.canvas.getObjects().forEach((obj) => {
			if ('meta' in obj) {
				if (obj.meta.type == 'slot-image') {
					obj.meta.filters.blackwhite = 1;
					obj.filters.push(new fabric.Image.filters.Grayscale());
					obj.applyFilters();
				}
			}
		});
		this.canvas.requestRenderAll();
		console.log('fill 16');
	}
	removeGlobalFilter(filter_name = 'blackwhite') {
		this.canvas.getObjects().forEach((obj) => {
			if ('meta' in obj) {
				if (obj.meta.type == 'slot-image') {
					obj.meta.filters.blackwhite = 0;
					var temp_index = obj.filters.findIndex(function(filter) {
						return filter instanceof fabric.Image.filters.Grayscale;
					});
					if (temp_index !== -1) {
						obj.filters.splice(temp_index, 1);
					}
					obj.applyFilters();
				}
			}
		});
		this.canvas.requestRenderAll();
		console.log('fill 17');
	}
	zoomCanvas() {
		console.log('zoom canvas');
		var target = document.querySelector('#collage-designer .canvas-wrap');
		target.style['scale'] = this.meta_data.canvas_zoom;
		let editor_bounding_box = document.querySelector('#collage-designer .editor').getBoundingClientRect();
		let canvas_bounding_box = document.querySelector('#collage-designer .editor .canvas-wrap').getBoundingClientRect();
		if (canvas_bounding_box.width > editor_bounding_box.width) {
			document.querySelector('#collage-designer .editor').scrollLeft = (canvas_bounding_box.width - editor_bounding_box.width) / 2;
		}

		var x = (editor_bounding_box.width / 2) - (canvas_bounding_box.width / 2);
		var y = (editor_bounding_box.height / 2) - (canvas_bounding_box.height / 2);
		if (canvas_bounding_box.width > editor_bounding_box.width) {
			x = 0;
		}
		if (canvas_bounding_box.height > editor_bounding_box.height) {
			y = 0;
		}
		target.style['left'] = x+'px';
		target.style['top'] = y+'px';

		if (document.querySelector('#collage-designer .slot-options') != null) {
			this.refreshSlotPositions();
		}
		if (document.querySelector('#collage-designer .text-tools') != null) {
			this.refreshUserTextOptionsPosition();
		}
	}
	fitImageInSlot(image, slot, mode = 'default') {
		var new_w = image.width;
		var new_h = image.height;
		if (image.angle == 90 || image.angle == 270) {
			new_w = image.height;
			new_h = image.width;
		}
		var temp_img_ratio = new_w / new_h;
		var clip_path_ratio = slot.width / slot.height;
		
		var slot_w = slot.width;
		var slot_h = slot.height;
		if (mode == 'rotate') {
			slot_w *= slot.zoomX;
			slot_h *= slot.zoomY;
		}
		if (slot.scaleX != null) {
			slot_w *= slot.scaleX;
			slot_h *= slot.scaleY;
		}
		
				
		if (clip_path_ratio > temp_img_ratio) {
			var slot_orientation = 'L';
			image.scaleToWidth(1);
			image.scaleToWidth(slot_w);
		} else {
			var slot_orientation = 'P';
			image.scaleToHeight(1);
			image.scaleToHeight(slot_h);
		}		
		image.set({
			left: slot.left + ((new_w * image.scaleX) / 2),
			top: slot.top + ((new_h * image.scaleY) / 2),
		});

		if (mode == 'default') {
			image.meta['initial_zoom_x'] = image.scaleX;
			image.meta['initial_zoom_y'] = image.scaleY;
		}
		image.meta.orientation = slot_orientation;
		image.setCoords();

		/*
		image.setOptions({
			lockMovementY: false,
			lockMovementX: false
		});
		if (slot_orientation == 'L') {
			slot.setOptions({
				lockMovementY: false,
				lockMovementX: true
			});
		} else {
			slot.setOptions({
				lockMovementY: true,
				lockMovementX: false
			});
		}
		*/
	}
	toggleBorderSlot(slot, remove = false) {
		const border_obj = this.findCanvasObject({type:'border'});
		if (remove) {
			console.log('border obj', border_obj);
			if(border_obj instanceof fabric.Object) {
				this.canvas.remove(border_obj);
			} else if (Array.isArray(border_obj)) {
				border_obj.forEach((temp_border_obj) => {
					this.canvas.remove(temp_border_obj);
				});
			}
		} else {
			let border_size = 6;
			let border = new fabric.Rect({
				left: slot.left - (border_size / 2),
				top: slot.top - (border_size / 2),
				fill: 'transparent',
				stroke: "#82b338",
				strokeWidth: border_size,
				width: slot.width + (border_size/2) - 2,
				height: slot.height + (border_size/2) - 2,
				absolutePositioned: true,
				selectable: false,
				scalable: false,
				controls: false,
				evented: false,
				lockMovementX: true,
				lockMovementY: true,
				meta: {
					type: 'border',
					slot_id: slot.meta.slot_id,
				}
			});
			this.canvas.add(border);
			//this.canvas.bringObjectToFront(border);
			border.set({
				selectable: false,
				scalable: false,
				controls: false,
				evented: false,
				lockMovementX: true,
				lockMovementY: true,
			});
		}
		this.canvas.requestRenderAll();
	}
	handleCanvasObjectMoving(e) {
		var obj = e.target;
		if (obj.meta.type !== 'slot-image') {
			console.log('return false', obj.meta.type);
			return false;
		}
		console.log('geht weiter', obj.meta.type);
		var temp_w = obj.width * obj.scaleX;
		var temp_h = obj.height * obj.scaleY;
		if (obj.angle == 90 || obj.angle == 270) {
			temp_w = obj.height * obj.scaleY;
			temp_h = obj.width * obj.scaleX;
		}
		var min_x = obj.clipPath.left;
		var max_x = obj.clipPath.width - temp_w + obj.clipPath.left;
		var min_y = obj.clipPath.top;
		var max_y = obj.clipPath.height - temp_h + obj.clipPath.top;
		min_x = min_x + (temp_w / 2);
		max_x = max_x + (temp_w / 2);
		min_y = min_y + (temp_h / 2);
		max_y = max_y + (temp_h / 2);

		if (obj.left > min_x) {
			obj.set({
				left: min_x,
			})
		}
		if (obj.left < max_x) {
			obj.set({
				left: max_x,
			})
		}
		if (obj.top > min_y) {
			obj.set({
				top: min_y,
			})
		}
		if (obj.top < max_y) {
			obj.set({
				top: max_y,
			})
		}
		obj.setCoords();
		console.log(obj);
	}
	dev_orientation() {
		var obj = this.canvas.getObjects()[3];
		var centerPoint = obj.translateToOriginPoint(obj.getCenterPoint(), 'left', 'top');
		console.log(centerPoint);
		return;
		obj.set({
			originX: 'left',
			originY: 'top',
		})
		obj.setCoords();
		obj.set({
			left: obj.clipPath.left,
			top: obj.clipPath.top,
		});
		obj.setCoords();
		obj.set({
			originX: 'center',
			originY: 'center',
		});
		obj.setCoords();
		this.canvas.requestRenderAll();
	}
	findCanvasObject(params, callback) {
		var check = Object.keys(params).length;
		var result = [];
		Array.from(this.canvas.getObjects()).forEach((val) => {
			if (typeof val.meta !== 'undefined') {
				var counter = 0;
				for (const key in params) {
					if (val.meta[key] == params[key]) {
						counter++;
					}
				}
				if (counter == check) {
					result.push(val);
				}
			}
		});
		return result;
		/*
		if (result.length == 1) {
			result = result[0];
		}
		callback(result);
		*/
	}
	async duplicateObject(object) {
    const objectData = object.toObject();
    const clonedObjects = await fabric.util.enlivenObjectsAsync([objectData]);
    const clonedObject = clonedObjects[0];
		return clonedObject;
}
	initLocalDB() {
		this.db = new Dexie('collage');
		this.db.version(1).stores({
			uploads: '++id',
			bg_uploads: '++id',
			canvas: '++id',
		});
	}
	initSessid() {
		if (window.localStorage.getItem('sess_id') !== null) {
			this.sess_id = window.localStorage.getItem('sess_id');
		} else {
			const userAgent = navigator.userAgent;
			const language = navigator.language || navigator.userLanguage;
			const currentTimestamp = new Date().toISOString();
			const rand = Math.floor(Math.random() * (99999 - 1) ) + 1;
			const stringToHash = `${userAgent}-${language}-${currentTimestamp}-${rand}`;

			var result = sha256(stringToHash).then(hash => {
				this.sess_id = hash;
				window.localStorage.setItem('sess_id', hash);
			}).catch(error => {
				console.error('Fehler beim Generieren des Hashes:', error);
				return null;
			});			

			function sha256(message) {
				const msgUint8 = new TextEncoder().encode(message);
				return crypto.subtle.digest('SHA-256', msgUint8).then(hashBuffer => {
					const hashArray = Array.from(new Uint8Array(hashBuffer));
					const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
					return hashHex;
				});
			}
		}
	}
	copyCode() {
		var text = document.querySelector('.save-wrap tab-system').el_content.querySelector('form[name="link-code"] input').getAttribute('value');
		navigator.clipboard.writeText(text).then(() => {
			//this.triggerInfo('<p style="text-align: center">Link copied</p>');
			xxlPopup.close();
			this.triggerToast('Link copied');
		},() => {
			this.triggerToast('Link could not be copied');
		});
	}
	triggerWarning(content, callback = null) {
		xxlPopup.create({
			data: {
				html:content,
				class: 'collage-designer-theme-1 warning'
			},
			ready: () => {
				if (callback != null) {
					callback();
				}
			}
		});
	}
	triggerInfo(content, callback = null) {
		xxlPopup.create({
			data: {
				html:content,
				class: 'collage-designer-theme-1 info'
			},
		});
	}
	triggerToast(message) {
		const existingToast = document.getElementById('toast');
		if (existingToast) {
			existingToast.remove();
		}
		const toast = document.createElement('div');
		toast.id = 'toast';
		toast.classList.add('toast');
		toast.innerText = message;
	
		document.body.appendChild(toast);
		setTimeout(() => {
			toast.classList.add('active');
		}, 100);
		toast.onclick = () => {
			removeToast(toast);
		};
		setTimeout(() => {
			removeToast(toast);
		}, 3000);

		function removeToast(toast) {
			toast.classList.remove('active');
			setTimeout(() => {
				toast.remove();
			}, 500);
		}
	}
	doConfetti(el = null) {
		var x = 0.5;
		var y = 0.5;
		if (el != null) {
			let position = el.getBoundingClientRect();
			x = (position.left + position.width / 2) / window.innerWidth;
			y = (position.top + position.height / 2) / window.innerHeight;
		}
		confetti({
			particleCount: 80,
			spread: 360,
			startVelocity: 15,
			gravity: 0.7,
			useWorker: true,
			ticks: 50,
			zIndex: 101,
			shapes: ['circle'],
			origin: {
				x: x,
				y: y
			}
		});
	}
	test() {
		console.log('test is getriggert');
	}
	checkMobile(e) {
		if (e.matches) {
			this.is_mobile = 1;
		} else {
			this.is_mobile = 0;
		}
	}
	
}
