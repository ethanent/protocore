module.exports = {
	'parse': (buf, from, data) => {
		const listLengthLength = 4

		const listLength = buf.readUIntLE(from, listLengthLength)
		const listStart = from + listLengthLength
		const listSchema = data.of

		const readSchemaOutputs = []

		let listLocation = 0

		for (let listIndex = 0; listIndex < listLength; listIndex++) {
			const specialParseResult = listSchema.parse(buf, listStart + listLocation, {
				'returnDetails': true
			})

			readSchemaOutputs.push(specialParseResult.data)

			listLocation += specialParseResult.finishedIndex
		}

		return {
			'readBytes': listLocation + listLengthLength,
			'data': readSchemaOutputs,
			'hadUnderflow': buf.length - from < listLengthLength + listLocation
		}
	},
	'serialize': (value, data) => {
		const listLengthLength = 4

		const listLength = value.length
		const listSchema = data.of

		const listLengthBuf = Buffer.alloc(listLengthLength)

		listLengthBuf.writeUIntLE(listLength, 0, listLengthLength)

		const listValues = []

		for (let listIndex = 0; listIndex < listLength; listIndex++) {
			listValues.push(listSchema.build(value[listIndex]))
		}

		return Buffer.concat([listLengthBuf].concat(listValues))
	}
}