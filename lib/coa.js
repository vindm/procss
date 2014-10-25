var FS = require('fs'),
    VOW = require('vow'),
    PATH = require('path'),
    EXTEND = require('extend'),
    GLOBULE = require('globule'),
    CONFIG = require('./config'),
    PROCSS = require('./procss'),
    PKG = require(PATH.resolve(__dirname, '..', 'package.json'));

module.exports = require('coa').Cmd()
    .helpful()
    .name(PKG.name)
    .title(PKG.description)
    .opt()
        .name('version').title('Version')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() { return PKG.version; })
        .end()
    .opt()
    .name('input').title('Input file, "-" for STDIN')
        .short('i').long('input')
        .arr()
        .val(function(val) {
            return val || this.reject('Option --input must have a value.');
        })
        .end()
    .opt()
        .name('output').title('Output file, "-" for STDOUT, by default "_?", where "?" is input file name')
        .short('o').long('output')
        .val(function(val) {
            return val || this.reject('Option --output must have a value.');
        })
        .end()
    .opt()
        .name('plugins').title('Array of plugins to use')
        .short('p').long('plugins')
        .arr()
        .end()
    .arg()
        .name('input').title('Alias to --input')
        .arr()
        .end()
    .arg()
        .name('output').title('Alias to --output')
        .end()
    .act(function(options, args) {
        if (args) {
            args.input && (options.input = args.input);
            args.output && (options.output = args.output);
        }

        if ( ! options.input) {
            return this.reject('Option --input must have a value.');
        }

        var readingInputDefer = VOW.defer(),
            contentByPath = {},
            filePaths = options.input.reduce(function(filePaths, inputPath) {
                var paths;

                if (inputPath !== '-') {
                    try {
                        paths = GLOBULE.find(inputPath);
                    } catch(e) {}
                }

                if ( ! paths || paths.length === 0) {
                    paths = [ inputPath ];
                }

                paths && paths.forEach(function(path) {
                    path === '-' || (path = PATH.normalize(PATH.resolve(path)).toString());
                    if (filePaths.indexOf(path) === -1) {
                        filePaths.push(path);
                    }
                });

                return filePaths;
            }, []),
            inputsToRead = filePaths.length;

        if (inputsToRead === 0) {
            readingInputDefer.reject('No files to process');
        }

        filePaths.forEach(function(filePath) {
            var content;

            if (filePath === '-') {
                content = '';
                process.stdin.pause();
                process.stdin
                    .on('data', function(chunk) {
                        chunk && (content += chunk);
                    })
                    .once('end', function() {
                        contentByPath[filePath] = content;
                        if (--inputsToRead === 0) {
                            readingInputDefer.resolve(contentByPath);
                        }
                    })
                    .resume();
            } else {
                if ( ! contentByPath[filePath] && filePath === FS.realpathSync(filePath)) {
                    FS.readFile(filePath, { encoding : 'utf8' }, function(err, content) {
                        if ( ! err) {
                            contentByPath[filePath] = content;
                        }
                        if (--inputsToRead === 0) {
                            readingInputDefer.resolve(contentByPath);
                        }
                    });
                }
            }
        });

        return readingInputDefer.promise()
            .then(function(contentByPath) {
                return PROCSS(Object
                    .keys(contentByPath)
                    .reduce(function(configs, filePath) {
                        var isstdin = filePath === '-',
                            config = isstdin ?
                                options :
                                EXTEND({}, CONFIG(filePath), {
                                    input : filePath,
                                    output : options.output,
                                    plugins : options.plugins
                                });

                        if (config.output === '-' || (isstdin && ! config.output)) {
                            config.output = '-';
                        } else {
                            config.output || (config.output = '?.pro');
                            config.output = config.output
                                .replace('?', isstdin ? 'stdin' : PATH.basename(filePath, '.css'));
                            /\.css$/.test(config.output) || (config.output += '.css');
                            isstdin || (config.output = PATH.resolve(PATH.dirname(filePath), config.output));
                        }

                        configs.push([ contentByPath[filePath], config ]);

                        return configs;
                    }, []));
            })
            .then(function(procss) {
                procss.files.forEach(function(file) {
                    if (file.config.output === '-') {
                        process.stdout.write(file.toString() + '\n');
                    } else {
                        FS.writeFileSync(file.config.output, file.toString());
                    }
                });
            });
    });
