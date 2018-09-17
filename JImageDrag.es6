/**
 * Iview dragble
 *
 * @author          xiaoxin
 * @date            Created on 17-6-28.
 * @description     Applicable to image enlargement and drag operation
 */

class JImageDrag {
    constructor(options) {
        for (let key in this.constructor.prototype) {
            this[key] = this[key].bind(this);
        }

        options.viewElement = options.viewElement || [];
        options.dragElement = options.dragElement || [];
        options.globalElement = options.globalElement || '';
        options.isGlobal = options.isGlobal || false;
        options.initCallback = options.initCallback || null;
        options.onDrag = options.onDrag || null;
        options.onClick = options.onClick || null;
        options.onFinishLoad = options.onFinishLoad || null;
        options.isCallView = options.isCallView || null;
        options.recoverView = options.recoverView || null;

        if (!options.viewElement || !options.dragElement) {
            throw new Error('[SKETCHPAD]: Missing parameters (element)');
        }

        if (typeof options.viewElement === 'string' && typeof options.dragElement === 'string') {
            options.viewElement = document.querySelector(options.viewElement);
            options.dragElement = document.querySelector(options.dragElement);

            if (options.isGlobal) options.globalElement = document.querySelector(options.globalElement);
            options.dragElementSrc = options.dragElement.getAttribute('src') ? options.dragElement.getAttribute('src') : '';
        }


        // Check if the callback variable exists
        if (options.isCallView && options.recoverView) this.recoverFit = options.recoverView;
        this.viewElement = options.viewElement;
        this.dragElement = options.dragElement;
        this.globalElement = options.globalElement;
        this.dragElementSrc = options.dragElementSrc;
        this.isGlobal = options.isGlobal;
        this.width = options.width;
        this.height = options.height;

        // callback param
        this.initCallback = options.initCallback;
        this.isCallView = options.isCallView;

        // if (this.dragElementSrc === null) return;

        //default setting
        this.zoom = 'fit';
        this.zoom_base = typeof(options.zoom_base) === "undefined" ? 100 : options.zoom_base; // limit base zoom
        this.zoom_max = typeof(options.zoom_max) === "undefined" ? 100 : options.zoom_max; // limit max zoom
        this.zoom_min = typeof(options.zoom_min) === "undefined" ? 5 : options.zoom_min; // limit min zoom
        this.zoom_delta = typeof(options.zoom_delta) === "undefined" ? 1.1 : options.zoom_delta; // limit delta zoom
        this.onZoom = null;

        this.onStartDrag = null;
        this.onDrag = options.onDrag;
        this.onMouseMove = null;
        this.onClick = options.onClick;
        this.onStartLoad = null;
        // this.onFinishLoad = null;

        this.onFinishLoad = options.onFinishLoad;

        this.img_object = new Object(null); //object to show img status
        this.zoom_object = new Object(null); //object to show zoom status
        this.coords_object = new Object(null); //object to show coords status
        this.image_loaded = false;
        //drag variables
        this.dx = 0;
        this.dy = 0;

        this.isDrag = typeof(options.isDrag) === 'undefined' ? true : options.isDrag;
        this.dragged = false;
        this.current_zoom = this.zoom;

        // touch param
        this.pos = {
            start: null,
            move: null,
            end: null
        };

        this._hasTouch = ('ontouchstart' in window);
        this.scale_last_rate = 1;

        this.img_object.x = 0;
        this.img_object.y = 0;
        this.new_zoom = 0;
        this.isZoom = typeof(options.isZoom) === 'undefined' ? true : options.isZoom;

        //init container
        this.update_container_info(this.viewElement);

        switch (this.dragElement['nodeName']) {
            case 'IMG':
                this.updata_drag_info(this.dragElement);
                this.loadImage(this.dragElementSrc);
                break;
            case 'CANVAS':
                this.orignWidth = options.orignWidth;
                this.orignHeight = options.orignHeight;
                this.updata_drag_info(this.dragElement);
                this.loadCanvas();
        }
    }

    /**
     * SET ZOOM
     * @param delta
     * @param e
     */
    zoom_by(delta) {
        let closest_rate = this.find_closest_zoom_rate(this.current_zoom);
        let next_rate = closest_rate + delta;
        let next_zoom = this.zoom_base * Math.pow(this.zoom_delta, next_rate);
        if (delta > 0 && next_zoom < this.current_zoom) next_zoom *= this.zoom_delta;
        if (delta < 0 && next_zoom > this.current_zoom) next_zoom /= this.zoom_delta;
        this.set_zoom(next_zoom);
    }

    /**
     * FIND CLOSEST ZOOM RATE
     * @param value
     * @returns {*}
     */
    find_closest_zoom_rate(value) {
        if (value === this.zoom_base) return false;

        function div(val1, val2) {
            return val1 / val2
        }

        function mul(val1, val2) {
            return val1 * val2
        }

        let func = (value > this.zoom_base) ? mul : div;
        let sgn = (value > this.zoom_base) ? 1 : -1;
        let mltplr = this.zoom_delta;
        let rate = 1;

        while (Math.abs(func(this.zoom_base, Math.pow(mltplr, rate)) - value) >
        Math.abs(func(this.zoom_base, Math.pow(mltplr, rate + 1)) - value)) {
            rate++;
        }
        return sgn * rate;
    }

    /**
     * MOUSE CLICK
     * @param e
     */
    click(e) {
        this.onClick &&
        this.onClick.call(this, this.getMouseCoords(e));
    }

    /**
     * MOUSE DRAG START
     * @param e
     * @returns {boolean}
     */
    drag_start(e) {
        if (e.which === 1) {
            // console.log(this._cursorPosition(e));

            if (this.isDrag) {
                /* start drag event*/
                if (this.isGlobal) this.globalElement.addEventListener('mousemove', this.drag)
                else this.img_object.object.addEventListener('mousemove', this.drag)

                if (this.onStartDrag && this.onStartDrag.call(this, this.getMouseCoords(e)) === false) return false;
                this.dragged = true;
                this.dx = e.pageX - this.img_object.x;
                this.dy = e.pageY - this.img_object.y;
                return false;
            }
        }
    }

    _cursorPosition(event) {
        let _this;
        _this = this;
        let zoom = this.coords_object.zoom / 100;
        return {
            x: (event.pageX - _this.offset(this.img_object.object).left) / zoom,
            y: (event.pageY - _this.offset(this.img_object.object).top) / zoom
        }
    }

    offset(curEle) {
        let totalLeft = null, totalTop = null, par = curEle.offsetParent;
        totalLeft += curEle.offsetLeft;
        totalTop += curEle.offsetTop;
        while (par) {
            if (navigator.userAgent.indexOf("MSIE 8.0") === -1) {
                totalLeft += par.clientLeft;
                totalTop += par.clientTop;
            }
            totalLeft += par.offsetLeft;
            totalTop += par.offsetTop;
            par = par.offsetParent;
        }
        return {
            left: totalLeft,
            top: totalTop
        }
    }

    /**
     * MOUSE_DRAG MOVE
     * @param e
     * @returns {boolean}
     */
    drag(e) {
        this.pauseEvent(e);
        this.onMouseMove && this.onMouseMove.call(this, this.getMouseCoords(e));
        if (this.dragged) {
            this.onDrag &&
            this.onDrag.call(this, this.getMouseCoords(e));

            let ltop = e.pageY - this.dy;
            let lleft = e.pageX - this.dx;
            let id = e.target.id;

            if ((ltop + this.img_object.display_height) < this.height) ltop = this.height - this.img_object.display_height;
            if ((lleft + this.img_object.display_width) < this.width) lleft = this.width - this.img_object.display_width;
            this.setCoords(lleft, ltop, id);
            return false;
        }


    }

    /**
     * MOUSE DRAG END
     * @param e
     * @returns {boolean}
     */
    drag_end(e) {
        if (this.isGlobal) this.globalElement.removeEventListener('mousemove', this.drag);
        else this.img_object.object.removeEventListener('mousemove', this.drag);
        this.dragged = false;
        return false;
    }

    /**
     * MOUSE WHEEL EVT
     * @param event
     */
    mouse_wheel(event) {
        let delta = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
        let zoom = (delta > 0) ? 1 : -1;
        if (this.isZoom) this.zoom_by(zoom);
    }

    /**
     * Get the location information for the event
     * @param e
     * @returns array [{x:int,y:int}]
     */
    getPosOfEvent(e) {
        // Multi-finger touch, return multiple gesture location information
        // if (this._hasTouch) {
        let posi, src;
        posi = [];
        src = null;

        for (let t = 0, len = e.touches.length; t < len; t++) {
            src = e.touches[t];
            posi.push({
                x: src.pageX,
                y: src.pageY
            });
        }
        return posi;
        // }
    }

    /**
     * Get the distance between two points
     * @param pos1
     * @param pos2
     * @returns {number}
     */
    getDistance(pos1, pos2) {
        let x = pos2.x - pos1.x,
            y = pos2.y - pos1.y;
        return Math.sqrt((x * x) + (y * y));
    }

    /**
     * Calculate the scaling ratio
     * @param pstart
     * @param pmove
     * @returns {number}
     */
    calScale(pstart, pmove) {
        if (pstart.length >= 2 && pmove.length >= 2) {
            let disStart = this.getDistance(pstart[1], pstart[0]);
            let disEnd = this.getDistance(pmove[1], pmove[0]);

            return disEnd / disStart;
        }
        return 1;
    }

    /**
     * Touch DRAG START
     * @param e
     * @returns {boolean}
     */
    touch_start(e) {
        if (!this.pos.start || this.pos.start.length < 2) {
            this.pos.start = this.getPosOfEvent(e);
            console.log(this.pos.start)
        }


        if (this.isGlobal) this.globalElement.addEventListener('touchmove', this.touch_move, false)
        else this.img_object.object.addEventListener('touchmove', this.touch_move, false)

        /* start drag event*/
        if (this.isDrag) {
            if (this.onStartDrag && this.onStartDrag.call(this, this.getMouseCoords(e.changedTouches[0])) === false) return false;
            this.dragged = true;
            this.dx = e.changedTouches[0].pageX - this.img_object.x;
            this.dy = e.changedTouches[0].pageY - this.img_object.y;
            return false;
        }
    }

    /**
     * Touch_DRAG MOVE
     * @param e
     * @returns {boolean}
     */
    touch_move(e) {
        let _this = this;
        e.preventDefault();
        _this.pos.move = _this.getPosOfEvent(e);
        let touch1 = e.targetTouches[0],  // The first finger touch event
            touch2 = e.targetTouches[1],  // The Second finger touch event
            fingers = e.touches.length;   // Number of fingers on the screen

        if (fingers == 2) {

            if (_this.isZoom) {
                let scale = _this.calScale(_this.pos.start, _this.pos.move);
                let scale_diff = 0.00000000001; //To prevent touchend's scale is equal to scale_last_rate and does not trigger
                if (scale > _this.scale_last_rate) {
                    //Gesture zoom
                    _this.zoom_by(1);
                    _this.scale_last_rate = scale - scale_diff;
                } else if (scale < _this.scale_last_rate) {
                    //Gestures narrow
                    _this.zoom_by(-1);
                    _this.scale_last_rate = scale + scale_diff;
                }
            }
        } else {
            this.onMouseMove && this.onMouseMove.call(this, this.getMouseCoords(e.changedTouches[0]));
            if (this.dragged) {
                this.onDrag &&
                this.onDrag.call(this, this.getMouseCoords(e.changedTouches[0]));
                let ltop = e.changedTouches[0].pageY - this.dy;
                let lleft = e.changedTouches[0].pageX - this.dx;
                let id = e.changedTouches[0].target.id;

                if ((ltop + this.img_object.display_height) < this.height) ltop = this.height - this.img_object.display_height;
                if ((lleft + this.img_object.display_width) < this.width) lleft = this.width - this.img_object.display_width;
                this.setCoords(lleft, ltop, id);
                return false;
            }
        }
    }

    /**
     * Touch DRAG END
     * @param e
     * @returns {boolean}
     */
    touch_end(e) {
        if (this.isGlobal) this.globalElement.removeEventListener('touchmove', this.touch_move, false);
        else this.img_object.object.removeEventListener('touchmove', this.touch_move, false);
        this.dragged = false;
        return false;
    }

    /**
     * GET THE MOUSE COORDINATES
     * @param e
     * @returns {{x: *, y: *}}
     */
    getMouseCoords(e) {
        return {
            x: this.descaleValue(e.pageX - this.img_object.object.offsetLeft, this.current_zoom),
            y: this.descaleValue(e.pageY - this.img_object.object.offsetTop, this.current_zoom)
        };
    }

    /**
     * SET SCALE VALUE
     * @param value
     * @param toZoom
     * @returns {number}
     */
    scaleValue(value, toZoom) {
        return value * toZoom / 100;
    }

    /**
     * SET DESCALE VALUE
     * @param value
     * @param fromZoom
     * @returns {number}
     */
    descaleValue(value, fromZoom) {
        return value * 100 / fromZoom;
    }

    /**
     * LOAD THE IMAGE
     * @param src
     */
    loadImage(src) {
        this.current_zoom = this.zoom;
        this.image_loaded = false;
        let _this = this;

        if (this.onStartLoad) this.onStartLoad.call(this);
        $(this.img_object.object).unbind('load').removeAttr("src").removeAttr("width").removeAttr("height").css({
            top: 0,
            left: 0
        }).load(function () {
            _this.image_loaded = true;
            let img = _this.getImgNaturalDimensions(this);
            _this.img_object.display_width = img.width;
            _this.img_object.orig_width = img.width;
            _this.img_object.display_height = img.height;
            _this.img_object.orig_height = img.height;
            _this.zoom === "fit" ? _this.fit() : _this.set_zoom(_this.zoom);
            if (_this.onFinishLoad) _this.onFinishLoad.call(_this, true);
            //src attribute is after setting load event, or it won't work
        }).attr("src", src);
    }

    loadCanvas() {
        let _this = this;
        this.current_zoom = this.zoom;
        _this.image_loaded = true;
        _this.img_object.display_width = this.orignWidth;
        _this.img_object.orig_width = this.orignWidth;
        _this.img_object.display_height = this.orignHeight;
        _this.img_object.orig_height = this.orignHeight;
        _this.zoom === "fit" ? _this.fit() : _this.set_zoom(_this.zoom);
    }

    /**
     * SET THE APPROPRIATE VALUE
     * @parm new_zoom
     */
    fit() {
        let aspect_ratio = this.img_object.orig_width / this.img_object.orig_height;
        let window_ratio = this.width / this.height;
        let choose_left = (aspect_ratio > window_ratio);

        if (choose_left) this.new_zoom = this.width / this.img_object.orig_width * 100;
        else this.new_zoom = this.height / this.img_object.orig_height * 100;

        if (this.isCallView && this.recoverFit) {
            if (typeof this.recoverFit.new_x !== 'undefined' && typeof this.recoverFit.new_y !== 'undefined' && typeof this.recoverFit.zoom !== 'undefined') {
                this.set_zoom(this.recoverFit.zoom);


                let zoom = this.coords_object.zoom / 100;
                let containerWidth = this.width;
                let containerHeight = this.height;

                let x = (this.recoverFit.new_x * zoom - containerWidth / 2);
                let y = (this.recoverFit.new_y * zoom - containerHeight / 2);

                this.setCoords(-x, -y);

                // this.setCoords(this.recoverFit.new_x, this.recoverFit.new_y);
            } else {
                this.set_zoom(this.new_zoom);
            }
        } else {
            this.set_zoom(this.new_zoom);
        }
    }

    /**
     * SET THE SCALING VALUE
     * @param new_zoom
     */
    set_zoom(new_zoom) {
        if (this.onZoom && this.onZoom.call(this, new_zoom) === false) return;
        // do nothing while image is being loaded

        if (!this.image_loaded) return;
        if (new_zoom < this.zoom_min) new_zoom = this.zoom_min;
        else if (new_zoom >= this.zoom_max) new_zoom = this.zoom_max;

        // we fake these values to make fit zoom properly work
        let old_x, old_y;
        if (this.current_zoom === "fit") {
            old_x = Math.round(this.width / 2 + this.img_object.orig_width / 2);
            old_y = Math.round(this.height / 2 + this.img_object.orig_height / 2);
            // this.current_zoom = 100;
        } else {
            old_x = -parseInt(this.img_object.object.style.left, 10) + Math.round(this.width / 2);
            old_y = -parseInt(this.img_object.object.style.top, 10) + Math.round(this.height / 2);
        }

        let new_width = this.scaleValue(this.img_object.orig_width, new_zoom);
        let new_height = this.scaleValue(this.img_object.orig_height, new_zoom);
        let new_x = this.scaleValue(this.descaleValue(old_x, this.current_zoom), new_zoom);
        let new_y = this.scaleValue(this.descaleValue(old_y, this.current_zoom), new_zoom);

        new_x = isNaN(this.current_zoom) ? '' : this.width / 2 - new_x;
        new_y = isNaN(this.current_zoom) ? '' : this.height / 2 - new_y;

        this.img_object.object.style.width = new_width + 'px';
        this.img_object.object.style.height = new_height + 'px';

        this.img_object.display_width = new_width;
        this.img_object.display_height = new_height;

        // Set the coordinates
        this.current_zoom = new_zoom;
        this.coords_object.zoom = new_zoom;

        // if(new_zoom === this.zoom_max) return
        this.setCoords(new_x, new_y);
    }

    callFun(obj) {
        if (this.initCallback) this.initCallback.call(this, obj);
    }

    /**
     * SER COORDS
     * @param x
     * @param y
     */
    setCoords(x, y) {
        //do nothing while image is being loaded
        if (!this.image_loaded) return;

        //check new coordinates to be correct (to be in rect)
        if (y > 0) y = 0;
        if (x > 0) x = 0;
        if (this.img_object.display_width <= this.width) x = -(this.img_object.display_width - this.width) / 2;
        if (this.img_object.display_height <= this.height) y = -(this.img_object.display_height - this.height) / 2;
        this.img_object.x = x;
        this.img_object.y = y;

        let zoom = this.coords_object.zoom / 100;
        let containerWidth = this.width;
        let containerHeight = this.height;
        let getCenterX = (containerWidth / 2 + Math.abs(this.img_object.x)) / zoom;
        let getCenterY = (containerHeight / 2 + Math.abs(this.img_object.y)) / zoom;

        this.coords_object.new_x = getCenterX;
        this.coords_object.new_y = getCenterY;

        console.log('x:' + getCenterX + 'y:' + getCenterY)

        this.callFun(this.coords_object);
        this.img_object.object.style.top = y + 'px';
        this.img_object.object.style.left = x + 'px';
    }

    /**
     * Pause event
     * @param e
     * @returns {boolean}
     */
    pauseEvent(e) {
        window.e = e;
        e = e || window.event;
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }

    /**
     * UPDATE THE CONTAINER
     * @param element
     */
    update_container_info(element) {
        element.style.width = this.width + 'px';
        element.style.height = this.height + 'px';
        element.style.overflow = 'hidden';
    }

    /**
     * UPDATE MORE DRAG ELEMENT
     * @param element
     */
    updata_drag_info(element) {
        let _this = this;
        this.img_object.object = element;
        this.img_object.object.style.position = 'absolute';
        this.img_object.object.style.top = '0';
        this.img_object.object.style.left = '0';

        // bind mouse events
        const event_update = (element) => {
            // Mouse
            element.addEventListener('mousedown', this.drag_start);
            element.addEventListener('mouseout', this.drag_end);
            element.addEventListener('mouseup', this.drag_end);

            // Touch
            element.addEventListener('touchstart', this.touch_start);
            element.addEventListener('touchend', this.touch_end);
            element.addEventListener('touchcancel', this.touch_end);
            element.addEventListener('touchleave', this.touch_end);

            element.onclick = e => _this.click(e);
            // mousewheel
            _this.addMouseWheelHandler(element, this.mouse_wheel);
        };
        if (this.isGlobal) event_update(this.globalElement);
        else event_update(this.img_object.object)
    }

    /**
     * GET THE ORIGINAL WIDTH OF THE IMAGE
     * @param img
     * @param callback
     * @returns {{width: *, height: *}}
     */
    getImgNaturalDimensions(img) {
        let width, height;
        if (img.naturalWidth) {
            width = img.naturalWidth;
            height = img.naturalHeight;
        }
        return {width, height}
    }

    /**
     * TRIGGERS ADDING MOUSE WHEEL TO LISTEN TO EVENTS
     * @param ele
     * @param fn
     * @param capture
     */
    addMouseWheelHandler(ele, fn, capture) {
        return (function () {
            const tick = () => {
                if (ele.addEventListener) {
                    ele.addEventListener('mousewheel', fn, capture || false);
                    ele.addEventListener('wheel', fn, capture || false);
                    ele.addEventListener('DOMMouseScroll', fn, capture || false);
                } else {
                    ele.attachEvent('onmousewheel', fn);
                }
            }

            return tick()
        })();
    }

    /**
     * TRIGGER REMOVE THE MOUSE WHEEL TO LISTEN TO EVENTS
     * @param ele
     * @param fn
     * @param capture
     */
    removeMouseWheelHandler(ele, fn, capture) {
        return (function () {
            const tick = () => {
                if (ele.addEventListener) {
                    ele.removeEventListener('mousewheel', fn, capture || false);
                    ele.removeEventListener('wheel', fn, capture || false);
                    ele.removeEventListener('DOMMouseScroll', fn, capture || false);
                } else {
                    ele.detachEvent('onmousewheel', fn);
                }
            }

            return tick()
        })();
    }

    /**
     * TRIGGERS THE DESTRUCTION OF ALL BINDING EVENTS
     */
    destroy() {
        let _this = this;
        const triggerDerive = (ele) => {
            // mouse
            ele.removeEventListener('mousedown', this.drag_start);
            ele.removeEventListener('mousemove', this.drag);
            ele.removeEventListener('mouseout', this.drag_end);
            ele.removeEventListener('mouseup', this.drag_end);

            // touch
            ele.removeEventListener('touchstart', this.touch_start);
            ele.removeEventListener('touchend', this.touch_end);
            ele.removeEventListener('touchcancel', this.touch_end);
            ele.removeEventListener('touchleave', this.touch_end);

            // wheel
            _this.removeMouseWheelHandler(ele, this.mouse_wheel);
        }

        if (this.isGlobal) {
            this.dragElement.remove();
            triggerDerive(this.globalElement)
        }

        if (this.dragElement) {
            this.dragElement.remove();
            triggerDerive(this.dragElement)
        }
    }
}

