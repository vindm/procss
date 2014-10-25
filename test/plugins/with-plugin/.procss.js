module.exports = [ {
    file_paths : '**/*.css',
    config : {
        plugins : [ {
            plugin : 'procss-test-plugin',
            config : { process : 'tested' }
        } ]
    }
} ];
