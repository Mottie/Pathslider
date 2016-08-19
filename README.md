A jQuery numerical slider that follows a bezier path.

[![devDependency Status][david-dev-image]][david-dev-url] [![MIT][license-image]][license-url]

## Features

* Numerical slider similar to the [jQuery UI Slider](http://jqueryui.com/demos/slider/) - currently it only works with percentages (0-100%)
* This slider follows a bezier path. The parameters are set using the pathslider builder.
* Designed to work in older browsers (no canvas support), just add the path as a background image.
* Get and set the slider position dynamically.
* Slider handle (grip) can be set to rotate along with the angle of the curve (uses css3).
* Callback events are available: create, update, start, slide, change, and stop.
* The slider itself works in all browsers: IE6+, Opera, Chrome, Firefox and Safari (known issues below)
* [Pathslider demo](http://mottie.github.com/Pathslider/index.html).
* [Pathslider Builder](http://mottie.github.com/Pathslider/builder.html).

## Documentation

Wiki:
 [Home](https://github.com/Mottie/Pathslider/wiki/Home) |
 [FAQ](https://github.com/Mottie/Pathslider/wiki/FAQ) |
 [Setup](https://github.com/Mottie/Pathslider/wiki/Setup) |
 [Options](https://github.com/Mottie/Pathslider/wiki/Options) |
 [Events](https://github.com/Mottie/Pathslider/wiki/Events) |
 [Theme](https://github.com/Mottie/Pathslider/wiki/Theme) |
 [Change](https://github.com/Mottie/Pathslider/wiki/Change)

## To Do:

* Add min, max and step options to use values, other than zero to one hundred percent, with the slider.
* Add enable, disable, destroy methods.
* Smooth out sliding by improving grip position calculation
  * The grip jumps around quite a bit with some settings
  * This can be minimized by adjusting the tolerance & range settings, but it needs a better method.
* Add more default handle (grip) styles in the css.
* Add ability to make a gradient/patterned stroke style of the curve; I'm not sure it will follow the path of the curve or just be a static background. Needs more testing!
* Add keyboard control to the slider when it has focus - arrows, page up/down, home and end.
* Add a circular path
  * I don't plan on making it go continuously around in a circle. It will have a starting and stopping point.
  * If you need a continuous circle slider, check out [this one](http://www.eleqtriq.com/2009/12/javascriptdialcontrol/), and [this one](http://www.baijs.nl/tinycircleslider/).
* Combine multiple beziers to make extended shapes - my math skills are a bit lacking so this may take a while, unless someone out there is willing to help ;)

## Dependencies

* jQuery 1.4.4+
* A browser that supports canvas (needed for the builder; optional for the pathslider plugin itself).
* A browser that supports css3 transforms (necessary to rotate the grip).

## Known Bugs

* The grip/handle will work if the loop folds back on itself - try these points to see an example: 75,200,200,-125,-200,0,225,200
* The S-Curve demo seems to get stuck near 100% but only in Firefox and on the demo page. It works fine when isolated. The grip isn't staying centered under the cursor like it does in Chrome.
* Safari for Windows likes to start with the grip in the upper left corner of the slider box... most of the time when I hover over it, it jumps to where it should be... wow that is so weird. Also, the "S" curve demo doesn't want to work at all...

[david-dev-url]: https://david-dm.org/Mottie/pathslider?type=dev
[david-dev-image]: https://img.shields.io/david/dev/Mottie/pathslider.svg
[license-url]: https://github.com/Mottie/Pathslider/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg

## Change Log

### Version 1.0.0-alpha (8/19/2016)

* Core:
  * Use window load event for jQuery v3.0+ compatibility.
  * Add `drawCanvas` callback & update curve color options. Fixes [issue #8](https://github.com/Mottie/Pathslider/issues/8).
  * Add `finishCurve` function. For use inside of the `drawCanvas` callback.
  * Add `redraw` method. See [issue #8](https://github.com/Mottie/Pathslider/issues/8).
  * Clean up CSS & use image URI.
* Builder:
  * Switch to using `drawCanvas` callback.
  * Use `finishCurve` function.
  * Add curve shift controls.
* Docs & Readme:
  * Update libraries & colors.
  * Make MIT license more prominent.
  * Optimize png images.
* Extras:
  * Add `.git` files.
  * Remove BOM from all files.
  * Add grunt build script & dist folder.

### Version 0.9.1 alpha (12/7/2011)

* Added touch device compatibility.
* Changed the grip "data-degree" attribute to "data-angle". This attribute contains the angle of transformation to rotate the grip.
* Changed the grip "data-position" attribute to "data-percent". This attribute contains the current percentage distance along the curve of the grip.
* Added some images for the wiki documentation.

### Version 0.9 alpha (12/5/2011)

* Initial commit
