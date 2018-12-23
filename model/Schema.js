module.exports = class Schema {
	constructor (schema) {
		this.schema = schema
	}

	parse (buf, from, specialOptions) {
		if (typeof from === 'number') {
			buf = buf.slice(from)
		}

		let readIndex = 0

		const readContent = []

		const componentNames = this.schema.map((component) => component.name)

		for (let i = 0; i < this.schema.length; i++) {
			const readSchema = this.schema[i]
			const readType = readSchema.type

			if (readType === 'int') {
				const readBytes = readSchema.size / 8

				readContent.push(buf.readIntLE(readIndex, readBytes))

				readIndex += readBytes
			}
			else if (readType === 'uint') {
				const readBytes = readSchema.size / 8

				readContent.push(buf.readUIntLE(readIndex, readBytes))

				readIndex += readBytes
			}
			else if (readType === 'float') {
				readContent.push(buf.readFloatLE(readIndex))

				readIndex += 4
			}
			else if (readType === 'double') {
				readContent.push(buf.readDoubleLE(readIndex))

				readIndex += 8
			}
			else if (readType === 'string') {
				const stringLength = buf[readIndex]
				const stringStart = readIndex + 1

				readContent.push(buf.toString(readSchema.encoding, stringStart, stringStart + stringLength))

				readIndex += 1 + stringLength
			}
			else if (readType === 'list') {
				const listLengthLength = 4

				const listLength = buf.readUIntLE(readIndex, listLengthLength)
				const listStart = readIndex + listLengthLength
				const listSchema = readSchema.of

				const readSchemaOutputs = []

				let listLocation = 0

				for (let listIndex = 0; listIndex < listLength; listIndex++) {
					const specialParseResult = listSchema.parse(buf, listStart + listLocation, {
						'returnDetails': true
					})

					readSchemaOutputs.push(specialParseResult.data)

					listLocation += specialParseResult.finishedIndex
				}

				readContent.push(readSchemaOutputs)

				readIndex += listLocation + listLengthLength
			}
		}

		const data = {}

		for (let i = 0; i < componentNames.length; i++) {
			data[componentNames[i]] = readContent[i]
		}

		if (typeof specialOptions === 'object' && specialOptions.returnDetails === true) {
			return {
				'finishedIndex': readIndex,
				'data': data
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
				'schema': this.schema[i]
			})
		}

		for (let i = 0; i < writeContent.length; i++) {
			const writeSchema = writeContent[i].schema
			const writeType = writeSchema.type

			const writeValue = writeContent[i].value

			if (writeType === 'int') {
				const makeBytes = writeSchema.size / 8

				const make = Buffer.alloc(makeBytes)

				make.writeIntLE(writeValue, 0, makeBytes)

				bufSegments.push(make)
			}
			else if (writeType === 'uint') {
				const makeBytes = writeSchema.size / 8

				const make = Buffer.alloc(makeBytes)

				make.writeUIntLE(writeValue, 0, makeBytes)

				bufSegments.push(make)
			}
			else if (writeType === 'float') {
				const make = Buffer.alloc(4)

				make.writeFloatLE(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'double') {
				const make = Buffer.alloc(8)

				make.writeFloatLE(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'string') {
				const stringBuf = Buffer.from(writeValue, writeSchema.encoding)

				const stringLength = stringBuf.length

				bufSegments.push(Buffer.concat([Buffer.from([stringLength]), stringBuf]))
			}
			else if (writeType === 'list') {
				const listLengthLength = 4

				const listLength = writeValue.length
				const listSchema = writeSchema.of

				const listLengthBuf = Buffer.alloc(listLengthLength)

				listLengthBuf.writeUIntLE(listLength, 0, listLengthLength)

				const listValues = []

				for (let listIndex = 0; listIndex < listLength; listIndex++) {
					listValues.push(listSchema.build(writeValue[listIndex]))
				}

				bufSegments.push(Buffer.concat([listLengthBuf].concat(listValues)))
			}
		}

		return Buffer.concat(bufSegments)
	}
}