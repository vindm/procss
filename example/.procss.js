module.exports = [

    // common config
    {
        file_paths : '**/*.css',
        config : {
            output : '?.happy.pro'
        }
    },

    // specific demoA.css config
    {
        file_paths : '**/*A.css',
        config : {
            output : '?.angry.pro',
            plugins : [ {
                plugin : './plugin',
                config : { mood : 'angry' }
            } ]
        }
    },

    // specific demoB.css config
    {
        file_paths : '**/*B.css',
        config : {
            plugins : [ {
                plugin : './plugin',
                config : { mood : 'happy' }
            } ]
        }
    }

];
