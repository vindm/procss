describe('API', function() {
    var ASSERT = require('chai').assert,
        PROCSS = require('../..'),
        PATH = require('path'),
        FS = require('fs');

    it('should throw error if input path is not defined', function(done) {
        PROCSS
	        .api({})
            .then(function() {
                done('passed');
            })
	        .fail(function(err) {
                ASSERT.equal(err, 'Option --input must have a value.');

                done();
            });
    });

    it('should throw error if input path is empty', function(done) {
        PROCSS
	        .api({ input : '' })
            .then(function() {
                done('passed');
            })
	        .fail(function(err) {
                ASSERT.equal(err, 'Option --input must have a value.');

                done();
            });
    });

    it('should throw error if input file is not exists', function(done) {
        PROCSS
	        .api({ input : './b.css' })
            .then(function() {
                done('passed');
            })
	        .fail(function(err) {
                ASSERT.equal(err.code, 'ENOENT');

                done();
            });
    });

    it('should replace ? in output with input file name', function(done) {
        var outputPath = PATH.resolve(__dirname, 'moved_a.css');

        afterEach(function(done) {
            require('child_process').exec('rm ' + outputPath, function() {
                done();
            });
        });

        return PROCSS
            .api({
                input : PATH.resolve(__dirname, 'a.css'),
                output : 'moved_?'
            })
            .then(function() {
                ASSERT.isTrue(FS.existsSync(outputPath));

                done();
            });
    });

    it('should process two files', function() {
        var files = [ 'a', 'b' ];

        afterEach(function(done) {
            require('child_process').exec('rm ' + files.map(function(name) {
                return PATH.resolve(__dirname, name + '.pro.css');
            }).join(' '), function() {
                done();
            });
        });

        return PROCSS
            .api({
                input : files.map(function(name) {
                    return PATH.resolve(__dirname, name + '.css');
                })
            })
            .then(function() {
                files.forEach(function(name) {
                    ASSERT.equal(
                        FS.readFileSync(PATH.resolve(__dirname, name + '.pro.css'), 'utf-8'),
                        FS.readFileSync(PATH.resolve(__dirname, name + '_expect.css'), 'utf-8')
                    );
                });
            });
    });

    it('should process files with wildcard input', function() {
        var files = [ 'a', 'b' ];

        afterEach(function(done) {
            require('child_process').exec('rm ' + files.map(function(name) {
                return PATH.resolve(__dirname, name + '.pro.css');
            }).join(' '), function() {
                done();
            });
        });

        return PROCSS
            .api({
                input : [ '**/api/a.css', '**/api/b.css' ]
            })
            .then(function() {
                files.forEach(function(name) {
                    ASSERT.equal(
                        FS.readFileSync(PATH.resolve(__dirname, name + '.pro.css'), 'utf-8'),
                        FS.readFileSync(PATH.resolve(__dirname, name + '_expect.css'), 'utf-8')
                    );
                });
            });
    });

    describe('stdin/stdout', function() {
        var inputPath = PATH.resolve(__dirname, 'a.css'),
            outputPath = PATH.resolve(__dirname, '_b.css');

        afterEach(function(done) {
            require('child_process').exec('rm ' + outputPath, function() {
                done();
            });
        });

        [
            [
                'should use stdin if input is "-"',
                'cat ' + inputPath + ' | procss -i - -o ' + outputPath
            ],
            [
                'should use stdout if output is "-"',
                'procss -o - -i ' + inputPath + ' > ' + outputPath
            ],
            [
                'should use both stdin and stdout if input is "-" and output is undefined',
                'cat ' + inputPath + ' | procss -i - > ' + outputPath
            ],
            [
                'should use both stdin and stdout if input is "-" and output is "-"',
                'cat ' + inputPath + ' | procss -i - -o - > ' + outputPath
            ]
        ]
            .forEach(function(test) {
                it(test[0], function(done) {
                    require('child_process')
                        .exec(test[1], function(err) {
                            if (err) {
                                return done(err);
                            }

                            ASSERT.isTrue(FS.existsSync(outputPath));
                            done();
                        });
                });
            });
    });

});
