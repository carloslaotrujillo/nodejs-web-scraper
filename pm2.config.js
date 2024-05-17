module.exports = {
	apps: [
		{
			name: "vite-app",
			script: "serve -s dist -l 80",
		},
		{
			name: "node-app",
			script: "scraper.js",
		},
	],
};
