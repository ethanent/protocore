module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 8) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': 8,
			'data': buf.readDoubleLE(from),
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const make = Buffer.alloc(8)

		make.writeDoubleLE(value)

		return make
	}
}