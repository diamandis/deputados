const exec = require('child_process').exec;
const gulp = require('gulp')
const nodemon = require('nodemon')

gulp.task('server', function() {
    nodemon({
        script: 'server/server.js',
        watch: ["server/", "app.js"],
        ext: 'js'
    });
    exec('node app.js');
});