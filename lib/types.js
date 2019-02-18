const path = require('path')
const fs = require('fs')

const types = {}

const typeNames = ['int', 'uint', 'varint', 'float', 'double', 'boolean', 'string', 'buffer', 'list']

for (let i = 0; i < typeNames.length; i++) {
	types[typeNames[i]] = require(path.join(__dirname, 'types', typeNames[i] + '.js'))
}

module.exports = types