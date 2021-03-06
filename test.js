const assert = require('assert')
const stream = require('stream')

const w = require('whew')

const {Schema, StreamingAbstractor, types, protospec} = require(__dirname)

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
		},
		{
			'name': 'decimal',
			'type': types.double
		}
	])

	const data = {
		'name': 'Ethan',
		'alive': true,
		'birthyear': 3039,
		'decimal': 5.135
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
				},
				{
					'name': 'value',
					'type': types.varint
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
				'founded': 2006,
				'value': 13422342
			},
			{
				'name': 'Shh, secret!',
				'founded': 2038,
				'value': 0
			},
			{
				'name': 'Test',
				'founded': 0,
				'value': -134223424
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

w.add('Buffer serialization and parsing', (result) => {
	const fileSchema = new Schema([
		{
			'name': 'data',
			'type': types.buffer
		}
	])

	const data = Buffer.from('HELLO THERE!')

	const built = fileSchema.build({
		'data': data
	})

	const parsed = fileSchema.parse(built)

	result(data.equals(parsed.data), parsed.data.toString())
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

		if (recievedCount === 3 && data.content === 'Hey there.') {
			result(true, 'Got 3 messages.')
		}
	})

	myAbstractor1._write(Buffer.concat([
		StreamingAbstractor.abstractorSchema.build({
			'event': 'message',
			'mode': 0,
			'serialized': messageSchema.build({
				'content': 'Hello!'
			})
		}),
		StreamingAbstractor.abstractorSchema.build({
			'event': 'message',
			'mode': 0,
			'serialized': messageSchema.build({
				'content': 'Hello2!'
			})
		})
	]))

	const build = StreamingAbstractor.abstractorSchema.build({
		'event': 'message',
		'mode': 0,
		'serialized': messageSchema.build({
			'content': 'Hey there.'
		})
	})

	// Chunk message

	myAbstractor1._write(build.slice(0, 15))

	myAbstractor1._write(build.slice(15))
})

w.add('Varint serialization and parsing', (result) => {
	const varint = types.varint

	const testNumbers = [255, 256, 257, 258, 16777215, 16777216, 16777217, -255, -256, -257, -16777215, -16777216]

	for (let i = 0; i < testNumbers.length; i++) {
		const gen = varint.serialize(testNumbers[i], {})

		const parsed = varint.parse(gen, 0, {})

		if (parsed.data !== testNumbers[i]) {
			result(false, parsed.data + ' !== ' + testNumbers[i])
			return
		}
	}

	result(true, 'Comparisons succeeded')
})

w.add('Protospec - Importing schemas', (result) => {
	const schemas = protospec.importAll(`
		def friend
		string name    
		int age size=16     

		// comment!?

       

		   def person
		string name
		  int age size=16
		list friends of=friend
	`).schemas

	const personSchema = schemas['person']

	const person = {
		'name': 'H. Wells',
		'age': 24836,
		'friends': [
			{
				'name': 'Q. Wells',
				'age': 24834
			},
			{
				'name': 'Ethan',
				'age': 5874
			}
		]
	}

	const built = personSchema.build(person)

	assert.deepStrictEqual(personSchema.parse(built), person)

	result(true, 'Comparisons succeeded')
})

w.add('Protospec - Importing as abstractor', (result) => {
	const myAbstractor = protospec.importAbstractor(`
		def user private
		string username
		varint friendCount

		def message
		list seenBy of=user
		string content

		def login public
		string username
		string password
	`)

	result(myAbstractor.eventSchemas.hasOwnProperty('login') && myAbstractor.eventSchemas.hasOwnProperty('message') && !myAbstractor.eventSchemas.hasOwnProperty('user') && myAbstractor.eventSchemas.message.elements.findIndex((element) => element.of.elements.findIndex((element2) => element2.name === 'friendCount') !== -1) !== -1, 'Attempted to validate resulting abstractor.')
})

w.add('Instance type functionality', (result) => {
	const personSchema = protospec.importAll(`

		def address private
		string country
		string region
		string street
		int number size=24

		def company private
		string name
		instance address of=address

		def person
		string name
		instance currentCompany of=company

	`).schemas.person

	const person = {
		'name': 'Ethan',
		'currentCompany': {
			'name': 'Esourceful',
			'address': {
				'country': 'US',
				'region': 'CA',
				'street': 'Corporation Ave.',
				'number': 5135
			}
		}
	}

	const built = personSchema.build(person)

	assert.deepStrictEqual(person, personSchema.parse(built))

	result(true, 'Validated built data.')
})

w.add('Map type functionality', (result) => {
	const mapSchema = new Schema([
		{
			'name': 'info',
			'type': types.map,
			'key': {
				'type': types.string
			},
			'value': {
				'type': types.string
			}
		}
	])

	const testData = {
		'info': new Map([
			['name', 'Person A'],
			['location', 'Earth'],
			['status', 'online']
		])
	}

	const built = mapSchema.build(testData)

	assert.deepStrictEqual(testData, mapSchema.parse(built))

	result(true, 'Validated built data.')
})

w.add('Map protospec functionality', (result) => {
	const mapSchema = protospec.importAll(`

		def infoData
		map info key=string;value=string

	`).schemas.infoData

	const testData = {
		'info': new Map([
			['name', 'Person A'],
			['location', 'Earth'],
			['status', 'online']
		])
	}

	const built = mapSchema.build(testData)

	assert.deepStrictEqual(testData, mapSchema.parse(built))

	result(true, 'Validated built data. (Protospec success!)')
})

w.add('Detect missing elements', (result) => {
	const testSchema = protospec.importAll(`

		def ping
		varint time

	`).ping

	const testData = {
		
	}

	try {
		testSchema.build(testData)
	}
	catch (err) {
		result(true, 'Error as expected.')

		return
	}

	result(false, 'Expected error to be thrown.')
})

w.add('Request and response', async (result) => {
	const testAbstractor = () => protospec.importAbstractor(`

		def setName private
		string name

		def welcomeName private
		string response

		exchange hello
		request setName
		response welcomeName

		def hello_unused
		string greeting

	`)

	const a1 = testAbstractor()

	const a2 = testAbstractor()

	a1.bind(a2)

	a1.on('hello', (data, res) => {
		res({
			'response': 'Hello, ' + data.name + '!'
		})
	})

	const res1 = await a2.request('hello', {
		'name': 'Ethan'
	})

	const res2 = await a2.request('hello', {
		'name': 'Tester'
	})

	const res3 = await a2.request('hello', {
		'name': 'Yolanda'
	})

	result(res1.response === 'Hello, Ethan!' && res2.response === 'Hello, Tester!' && res3.response === 'Hello, Yolanda!')
})

w.test()

process.stdin.on('data', () => {})