module.exports = {
	'parse': (buf, from, data) => {
		return {
			'readBytes': 1,
			'data': buf[from] === 1,
			'hadUnderflow': buf.length - from < 1
		}
	},
	'serialize': (value, data) => {
		return Buffer.from([value === true ? 1 : 0])
	}
}