module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{html,svg,js,json}'
	],
	globIgnores: [`/OLDpwa.js`],
	swSrc: 'sw-input.js',
	swDest: 'sw-workbox.js',
};