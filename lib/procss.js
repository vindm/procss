var VOW = require('vow'),
    PATH = require('path'),
    UTIL = require('util'),
    POSTCSS = require('postcss'),
    PARSE = require('./parser'),
    File = require('./file'),
    colors = require('colors');

/**
 * @constructor
 * @param {Object} configs
 */
var Procss = function(configs) {
    this.files = configs.map(function(cnfg) {
        return new File(cnfg[0], cnfg[1]);
    });
    this.startTime = process.hrtime();

    this._initPlugins();
};

/**
 * @static
 */
Procss.run = function(configs) {
    var procss;

    return VOW
        .when((function() {
            procss = new Procss(configs);
        })())
        .then(function() {
            return procss.callPlugins('before');
        })
        .then(function() {
            return procss.files.reduce(function(promise, file) {
                function fileProcess(file) {
                    procss.file = file;
                    procss.ruleIndex = 0;

                    return procss
                        .callPlugins(file._plugins, 'beforeEach')
                        .then(function _processCommand() {
                            if (procss._nextCommand()) {
                                return procss
                                    .callPlugins(file._plugins, 'process')
                                    .always(_processCommand);
                            }
                        })
                        .then(function() {
                            return procss.callPlugins(file._plugins, 'afterEach');
                        })
                        .then(function() {
                            return procss;
                        });
                }

                return promise ?
                    promise.then(fileProcess.bind(null, file)) :
                    fileProcess(file);
            }, null);
        })
        .then(function() {
            return procss.callPlugins('after');
        })
        .then(function() {
            procss.report();

            return procss;
        });
};

/**
 * Postcss helper
 * @type {postcss}
 */
Procss.prototype.pcss = POSTCSS;

/**
 * Parse helper
 * @type {parse}
 */
Procss.prototype.parser = PARSE;

/**
 * Processing rule
 * @type {Object}
 */
Procss.prototype.rule = null;

/**
 * Processing rule index
 * @type {Number}
 */
Procss.prototype.ruleIndex = 0;

/**
 * Processing declaration
 * @type {Object}
 */
Procss.prototype.decl = null;

/**
 * Processing declaration index
 * @type {Number}
 */
Procss.prototype.declIndex = 0;

/**
 * Get next command to process
 * @private
 * @returns {Boolean} state
 */
Procss.prototype._nextCommand = function() {
    var file = this.file.parsed,
        rule,
        decl,
        command,
        value;

    if ( ! file) {
        return false;
    }

    rule = this.rule || file.rules[this.ruleIndex];

    if ( ! rule) {
        return false;
    }

    if (rule.decls) {
        while ((decl = rule.decls[this.declIndex])) {
            value = decl._value && decl._value.raw || decl.value;

            this.declIndex++;

            if (value && value.indexOf('/*') !== -1) {
                command = PARSE.parseCommand(value);

                if (command) {
                    decl.value = decl.value.replace(command.full, '').trim();
                    decl._value && decl._value.raw &&
                        (decl._value.raw = decl._value.raw.replace(command.full, '').trim());
                    command.decl = decl;
                    this.decl = decl;
                    this.file.isChanged = true;

                    break;
                }
            }
        }
    }

    if ( ! command) {
        this.rule = file.rules[++this.ruleIndex];
        this.declIndex = 0;

        if (this.rule) {
            return this._nextCommand();
        }

        this.rule = null;
        this.ruleIndex = null;

        return false;
    }

    this.rule = rule;
    this.command = command;

    return true;
};

/**
 * @type {Object}
 * @private
 */
Procss.prototype._pluginsByPath = {};

/**
 * Resolve and init plugins all files plugins
 * @private
 */
Procss.prototype._initPlugins = function() {
    var files = this.files;

    this._pluginsByPath = {};
    this._allPlugins = [];

    files.forEach(function(file) {
        var fileProcessingConfig = file.config;

        file._plugins = [];
        fileProcessingConfig.plugins && fileProcessingConfig.plugins
            .forEach(function(plugin) {
                var pluginConfig,
                    resolvedPlugin;

                if (typeof plugin === 'object' && plugin.plugin) {
                    pluginConfig = plugin.config;
                    plugin = plugin.plugin;
                }

                if (typeof plugin === 'string') {
                    resolvedPlugin = this._pluginsByPath[plugin];
                    if ( ! resolvedPlugin) {
                        try {
                            resolvedPlugin = require(plugin);
                            if (resolvedPlugin) {
                                this._pluginsByPath[plugin] = resolvedPlugin;
                            }
                        } catch (e) {}
                    }
                } else {
                    resolvedPlugin = plugin;
                }

                if (resolvedPlugin && typeof resolvedPlugin === 'object') {
                    if ( ! this._allPlugins.some(function(plg) {
                        return plg.plugin === resolvedPlugin;
                    })) {
                        this._allPlugins.push({
                            plugin : resolvedPlugin,
                            config : {}
                        });
                    }

                    file._plugins.push({
                        plugin : resolvedPlugin,
                        config : pluginConfig || {}
                    });
                }
            }, this);
    }, this);
};

/**
 * Calls plugins action one by one
 * @private
 * @returns {VOW.defer)
 */
Procss.prototype.callPlugins = function(plugins, method) {
    var _this = this,
        defer = VOW.defer(),
        promise = defer.promise();

    if (arguments.length === 1 && typeof plugins === 'string') {
        method = plugins;
        plugins = _this._allPlugins;
    }

    Array.isArray(plugins) || (plugins = [ plugins ]);

    if (plugins && plugins.length > 0) {
        promise = plugins
            .reduce(function(promise, plugin) {
                if (typeof plugin.plugin[method] === 'function') {
                    return promise.always(function() {
                        return plugin.plugin[method].apply(plugin.plugin, [ _this, plugin.config ]);
                    });
                }

                return promise;
            }, promise);
    }

    defer.resolve();

    return promise;
};

Procss.prototype.report = (function() {
    function zeros(s, l) {
        s = String(s);
        while (s.length < l) {
            s = '0' + s;
        }
        return s;
    }
    function time() {
        var dt = new Date();

        return zeros(dt.getHours(), 2) + ':' +
            zeros(dt.getMinutes(), 2) + ':' +
            zeros(dt.getSeconds(), 2) + '.' +
            zeros(dt.getMilliseconds(), 3) + ' - ';
    }

    return function() {
        var cwd = process.cwd(),
            startTimeDiff = process.hrtime(this.startTime),
            processed = this.files.length,
            modified = this.files.filter(function(file) {
                if (file.isChanged) {
                    UTIL.puts(
                        colors.grey(
                            time() +
                            '[' + colors.magenta('Procss') + '] ' +
                            '[' + colors.green('Rebuild') + '] ' + colors.blue(PATH.relative(cwd, file.config.output))
                        )
                    );

                    return true;
                }
            }).length;

        UTIL.puts([
            '',
            processed + ' file' + (processed.length === 1 ? '' : 's') + ' processed',
            modified + ' file' + (modified.length === 1 ? '' : 's') +  ' modified',
            'spent: ' + parseInt((startTimeDiff[0] * 1e9 + startTimeDiff[1]) / 1000000, 10) + 'ms',
            ''
        ].join('\n'));
    };
})();

module.exports = Procss.run;
