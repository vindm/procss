var PATH = require('path'),
    EXTEND = require('extend'),
    GLOBULE = require('globule');

var SEP =  PATH.sep === '\\' ? '\\\\' : PATH.sep;

/**
 * @private
 * @param {String} path
 * @returns {Object} Config from .procss file by path
 */
function _loadConfig(path) {
    var config = _loadConfig.cache[path];

    if ( ! config && config !== null) {
        try {
            config = require(PATH.resolve(path, '.procss.js'));
        } catch (e) {
            config = null;
        }

        _loadConfig.cache[path] = config;
    }

    return config;
}
_loadConfig.cache = {};

/**
 * @param {String} filePath
 * @returns {Object} Extended config by file path
 */
function _getConfig(filePath) {
    var configs = _getConfig.cache[filePath],
        pathForCheck,
        rePrefix,
        matched;

    if ( ! configs && configs !== null) {
        pathForCheck = PATH.dirname(filePath);
        rePrefix = new RegExp('(' + SEP + '*[^' + SEP + ']+)$', 'g');

        do {
            configs = _loadConfig(pathForCheck);
        } while (
            ! configs &&
            (matched = pathForCheck.match(rePrefix)) !== null &&
            (pathForCheck = pathForCheck.replace(rePrefix, '')));

        configs || (configs = null);
        _getConfig.cache[filePath] = configs;
    }

    if (configs) {
        if ( ! Array.isArray(configs)) {
            configs = [ {
                file_paths : '**',
                config : configs
            } ];
        }

        configs.forEach(function(config) {
            if (Array.isArray(config.config.plugins)) {
                config.config.plugins = config.config.plugins.map(function(plugin) {
                    if (typeof plugin === 'string') {
                        plugin = { plugin : plugin };
                    }

                    if (typeof plugin.plugin === 'string' && plugin.plugin.indexOf('/') !== -1) {
                        plugin.plugin = PATH.resolve(pathForCheck, plugin.plugin);
                    }

                    return plugin;
                });
            }
        });
    }

    return configs;
}
_getConfig.cache = {};

/**
 * @param {String} filePath
 * @returns {Object} Config by file path
 */
function getConfig(filePath) {
    var configs = getConfig.cache[filePath];

    if ( ! configs && configs !== null) {
        configs = _getConfig(filePath);

        if (configs) {
            configs = configs.reduce(function(matched, config) {
                if (GLOBULE.isMatch(config.file_paths, filePath)) {
                    matched = EXTEND(matched, config.config);
                }

                return matched;
            }, null);
        }

        getConfig.cache[filePath] = configs;
    }

    return configs || {};
}
getConfig.cache = {};

module.exports = getConfig;
