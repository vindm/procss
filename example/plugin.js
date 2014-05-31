/**
 * @typedef File
 * @property {Object} parsed CSS AST by PostCSS
 * @property {Object} config
 *  @property {String} config.input Resolved input filepath
 *  @property {String} config.output Resolved output filepath
 */

/**
 * @typedef Rule
 * @description PostCss Rule node
 * @see {@link https://github.com/postcss/postcss#rule-node}
 */

/**
 * @typedef Decl
 * @description PostCss Declaration node
 * @see {@link https://github.com/postcss/postcss#declaration-node}
 */

/**
 * @typedef Command
 * @description Parsed procss.<name>(<[params...]>) comment
 * @property {String} name Name of command to process
 * @property {String[]} params List of parsed params
 */

module.exports = {

    /**
     * Will be called before start to process input files
     * @param {Object} scope
     *  @param {File[]} scope.files Parsed input files
     */
    before : function(scope) {
        console.log(
            'Before start to process input files:',
            scope.files.map(function(file) {
                var rulesCount = file.parsed.rules.length;

                rulesCount += ' rule' + (rulesCount > 1 ? 's' : '');

                return '\n' + rulesCount + ' in ' + file.config.input;
            }).join(',')
        );
    },

    /**
     * Will be called before start to process each input file
     * @param {Object} scope
     *  @param {File[]} scope.files Parsed input files
     *  @param {File} scope.file Current processing file
     * @param {Object} config Plugin config for processing file
     */
    beforeEach : function(scope, config) {
        console.log(
            '\nBefore start to process file: ', scope.file.config.input,
            '\n\t\t with config: ', config
        );
    },

    /**
     * Will be called on each parsed command
     * @param {Object} scope
     *  @param {File[]} scope.files Parsed input files
     *  @param {File} scope.file Current processing file node
     *  @param {Rule} scope.rule Current processing rule node
     *  @param {Decl} scope.decl Current processing declaration node
     *  @param {Command} scope.command Current processing command
     * @param {Object} config Plugin config for processing file
     */
    process : function(scope, config) {
        var isAngry = config.mood === 'angry',
            isColorExist;

        console.log(
            '\nProcessing command: ' + scope.command.name
        );

            if (scope.decl.prop === 'content') {
                scope.decl.value = isAngry ?
                    '"Fuck off, world!"' :
                    '"I LOVE YOU!"';
            }

            isColorExist = scope.rule.decls.some(function(decl) {
                if (decl.prop === 'color') {
                    decl.value = isAngry ? 'red' : 'pink';

                    return true;
                }

                if ( ! isAngry && decl.prop === 'font-size') {
                    decl.value = '48px';
                }
            });

            if ( ! isColorExist) {
                scope.rule.append({
                    prop : 'color',
                    value : isAngry ? 'red' : 'pink'
                });
            }

            (scope.angrifiedCount || (scope.angrifiedCount = 0));
            scope.angrifiedCount++;
    },

    /**
     * Will be called after each file processing finish
     * @param {Object} scope
     *  @param {File[]} scope.files Parsed input files
     *  @param {File} scope.file Current processing file node
     * @param {Object} config Plugin config for processing file
     */
    afterEach : function(scope, config) {
        console.log(
            '\nAfter finish to process file: ', scope.file.config.input
        );
    },

    /**
     * Will be called after all files processing finish,
     * but before start to write results
     * @param {Object} scope
     *  @param {File[]} scope.files Processed input files
     */
    after : function(scope) {
        console.log(
            '\nAfter finish to process input files',
            '\nAngified items count:' + scope.angrifiedCount
        );
    }

};
