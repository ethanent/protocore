const path = require('path')
const {Duplex} = require('stream')

const Schema = require(path.join(__dirname, 'Schema.js'))
const types = require(path.join(__dirname, '..', 'lib', 'types.js'))

const abstractorSchema = new Schema([
	{
		'name': 'event',
		'type': types.string
	},
	{
		'name': 'serialized',
		'type': types.buffer
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

		const parsedAbstract = abstractorSchema.parse(this.activeBuffer, 0, {
			'returnDetails': true
		})

		const correlatedEvent = this.eventSchemas[parsedAbstract.data.event]

		if (!correlatedEvent) {
			this.emit('unregisteredEvent', parsedAbstract.data)

			this.activeBuffer = Buffer.alloc(0)
		}
		else {
			const correlatedParseResult = correlatedEvent.parse(parsedAbstract.data.serialized)

			if (!parsedAbstract.hadUnderflow) {
				this.emit(parsedAbstract.data.event, correlatedParseResult)

				this.activeBuffer = this.activeBuffer.slice(parsedAbstract.finishedIndex)

				if (this.activeBuffer.length > 0) this._write(Buffer.alloc(0))
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

module.exports.abstractorSchema = abstractorSchema