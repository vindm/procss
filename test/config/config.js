describe('Config', function() {
    var PROCSS = require('../..'),
        PATH = require('path'),
        FS = require('fs');

    it('should use procss.json config', function() {
        var basePath = PATH.resolve(__dirname, 'simple'),
            outputFilePath = PATH.resolve(basePath, 'changed_a.css');

	    after(function(done) {
		    require('child_process').exec('rm ' + outputFilePath, done);
	    });

        return PROCSS
	        .api({ input : PATH.resolve(basePath, 'a.css') })
	        .then(function() {
	            if ( ! FS.existsSync(outputFilePath)) {
	                throw 'FAIL';
	            }
	        });
    });

	it('should get nearest to input file procss.json config', function(done) {
		var basePath = PATH.resolve(__dirname, 'inherit'),
		    outputAFilePath = PATH.resolve(basePath, '_a_a.css'),
		    outputBFilePath = PATH.resolve(basePath, 'b', '_b_b.css');

		PROCSS.api({
			input : PATH.resolve(basePath, 'a.css')
		})
			.then(function() {
				if ( ! FS.existsSync(outputAFilePath)) {
					return done('FAIL');
				}

				return PROCSS.api({
					input : PATH.resolve(basePath, 'b', 'b.css')
				});
			})
			.then(function() {
				if ( ! FS.existsSync(outputBFilePath)) {
					return done('FAIL');
				}

				require('child_process')
					.exec('rm ' + [ outputAFilePath, outputBFilePath ].join(' '), done);

			})
			.fail(function(err) {
				done(err);
			});
	});

    it('should get and extend configs by matching configs patterns with processing file path', function() {
        var basePath = PATH.resolve(__dirname, 'patterns'),
            outputFilePath = PATH.resolve(basePath, 'changed-once-more_a.css');

	    after(function(done) {
		    require('child_process').exec('rm ' + outputFilePath, done);
	    });

        return PROCSS
	        .api({ input : PATH.resolve(basePath, 'a.css') })
	        .then(function() {
	            if ( ! FS.existsSync(outputFilePath)) {
	                throw 'FAIL';
	            }
	        });
    });

});
