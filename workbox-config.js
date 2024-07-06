module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{html,svg,js,json}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};