module.exports = {
	'parse': (buf, from, data) => {
		const bufLengthLength = 4

		const bufLength = buf.readUIntLE(from, bufLengthLength)
		const bufStart = from + bufLengthLength

		return {
			'readBytes': bufLengthLength + bufLength,
			'data': buf.slice(bufStart, bufStart + bufLength),
			'hadUnderflow': buf.length - from < bufLength + bufLengthLength
		}
	},
	'serialize': (value, data) => {
		const bufLengthLength = 4

		const bufLength = value.length

		const bufLengthBuf = Buffer.alloc(bufLengthLength)

		bufLengthBuf.writeUIntLE(bufLength, 0, bufLengthLength)

		return Buffer.concat([bufLengthBuf, value])
	}
}