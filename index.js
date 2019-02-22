const path = require('path')

module.exports = {
	'Schema': require(path.join(__dirname, 'model', 'Schema.js')),
	'StreamingAbstractor': require(path.join(__dirname, 'model', 'StreamingAbstractor.js')),
	'types': require(path.join(__dirname, 'lib', 'types.js')),
	'protospec': require(path.join(__dirname, 'lib', 'protospec.js'))
}