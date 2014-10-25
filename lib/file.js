var POSTCSS = require('postcss');

/**
 * @constructor
 * @param {String} content
 * @param {Object} config
 */
var File = function(content, config) {
    this.content = content;
    this.config = config;

    this.parsed = POSTCSS.parse(this.content);
};

/**
 * @private
 * @type {Boolean}
 */
File.prototype._isChanged = false;

/**
 * @private
 * @type {Boolean}
 */
File.prototype._isNeedToUpdateContent = false;

Object.defineProperties(File.prototype, {
    /**
     * @type {Boolean}
     */
    isChanged : {
        get : function() {
            return this._isChanged;
        },
        set : function(state) {
            this._isChanged = state;
            this._isNeedToUpdateContent = state;
        }
    }
});

/**
 * @returns {String} Stringified file content
 */
File.prototype.toString = function() {
    if (this._isNeedToUpdateContent) {
        this._isNeedToUpdateContent = false;
        this.content = this.parsed.toString();
    }

    return this.content;
};

module.exports = File;
