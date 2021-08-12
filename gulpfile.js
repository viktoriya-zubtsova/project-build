const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const gulpif = require('gulp-if');
const env = require('gulp-env');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const nested = require('postcss-nested');
const short = require('postcss-short');
const assets = require('postcss-assets');
const presetenv = require('postcss-preset-env');
const handlebars = require('gulp-compile-handlebars');
const glob = require('glob');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const stylelint = require('stylelint');
const reporter = require('postcss-reporter');
const filter = require('gulp-filter');

const templateContext = require('./src/templates/test.json');
const rulesScripts = require('./eslintrc.json');
const rulesStyles = require('./stylelintrc.json');
const config = require('./config');

const paths = {
	assets: 'src/**/*.png',
    contextJson: 'src/templates/test.json',
	src: {
		dir: 'src/templates',
		styles: 'src/styles/**/*.css',
		scripts: 'src/scripts/*.js',
		templates: 'src/templates/**/*hbs'
	},
	buildDir: 'static',
	buildNames: {
		styles: 'index.min.css',
		scripts: 'index.min.js'
	},
	lint: {
		scripts: ['**/*.js', '!node_modules/**/*', '!static/**/*'],
		styles: ['**/*.css', '!node_modules/**/*', '!static/**/*']
	}
};

switch (config.env) {
    case 'development':
        gulp.task('default', [
            'fonts',
            'scripts',
            'styles',
            'compile',
            'watch',
            'browser-sync'
        ]);
        break;
    case 'production':
        gulp.task('default', [
            'fonts',
            'scripts',
            'styles',
            'compile'
        ]);
        break;
    default:
        break;
}

gulp.task('browser-sync', () => {
	browserSync.init({
		server: {
			baseDir: './static'
		}
	});
});

gulp.task('compile', () => {
	glob(paths.src.templates, (err, files) => {
		if (!err) {
			const options = {
				ignorePartials: true,
				batch: files.map(item => item.slice(0, item.lastIndexOf('/'))),
				helpers: {
					capitals: str => str.toUpperCase()
				}
			};

			return gulp.src(`${paths.src.dir}/index.hbs`)
				.pipe(handlebars(templateContext, options))
				.pipe(rename('index.html'))
				.pipe(gulp.dest(paths.buildDir));
		} else {
			throw err;
		}
	});
});

const plagins = [
		autoprefixer(),
		nested()
	];

const lintPlagins = [
		stylelint(rulesStyles),
		reporter({
			clegarMessages: true,
			throwError: false
		})
	];

gulp.task('styles', () => {
	gulp.src(paths.src.styles)
		.pipe(sourcemaps.init())
			.pipe(postcss(plagins))
			.pipe(concat(paths.buildNames.styles))
        	.pipe(gulpif(config.env === 'production', cssnano()))
        .pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.buildDir));
});

gulp.task('scripts', () => {
	return gulp.src(paths.src.scripts)
		.pipe(concat(paths.buildNames.scripts))
		.pipe(sourcemaps.init())
			.pipe(babel({
	            presets: ['@babel/env']
	        }))
	        .pipe(gulpif(config.env === 'production', uglify()))
	    .pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.buildDir));
});

gulp.task('eslint', () => {
	gulp.src(paths.lint.scripts)
		.pipe(eslint(rulesScripts))
		.pipe(eslint.format());
});

gulp.task('stylelint', () => {
	gulp.src(paths.lint.styles)
		.pipe(postcss(lintPlagins));
});

gulp.task('lint', ['eslint', 'stylelint']);

gulp.task('fonts', () => {
    gulp.src('./src/fonts/**/*')
        .pipe(filter(['*.woff', '*.woff2']))
        .pipe(gulp.dest(`${paths.buildDir}/fonts`));
});

gulp.task('assets', () => {
    glob(paths.assets, (err, files) => {
        if (!err) {
            gulp.src(files)
                .pipe(gulp.dest(`${paths.buildDir}/assets`));
        } else {
            throw err;
        }
    });
});

gulp.task('watch', () => {
    gulp.watch(paths.templates, ['compile'];
    gulp.watch(paths.src.styles, ['styles']);
    gulp.watch(paths.src.scripts, ['scripts']);
    gulp.watch(paths.contextJson)
        .on('change', browserSync.reload);
    gulp.watch(`${paths.buildDir}/**/*`)
        .on('change', browserSync.reload);
});