module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 4) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': 4,
			'data': buf.readFloatLE(from),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const make = Buffer.alloc(4)

		make.writeFloatLE(value)

		return make
	}
}