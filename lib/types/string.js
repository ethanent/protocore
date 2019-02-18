const path = require('path')

const varint = require(path.join(__dirname, 'varint.js'))

module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const stringLengthPrefixData = varint.parsePrefix(buf, from)

		if (buf.length - from < stringLengthPrefixData.totalSize) {
			return {
				'hadUnderflow': true
			}
		}

		const stringLength = varint.parse(buf, from).data

		const stringStart = from + stringLengthPrefixData.totalSize

		if (buf.length - from < stringLength + stringLengthPrefixData.totalSize) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': stringLengthPrefixData.totalSize + stringLength,
			'data': buf.toString(data.encoding, stringStart, stringStart + stringLength),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const stringBuf = Buffer.from(value, data.encoding)

		const stringLength = stringBuf.length

		const stringLengthBuf = varint.serialize(stringLength)

		return Buffer.concat([stringLengthBuf, stringBuf])
	}
}