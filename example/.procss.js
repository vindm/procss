module.exports = [

    // common config
    {
        patterns : [ '**/*.css' ],
        config : {
            output : '?.happy.pro'
        }
    },

    // demoA.css config
    {
        patterns : [ '**/*A.css' ],
        config : {
            output : '?.angry.pro',
            plugins : [
                {
                    plugin : './plugin',
                    config : { mood : 'angry' }
                }
            ]
        }
    },

    // demoB.css config
    {
        patterns : [ '**/*B.css' ],
        config : {
            plugins : [
                {
                    plugin : './plugin',
                    config : { mood : 'happy' }
                }
            ]
        }
    }

];
