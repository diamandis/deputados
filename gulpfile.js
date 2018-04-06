const exec = require('child_process').exec;
const gulp = require('gulp')
const nodemon = require('nodemon')

gulp.task('server', function(done) {
    exec('mongod --dbpath ./mongo-data/',(err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done(err)
    })
    nodemon({
        script: 'server/server.js',
        watch: ["server/", "app.js"],
        ext: 'js'
    });
    exec('node app.js',(err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done(err)
    });
});