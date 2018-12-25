const path = require('path')
const {Duplex} = require('stream')

const Schema = require(path.join(__dirname, 'Schema.js'))

const abstractorSchema = new Schema([
	{
		'name': 'event',
		'type': 'string'
	},
	{
		'name': 'serialized',
		'type': 'buffer'
	}
])

module.exports = class StreamingAbstractor extends Duplex {
	constructor () {
		super()

		this.activeBuffer = Buffer.alloc(0)
		this.eventSchemas = {}
	}

	register (eventName, schema) {
		this.eventSchemas[eventName] = schema
	}

	_write (data, encoding, next) {
		this.activeBuffer = Buffer.concat([this.activeBuffer, data])

		const parsedAbstract = abstractorSchema.parse(this.activeBuffer)

		const correlatedEvent = this.eventSchemas[parsedAbstract.event]

		if (!correlatedEvent) {
			this.emit('unregisteredEvent', parsedAbstract)
		}
		else {
			const correlatedParseResult = correlatedEvent.parse(parsedAbstract.serialized, 0, {
				'returnDetails': true
			})

			if (!correlatedParseResult.hadUnderflow) {
				this.emit(parsedAbstract.event, correlatedParseResult.data)

				this.activeBuffer = Buffer.alloc(0)
			}
		}

		if (next) next()
	}

	_read (size) {

	}

	send (eventName, data) {
		this.push(abstractorSchema.build({
			'event': eventName,
			'serialized': this.eventSchemas[eventName].build(data)
		}))
	}
}