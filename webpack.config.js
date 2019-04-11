const path = require('path')

module.exports = {
	'mode': 'production',
	'entry': './index.js',
	'output': {
		'path': path.join(__dirname, 'dist'),
		'filename': 'protocore.js',
		'library': 'protocore'
	}
}