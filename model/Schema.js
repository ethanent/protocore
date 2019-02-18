module.exports = class Schema {
	constructor (schema) {
		this.schema = schema
	}

	parse (buf, from, specialOptions) {
		if (typeof from === 'number') {
			buf = buf.slice(from)
		}

		let readIndex = 0

		let hadUnderflow = false

		const readContent = []

		const data = {}

		for (let i = 0; i < this.schema.length; i++) {
			const parserData = this.schema[i]
			const parserType = parserData.type

			const result = parserType.parse(buf, readIndex, parserData) // returns {? data, int readBytes, bool hadUnderflow}

			if (result.hadUnderflow === true) {
				hadUnderflow = true

				continue
			}

			data[parserData.name] = result.data

			readIndex += result.readBytes
		}

		if (typeof specialOptions === 'object' && specialOptions.returnDetails === true) {
			return {
				'data': data,
				'finishedIndex': readIndex,
				'hadUnderflow': hadUnderflow
			}
		}
		else return data
	}

	build (data) {
		const bufSegments = []

		const writeContent = []

		for (let i = 0; i < this.schema.length; i++) {
			writeContent.push({
				'value': data[this.schema[i].name],
				'serializerData': this.schema[i]
			})
		}

		for (let i = 0; i < writeContent.length; i++) {
			const serializerData = writeContent[i].serializerData
			const serializerType = serializerData.type

			bufSegments.push(serializerType.serialize(writeContent[i].value, serializerData))
		}

		return Buffer.concat(bufSegments)
	}
}
