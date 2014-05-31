module.exports = [
	{
		patterns : '**/patterns/**',
		config : {
			output : 'changed_?.css',
			plugins : [ 'some-plugin' ]
		}
	},
	{
		patterns : [ '**/patterns/a.css', '**/patterns/dirB/*.css' ],
		config : {
			output : 'changed-once-more_?.css'
		}
	}
];
