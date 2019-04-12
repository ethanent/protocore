const Schema = require('./../model/Schema.js')
const StreamingAbstractor = require('./../model/StreamingAbstractor.js')
const types = require('./types.js')

const importAll = (data) => {
	const parsedSchemas = {}
	const parsedExchanges = {}

	const lines = data.toString().split(/(?:\r|\n)+/g).filter((line) => /[a-zA-Z0-9]/.test(line)).map((line) => line.trim().split(/\s+/))

	let activeDef = null
	let activeDefType = null

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]

		if (line[0] === 'def') {
			parsedSchemas[line[1]] = new Schema([])
			activeDef = line[1]
			activeDefType = 'schema'

			if (line.length > 2 && line[2] === 'private') {
				parsedSchemas[line[1]].privacy = 'private'
			}
			else {
				parsedSchemas[line[1]].privacy = 'public'
			}
		}
		else if (line[0] === 'exchange') {
			activeDef = line[1]
			activeDefType = 'exchange'

			parsedExchanges[activeDef] = {}
		}
		else if (line[0] === 'request' || line[0] === 'response') {
			if (activeDefType !== 'exchange') {
				throw new Error('Cannot specify request and response schemas of a non-exchange. (:' + i + ')')
			}

			if (!parsedSchemas.hasOwnProperty(line[1])) {
				throw new Error('Schema \'' + line[1] + '\' has not been defined. (:' + i + ')')
			}

			const specifySchema = parsedSchemas[line[1]]

			const setProp = line[0] === 'response' ? 'responseSchema' : 'requestSchema'

			parsedExchanges[activeDef][setProp] = specifySchema
		}
		else if (line[0] !== '//') {
			if (activeDef === null) {
				throw new Error('Cannot define terms until a schema is defined. (:' + i + ')')
			}

			if (activeDefType !== 'schema') {
				throw new Error('Cannot specify typed properties of a non-schema. (:' + i + ')')
			}

			if (!types.hasOwnProperty(line[0])) {
				throw new Error('Bad type \'' + line[0] + '\'. (:' + i + ')')
			}

			const elementDefinition = {
				'name': line[1],
				'type': types[line[0]]
			}

			if (line.length > 2) {
				const optDefs = line[2].split(';').filter((optdef) => optdef.length > 1).map((optdef) => optdef.split('='))

				const options = {}

				optDefs.forEach((optdef) => options[optdef[0]] = optdef[1])

				if (options.hasOwnProperty('size')) {
					options.size = Number(options.size)
				}

				if (options.hasOwnProperty('of')) {
					if (!parsedSchemas.hasOwnProperty(options.of)) {
						throw new Error('Schema \'' + options.of + '\' does not exist. (:' + i + ')')
					}

					options.of = parsedSchemas[options.of]
				}

				if (options.hasOwnProperty('key')) {
					if (!types.hasOwnProperty(options.key)) throw new Error('Type \'' + options.key + '\' does not exist. (:' + i + ')')

					options.key = {
						'type': types[options.key]
					}
				}

				if (options.hasOwnProperty('value')) {
					if (!types.hasOwnProperty(options.value)) throw new Error('Type \'' + options.value + '\' does not exist. (:' + i + ')')

					options.value = {
						'type': types[options.value]
					}
				}

				Object.assign(elementDefinition, options)
			}

			parsedSchemas[activeDef].elements.push(elementDefinition)
		}
	}

	const finalSchemas = {}

	const schemaNames = Object.keys(parsedSchemas)

	for (let i = 0; i < schemaNames.length; i++) {
		const currentSchema = parsedSchemas[schemaNames[i]]

		if (currentSchema.privacy === 'public') {
			finalSchemas[schemaNames[i]] = currentSchema
		}
	}

	return {
		'schemas': finalSchemas,
		'exchanges': parsedExchanges
	}
}

const importAbstractor = (data) => {
	const importResult = importAll(data)
	const schemaNames = Object.keys(importResult.schemas)

	const builtAbstractor = new StreamingAbstractor()

	for (let i = 0; i < schemaNames.length; i++) {
		builtAbstractor.register(schemaNames[i], importResult.schemas[schemaNames[i]])
	}

	const exchangeNames = Object.keys(importResult.exchanges)

	for (let i = 0; i < exchangeNames.length; i++) {
		builtAbstractor.registerExchange(exchangeNames[i], importResult.exchanges[exchangeNames[i]])
	}

	return builtAbstractor
}

module.exports = {
	importAll,
	importAbstractor
}