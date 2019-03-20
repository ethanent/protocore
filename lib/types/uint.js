module.exports = {
	'name': 'uint',
	'parse': (buf, from, data) => {
		const readBytes = data.size / 8

		if (buf.length - from < readBytes) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': readBytes,
			'data': buf.readUIntLE(from, readBytes),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const makeBytes = data.size / 8

		const make = Buffer.alloc(makeBytes)

		make.writeUIntLE(value, 0, makeBytes)

		return make
	}
}