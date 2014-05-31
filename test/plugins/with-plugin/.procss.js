module.exports = [
	{
		patterns : '**',
		config : {
			plugins : [
				{
					plugin : 'procss-test-plugin',
					config : { process : 'tested' }
				}
			]
		}
	}
];
