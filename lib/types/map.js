const path = require('path')

const Schema = require(path.join(__dirname, '..', '..', 'model', 'Schema.js'))
const list = require(path.join(__dirname, 'list.js'))

const schemaCache = new Map()

const genMapSchema = (data) => {
	if (schemaCache.has(data)) {
		return schemaCache.get(data)
	}
	else {
		const generated = new Schema([
			{
				'name': 'pairs',
				'type': list,
				'of': new Schema([
					Object.assign(data.key, {
						'name': 'key'
					}),
					Object.assign(data.value, {
						'name': 'value'
					})
				])
			}
		])

		schemaCache.set(data, generated)

		return generated
	}
}

module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const mapSchema = genMapSchema(data)

		const parseResult = mapSchema.parse(buf, from, {
			'returnDetails': true
		})

		if (parseResult.hadUnderflow) {
			return {
				'hadUnderflow': true
			}
		}

		const parsedMap = new Map(parseResult.data.pairs.map((pair) => [pair.key, pair.value]))

		return {
			'readBytes': parseResult.finishedIndex - from,
			'data': parsedMap,
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const mapSchema = genMapSchema(data)

		return mapSchema.build({
			'pairs': Array.from(value).map((entry) => new Object({
				'key': entry[0],
				'value': entry[1]
			}))
		})
	}
}