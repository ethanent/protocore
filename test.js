const assert = require('assert')
const stream = require('stream')

const w = require('whew')

const {Schema, StreamingAbstractor} = require(__dirname)

w.add('Schema - Simple', (result) => {
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

	result(true, 'Verified data integrity.')
})

w.add('Schema - Lists, complex', (result) => {
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

	const parsed = mySchema.parse(serialized)

	assert.deepStrictEqual(parsed, data)

	result(true, 'Verified data integrity.')
})

w.add('StreamingAbstractor - Event handling + sending', (result) => {
	const loginSchema = new Schema([
		{
			'name': 'username',
			'type': 'string'
		},
		{
			'name': 'number',
			'type': 'uint',
			'size': 16
		}
	])

	const myAbstractor1 = new StreamingAbstractor()

	myAbstractor1.register('login', loginSchema)

	myAbstractor1.on('login', (data) => {
		if (data.username === 'test' && data.number === 5135) {
			result(true, 'Verified data integrity.')
		}
		else result(false)
	})

	const myAbstractor2 = new StreamingAbstractor()

	myAbstractor2.pipe(myAbstractor1)

	myAbstractor2.register('login', loginSchema)

	myAbstractor2.send('login', {
		'username': 'test',
		'number': 5135
	})
})

w.test()