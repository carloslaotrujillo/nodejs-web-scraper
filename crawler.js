const os = require("os");
const fs = require("fs/promises");
const { load } = require("cheerio");
const fastify = require("fastify")({ logger: true });

const DISC_URLS_MAX_SIZE = 100;

async function crawlPage(pageURL, rootUrl) {
	const response = await fetch(pageURL);
	const html = await response.text();
	const $ = load(html);

	const discoveredHTMLAElements = $("a[href]");

	const discoveredURLs = [];
	discoveredHTMLAElements.each((_, a) => {
		discoveredURLs.push($(a).attr("href"));
	});

	const filteredDiscoveredURLs = discoveredURLs.filter((url) => {
		return (
			url.startsWith(rootUrl) &&
			(!url.startsWith(`${rootUrl}/wp-admin`) || url === `${rootUrl}/wp-admin/admin-ajax.php`)
		);
	});

	return filteredDiscoveredURLs;
}

async function crawlSite(pagesToCrawl, baseUrl) {
	const pagesCrawled = [];
	const discoveredURLs = new Set();

	while (pagesToCrawl.length !== 0 && discoveredURLs.size <= DISC_URLS_MAX_SIZE) {
		const currentPage = pagesToCrawl.pop();
		console.log(`Crawling page: ${currentPage}`);

		const pageDiscoveredURLs = await crawlPage(currentPage, baseUrl);
		pageDiscoveredURLs.forEach((url) => {
			discoveredURLs.add(url);
			if (!pagesCrawled.includes(url) && url !== currentPage) {
				pagesToCrawl.push(url);
			}
		});
		console.log(`${pageDiscoveredURLs.length} URLs found`);

		pagesCrawled.push(currentPage);
		console.log(`${discoveredURLs.size} URLs discovered so far\n`);
	}

	const csvContent = [...discoveredURLs].join(os.EOL);
	await fs.writeFile("output/links.csv", csvContent);

	return discoveredURLs;
}

function getBaseUrl(url) {
	try {
		const parsedUrl = new URL(url);
		return `${parsedUrl.protocol}//${parsedUrl.host}/`;
	} catch (error) {
		console.error("Invalid URL:", error);
		return null;
	}
}

fastify.post("/crawl", async function handler(request, reply) {
	const pagesUrls = request.body.pagesUrls;
	const baseUrl = getBaseUrl(pagesUrls[0]);

	console.log(pagesUrls, baseUrl);

	const dataCrawled = await crawlSite(pagesUrls, baseUrl);
	const urlsArray = Array.from(dataCrawled);

	reply.send({ urls: urlsArray });
});

fastify.listen({ port: 3000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
});
