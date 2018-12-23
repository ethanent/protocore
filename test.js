const assert = require('assert')

const w = require('whew')

const {Schema} = require(__dirname)

w.add('Serialize and parse a simple schema', (result) => {
	const mySchema = new Schema([
		{
			'name': 'name',
			'type': 'string'
		},
		{
			'name': 'birthyear',
			'type': 'uint',
			'size': 16
		}
	])

	const data = {
		'name': 'Ethan',
		'birthyear': 3039
	}

	const serialized = mySchema.build(data)

	assert.deepStrictEqual(mySchema.parse(serialized), data)

	result(true)
})

w.add('Serialize and parse a complex schema with a list', (result) => {
	const mySchema = new Schema([
		{
			'name': 'name',
			'type': 'string'
		},
		{
			'name': 'birthyear',
			'type': 'uint',
			'size': 16
		},
		{
			'name': 'organizations',
			'type': 'list',
			'of': new Schema([
				{
					'name': 'name',
					'type': 'string'
				},
				{
					'name': 'founded',
					'type': 'int',
					'size': 16
				}
			])
		},
		{
			'name': 'isgood',
			'type': 'uint',
			'size': 8
		}
	])

	const data = {
		'name': 'Ethan',
		'birthyear': 3039,
		'isgood': 1,
		'organizations': [
			{
				'name': 'Esourceful',
				'founded': 2006
			},
			{
				'name': 'Shh, secret!',
				'founded': 2038
			}
		]
	}

	const serialized = mySchema.build(data)

	assert.deepStrictEqual(mySchema.parse(serialized), data)

	result(true)
})

w.test()