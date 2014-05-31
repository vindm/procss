module.exports = {

    beforeEach : function(scope, config) {
        config || (config = {});
        if (typeof config.beforeEach === 'undefined') {
            return;
        }

        if (typeof config.beforeEach === 'function') {
            config.beforeEach(scope, config);
        } else {
            scope.file.parsed.prepend(scope.pcss.comment({ text : config.beforeEach }));
        }
    },

    process : function(scope, config) {
        config || (config = {});
        if (scope.command.name !== 'test' || typeof config.process === 'undefined') {
            return;
        }

        if (typeof config.process === 'function') {
            config.process(scope, config);
        } else {
            scope.rule.append({
                prop : '-procss-content',
                value : config.process
            });
        }
    },

    afterEach : function(scope, config) {
        config || (config = {});
        if (typeof config.afterEach === 'undefined') {
            return;
        }

        if (typeof config.afterEach === 'function') {
            config.afterEach(scope, config);
        } else {
            scope.file.parsed.append(scope.pcss.comment({ text : config.afterEach }));
        }
    }

};
