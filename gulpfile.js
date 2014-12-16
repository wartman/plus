var gulp = require('gulp')
var mocha = require('gulp-mocha')
var to5 = require('gulp-6to5')

gulp.task('test', ['to5'], function () {
  return gulp.src('./tests/test_*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('to5', function () {
  return gulp.src('./src/**/*.js')
    .pipe(to5())
    .pipe(gulp.dest('./dist'))
})

gulp.task('default', ['to5', 'test'])