/* jQuery Pathslider Builder v0.9.1 alpha
 * By Rob Garrison (Mottie)
 * MIT License
 *
 * Code based on the bezier curve demo by Craig Buckler (http://twitter.com/craigbuckler)
 * http://blogs.sitepointstatic.com/examples/tech/canvas-curves/bezier-curve.html
 */
(function($){

$.pathbuilderdefaults = {
	edit : true, // allows user to move bezier curve
	snap : true,
	grid : 10,
	// default canvas styles
	// control point line (cpline) & point are used in edit mode
	style : {
		cpline : { width: 1, color: "#00c" },
		// start point
		start  : { width: 2, color: "hsl(120,100%,30%)", fill: "hsla(120,100%,30%,0.3)", radius: 10, arc1: 0, arc2: 2 * Math.PI },
		// start control point
		cstart : { width: 2, color: "hsl(120,100%,30%)", fill: "hsla(120,100%,30%,0.5)", radius: 10, arc1: 0, arc2: 2 * Math.PI },
		// end control point
		cend   : { width: 2, color: "hsl(0,100%,30%)", fill: "hsla(0,100%,30%,0.5)", radius: 10, arc1: 0, arc2: 2 * Math.PI },
		// end point
		end    : { width: 2, color: "hsl(0,100%,30%)", fill: "hsla(0,100%,30%,0.3)", radius: 10, arc1: 0, arc2: 2 * Math.PI },
		grid   : { width: 1, color: "hsla(0,0%,60%,0.5)" }
	},
	canvasImage : null // jQuery object of img that the canvas is saved into - see base.updateCanvasImage
};

$.fn.pathbuilder = function(options) {
return this.each(function(){
	// make sure pathslider is attached
	var o, base = $(this).data('pathslider');
	if (!base) { return; }

	base.builderInit = function(){
		base.options = o = $.extend(true, base.options, $.pathbuilderdefaults, options);
		base.drag = null;

		base.options.drawCanvas = function(b, ctx, points) {
			base.drawControls(ctx, points);
			// prevent redrawing the curve
			return false;
		}

		if (!base.hasCanvas) { return; } // too bad IE!

		// Add resizable corner to allow resizing of the canvas
		$('<div class="corner"></div>')
		.appendTo(base.$el)
		.mousedown(function(e) {
			$(document)
			.unbind('mousemove.pathbuilder touchmove.pathbuilder')
			.bind((base.hasTouch ? 'touchmove' : 'mousemove') + '.pathbuilder', function(e) {
				var ww = $(window).width(),
					wh = $(window).height(),
					l = base.$canvas.offset().left,
					t = base.$canvas.offset().top,
					w = (e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX) - l,
					h = (e.originalEvent.touches ? e.originalEvent.touches[0].pageY : e.pageY) - t;
				w = (w < 100) ? 100 : w > ww-l ? ww-l : w;
				h = (h < 100) ? 100 : h > wh-t ? wh-t : h; // min w & h
				base.$canvas.attr({ width : w, height: h });
				base.$el.css({ width : w, height: h });
				base.sliderDim = [ base.$el.position().left, base.$el.position().top, w, h ];
				// Add bezier curve & controls
				base.drawCurve();
			})
			.bind((base.hasTouch ? 'touchend' : 'mouseup') + '.pathbuilder', function(){
				$(document).unbind('mousemove.pathbuilder touchmove.pathbuilder');
			});
		});

		base.updateBuilder(true);
		base.builderInitialized = true; // initialization flag
		base.$el.trigger('update.pathslider', [base] );

	};

	base.updateBuilder = function(internal) {
		// make sure all of the points are numerical
		base.points = o.points = $.map(o.points, function(v,i){
			return parseInt(v*100,10)/100;
		});
		// convert control point offsets to x/y positions
		base.pointsxy = base.convert2xy( (base.builderInitialized) ? base.points : base.shift(25,100) );
		base.update();
		base.setSlider(base.percent, null, true);
		if (o.edit) {
			base.$canvas
				.unbind('.pathbuilder')
				.bind((base.hasTouch ? 'touchstart' : 'mousedown') + '.pathbuilder', function(e){ base.dragStart(e); })
				.bind((base.hasTouch ? 'touchmove' : 'mousemove') + '.pathbuilder', function(e){ base.dragging(e); })
				.bind((base.hasTouch ? 'touchend.pathbuilder touchcancel' : 'mouseup.pathbuilder mouseleave') + '.pathbuilder', function(e){ base.dragEnd(e); });
		}
		if (!internal) {
			base.$el.trigger('update.pathslider', [base]);
		}
	};

	// Make purdy stuff
	base.drawControls = function(c, b) {
		var i, j, x, y, t, p, s = o.style,
		// c = base.ctx, b = base.pointsxy,
		w = base.sliderDim[2], h = base.sliderDim[3];
		base.points = base.convert();
		clearTimeout(base.timer);
		c.clearRect(0, 0, w, h);

		// finish drawing curve - don't let drawCanvas do this because
		// we're changing the colors for the control handles
		c.beginPath();
		c.moveTo(b[0], b[1]);
		c.bezierCurveTo(b[2], b[3], b[4], b[5], b[6], b[7]);
		c.stroke();

		// Edit mode = add grid, control points/lines
		if (o.edit) {
			// make grid
			if (o.grid >= 2) {
				c.prop({
					lineWidth   : s.grid.width,
					strokeStyle : s.grid.color
				})
				.beginPath();
				for (x = o.grid; x < w; x += o.grid) {
					c.moveTo(x, 0).lineTo(x, h);
				}
				for (y = o.grid; y < h; y += o.grid) {
					c.moveTo(0, y).lineTo(w, y);
				}
				c.stroke();
			}

			j = 0;
			base.controls = b;
			base.controlNames = ['start', 'cstart', 'cend', 'end'];

			// Add control lines
			c.prop({
				lineWidth   : s.cpline.width,
				strokeStyle : s.cpline.color
			})
			.beginPath()
			.moveTo(b[0], b[1])
			.lineTo(b[2], b[3])
			.moveTo(b[6], b[7])
			.lineTo(b[4], b[5])
			.stroke();
			// Add control points
			for (i=0; i < 8; i++) {
				c.prop({
					lineWidth   : s[base.controlNames[j]].width,
					strokeStyle : s[base.controlNames[j]].color,
					fillStyle   : s[base.controlNames[j]].fill
				})
				.beginPath()
				.arc(
					b[i++],
					b[i],
					s[base.controlNames[j]].radius,
					s[base.controlNames[j]].arc1,
					s[base.controlNames[j]].arc2,
					true
				)
				.fill()
				.stroke();
				j += i%2;
			}
		}

		// thottle resizing window
		base.timer = setTimeout(function(){
			base.makeArray();
			base.setSlider(base.percent, null, true);
		}, 100);

	};

	base.updateCanvasImage = function(){
		if (o.canvasImage.length) {
			clearTimeout(base.timer);
			base.ctx.clearRect(0, 0, base.sliderDim[2], base.sliderDim[3]);
			base.drawCurve();
			o.canvasImage.attr('src', base.canvas.toDataURL());
			base.updateBuilder();
		}
	};

	// start dragging points on canvas
	base.dragStart = function(event){
		if (!o.edit) { return; }
		var e = base.mousePos(event),
			l = base.controls.length,
			i, j = 0, r, dx, dy;
		for (i=0; i < l; i++) {
			dx = base.controls[i++] - e[0];
			dy = base.controls[i] - e[1];
			r = o.style[base.controlNames[j]].radius + o.grid/2;
			if ((dx * dx) + (dy * dy) < r * r) {
				base.drag = i-1;
				base.dPoint = e;
				base.$canvas.addClass('moving');
				return;
			}
			j += i%2;
		}
	};

	// dragging points on canvas
	base.dragging = function(event){
		if (o.edit && base.drag !== null) {
			var i, g = o.grid || 1,
				e = base.mousePos(event),
				c = base.controls,
				l = c.length,
				x = e[0] - base.dPoint[0],
				y = e[1] - base.dPoint[1];
			// Move whole thing
			if (event.shiftKey) {
			if (x > o.grid || y > o.grid) { base.dPoint = e; }
				for (i=0; i < l; i++) {
					// *** SHIFT-snap to grid needs improvement ***
					c[i] = (o.snap) ? Math.round((c[i] + x)/g)*g : c[i] + x;
					c[++i] = (o.snap) ? Math.round((c[i] + y)/g)*g : c[i] + y;
				}
				base.dPoint = e;
			} else {
				// only move the one point
				c[base.drag] = (o.snap) ? Math.round((base.dPoint[0] + x)/g)*g : base.dPoint[0] + x;
				c[base.drag+1] = (o.snap) ? Math.round((base.dPoint[1] + y)/g)*g : base.dPoint[1] + y;
			}
			// Add bezier curve & controls
			base.drawCurve();

			base.$el.trigger('update.pathslider', [base]);
		}
	};

	// end dragging
	base.dragEnd = function(e){
		if (o.edit && base.drag !== null) {
			base.drag = null;
			base.$canvas.removeClass('moving');
			o.points = base.points;
			base.updateBuilder(true);
		}
	};

	base.crop = function(){
		o.points = base.points;
		base.updateBuilder(true);
		// include curve width when cropping
		var w = o.curve.width * 2;
		return [
			Math.min.apply(this,base.arrayX) - w, // min X
			Math.min.apply(this,base.arrayY) - w, // min Y
			Math.max.apply(this,base.arrayX) + w, // max X
			Math.max.apply(this,base.arrayY) + w  // max Y
		];
	};

	// base.pointsxy = [ sx,sy,  csx,csy,   cex,cey,  ex,ey ] to
	// base.points   = [ sx,sy, csxo,csyo, cexo,ceyo, ex,ey ]
	base.convert = function(p){
		p = p || base.pointsxy;
		return [
			p[0], p[1], // start x,y
			p[2] - p[0], p[3] - p[1], // start control x,y
			p[4] - p[6], p[5] - p[7], // end control x,y
			p[6], p[7] // end x,y
		];
	};

	// shift all points so coords based from origin
	// example: base.shift(-10, +10);
	base.shift = function(x,y){
		// b = [ sx,sy, csx,csy, cex,cey, ex,ey ]
		var b = base.points;
		return [
			Math.round(b[0]+x), Math.round(b[1]+y),
			b[2], b[3],
			b[4], b[5],
			Math.round(b[6]+x), Math.round(b[7]+y)
		];
	};

	base.getCode = function(){
		var dim = base.crop(),
		points = base.shift(-dim[0],-dim[1]),
		txt = '<style>\n' +
			'#slider {\n' +
			'  background : url();\n' +
			'  width      : ' + (dim[2] - dim[0]) + 'px;\n' +
			'  height     : ' + (dim[3] - dim[1]) + 'px;\n' +
			'}\n' +
			'</style>\n' +
			'<script>\n' +
			'jQuery(function($){\n' +
			'  $("#' + base.el.id + '").pathslider({\n'+
			(o.gripClass !== '' ? '    gripClass  : "' + o.gripClass + '",\n' : '' ) +
			'    points     : [ ' + points.toString() + ' ],\n' +
			'    value      : ' + base.percent + ',\n' +
			'    rotateGrip : ' + o.rotateGrip + ',\n' +
			'    tolerance  : ' + o.tolerance + ',\n' +
			'    range      : ' + o.range + ',\n' +
			'    curve      : { width:' + o.curve.width + ', color:' +
				($.isArray(o.curve.color) ? '["' + o.curve.color.join('","') + '"]' : '"' + o.curve.color + '"') +
				', cap:"' + o.curve.cap + '" }\n' +
			'  });\n' +
			'});\n' +
			'</script>';
		return txt;
	};

	// Run initializer
	base.builderInit();

});
};

})(jQuery);

/**
 * Chainvas: Make APIs chainable
 * @author Lea Verou
 * MIT license http://www.opensource.org/licenses/mit-license.php
 */
(function(){var e=window.Chainvas={chainable:function(a){return function(){var b=a.apply(this,arguments);return b===void 0?this:b}},chainablizeOne:function(a,b){try{e.utils.hasOwnProperty(a,b)&&e.utils.isFunction(a[b])&&(a[b]=e.chainable(a[b]))}catch(c){}return this},chainablize:function(a,b){var c=a.prototype;if(b)for(var d=b.length;d--;)e.chainablizeOne(c,b[d]);else for(d in c)e.chainablizeOne(c,d);return this},helpers:function(a,b){var c=a.prototype,d;for(d in e.methods)c&&!(d in c)&&(c[d]=e.methods[d]);
e.extend(c,b);return this},extend:function(a,b){return Chainvas.methods.prop.call(a,b)},global:function(a,b,c){typeof a==="string"&&(a=[a]);for(var d=a.length;d--;){var f=window[a[d]];f&&e.chainablize(f,c).helpers(f,b)}},methods:{prop:function(){if(arguments.length===1){var a=arguments[0],b;for(b in a)this[b]=a[b]}else arguments.length===2&&(this[arguments[0]]=arguments[1]);return this}},utils:{isFunction:function(a){var b=Object.prototype.toString.call(a);return b==="[object Function]"||b==="[object Object]"&&
"call"in a&&"apply"in a&&/^\s*\bfunction\s+\w+\([\w,]*\) \{/.test(a+"")},hasOwnProperty:function(a,b){try{return a.hasOwnProperty(b)}catch(c){return b in a&&(!a.prototype||!(b in a.prototype)||a.prototype[b]!==a[b])}}}}})();

/**
 * Chainvas module: Canvas
 */
Chainvas.global("CanvasRenderingContext2D",{circle:function(a,b,d){return this.beginPath().arc(a,b,d,0,2*Math.PI,!1).closePath()},roundRect:function(a,b,d,e,c){return this.beginPath().moveTo(a+c,b).lineTo(a+d-c,b).quadraticCurveTo(a+d,b,a+d,b+c).lineTo(a+d,b+e-c).quadraticCurveTo(a+d,b+e,a+d-c,b+e).lineTo(a+c,b+e).quadraticCurveTo(a,b+e,a,b+e-c).lineTo(a,b+c).quadraticCurveTo(a,b,a+c,b).closePath()}});
