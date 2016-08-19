/*global module:false */
module.exports = function(grunt) {
	'use strict';

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: {
			dist: {
				src: ['dist/*', 'dist/**/*']
			}
		},

		copy: {
			dist: {
				files : [{
					expand: true,
					dot: true,
					flatten: true,
					src: [ 'css/pathslider.css', 'js/jquery.pathslider.js' ],
					dest: 'dist/'
				}]
			}
		},

		jshint: {
			core: {
				options: {
					"jquery": true,
					"browser": true
				},
				src: [ 'js/jquery.*.js' ]
			}
		},

		cssmin: {
			target: {
				files: [{
					expand: true,
					flatten: true,
					src: ['css/*.css'],
					dest: 'dist/',
					ext: '.min.css'
				}]
			}
		},

		uglify: {
			options: {
				preserveComments: function( node, comment ) {
					return /^!/.test( comment.value );
				},
				report: 'gzip'
			},
			dist: {
				files: [{
					expand: true,
					cwd: '',
					src: [ 'js/jquery*.js', '!js/*builder.js' ],
					dest: 'dist/',
					ext: '.min.js',
					extDot: 'last',
					flatten: true
				}]
			}
		},

		watch: {
			scripts: {
				files: ['js/*.js'],
				tasks: ['build']
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task.
	grunt.registerTask('default', [
		'clean',
		'jshint',
		'copy',
		'cssmin',
		'uglify'
	]);

};
