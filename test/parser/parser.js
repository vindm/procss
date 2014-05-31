describe('parser', function() {
    var ASSERT = require('chai').assert,
        PARSER = require('../../lib/parser');

    describe('#parseCommand', function() {

        it('should parse command', function() {
            [
                'blah /*procss.test()*/ blah',
                'blah /*procss.test()*/',
                '/*procss.test()*/ blah',
                '/* procss.test() */'
            ]
                .forEach(function(content) {
                    var parsedCommand = PARSER.parseCommand(content);

                    ASSERT.equal(parsedCommand.name, 'test');
                    ASSERT.equal(parsedCommand.params.length, 0);
                });
        });

        it('should parse command with arguments', function() {
            [
                [ 'arg1', 'arg2' ],
                [ '', 'arg2' ],
                [ '', '' ]
            ]
                .forEach(function(content) {
                    var parsedCommand = PARSER.parseCommand('/* procss.test(' + content.join(', ') + ') */');

                    ASSERT.equal(parsedCommand.name, 'test');
                    ASSERT.equal(parsedCommand.params[0], content[0] || null);
                    ASSERT.equal(parsedCommand.params[1], content[1] || null);
                });
        });

        it('should parse bg-position', function() {
            [
                '0 0',
                '0px 0px'
            ]
                .forEach(function(content) {
                    var parsedPosition = PARSER.parseBgPosition(content);

                    ASSERT.equal(parsedPosition.x, '0px');
                    ASSERT.equal(parsedPosition.y, '0px');
                });
        });

    });

});
