module.exports = class BlockSchema {
	constructor (schema) {
		this.schema = schema
	}

	parse (buf) {
		let readIndex = 0

		const readContent = []

		const componentNames = this.schema.map((component) => component.name)

		for (let i = 0; i < this.schema.length; i++) {
			const activeComponent = this.schema[i]
			const readType = activeComponent.type

			if (readType === 'int8') {
				readContent.push(buf.readInt8(readIndex))

				readIndex += 1
			}
			else if (readType === 'int16') {
				readContent.push(buf.readInt16LE(readIndex))

				readIndex += 2
			}
			else if (readType === 'int32') {
				readContent.push(buf.readInt16LE(readIndex))

				readIndex += 4
			}
			else if (readType === 'uint8') {
				readContent.push(buf.readUInt8(readIndex))

				readIndex += 1
			}
			else if (readType === 'uint16') {
				readContent.push(buf.readUInt16LE(readIndex))

				readIndex += 2
			}
			else if (readType === 'uint32') {
				readContent.push(buf.readUInt32LE(readIndex))

				readIndex += 4
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

				readContent.push(buf.toString(activeComponent.encoding || 'utf8', stringStart, stringStart + stringLength))

				readIndex += 1 + stringLength
			}
		}

		const data = {}

		for (let i = 0; i < componentNames.length; i++) {
			data[componentNames[i]] = readContent[i]
		}

		return data
	}

	build (data) {
		const bufSegments = []

		const writeContent = []

		for (let i = 0; i < this.schema.length; i++) {
			writeContent.push({
				'value': data[this.schema[i].name],
				'type': this.schema[i].type,
				'schema': this.schema
			})
		}

		for (let i = 0; i < writeContent.length; i++) {
			const writeValue = writeContent[i].value
			const writeType = writeContent[i].type
			const writeSchema = writeContent[i].schema

			if (writeType === 'int8') {
				const make = Buffer.alloc(1)

				make.writeInt8(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'int16') {
				const make = Buffer.alloc(2)

				make.writeInt16LE(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'int32') {
				const make = Buffer.alloc(4)

				make.writeInt32LE(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'uint8') {
				const make = Buffer.alloc(1)

				make.writeUInt8(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'uint16') {
				const make = Buffer.alloc(2)

				make.writeUInt16LE(writeValue)

				bufSegments.push(make)
			}
			else if (writeType === 'uint32') {
				const make = Buffer.alloc(4)

				make.writeUInt32LE(writeValue)

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
				const stringBuf = Buffer.from(writeValue, writeSchema.encoding || 'utf8')

				const stringLength = stringBuf.length

				bufSegments.push(Buffer.concat([Buffer.from([stringLength]), stringBuf]))
			}
		}

		return Buffer.concat(bufSegments)
	}
}