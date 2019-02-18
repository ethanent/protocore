const path = require('path')

const varint = require(path.join(__dirname, 'varint.js'))

module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const listLengthPrefixData = varint.parsePrefix(buf, from)

		console.log('prefix data')
		console.log(listLengthPrefixData)

		if (buf.length - from - 1 < listLengthPrefixData.totalSize) {
			return {
				'hadUnderflow': true
			}
		}

		const listLength = varint.parse(buf, from).data
		const listStart = from + listLengthPrefixData.totalSize
		const listSchema = data.of

		console.log('list len: ' + listLength)

		const readSchemaOutputs = []

		let listLocation = 0

		for (let listIndex = 0; listIndex < listLength; listIndex++) {
			const specialParseResult = listSchema.parse(buf, listStart + listLocation, {
				'returnDetails': true
			})

			if (specialParseResult.hadUnderflow) {
				return {
					'hadUnderflow': true
				}
			}

			readSchemaOutputs.push(specialParseResult.data)

			listLocation += specialParseResult.finishedIndex
		}

		return {
			'readBytes': listLocation + listLengthPrefixData.totalSize,
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