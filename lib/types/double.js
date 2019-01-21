module.exports = {
	'parse': (buf, from, data) => {
		return {
			'readBytes': 8,
			'data': buf.readDoubleLE(from),
			'hadUnderflow': buf.length - from < 8
		}
	},
	'serialize': (value, data) => {
		const make = Buffer.alloc(8)

		make.writeDoubleLE(value)

		return make
	}
}