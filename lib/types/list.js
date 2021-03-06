const varint = require('./varint.js')

module.exports = {
	'name': 'list',
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const listLengthPrefixData = varint.parsePrefix(buf, from)

		if (buf.length - from < listLengthPrefixData.totalSize) {
			return {
				'hadUnderflow': true
			}
		}

		const listLength = varint.parse(buf, from).data
		const listStart = from + listLengthPrefixData.totalSize
		const listSchema = data.of

		const readSchemaOutputs = []

		let listLocation = listStart

		for (let listIndex = 0; listIndex < listLength; listIndex++) {
			const specialParseResult = listSchema.parse(buf, listLocation, {
				'returnDetails': true
			})

			if (specialParseResult.hadUnderflow) {
				return {
					'hadUnderflow': true
				}
			}

			readSchemaOutputs.push(specialParseResult.data)

			listLocation = specialParseResult.finishedIndex
		}

		return {
			'readBytes': listLocation - from,
			'data': readSchemaOutputs,
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const listLength = value.length
		const listSchema = data.of

		const listLengthBuf = varint.serialize(listLength)

		const listValues = []

		for (let listIndex = 0; listIndex < listLength; listIndex++) {
			listValues.push(listSchema.build(value[listIndex]))
		}

		return Buffer.concat([listLengthBuf].concat(listValues))
	}
}