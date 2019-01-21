module.exports = {
	'parse': (buf, from, data) => {
		const readBytes = data.size / 8

		return {
			'readBytes': readBytes,
			'data': buf.readUIntLE(from, readBytes),
			'hadUnderflow': buf.length - from < readBytes
		}
	},
	'serialize': (value, data) => {
		const makeBytes = data.size / 8

		const make = Buffer.alloc(makeBytes)

		make.writeUIntLE(value, 0, makeBytes)

		return make
	}
}