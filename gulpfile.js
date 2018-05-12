/**
 * Gulp Packages
 */

// General
var gulp = require('gulp');
var fs = require('fs');
var del = require('del');
var lazypipe = require('lazypipe');//js重命名
var plumber = require('gulp-plumber');
var flatten = require('gulp-flatten');
var tap = require('gulp-tap');
var rename = require('gulp-rename');
var header = require('gulp-header');//引入header
var footer = require('gulp-footer');
var watch = require('gulp-watch');
var package = require('./package.json');

// Scripts and tests
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');//js代码质量
var concat = require('gulp-concat');//js合并
var uglify = require('gulp-uglify');

// Styles
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');//添加前缀
var minify = require('gulp-cssnano');//css优化

var spritesmith = require('gulp.spritesmith'); //雪碧图插件
var imagemin = require('gulp-imagemin');//压缩图片，以下两个为深度压缩图片和已压缩缓存
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var replace=require('gulp-replace');
/**
 * Paths to project folders
 */

var paths = {
	input: 'src/**/*',
	output: 'dist/',
	scripts: {
		input: 'src/js/*',
		lint: 'src/js/**',
		output: 'dist/js/'
	},
	styles: {
		input: 'src/sass/**/*.{scss,sass}',
		output: 'dist/css/',
		outputx: 'src/css/'
	},
	images: {
		input: 'src/img/*',
		output: 'dist/img/'
	},
	static: {
		input: 'src/*',
		output: 'dist/'
	},
	lib:{
		input: ['src/lib/*','src/lib/**/*','src/lib/**/**/*'],
		output: 'dist/lib'
	}
};

/**
 * Template for banner to add to file headers
 */

var banner = {
	full :
		'/*!\n' +
		' * <%= package.name %> v<%= package.version %>: <%= package.description %>\n' +
		' * (c) ' + new Date().getFullYear() + ' <%= package.author.name %>\n' +
		' * MIT License\n' +
		' * <%= package.repository.url %>\n' +
		' */\n\n',
	min :
		'/*!' +
		' <%= package.name %> v<%= package.version %>' +
		' | (c) ' + new Date().getFullYear() + ' <%= package.author.name %>' +
		' | MIT License' +
		' | <%= package.repository.url %>' +
		' */\n'
};


/**
 * Gulp Taks
 */

// Lint, minify, and concatenate scripts
gulp.task('build:scripts', ['clean:dist'], function() {
	var jsTasks = lazypipe()
		.pipe(header, banner.full, { package : package })
		.pipe(gulp.dest, paths.scripts.output)
		.pipe(rename, { suffix: '.min' })
		.pipe(uglify)
		.pipe(header, banner.min, { package : package })
		.pipe(gulp.dest, paths.scripts.output);

	return gulp.src(paths.scripts.input)
		.pipe(plumber())
		.pipe(tap(function (file, t) {
			if ( file.isDirectory() ) {
				var name = file.relative + '.js';
				return gulp.src(file.path + '/*.js')
					.pipe(concat(name))
					.pipe(jsTasks());
			}
		}))
		.pipe(jsTasks());
});

// Process, lint, and minify Sass files
gulp.task('build:styles', ['clean:dist'], function() {
	return gulp.src(paths.styles.input)
		.pipe(plumber())
		.pipe(sass({
			outputStyle: 'expanded',
			sourceComments: true
		}))
		.pipe(flatten())
		.pipe(prefix({
			browsers: ['last 2 version', '> 1%'],
			cascade: true,
			remove: true
		}))
		.pipe(rename({ suffix: '.min' }))
		.pipe(minify({
			discardComments: {
				removeAll: true
			}
		}))
		.pipe(header(banner.min, { package : package }))
		.pipe(gulp.dest(paths.styles.output))
});


// 压缩图片到dist文件夹
gulp.task('build:images', ['clean:dist'], function () {
    gulp.src('src/img/*.{png,jpg,gif,ico}')
        .pipe(cache(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest(paths.images.output));
});

//复制dist图片到文件夹
gulp.task('build:static', ['clean:dist'], function() {
	return gulp.src(paths.static.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.static.output));
});

// Lint scripts
gulp.task('lint:scripts', function () {
	return gulp.src(paths.scripts.lint)
		.pipe(plumber())
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
});
// Copy lib files into output folder
gulp.task('build:lib', ['clean:dist'], function() {
	return gulp.src(paths.lib.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.lib.output));
});

// Remove pre-existing content from output and test folders
gulp.task('clean:dist', function () {
	del.sync([
		paths.output
	]);
});
// listen for file changes
gulp.task('listen', function () {
	gulp.watch(paths.input).on('change', function(file) {
		gulp.start('default');
	});
});


//引入头部底部watch用
gulp.task('include',['build:static'],function() {
    var htmlDir = 'dist/';
    fs.readdir(htmlDir, function(err, files) {
        if (err) {
            console.log(err);
        } else {
            files.forEach(function(f) {
                if (f !== '_header.html' && f !== '_footer.html' && f !== '_aside.html') {
                    gulp.src(htmlDir + f)
                        .pipe(replace(/<!--header-->[\s\S]*<!--headerend-->/, '<!--header-->\n' + fs.readFileSync(htmlDir + '_header.html', 'utf-8') + '\n<!--headerend-->'))
                        .pipe(replace(/<!--footer-->[\s\S]*<!--footerend-->/, '<!--footer-->\n' + fs.readFileSync(htmlDir + '_footer.html', 'utf-8') + '\n<!--footerend-->'))
                        .pipe(replace(/<!--aside-->[\s\S]*<!--asideend-->/, '<!--aside-->\n' + fs.readFileSync(htmlDir + '_aside.html', 'utf-8') + '\n<!--asideend-->'))
                        .pipe(gulp.dest(htmlDir))
                }
            });
        }
    });
});

/**
 * Task Runners
 */

// Compile files
gulp.task('compile', [
	'lint:scripts',
	'clean:dist',
	'build:scripts',
	'build:styles',
	'build:images',
	'build:static',
	'build:lib',
	'include'
]);



// Compile files and generate docs (default)
gulp.task('default', [
	'compile',
]);

// Compile files and generate docs when something changes
gulp.task('watch', [
	'listen',
	'default',
]);

// Run unit tests
gulp.task('test', [
	'default',
	'test:scripts',
	'default'
]);

//自己使用
gulp.task('msprites', function() {
	return gulp.src('src/img/sprite/*.png') //需要合并的图片地址
		.pipe(spritesmith({
			imgName: 'img/sprite.png', //保存合并后图片的地址
			cssName: 'css/sprite.css', //保存合并后对于css样式的地址
			padding: 1, //合并时两个图片的间距
			algorithm: 'top-down', //top-down、left-right、diagonal、alt-diagonal、binary-tree
			cssTemplate: function(data) {
				var arr = [];
				data.sprites.forEach(function(sprite) {
					arr.push(".icon-" + sprite.name +
						"{" +
						"background-image: url('" + sprite.escaped_image + "');" +
						"background-position: " + sprite.px.offset_x + " " + sprite.px.offset_y + ";" +
						"width:" + sprite.px.width + ";" +
						"height:" + sprite.px.height + ";" +
						"}\n");
				});
				return arr.join("");
			}

		}))
		.pipe(gulp.dest('src/'));
});

var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;

// 静态服务器 + 监听 scss/html 文件
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./dist"
    });

    gulp.watch(paths.styles.input, ['sass']);
    gulp.watch(paths.static.input,['include1']);
});

// scss编译后的css将注入到浏览器里实现更新
gulp.task('sass', function() {
    return gulp.src(paths.styles.input)
        .pipe(sass())
        .pipe(gulp.dest(paths.styles.output))
        .pipe(reload({stream: true}));
});
gulp.task('html', function() {
	return gulp.src(paths.static.input)
		.pipe(plumber())
		.pipe(gulp.dest(paths.static.output))
		
});
//引入头部底部serve用
gulp.task('include1',['html'],function() {
    var htmlDir = 'dist/';
    fs.readdir(htmlDir, function(err, files) {
        if (err) {
            console.log(err);
        } else {
            files.forEach(function(f) {
                if (f !== '_header.html' && f !== '_footer.html' && f !== '_aside.html') {
                    gulp.src(htmlDir + f)
                        .pipe(replace(/<!--header-->[\s\S]*<!--headerend-->/, '<!--header-->\n' + fs.readFileSync(htmlDir + '_header.html', 'utf-8') + '\n<!--headerend-->'))
                        .pipe(replace(/<!--footer-->[\s\S]*<!--footerend-->/, '<!--footer-->\n' + fs.readFileSync(htmlDir + '_footer.html', 'utf-8') + '\n<!--footerend-->'))
                        .pipe(replace(/<!--aside-->[\s\S]*<!--asideend-->/, '<!--aside-->\n' + fs.readFileSync(htmlDir + '_aside.html', 'utf-8') + '\n<!--asideend-->'))
                        .pipe(gulp.dest(htmlDir))
                }
            });
        }
    });
    return gulp.src(paths.static.input).pipe(reload({stream: true}));
});