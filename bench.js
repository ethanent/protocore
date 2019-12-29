const {Schema, types} = require(__dirname)

const sets = [
	{
		'name': 'Complex Person',
		'schema': new Schema([
			{
				'name': 'name',
				'type': types.string
			},
			{
				'name': 'count',
				'type': types.varint
			},
			{
				'name': 'born',
				'type': types.int,
				'size': 16
			},
			{
				'name': 'vehicles',
				'type': types.list,
				'of': new Schema([
					{
						'name': 'type',
						'type': types.string
					},
					{
						'name': 'made',
						'type': types.int,
						'size': 16
					}
				])
			}
		]),
		'data': {
			'name': 'Ethan',
			'count': 181263,
			'born': 2001,
			'vehicles': [
				{
					'type': 'Flying Car',
					'made': 2034
				},
				{
					'type': 'Rollerblades',
					'made': 2004
				},
				{
					'type': 'Bike',
					'made': 2014
				}
			]
		}
	},
	{
		'name': 'Building',
		'schema': new Schema([
			{
				'name': 'title',
				'type': types.string
			},
			{
				'name': 'number',
				'type': types.uint,
				'size': 16
			},
			{
				'name': 'residents',
				'type': types.list,
				'of': new Schema([
					{
						'name': 'firstName',
						'type': types.string
					},
					{
						'name': 'age',
						'type': types.uint,
						'size': 8
					}
				])
			}
		]),
		'data': {
			'title': 'Home',
			'number': 19,
			'residents': [
				{
					'firstName': 'James',
					'age': 255
				},
				{
					'firstName': 'Ethan',
					'age': 5
				},
				{
					'firstName': 'Laruel',
					'age': 255
				}
			]
		}
	}
]

for (let i = 0; i < sets.length; i++) {
	console.log('\nBench set: ' + sets[i].name)

	const arrdata = Object.values(sets[i].data).map((v) => Array.isArray(v) ? v.map((vd) => Object.values(vd)) : v)

	console.log('Keyless JSON size: ' + Buffer.from(JSON.stringify(arrdata)).length + ' bytes')
	console.log('Protocore (inherently keyless) size: ' + sets[i].schema.build(sets[i].data).length + ' bytes')
}
