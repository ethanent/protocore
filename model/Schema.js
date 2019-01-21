module.exports = class Schema {
	constructor (schema) {
		this.schema = schema
	}

	parse (buf, from, specialOptions) {
		if (typeof from === 'number') {
			buf = buf.slice(from)
		}

		const protoVersion = buf[0]

		let readIndex = 1

		let hadUnderflow = false

		const readContent = []

		const data = {}

		for (let i = 0; i < this.schema.length; i++) {
			const parserData = this.schema[i]
			const parserType = parserData.type

			const result = parserType.parse(buf, readIndex, parserData) // returns {? data, int readBytes, bool hadUnderflow}

			data[parserData.name] = result.data

			readIndex += result.readBytes

			if (result.hadUnderflow === true) hadUnderflow = true
		}

		if (typeof specialOptions === 'object' && specialOptions.returnDetails === true) {
			return {
				'data': data,
				'finishedIndex': readIndex,
				'underflows': hadUnderflow
			}
		}
		else return data
	}

	build (data) {
		const bufSegments = [Buffer.from([1])]

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

			console.log('Serialize: ' + serializerType + ' ' + writeContent[i].value)

			console.log(serializerData)

			bufSegments.push(serializerType.serialize(writeContent[i].value, serializerData))
		}

		return Buffer.concat(bufSegments)
	}
}
