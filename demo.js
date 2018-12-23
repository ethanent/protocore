const Schema = require('./')

const mySchema = new Schema([
	{
		'name': 'name',
		'type': 'string',
		'encoding': 'utf8'
	},
	{
		'name': 'age',
		'type': 'uint',
		'size': 8
	},
	{
		'name': 'randomNumber',
		'type': 'int',
		'size': 32
	},
	{
		'name': 'message',
		'type': 'string',
		'encoding': 'ascii'
	}
])

const originalData = {
	'name': 'Ethan',
	'age': 17,
	'randomNumber': -197,
	'message': 'Hello :)'
}

const built = mySchema.build(originalData)

console.log('-- Built Buffer --')

console.log(built)

console.log('As string: ' + built.toString())

console.log('Size (bytes): ' + built.length)

console.log('-- JSON Stringified --')

const stringified = JSON.stringify(originalData)

console.log('As string: ' + stringified)

console.log('Size (bytes): ' + Buffer.from(stringified).length)

console.log('-- Parsed Buffer --')

console.log(mySchema.parse(built))