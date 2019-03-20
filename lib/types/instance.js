module.exports = {
	'name': 'instance',
	'parse': (buf, from, data) => {
		const parseResult = data.of.parse(buf, from, {
			'returnDetails': true
		})

		if (parseResult.hadUnderflow === true) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': parseResult.finishedIndex - from,
			'data': parseResult.data,
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		return data.of.build(value)
	}
}