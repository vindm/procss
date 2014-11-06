/*jshint unused:false */

var SIDES = {
    x : [ 'left', 'center', 'right' ],
    y : [ 'bottom', 'center', 'top' ]
};

var parse = {};

/**
 * @returns {String} Expression for keyword parsing
 */
parse.getKeywordRe = function() {
    return 'procss';
};

/**
 * @returns {String} Expression for comment parsing
 */
parse.getCommentRe = function(commentContent) {
    return '\\s*\\/\\*.*?\\s*' + (commentContent || '') + '\\s*(?:[^*]|(?:\\*(?=[^\\/])))*\\*\\/';
};

/**
 * @returns {String} Expression for command name parsing
 */
parse.getCommandNameRe = function() {
    return '[^\\s(]+?';
};

/**
 * @returns {String} Expression for command params parsing
 */
parse.getCommandParamsRe = function() {
    return '(?:\\s*([^,]*?)\\s*(?:(?:,\\s*)|$))?';
};

/**
 * @param {String} content Content to parse
 * @returns {String[]} Parsed command arguments
 */
parse.parseCommandParams = function(content) {
    var paramsRx = new RegExp(parse.getCommandParamsRe(), 'g'),
        params = [],
        parsed;

    while ((parsed = paramsRx.exec(content))[0]) {
        params.push(parsed[1] ? parsed[1].trim() : null);
    }

    return params;
};

/**
 * @param {String} content Content to parse
 * @returns {Object} Parsed command
 */
parse.parseCommand = function(content) {
    var commandRx = new RegExp(
            parse.getCommentRe(
                parse.getKeywordRe() + '\\.' + '(' + parse.getCommandNameRe() + ')' +
                '\\(\\s*(.*)\\s*\\)'
            )
        ),
        parsed = commandRx.exec(content),
        command;

    if (parsed && parsed[1]) {
        command = {
            full : parsed[0],
            name : parsed[1].trim(),
            params : parsed[2] ? parse.parseCommandParams(parsed[2]) : []
        };
    }

    return command;
};

/**
 * @returns {String} Expression for url parsing
 */
parse.getUrlRe = function() {
    return '(?:(?:url\\(\\s*' + parse.getUrlContentRe() + '\\s*\\))' +
        '|(?:url\\(\\s*[^\\s\\r\\n\'\"]*\\s*\\)))';
};

/**
 * @returns {String} Expression for url content parsing
 */
parse.getUrlContentRe = function() {
    return '(?:(?:\'[^\'\\r\\n]*\')|(?:\"[^\"\\r\\n]*\"))';
};

/**
 * @param {String} content
 * @returns {String} Parsed bg-url
 */
parse.parseBgUrl = function(content) {
    var urlRx = new RegExp(parse.getUrlRe()),
        url;

    url = urlRx.exec(content);

    if ( ! url || ! url[0]) {
        return null;
    }

    url = url[0];

    if (url.lastIndexOf('url(', 0) === 0) {
        url = url.replace(/^url\(\s*/, '').replace(/\s*\)$/, '');
    }

    if (url.charAt(0) === '\'' || url.charAt(0) === '"') {
        url = url.substr(1, url.length - 2);
    }

    return url;
};

/**
 * @static
 * @private
 * @returns {String} Expression for bg-position parsing
 */
parse.getBgPositionRe = function() {
    return '(?:' +
                '(' + parse.getBgPositionValueRe('x') + ')' +
                '(?:\\s*' +
                    '(' + parse.getBgPositionValueRe('y') + ')' +
                ')?' +
            ')|(initial|inherit)';
};

/**
 * @static
 * @private
 * @returns {String} Expression for bg-position value parsing
 */
parse.getBgPositionValueRe = function(side) {
    return '(?:^|\\s)(?:' +
                '(?:-?\\d{1,6}(?:\\.\\d{1,6})?(?:px|%))|' +
                '0|' +
                '(?:' + SIDES[side].join('|') + ')' +
            ')';
};

/**
 * @param {String} content
 * @returns {{x: String, y: String}} Parsed bg-position
 */
parse.parseBgPosition = function(content) {
    var bgPositionRx = new RegExp(parse.getBgPositionRe()),
        foundPosition = bgPositionRx.exec(content),
        position = { x : '0px', y : '0px' };

    if (foundPosition) {
        var x = foundPosition[1].trim(),
            y = foundPosition[2] && foundPosition[2].trim(),
            xSideIndex,
            ySideIndex;

        position = {};

        xSideIndex = SIDES.x.indexOf(x);
        xSideIndex !== -1 && (x = 50 * xSideIndex + '%');
        x === '0' && (x += 'px');

        ySideIndex = y ? SIDES.y.indexOf(y) : 1;
        ySideIndex !== -1 && (y = 50 * ySideIndex + '%');
        y === '0' && (y += 'px');

        position.x = x;
        position.y = y;
        position.raw = foundPosition[0];
    }

    return position;
};

/**
 * @static
 * @private
 * @returns {String} Expression for bg-repeat parsing
 */
parse.getBgRepeatRe = function() {
    return 'repeat|repeat-x|repeat-y|no-repeat';
};

/**
 * @param {String} content
 * @returns {String} Parsed bg-repeat
 */
parse.parseBgRepeat = function(content) {
    var bgRepeatRx = new RegExp(parse.getBgRepeatRe()),
        foundRepeat = bgRepeatRx.exec(content);

    return foundRepeat ?
        foundRepeat[0] :
        'no-repeat';
};

module.exports = parse;
