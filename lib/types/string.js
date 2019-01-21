module.exports = {
	'parse': (buf, from, data) => {
		const stringLengthLength = 4

		if (buf.length - from < stringLengthLength) {
			return {
				'hadUnderflow': true
			}
		}

		const stringLength = buf.readUIntLE(from, stringLengthLength)
		const stringStart = from + stringLengthLength

		if (buf.length - from < stringLength + stringLengthLength) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': stringLengthLength + stringLength,
			'data': buf.toString(data.encoding, stringStart, stringStart + stringLength),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const stringLengthLength = 4

		const stringBuf = Buffer.from(value, data.encoding)

		const stringLength = stringBuf.length

		const stringLengthBuf = Buffer.alloc(stringLengthLength)

		stringLengthBuf.writeUIntLE(stringLength, 0, stringLengthLength)

		return Buffer.concat([stringLengthBuf, stringBuf])
	}
}