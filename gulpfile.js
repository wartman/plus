var gulp = require('gulp')
var mocha = require('gulp-mocha')

gulp.task('test', function () {
  return gulp.src('./tests/test_*.js', {read: false})
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('default', ['test'])