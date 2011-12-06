﻿/*
 * jQuery Pathslider v0.9 alpha
 *
 * By Rob Garrison (aka Mottie & Fudgey)
 * Licensed under the MIT License
 *
 */

(function($){
$.pathslider = function(el, options){

	// To avoid scope issues, use 'base' instead of 'this'
	// to reference this class from internal events and functions.
	var base = this, o;

	// Access to jQuery and DOM versions of element
	base.$el = $(el).addClass('pathslider');
	base.el = el;

	// Add a reverse reference to the DOM object
	base.$el.data("pathslider", base);

	base.init = function(){
		var t;
		base.options = o = $.extend(true, {}, $.pathslider.defaults, options);

		// Is there a canvas?
		t = document.createElement('canvas');
		base.hasCanvas = !!(t.getContext && t.getContext('2d'));

		// add grip
		base.$grip = $('<div></div>').appendTo(base.$el);

		// store array of x & y positions for cross reference
		base.points = o.points;
		base.pointsxy = base.convert2xy();
		base.arrayX = [];
		base.arrayY = [];
		base.arrayP = [];

		base.rad2deg = 180 / Math.PI; // convert radians to degrees (multiply radian by this value)
		base.sliding = false; // flag for dragging element
		base.lastPercent = base.percent = o.value;

		// Callbacks
		// slide triggered on EVERY mouse move; change triggered on slide stop
		$.each('create update start slide change stop'.split(' '), function(i,f){
			if ($.isFunction(o[f])){
				base.$el.bind(f + '.pathslider', o[f]);
			}
		});

		$(document)
			.bind('mouseup.pathslider mouseleave.pathslider', function(e){
				if (base.sliding) { // && ($(e.target).closest('.pathslider').length || e.type === 'mouseleave')) {
					base.$el.trigger('stop.pathslider', [base]);
					if (base.lastPercent !== base.percent) {
						base.lastPercent = base.percent;
						base.$el.trigger('change.pathslider', [base]);
					}
				}
				base.$grip.removeClass('sliding');
				base.sliding = false;
			})
			.bind('mousemove.pathslider', function(e){
				if (base.sliding) {
					base.setSlider( base.findPos(e), null, true );
				}
			});

		$(window)
			.bind('resize.pathslider', function(){
				base.update();
			})
			.load(function(){
				// needed because loading images/fonts will shift the page
				base.sliderDim[0] = base.$el.offset().left;
				base.sliderDim[1] = base.$el.offset().top;
			});

		base.$grip
			.bind('mousedown.pathslider', function(e){
				base.sliding = true;
				$(this).addClass('sliding');
				base.$el.trigger('start.pathslider', [base]);
				return false;
			})
			.bind('click', function(){
				return false;
			});

		base.update();
		base.$el.trigger('create.pathslider', [base]);

	};

	base.update = function(){

		// using attr to remove other css grip classes when updating
		base.$grip.attr('class', 'pathslider-grip ' + o.gripClass);

		base.sliderDim = [
			base.$el.offset().left,
			base.$el.offset().top,
			base.$el.width(),
			base.$el.height()
		];

		base.gripCenter = [ base.$grip.width()/2, base.$grip.height()/2 ]; // for centering grip

		// number of data points to store - increase to smooth the animation (based on slider size)
		base.dataPoints = o.dataPoints;
		// in next update add min/max/step
		// base.range = o.max - o.min;
		// base.dataPoints = base.range * o.step;

		base.makeArray();
		// save the position in the array of the starting value (roughly)
		var t = $.inArray(base.percent, base.arrayP);
		base.position = (t === -1) ? Math.round(base.percent/100 * base.dataPoints) : t;

		base.setSlider(base.percent, null, true);
		if (base.hasCanvas && o.useCanvas) { base.drawCurve(); }

	};

	// set position of slider
	base.setSlider = function(percent, callback, internal) {
		if (!isNaN(percent)) {
			// find position on bezier curve; p = percent (range 0 - 100)
			// set position of slider without using the array (more precision)
			percent = parseFloat(percent, 10);
			percent = (percent > 100) ? 100 : percent < 0 ? 0 : percent;
			var css, pos = $.inArray(percent, base.arrayP),
			p = base.calcBezier(percent/100, base.pointsxy),
			pm1 = (percent - 2 > 0) ? base.calcBezier( (percent-2)/100, base.pointsxy ) : p,
			pp1 = (percent + 2 < 100) ? base.calcBezier( (percent+2)/100, base.pointsxy ) : p,
			// m = slope of tangent - used to change rotation angle of the grip
			// yes, I could have used the cubic derivative, but this is less math
			m = (pp1[0] - pm1[0] === 0) ? 90 : (pp1[1] - pm1[1])/(pp1[0] - pm1[0]);
			base.angle = parseInt(Math.atan(m) * base.rad2deg, 10);
			m = 'rotate(' + base.angle + 'deg)';
			css = (o.rotateGrip) ? {
				'-webkit-transform' : m,
				'-moz-transform'    : m,
				'-o-transform'      : m,
				'-ms-transform'     : m,
				'transform'         : m
			} : {};
			css.left = p[0] - base.gripCenter[0];
			css.top = p[1] - base.gripCenter[1];
			base.$grip
				.attr({
					'data-degrees'  : base.angle,
					'data-position' : percent
				})
				.css(css);
			// find closest percent in the array - this relies on there being a factor
			// of 100 datapoints, so it'll need changing when we have a min/max/step
			base.percent = percent; // Math.round(percent*r)/r;
			if ((percent !== base.lastPercent && !base.sliding) || !internal) {
				base.$el.trigger('change.pathslider', [base]);
			}
		}
		if (typeof callback === 'function') { callback(base); }
	};

	// relative mouse position
	base.mousePos = function(event) {
		return {
			x: event.pageX - base.sliderDim[0],
			y: event.pageY - base.sliderDim[1]
		};
	};

	// find percentage given the x,y coordinates
	// searching through a set array of points starting from the last known position
	// This allows the curve to loop over itself without mixing up intersecting points
	// The biggest issue is a very sharp turn
	base.findPos = function(event) {
		var i, j, dx, dy, px = [], py = [],
		last = base.position, //* base.dataPoints / 100,
		// check x & y cross ref based on nearby positions (+/- tolerance)
		t = parseInt(o.tolerance + 1, 10) || 2, // tolerance of 1 is too small
		r = parseInt(o.range, 10) || base.gripCenter[0], // set to 1/2 width of grip
		x = event.pageX - base.sliderDim[0],
		y = event.pageY - base.sliderDim[1];
		// save percent
		for ( i=0; i < r; i++ ){
			px = []; py = [];
			for ( j=0; j < t + 1; j++ ){
				// check positive direction
				dx = Math.abs(base.arrayX[last+j] - x) <= i;
				dy = Math.abs(base.arrayY[last+j] - y) <= i;
				if (dx && dy) { return base.returnPos(last+j); }
				if (dx) { px.push(last+j); }
				if (dy) { py.push(last+j); }
				// check in negative direction
				dx = Math.abs(base.arrayX[last-j] - x) <= i;
				dy = Math.abs(base.arrayY[last-j] - y) <= i;
				if (dx && dy) { return base.returnPos(last-j); }
				if (dx) { px.push(last-j); }
				if (dy) { py.push(last-j); }
			}
			if (px.length === 1 && py.length > 1) { return base.returnPos(px[0]); }
			if (py.length === 1 && px.length > 1) { return base.returnPos(py[0]); }
		}
		return base.returnPos(last);
	};

	// return found position & trigger slide event
	base.returnPos = function(p) {
		var t = base.position === p;
		base.percent = base.arrayP[p];
		base.position = p;
		if (!t) { base.$el.trigger('slide.pathslider', [base] ); }
		return base.percent;
	};

	// build cross-ref array - find position based on x,y coords
	base.makeArray = function(){
		var i, t, b = base.pointsxy,
		n = base.dataPoints;
		for ( i=0; i < n+1; i++ ){
			t = base.calcBezier(i/n, b);
			base.arrayX[i] = t[0];
			base.arrayY[i] = t[1];
			base.arrayP[i] = t[2];
		}
	};

	// Calculate bezier x & y based on percentage (p)
	// cubic bezier = start(p^3) + cstart(3*p^2*(1−p)) + cend(3*p*(1−p)^2) + end(1−p)^3
	// b = [ startx,starty, cstartx,cstarty, cendx,cendy, endx,endy ]
	base.calcBezier = function(p,b){
		var p2 = p*p,
			omp = (1-p), // omp = one minus p - smart naming ftw!
			omp2 = omp*omp,
			f1 = omp*omp2,
			f2 = 3*p*omp2,
			f3 = 3*p2*omp,
			f4 = p*p2;
		return [
			Math.round(b[0]*f1 + b[2]*f2 + b[4]*f3 + b[6]*f4), // bezier x
			Math.round(b[1]*f1 + b[3]*f2 + b[5]*f3 + b[7]*f4), // bezier y
			Math.round(p*1000)/10 // percentage with one decimal place
		];
	};

	// base.points = [ sx,sy, csxo,csyo, cexo,ceyo, ex,ey ]
	// sx,sy = start x & y
	// csxo,csyo = control start x & y offset from start point
	// cexo,ceyo = control end x & y offset from end point
	// ex,ey = end x & y
	// convert needed for canvas - using the offset just makes the code easier to read
	// base.pointsxy = [ sx, sy, csx, csy, cex, cey, ex, ey ]
	base.convert2xy = function(p){
		p = p || base.points;
		return [
			p[0], p[1], // start x,y
			p[0] + p[2], p[1] + p[3], // start control x,y
			p[6] + p[4], p[7] + p[5], // end control x,y
			p[6], p[7] // end x,y
		];
	};

	// Make purdy curve
	base.drawCurve = function() {
		var c, b = base.pointsxy;
		if (!base.$el.find('canvas').length) {
			$('<canvas class="pathslider-canvas"></canvas>').appendTo(base.$el);
			// size in attribute needed to keep canvas size in proportion
			base.$canvas = base.$el.find('canvas').attr({ width: base.sliderDim[2], height: base.sliderDim[3] });
			base.canvas = base.$canvas[0];
			base.ctx = base.canvas.getContext("2d");
		}
		c = base.ctx;
		c.lineCap = o.curve.cap;
		c.lineJoin = o.curve.cap;
		c.lineWidth = o.curve.width;
		c.strokeStyle = o.curve.color; // this can be a gradient or image as well... https://developer.mozilla.org/en/Canvas_tutorial/Applying_styles_and_colors
		c.beginPath();
		c.moveTo(b[0], b[1]);
		c.bezierCurveTo(b[2], b[3], b[4], b[5], b[6], b[7]);
		c.stroke();
	};

	// Run initializer
	base.init();

};

$.pathslider.defaults = {

	// Appearance
	gripClass  : '', // class added to the grip/handle
	rotateGrip : true, // when true, the grip will rotate based on the shape of the path

	// canvas curve styling
	useCanvas  : true,
	curve      : { width: 4, color: "#333", cap: "round" },

	// Usability
	// sx,sy = start x & y
	// csxo,csyo = control start x & y offset from start point
	// cexo,ceyo = control end x & y offset from end point
	// ex,ey = end x & y
	//          [ sx,sy, csxo,csyo, cexo,ceyo,  ex,ey ]
	points    : [  0,50,   50,-50,   -50,-50,  250,50 ],

	value     : 50, // starting value - range 0 - 100%
	// min       : 0,   // minimum value on the slider
	// max       : 100, // maximum value on the slider
	// step      : 1,   // step to use between min and max

	// Tweaking
	dataPoints: 100, // Total number of points of the curve to save; increase in increments of 100 to smooth out the grip movement, but not more than 500 (it slows everything down)
	tolerance : 3,   // distance on the curve from the last position to check; increase this to scroll faster
	range     : 30   // distance, in pixels, from the cursor to a matching x/y on the curve (should be about the same size as the grip)

};

$.fn.pathslider = function(options, callback){
	return this.each(function(){
		var percent, slider = $(this).data('pathslider');

		// initialize the slider but prevent multiple initializations
		if ((typeof(options)).match('object|undefined')){
			if (!slider) {
				(new $.pathslider(this, options));
			} else {
				return slider.update();
			}
		// If options is a number, set percentage
		} else if (/\d/.test(options) && !isNaN(options) && slider) {
			percent = (typeof(options) === "number") ? options : parseInt($.trim(options),10); // accepts "  2  "
			// ignore out of bound percentages
			if ( percent >= 0 && percent <= 100 ) {
				slider.setSlider(percent, callback); // set percent & callback
			}
		}
	});
};

$.fn.getpathslider = function(){
	return this.data('pathslider');
};

})(jQuery);