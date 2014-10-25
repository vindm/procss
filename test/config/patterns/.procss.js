module.exports = [
    {
        file_paths : '**/patterns/**',
        config : {
            output : 'changed_?.css',
            plugins : [ 'some-plugin' ]
        }
    },
    {
        file_paths : [ '**/patterns/a.css', '**/patterns/dirB/*.css' ],
        config : {
            output : 'changed-once-more_?.css'
        }
    }
];
