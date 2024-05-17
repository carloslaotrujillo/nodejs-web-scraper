module.exports = {
	apps: [
		{
			name: "vite-app",
			script: "serve -s dist -l 8000",
		},
		{
			name: "node-app",
			script: "scraper.js",
		},
	],
};
