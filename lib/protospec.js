const path = require('path')

const Schema = require(path.join(__dirname, '..', 'model', 'Schema.js'))
const StreamingAbstractor = require(path.join(__dirname, '..', 'model', 'StreamingAbstractor.js'))
const types = require(path.join(__dirname, 'types.js'))

const importAll = (data) => {
	const parsedSchemas = {}

	const lines = data.toString().split(/(?:\r|\n)+/g).filter((line) => /[a-zA-Z0-9]/.test(line)).map((line) => line.trim().split(/\s+/))

	let activeDef = null

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]

		if (line[0] === 'def') {
			parsedSchemas[line[1]] = new Schema([])
			activeDef = line[1]

			if (line.length > 2 && line[2] === 'private') {
				parsedSchemas[line[1]].privacy = 'private'
			}
			else {
				parsedSchemas[line[1]].privacy = 'public'
			}
		}
		else if (line[0] !== '//') {
			if (activeDef === null) {
				throw new Error('Cannot define terms until a schema is defined. (:' + i + ')')
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

	return finalSchemas
}

const importAbstractor = (data) => {
	const schemas = importAll(data)
	const schemaNames = Object.keys(schemas)

	const builtAbstractor = new StreamingAbstractor()

	for (let i = 0; i < schemaNames.length; i++) {
		builtAbstractor.register(schemaNames[i], schemas[schemaNames[i]])
	}

	return builtAbstractor
}

module.exports = {
	importAll,
	importAbstractor
}