const path = require('path');

module.exports = {
	entry: './src/scripts/index.js',
	output: {
		path: path.resolve(__dirname, 'static'),
		filename: 'index.min.js'
	}
}