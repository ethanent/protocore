const types = {}

const typeNames = ['int', 'uint', 'varint', 'float', 'double', 'boolean', 'string', 'buffer', 'list', 'map', 'instance']

for (let i = 0; i < typeNames.length; i++) {
	types[typeNames[i]] = require('./types/' + typeNames[i] + '.js')
}

module.exports = types