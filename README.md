# protocore
> Specify and deploy custom binary protocol structures in Node

[GitHub](https://github.com/ethanent/protocore) | [NPM](https://www.npmjs.com/package/protocore)

## Install

```
npm i protocore
```

Then include the library in your code:

```js
const {Schema} = require('protocore')
```

## What is Protocore?

Protocore makes building custom binary protocols a snap.

It's a lightweight Node library that takes the pain out of making binary protocols for games, databases, and other performance-dependent applications!

Protocore allows developers to create advanced protocols with powerful functionality and with maximum efficiency.

## Define a Schema

```js
const personSchema = new Schema([
	{
		'name': 'firstName',
		'type': 'string'
	},
	{
		'name': 'age',
		'type': 'uint',
		'size': 8
	}
])
```

The above code defines a simple schema which represents a person.

It includes a `firstName` string field and an `age`, which is a UInt8.

## Build a Buffer from a Schema

```js
const ethanBuf = personSchema.build({
	'name': 'Ethan Davis',
	'age': 17
})

// Now ethanBuf is a buffer representation of a person!
```

Here we've built a buffer from Ethan's data using the `personSchema` Schema. The `Schema.build` method returns a [Buffer](https://nodejs.org/api/buffer.html).

## Parse a Buffer from a Schema

```js
// ^ Let's say ethanBuf is a buffer created with the personSchema Schema

const parsed = personSchema.parse(ethanBuf)

// parsed will now be an object with the original information about Ethan!
// parsed = {'name': 'Ethan Davis', 'age': 17}
```

Above a buffer was parsed using `personSchema`, which returned an object representation of the data!

## Lists in Schemas

Lists can be defined in schemas as well.

```js
const citySchema = new Schema([
	{
		'name': 'name',
		'type': 'string'
	},
	{
		'name': 'buildings',
		'type': 'list',
		'of': new Schema([
			{
				'name': 'name',
				'type': 'string'
			},
			{
				'name': 'constructed',
				'type': 'uint',
				'size': 16
			}
		])
	}
])
```

We've now defined `citySchema`, which represents a city with buildings. Buildings have names and also contain the year they were constructed.

### Serializing Lists in Schemas

```js
const sanFranciscoBuf = citySchema.build({
	'name': 'San Francisco',
	'buildings': [
		{
			'name': 'Salesforce Tower',
			'constructed': 2018
		},
		{
			'name': 'Ferry Building',
			'constructed': 1898
		}
	]
})
```

### Parsing Lists in Schemas

```js
const sanFrancisco = citySchema.parse(sanFranciscoBuf)
```

`sanFrancisco` will be similar to the object we built `sanFranciscoBuf` from. It will have an array of building objects.


## Utilizing StreamingAbstractor

`StreamingAbstractor`s allow us to create duplex, event-based streaming systems for applications.

Let's create a `StreamingAbstractor`.

```js
const myAbstractor = new StreamingAbstractor()

myAbstractor.register('login', new Schema([
	{
		'name': 'username',
		'type': 'string'
	},
	{
		'name': 'number',
		'type': 'uint',
		'size': 16
	}
]))
```

Above we've registered an event called 'login' in our abstractor. Now it can recieve login events from a stream connected to another `StreamingAbstractor`.

### Recieving Events Through StreamingAbstractor

Now that we have a `StreamingAbstractor` (`myAbstractor`) with the `login` event registered, we'll listen for `login` on our end.

```js
myAbstractor.on('login', (data) => {
	console.log('Login with username ' + data.username + ' and number ' + data.number + '.')
})
```

### Sending Events Through StreamingAbstractor

Because we've registered the `login` event, we can send `login` events using `myAbstractor`.

```js
myAbstractor.send('login', {
	'username': 'ethan',
	'number': 5135
})
```