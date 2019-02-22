const path = require('path')

const Schema = require(path.join(__dirname, '..', 'model', 'Schema.js'))
const StreamingAbstractor = require(path.join(__dirname, '..', 'model', 'StreamingAbstractor.js'))
const types = require(path.join(__dirname, 'types.js'))

const typeNameFromElement = (element) => {
	const typeNames = Object.keys(types)

	for (let i = 0; i < typeNames.length; i++) {
		if (types[typeNames[i]] === element.type) return typeNames[i]
	}
}

const importAll = (data) => {
	const parsedSchemas = {}

	const lines = data.split(/(?:\r|\n)+/g).filter((line) => /[a-zA-Z0-9]/.test(line)).map((line) => line.trim().split(/\s+/))

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

const serializeSchema = (schema, schemaName, includedCache, makePrivate = false) => {
	let spec = 'def ' + schemaName + (makePrivate === true ? ' private\n' : '\n')

	const elements = schema.elements

	for (let i = 0; i < elements.length; i++) {
		let formattedProps = ''

		Object.keys(elements[i]).filter((elementProp) => elementProp !== 'name' && elementProp !== 'type').forEach((elementProp) => {
			if (elementProp === 'of') {
				if (includedCache.has(elements[i].of)) {
					formattedProps += ';of=' + includedCache.get(elements[i].of)
				}
				else {
					const genName = Math.floor(Math.random() * 10000)

					spec = serializeSchema(elements[i].of, genName, includedCache, true) + '\n' + spec

					includedCache.set(elements[i].of, genName)

					formattedProps += ';of=' + genName
				}
			}
			else {
				formattedProps += ';' + elementProp + '=' + elements[i][elementProp]
			}
		})

		spec += typeNameFromElement(elements[i]) + ' ' + elements[i].name + ' ' + formattedProps + '\n'
	}

	spec += '\n'

	return spec
}

const exportSpec = (data) => {
	const schemas = data instanceof StreamingAbstractor ? data.eventSchemas : data

	const includedCache = new Map([])

	let buildSpec = ''

	Object.keys(schemas).forEach((schemaName) => {
		buildSpec += serializeSchema(schemas[schemaName], schemaName, includedCache)
	})

	return buildSpec
}

module.exports = {
	importAll,
	importAbstractor,
	exportSpec
}