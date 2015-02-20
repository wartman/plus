var gulp = require('gulp')
var mocha = require('gulp-mocha')
var babel = require('gulp-babel')

gulp.task('test', ['babel'], function () {
  return gulp.src('./tests/test_*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('babel', function () {
  return gulp.src('./src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./dist'))
})

gulp.task('default', ['babel', 'test'])
