module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from < 1) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': 1,
			'data': buf[from] === 1,
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		return Buffer.from([value === true ? 1 : 0])
	}
}