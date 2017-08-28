const gulp = require('gulp');
var babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const pump = require('pump');
const concat = require('gulp-concat');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync');
const gulpLoadPlugins = require('gulp-load-plugins');
const cleanCSS = require('gulp-clean-css');
const concatCss = require('gulp-concat-css');
const ngAnnotate = require('gulp-ng-annotate');
const strip = require('gulp-strip-comments');
const sass = require('gulp-sass');
const stripDebug = require('gulp-strip-debug');
var purgeSourcemaps = require('gulp-purge-sourcemaps');

const $ = gulpLoadPlugins();
const minDir = './public/assets/min';
const cssDir = './public/assets/css';
const jsDir = './public/assets/js';
const libDir = './public/libs';
const publicDir = './public';

const assets = require('./app/config/assets.config');

gulp.task('minjsAdmin', () => {
    gulp
        .src([
            ...assets.admin.js.build.map(function(file) {
                return publicDir + file;
            })
        ])
        .pipe($.plumber({
            errorHandler: function(error) {
                console.log(error);
                this.emit('end');
            }
        }))
        .pipe(ngAnnotate())
        .pipe(concat('app-admin.min.js'))
        .pipe(gulp.dest(minDir))
        .pipe(babel({ presets: ['es2015'], compact: false }))
        .pipe(purgeSourcemaps())
        .pipe(uglify())
        .pipe(stripDebug())
        .pipe(gulp.dest(minDir));
    gulp
        .src([
            ...assets.admin.js.concat.map(function(file) {
                return publicDir + file;
            })
        ])
        .pipe($.plumber({
            errorHandler: function(error) {
                console.log(error);
                this.emit('end');
            }
        }))
        .pipe(ngAnnotate())
        .pipe(concat('app-admin.concat.min.js'))
        .pipe(gulp.dest(minDir))
        // .pipe(babel({ presets: ['es2015'], compact: false }))
        .pipe(purgeSourcemaps())
        // .pipe(uglify())
        // .pipe(stripDebug())
        .pipe(gulp.dest(minDir));
});

gulp.task('mincssAdmin', function() {
    gulp.src([
            ...assets.admin.css.map(function(file) {
                return publicDir + file;
            })
        ])
        .pipe(concatCss('app-admin.min.css'))
        .pipe(gulp.dest(minDir))
        .pipe(cleanCSS())
        .pipe(gulp.dest(minDir));
});

gulp.task('browser-sync', ['nodemon'], function() {
    browserSync.init(null, {
        proxy: "http://localhost:6655",
        files: ["public/**/*.*", "app/**/*.*"],
        browser: "google chrome",
        port: 3090
    });
});

gulp.task('nodemon', function() {
    nodemon({
        script: 'app.js',
        ext: 'js html',
        env: { 'NODE_ENV': 'development' }
    })
});


gulp.task('styles', function() {
    gulp.src(['app/modules/admin*/views/css/*.scss', 'app/modules/admin*/views/css/*.css'])
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('styles-admin.css'))
        .pipe(gulp.dest(cssDir));
});

gulp.task('javascripts', () => {
    gulp.src(['app/modules/admin*/views/js/app/*.js', 'app/modules/admin*/views/js/*.js'])
        .pipe($.plumber({
            errorHandler: function(error) {
                console.log(error.toString());
                this.emit('end');
            }
        }))
        .pipe(ngAnnotate())
        .pipe(concat('app-admin.js'))
        .pipe(gulp.dest(jsDir));
});

gulp.task('build', ['minjsAdmin', 'mincssAdmin']);
// gulp.task('build_portal', ['minjs_portal', 'mincss_portal']);

gulp.task('default', ['nodemon', 'browser-sync', 'styles', 'javascripts'], function() {
    gulp.watch(['app/modules/**/views/css/*.scss'], ['styles']);
    gulp.watch(['app/modules/admin*/views/js/app/*.js', 'app/modules/**/views/js/*.js'], ['javascripts']);
});