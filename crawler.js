import {load} from "cheerio"

async function crawlSite(baseURL, endpoint) {
  const response = await fetch(baseURL + endpoint)
  const html = await response.text()
  const $ = load(html)

  const discoveredHTMLAElements = $("a[href]")

  const discoveredURLs = []
  discoveredHTMLAElements.each((_, a) =>{
    discoveredURLs.push($(a).attr("href"))
  })

  const filteredDiscoveredURLs = discoveredURLs.filter((url) => {
    return (
      url.startsWith(baseURL) &&
      (!url.startsWith(`${baseURL}/wp-admin`) || url === `${baseURL}/wp-admin/admin-ajax.php`)
    )
  })

  console.log(filteredDiscoveredURLs)
}

crawlSite("https://scrapeme.live/", "shop")

