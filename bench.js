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
	}
]

for (let i = 0; i < sets.length; i++) {
	console.log('\nBench set: ' + sets[i].name)

	console.log('JSON size: ' + Buffer.from(JSON.stringify(sets[i].data)).length + ' bytes')
	console.log('Protocore size: ' + sets[i].schema.build(sets[i].data).length + ' bytes')
}