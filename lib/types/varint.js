const calcBytes = (number) => {
	if (number < 0) number = Math.abs(number)

	let bytes = 1

	while (Math.pow(256, bytes) <= number) {
		bytes++
	}

	return bytes
}

module.exports = {
	'parse': (buf, from, data) => {
		if (buf.length - from - 1 < 1) {
			return {
				'hadUnderflow': true
			}
		}

		const prefix = buf[from]

		const sign = prefix > 127 ? -1 : 1

		const uintBytes = sign === -1 ? prefix - 127 : prefix + 1

		if (buf.length - from - 1 < uintBytes) {
			return {
				'hadUnderflow': true
			}
		}

		return {
			'readBytes': uintBytes + 1,
			'data': buf.readUIntLE(from + 1, uintBytes) * sign,
			'hadUnderflow': false
		}
	},
	'serialize': (value, data) => {
		const makeBytes = calcBytes(value)

		const make = Buffer.alloc(1 + makeBytes)

		const prefix = value < 0 ? 127 + makeBytes : makeBytes - 1

		make[0] = prefix

		make.writeUIntLE(Math.abs(value), 1, makeBytes)

		return make
	}
}