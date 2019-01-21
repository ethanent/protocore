const assert = require('assert')
const stream = require('stream')

const w = require('whew')

const {Schema, StreamingAbstractor, types} = require(__dirname)

w.add('Schema - Simple', (result) => {
	const mySchema = new Schema([
		{
			'name': 'name',
			'type': types.string
		},
		{
			'name': 'alive',
			'type': types.boolean
		},
		{
			'name': 'birthyear',
			'type': types.uint,
			'size': 16
		}
	])

	const data = {
		'name': 'Ethan',
		'alive': true,
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
			'type': types.string
		},
		{
			'name': 'birthyear',
			'type': types.uint,
			'size': 16
		},
		{
			'name': 'organizations',
			'type': types.list,
			'of': new Schema([
				{
					'name': 'name',
					'type': types.string
				},
				{
					'name': 'founded',
					'type': types.int,
					'size': 16
				}
			])
		},
		{
			'name': 'isgood',
			'type': types.boolean
		}
	])

	const data = {
		'name': 'Ethan',
		'birthyear': 3039,
		'isgood': true,
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
			'type': types.string
		},
		{
			'name': 'number',
			'type': types.uint,
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

w.add('StreamingAbstractor - Proper buffer buffering', (result) => {
	const messageSchema = new Schema([
		{
			'name': 'content',
			'type': types.string
		}
	])

	const myAbstractor1 = new StreamingAbstractor()

	myAbstractor1.register('message', messageSchema)

	let recievedCount = 0

	myAbstractor1.on('message', (data) => {
		recievedCount++

		if (recievedCount === 2 && data.content === 'Hello2!') {
			result(true, 'Got 2 messages.')
		}
	})

	myAbstractor1._write(Buffer.concat([
		StreamingAbstractor.abstractorSchema.build({
			'event': 'message',
			'serialized': messageSchema.build({
				'content': 'Hello!'
			})
		}),
		StreamingAbstractor.abstractorSchema.build({
			'event': 'message',
			'serialized': messageSchema.build({
				'content': 'Hello2!'
			})
		})
	]))
})

w.test()
