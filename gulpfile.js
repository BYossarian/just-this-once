
'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');

const ES_LINT_CONFIG = {
    extends: 'eslint:recommended',
    parserOptions: { ecmaVersion: 6 },
    env: { node: true, es6: true },
    rules: {
        'no-console': 'off',
        semi: ['error', 'always'],
        'new-cap': 'off',
        strict: ['error', 'global'],
        'no-underscore-dangle': 'off',
        'no-use-before-define': 'error',
        'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
        'eol-last': 'off',
        quotes: ['error', 'single'],
        'comma-dangle': 'warn'
    }
};
const JS_FILES = ['./*.js', './test/*.js'];

gulp.task('lint', function() {

    return gulp.src(JS_FILES)
            .pipe(eslint(ES_LINT_CONFIG))
            .pipe(eslint.format())
            // Brick on failure to be super strict
            .pipe(eslint.failOnError());

});

gulp.task('default', ['lint']);
