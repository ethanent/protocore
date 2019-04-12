const {Duplex} = require('stream')
const EventEmitter = require('events')

const Schema = require('./Schema.js')
const types = require('./../lib/types.js')

const abstractorSchema = new Schema([
	{
		'name': 'event',
		'type': types.string
	},
	{// 0=non-exchange, 1=req, 2=res
		'name': 'mode',
		'type': types.uint,
		'size': 8
	},
	{
		'name': 'serialized',
		'type': types.buffer
	}
])

const exchangeSchema = new Schema([
	{
		'name': 'id',
		'type': types.varint
	},
	{
		'name': 'body',
		'type': types.buffer
	}
])

module.exports = class StreamingAbstractor extends Duplex {
	constructor () {
		super()

		this.activeBuffer = Buffer.alloc(0)
		this.eventSchemas = {}
		this.exchanges = {}

		this.exchangeEmitter = new EventEmitter()

		this.currentID = 0
	}

	register (eventName, schema) {
		if (this.exchanges.hasOwnProperty(eventName)) {
			throw new Error('Cannot create event with same name as existing exchange.')
		}

		this.eventSchemas[eventName] = schema
	}

	registerExchange (exchangeName, exchangeProperties) {
		if (this.eventSchemas.hasOwnProperty(exchangeName)) {
			throw new Error('Cannot create exchange with same name as existing event.')
		}

		this.exchanges[exchangeName] = exchangeProperties
	}

	_write (data, encoding, next) {
		this.activeBuffer = Buffer.concat([this.activeBuffer, data])

		const parsedAbstract = abstractorSchema.parse(this.activeBuffer, 0, {
			'returnDetails': true
		})

		if (!parsedAbstract.hadUnderflow) {
			const mode = parsedAbstract.data.mode

			if (mode === 0) {// Stateless
				if (this.eventSchemas.hasOwnProperty(parsedAbstract.data.event)) {
					const correlatedEvent = this.eventSchemas[parsedAbstract.data.event]
					const correlatedParseResult = correlatedEvent.parse(parsedAbstract.data.serialized)

					this.emit(parsedAbstract.data.event, correlatedParseResult)

					this.activeBuffer = this.activeBuffer.slice(parsedAbstract.finishedIndex)

					if (this.activeBuffer.length > 0) this._write(Buffer.alloc(0))
				}
				else {
					this.emit('unregisteredEvent', parsedAbstract.data)

					this.activeBuffer = Buffer.alloc(0)
				}
			}
			else if (mode === 1 || mode === 2) {// Exchange
				if (this.exchanges.hasOwnProperty(parsedAbstract.data.event)) {
					const relatedExchange = this.exchanges[parsedAbstract.data.event]
					const parsedExchange = exchangeSchema.parse(parsedAbstract.data.serialized)

					if (mode === 1) {// Request
						const parsedRequest = relatedExchange.requestSchema.parse(parsedExchange.body)

						this.emit(parsedAbstract.data.event, parsedRequest, (data) => {
							this.push(abstractorSchema.build({
								'event': parsedAbstract.data.event,
								'mode': 2,
								'serialized': exchangeSchema.build({
									'id': parsedExchange.id,
									'body': relatedExchange.responseSchema.build(data)
								})
							}))
						})
					}
					else if (mode === 2) {// Response
						const parsedResponse = relatedExchange.responseSchema.parse(parsedExchange.body)

						this.exchangeEmitter.emit('res_' + parsedExchange.id, parsedResponse)
					}
				}
				else this.emit('unregisteredEvent', parsedAbstract.data)

				this.activeBuffer = Buffer.alloc(0)
			}
		}

		if (next) next()
	}

	_read (size) {

	}

	bind (stream) {
		this.pipe(stream)
		stream.pipe(this)
	}

	request (exchangeName, data) {
		if (!this.exchanges.hasOwnProperty(exchangeName)) {
			throw new Error('Exchange \'' + exchangeName + '\' has not been defined.')
		}

		const reqID = this.currentID

		this.currentID++

		return new Promise((res, rej) => {
			this.exchangeEmitter.once('res_' + reqID, (data) => {
				res(data)
			})

			this.push(abstractorSchema.build({
				'event': exchangeName,
				'mode': 1,
				'serialized': exchangeSchema.build({
					'id': reqID,
					'body': this.exchanges[exchangeName].requestSchema.build(data)
				})
			}))
		})
	}

	send (eventName, data) {
		this.push(abstractorSchema.build({
			'event': eventName,
			'mode': 0,
			'serialized': this.eventSchemas[eventName].build(data)
		}))
	}
}

module.exports.abstractorSchema = abstractorSchema