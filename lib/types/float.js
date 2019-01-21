module.exports = {
	'parse': (buf, from, data) => {
		return {
			'readBytes': 4,
			'data': buf.readFloatLE(from),
			'hadUnderflow': buf.length - from < 4
		}
	},
	'serialize': (value, data) => {
		const make = Buffer.alloc(4)

		make.writeFloatLE(value)

		return make
	}
}