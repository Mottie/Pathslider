$(function(){

	var i, s, t, pathslider = $('#slider'),
	points = $('.points'),
	position = $('.position'),
	angle = $('.angle'),
	code = $('textarea.code'),
	m = $('.message'),
	presets = {
		'0' : [ 25,150,50,-50,-50,-50,275,150 ],    // arch
		'1' : [ 25,275,25,-25,-25,25,275,25 ],      // diagonal
		'2' : [ 25,275,250,0,-250,0,275,25 ],       // s-shape
		'3' : [ 100,200,200,25,-100,-275,100,275 ], // p-shape
		'4' : [ 75,200,200,-125,-200,-125,225,200 ] // loop
	},
	// update code box
	updateOptions = function(s){
		var t;
		if (s) {
			if (s.hasOwnProperty('builderInitialized') && s.builderInitialized) { code.val( s.getCode().replace(/url\(\)/, $('.bkgd').val()) ); }
			$('.rotate')[0].checked = s.options.rotateGrip; // I would use prop, but want to make it work with jQuery 1.4.4
			$('.tolerance').val(s.options.tolerance).filter('.isRange').next().html( s.options.tolerance );
			$('.range').val( s.options.range ).filter('.isRange').next().html( s.options.range + ' px' );
			$('.edit')[0].checked = s.options.edit;
			$('.grid').val( s.options.grid ).filter('.isRange').next().html( s.options.grid === 1 ? 'off' : s.options.grid + ' px' );
			$('.snap')[0].checked = s.options.snap;
			$('.thickness').val( s.options.curve.width ).filter('.isRange').next().html( s.options.curve.width + ' px' );
			t = $('.gripColor'); t.val( checkColor(t, t.val()) );
			$('.curveColor').each(function(indx, el){
				var $el = $(el);
				$el.val( checkColor($el) );
			});
		}
	},
	checkColor = function(t,c){
		var c = c || t.val(),
			d = (/^(#[\da-fA-F]{6}$)/.test(c)) ? c : t.attr('data-last');
		t.attr('data-last', d);
		return d;
	},
	// t = jQuery object, d = default value
	checkRange = function(t,d){
		// parseInt($('.tolerance').val(), 10) || 3;
		var v = parseInt(t.val(), 10) || d,
			min = parseInt(t.attr('min'), 10),
			max = parseInt(t.attr('max'), 10);
		return (v < min) ? min : (v > max) ? max : v;
	};

	$('#tabs').tabs({
		show: function(e,ui){
			if (ui.tab.innerHTML === "Code") {
				var s = pathslider.data('pathslider');
				updateOptions(s);
				if (s && s.hasOwnProperty('updateCanvasImage')) {
					// update save canvas image
					s.updateCanvasImage();
				}
			}
		}
	});

	// add preset buttons
	i = 0; t = '';
	while (presets.hasOwnProperty(i)) {
		t += '<button>' + (i+1) + '</button>';
		i++;
	}
	$('.presets').html(t);

	// check input type support
	$('.tolerance, .range, .grid, .thickness').each(function(){
		if (this.type !== 'range') {
			$(this)
				.addClass('text')
				.next()
				.html(' range (' + $(this).attr('min') + '-' + $(this).attr('max') + ')');
		} else {
			$(this).addClass('isRange');
		}
	});

	// update all pathslider options
	$('.set').change(function(){
		var t;
		s.options.rotateGrip = $('.rotate')[0].checked;
		s.options.tolerance = checkRange( $('.tolerance'), 3);
		s.options.range = checkRange( $('.range'), 30);
		s.options.edit = $('.edit')[0].checked;
		s.options.grid = checkRange( $('.grid'), 25);
		s.options.snap = $('.snap')[0].checked;
		$('.pathslider-grip').attr('style',''); // clear rotation
		s.options.points = points.val().split(',');
		s.options.curve.width = checkRange( $('.thickness'), 4);
		s.options.curve.cap = $('.capStyle').val().toLowerCase();

		t = $('.curveColor').map(function(){
			return checkColor($(this));
		}).get();
		if (t[0] === t[1]) {
			t = t[0];
		}
		// a color array => linear gradient in v1.0.0
		s.options.curve.color = t;

		if ($('.gripStyle')[0].selectedIndex === 0) {
			$('.gripColor')[0].disabled = false;
			t = checkColor( $('.gripColor') );
			s.options.gripClass = ''; // update for code tab
			$('.pathslider-grip')
				.attr('class', 'pathslider-grip')
				.css('background-color', t);
		} else {
			t = $('.gripStyle').val().toLowerCase().replace(/\s+/g,'');
			s.options.gripClass = t;
			$('.gripColor')[0].disabled = true;
			$('.pathslider-grip')
				.attr('class', 'pathslider-grip ' + t)
				.css('background-color', '');
		}

		// background - remove ";" because it breaks if you don't
		t = $('.bkgd').val().replace(/\;/g,'');
		$('.bkgd').val(t);
		$('#slider').css('background', t );

		updateOptions(s);
		s.updateBuilder();
	});

	// set up pathslider
	$('#slider')
		.pathslider({
			rotateGrip : true,
			// points    : [ 50,300, 0,250, 180,250, 300,50 ],
			points     : [ 0,50, 50,-50, -50,-50, 250,50 ],

			create     : function(e,slider){
				points.val(slider.points);
				position.val(slider.percent);
				angle.text( slider.angle );50
			},
			update     : function(e,slider){
				points.val(slider.points);
				updateOptions(slider);
			},
			slide      : function(e,slider){
				position.val(slider.percent);
				angle.text( slider.angle );
			}
		})
		.pathbuilder({
			edit        : true,
			snap        : true,
			grid        : 25,
			canvasImage : $('#save')
		});

	// Select all text in the points input
	points.mouseup(function(){
		this.select();
	});

	// "Set" points
	$('.setpoints').click(function(){
		var p, pts = points.val().split(',');
		if (pts.length === 8) {
			s.options.points = pts;
			s.updateBuilder();
		}
	});

	// "Set" position
	$('.setpos').click(function(){
		s.setSlider( parseFloat(position.val()), function(s){
			// no need to validate, just replace the value
			position.val( s.percent );
		} );
	});

	// presets
	$('.presets button').click(function(){
		t = parseInt($(this).text(), 10) - 1;
		points.val(s.options.points = presets[t]);
		s.updateBuilder();
	});

	// Add events
	pathslider.bind('create.pathslider update.pathslider start.pathslider slide.pathslider change.pathslider stop.pathslider',function(e,s){
		m.append('<li>' + e.type + ' : ' + s.percent + '</li>');
		var l = m.find('li');
		if (l.length > 10) { l.eq(0).remove(); }
	});

	// Color styles
	$('.gripColor, .curveColor').ColorPicker({
		onSubmit: function(hsb, hex, rgb, el) {
			$(el).val('#' + hex);
			$(el).ColorPickerHide();
			$(el).trigger('change');
		},
		onBeforeShow: function () {
			$(this).ColorPickerSetColor(this.value.slice(1));
		}
	})
	.bind('keyup', function(){
		$(this).ColorPickerSetColor(this.value.slice(1));
	});

	// Make info links (tooltips) unclickable
	$('a.info').click(function(){
		if (this.target === "") { return false; }
	});

	// set up tooltips
	$.jatt({ direction : 'ne' });

	s = pathslider.data('pathslider');

});