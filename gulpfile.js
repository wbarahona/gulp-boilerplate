//
// Gulpfile JS
// Willmer Barahona
// --------------------------------------------------------------------------------------

var gulp 									= require('gulp');
var connect                 				= require('gulp-connect');
var browserify              				= require('browserify');
var sourcemaps 								= require('gulp-sourcemaps');
var uglify 									= require('gulp-uglify');
var buffer                 					= require('vinyl-buffer');
var gutil 									= require('gulp-util');
var jshint 									= require('gulp-jshint');
var eslint 									= require('gulp-eslint');
var source     								= require('vinyl-source-stream');
var stringify               				= require('stringify');
var rename 									= require('gulp-rename');
var sass           	        				= require('gulp-sass');
var cssnano                 				= require('gulp-cssnano');
var rename                  				= require('gulp-rename');
var concat                  				= require('gulp-concat');
var autoprefixer 							= require('gulp-autoprefixer');
var livereload 								= require('gulp-livereload');
var handlebars          					= require('gulp-compile-handlebars');
var imagemin 								= require('gulp-imagemin');
var paths                 					= require('./conf/paths.conf'); // <-- important! find there the configs for separation of concerns: src/dist
var templateData 							= require('./conf/web.conf');

//
// Start Gulp task
// ---------------------------------------------------------------------------
    //
    // Swallow Error
    // -----------------------------------------------------------------------
        function swallowError (error) {
            console.log(error.toString());
            this.emit('end');
        }

	//
    // Server task
    // -----------------------------------------------------------------------
        gulp.task('connect', function() {
            connect.server({
                root: paths.dist.root,
                port: 8000,
                livereload: true
            });
        });

	//
	// Process js
	// -----------------------------------------------------------------------
		gulp.task('lint', function() {
			return gulp.src([paths.dev.scripts+'/**/*.js', '!'+paths.dev.scripts+'/libs/**/*'])
						.pipe(jshint({ strict: false, node: true, sub: true, globals: { window: true, date: true, le_app: true, app: true, document: true, $: true, Image: true } }))
						.pipe(jshint.reporter('default'));
		});

		gulp.task('scripts', function(done) {
			return browserify({
				   		debug: true,
				   		entries: [paths.dev.scripts+'/scripts.js']
				   }).transform(stringify, {
                   		appliesTo: { includeExtensions: ['.json'] },
                   		minify: true
                   })
				  .bundle()
				  .pipe(source('scripts.min.js'))
				  .pipe(buffer())
				  .pipe(uglify({options: {
			  	  		mangle: {
				  			except: ['jquery', 'bootstrap']
				  		}
				  }}))
				  .pipe(gulp.dest(paths.dist.scripts));
		});

	//
    // Process Style
    // -----------------------------------------------------------------------
        gulp.task('sass', function () {

			return gulp.src([paths.dev.styles+'/**/*.scss'])
						.pipe(sourcemaps.init())
						.pipe(sass())
						.on('error', gutil.log)
						.pipe(cssnano())
						.pipe(rename({suffix: '.min'}))
						.pipe(sourcemaps.write())
						.pipe(autoprefixer({
							browsers: ['last 2 versions'],
            				cascade: false
						}))
						.pipe(gulp.dest(paths.dist.styles))
						.pipe(livereload());

        });

	//
    // Process images
    // -----------------------------------------------------------------------
		gulp.task('images', function() {
			return gulp.src(paths.dev.images+'/**/*')
					   .pipe(imagemin({
							progressive: true,
							svgoPlugins: [{removeViewBox: false}],
							use: [pngquant()]
						}))
						.pipe(gulp.dest(paths.dist.images));
		});

	//
	// Process fonts
	// -----------------------------------------------------------------------
		gulp.task('fonts', function() {
			return gulp.src(paths.dev.fonts)
					   .pipe(gulp.dest(paths.dist.fonts))
					   .pipe(livereload());
		});

	//
	// Process Handlebars templates
	// -----------------------------------------------------------------------
		gulp.task('hbs', function () {
			var options = {
				ignorePartials: true,
				batch : [paths.dev.hbs.partials],
				helpers : {
					capitals : function(str){
						return str.toUpperCase();
					}
				}
			}

			return gulp.src([paths.dev.hbs.root+'/**/*.hbs', '!'+paths.dev.hbs.root+'/partials/**/*.hbs'])
					   .pipe(handlebars(templateData, options))
					   .pipe(rename(function(path) {
					   		path.extname = '.html';
					   }))
					   .pipe(gulp.dest(paths.dist.root))
					   .pipe(livereload());
		});

	//
	// Watch for changes on files
	// -----------------------------------------------------------------------
		gulp.task('watch', function () {
			livereload.listen();
			gulp.watch([paths.dev.scripts+'/**/*.js', paths.dev.json+'/**/*.json', '!**/modules/**/*', '!**/libs/**/*'], ['lint', 'scripts']);
			gulp.watch([paths.dev.styles+'/**/*.scss'], ['sass']);
			gulp.watch([paths.dev.hbs.root+'/**/*.hbs'], ['hbs']);
		});

	//
	// Default task to just have `$ gulp` et voila
	// -----------------------------------------------------------------------
		gulp.task('default', ['lint', 'scripts', 'fonts', 'sass','hbs', 'watch', 'connect']);
