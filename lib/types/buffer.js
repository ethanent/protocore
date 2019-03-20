const path = require('path')

const varint = require(path.join(__dirname, 'varint.js'))

module.exports = {
	'name': 'buffer',
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const bufLengthPrefixData = varint.parsePrefix(buf, from)

		if (buf.length - from < bufLengthPrefixData.totalSize) {
			return {
				'hadUnderflow': true
			}
		}

		const bufLength = varint.parse(buf, from).data

		if (buf.length - from < bufLengthPrefixData.totalSize + bufLength) {
			return {
				'hadUnderflow': true
			}
		}

		const bufStart = from + bufLengthPrefixData.totalSize

		return {
			'readBytes': bufLengthPrefixData.totalSize + bufLength,
			'data': buf.slice(bufStart, bufStart + bufLength),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const bufLength = value.length

		const bufLengthBuf = varint.serialize(bufLength)

		return Buffer.concat([bufLengthBuf, value])
	}
}