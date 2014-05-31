describe('plugins', function() {
    var ASSERT = require('chai').assert,
        PROCSS = require('../..'),
        PATH = require('path'),
        FS = require('fs');

    var testPluginPath = PATH.resolve(__dirname, 'test-plugin');

    describe('resolving', function() {
        var basePath = PATH.resolve(__dirname, 'with-plugin'),
            testFilePath = PATH.resolve(basePath, 'plugin.css'),
            outputFilePath = PATH.resolve(basePath, 'plugin.pro.css'),
            expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'plugin_expected.css'), 'utf-8');

        before(function(done) {
            require('child_process').exec(
                'cd ' + testPluginPath + ' && npm link &&' +
                'cd ' + basePath + ' && npm link "procss-test-plugin"', function() {
		            done();
	            });
        });

	    afterEach(function(done) {
		    require('child_process').exec('rm ' + outputFilePath, function() {
			    done();
		    });
	    });

        after(function(done) {
            require('child_process').exec(
                'cd ' + basePath + ' && npm unlink "procss-test-plugin"', function() {
		            done();
	            });
        });

        [
            [ 'file path string', testPluginPath ],
            [ 'js object', require(testPluginPath) ],
            [ 'plugin name string', 'procss-test-plugin' ],
            [ '.procss config, if plugins option is not defined' ]
        ]
            .forEach(function(test) {
                it('plugin should be resolved by ' + test[0], function() {
	                var opts = {
		                input : testFilePath
	                };

	                if (test[1]) {
		                opts.plugins = [ {
			                plugin : test[1],
			                config : { process : 'tested' }
		                } ];
	                }

                    return PROCSS
                        .api(opts)
	                    .then(function() {
		                    ASSERT.equal(
			                    FS.readFileSync(outputFilePath, 'utf-8'),
			                    expectedFileContent);
	                    });
                });
            });

    });

    describe('usage', function() {
        var basePath = PATH.resolve(__dirname, 'with-plugin'),
            testFilePath = PATH.resolve(basePath, 'plugin.css');

	    function _process(testPluginConfig, output) {
            var opts = {
                input : testFilePath,
                plugins : Array.isArray(testPluginConfig) ?
                    testPluginConfig :
                    [ {
                        plugin : testPluginPath,
                        config : testPluginConfig
                    } ]
            };
            output && (opts.output = output);

		    return PROCSS.api(opts);
	    }

        describe('#beforeEach', function() {
	        var expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'before_expected.css'), 'utf-8');

            it('should be called with scope as argument before file parsing start', function(done) {
                var isUsed = false,
	                err;

                afterEach(function(done) {
                    require('child_process').exec('rm ' + PATH.resolve(basePath, '_plugin.css'), function() {
                        done();
                    });
                });

                _process({
	                beforeEach : function(scope) {
		                isUsed = true;
		                try {
			                ASSERT.isObject(scope);
			                ASSERT.isObject(scope.file);
                            ASSERT.isNull(scope.rule);
			                ASSERT.equal(scope.file.config.input, testFilePath);
		                } catch (e) { err = e; }
	                }
                })
                .then(function() {
	                if (err) {
		                return done(err);
	                }

                    ASSERT.ok(isUsed);
	                done();
                }, done);
            });

            it('should allow to modify file content that will be parsed and processed', function() {
                var outputFilePath = PATH.resolve(basePath, '_before.css');

                afterEach(function(done) {
                    require('child_process').exec('rm ' + outputFilePath, function() {
                        done();
                    });
                });

                return _process({
                    beforeEach : function(scope) {
                        var rule = scope.file.parsed.rules[0].clone();

                        rule.selector = 'a';
                        rule.each(function(decl, i) {
                            rule.remove(i);
                        });
                        rule.append({
                            prop : '-procss-content',
                            value : '"tested" /* procss.test() */'
                        });

                        scope.file.parsed.prepend(rule);
                    }
                }, '_before.css')
                .then(function() {
                    ASSERT.equal(
                        FS.readFileSync(outputFilePath, 'utf-8'),
                        expectedFileContent);
                });
            });

        });

        describe('#process', function() {
            afterEach(function(done) {
                require('child_process').exec('rm ' + PATH.resolve(basePath, '_plugin.css'), function() {
                    done();
                });
            });

            it('should be called with scope as argument for each parsed command', function(done) {
	            var err;

                _process({
	                    process : function(scope) {
                            try {
			                    ASSERT.isObject(scope);
			                    ASSERT.isObject(scope.file);
			                    ASSERT.isObject(scope.rule);
			                    ASSERT.equal(scope.file.parsed.rules[scope.ruleIndex], scope.rule);
		                    } catch (e) { err = e; }
	                    }
	                })
	                .then(function() {
		                err ?
			                done(err) :
			                done();
	                }, done);
            });

            it('should process each parsed and dynamically added commands', function() {
                var used = 0;

                return _process({
                    process : function(scope) {
                        if (used % 2 === 0) {
                            scope.rule.append({
                                prop : '-some-prop',
                                value : 'some value /* procss.test() */'
                            });
                        }
                        used++;
                    }
                })
                .then(function() {
                    ASSERT.equal(used, 4);
                });
            });

        });

        describe('#afterEach', function() {
			var outputFilePath = PATH.resolve(basePath, '_after-each.css'),
				expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'after-each_expected.css'), 'utf-8');

	        afterEach(function(done) {
		        require('child_process').exec('rm ' + outputFilePath, function() {
			        done();
		        });
	        });

            it('should be called with scope as argument after each file processing finish', function(done) {
	            var err;

                _process({
                    afterEach : function(scope) {
                        try {
                            ASSERT.isObject(scope);
                            ASSERT.isObject(scope.file);
                            ASSERT.isArray(scope.file.parsed.rules);
                            ASSERT.equal(scope.file.parsed.rules.length, 3);
                        } catch (e) { err = e; }
                    }
                })
                .then(function() {
                    err ?
                        done(err) :
                        done();
                }, done);
            });

	        it('should allow to modify chunks before update file content with their results', function() {
		        return _process({
                    afterEach : function(scope) {
                        var rule = scope.file.parsed.rules[0];

                        rule.selector = 'a';
                        rule.remove(0);
                        rule.append({
                            prop : '-procss-content',
                            value : '"tested"'
                        });
                    }
                }, '_after-each.css')
                .then(function() {
                    ASSERT.equal(
                        FS.readFileSync(outputFilePath, 'utf-8'),
                        expectedFileContent);
                });
            });
        });

        describe('#after', function() {
			var outputFilePath = PATH.resolve(basePath, '_after.css'),
				expectedFileContent = FS.readFileSync(PATH.resolve(basePath, 'after_expected.css'), 'utf-8');

	        afterEach(function(done) {
		        require('child_process').exec('rm ' + outputFilePath, function() {
			        done();
		        });
	        });

            it('should be called with scope as argument after all files processing finish', function(done) {
	            var err;

                _process({
                    after : function(scope) {
                        try {
                            ASSERT.isObject(scope);
                            ASSERT.isArray(scope.files);
                        } catch (e) { err = e; }
                    }
                })
                .then(function() {
                    err ?
                        done(err) :
                        done();
                }, done);
            });

	        it('should allow to modify chunks before update file content with their results', function() {
		        return PROCSS.api({
                    input : testFilePath,
                    output : '_after.css',
                    plugins : [ {
                        after : function(scope) {
                            var rule = scope.files[0].parsed.rules[0];

                            rule.selector = 'a';
                            rule.remove(0);
                            rule.append({
                                prop : '-procss-content',
                                value : '"tested"'
                            });
                        }
                    } ]
                })
                .then(function() {
                    ASSERT.equal(
                        FS.readFileSync(outputFilePath, 'utf-8'),
                        expectedFileContent);
                });
            });
        });

        describe('scope', function() {

            it('should keep scope changes while processing file with plugins', function(done) {
                var pluginNames = [ 'first', 'second', 'third' ],
	                outputFilePath = PATH.resolve(basePath, '_order.css');

	            after(function(done) {
		            require('child_process').exec('rm ' + outputFilePath, function() {
			            done();
		            });
	            });

                PROCSS
	                .api({
		                input : testFilePath,
		                output : '_order.css',
		                plugins : pluginNames.map(function(pluginName, i) {
			                function checkPrev(scope, expected) {
				                try {
					                ASSERT.equal(scope._prevCommand, expected);
				                } catch(e) {
					                done(e);
				                }
			                }

			                return {
			                    beforeEach : function(scope) {
			                        if ( ! scope._isNotFirstBeforeCall) {
			                            scope._isNotFirstBeforeCall = true;
			                        } else {
				                        checkPrev(scope, pluginNames[i - 1] + '#before');
			                        }

			                        scope._prevCommand = pluginName + '#before';

			                        scope.file.parsed.prepend(scope.pcss.comment({ text : pluginName + '#before' }));
			                    },
			                    process : function(scope) {
			                        if ( ! scope._isNotFirstProcessCall) {
				                        checkPrev(scope, pluginNames[2] + '#before');
			                            scope._isNotFirstProcessCall = true;
			                        } else {
				                        checkPrev(scope, (pluginNames[i - 1] || pluginNames[2]) + '#process');
			                        }

			                        scope._prevCommand = pluginName + '#process';
			                        scope.rule.append({
				                        prop : '-procss-content',
				                        value : pluginName + '#process'
			                        });
			                    },
			                    afterEach : function(scope) {
			                        if ( ! scope._isNotFirstAfterCall) {
				                        checkPrev(scope, pluginNames[2] + '#process');
			                            scope._isNotFirstAfterCall = true;
			                        } else {
				                        checkPrev(scope, pluginNames[i - 1] + '#after');
			                        }

			                        scope._prevCommand = pluginName + '#after';
                                    scope.file.parsed.append(scope.pcss.comment({ text : pluginName + '#after' }));
			                    }
			                };
			            })
		            })
	                .then(function() {
		                ASSERT.equal(
			                FS.readFileSync(outputFilePath, 'utf-8'),
			                FS.readFileSync(PATH.resolve(basePath, 'order_expected.css'), 'utf-8'));

		                done();
	                })
                    .fail(done);
            });

        });
    });

});
