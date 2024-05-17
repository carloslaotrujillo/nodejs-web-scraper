import "./App.css";
import { useState } from "react";

interface FormData {
	url: string;
}

function App() {
	const [results, setResults] = useState<string[]>([]);
	const [formData, setFormData] = useState<FormData>({ url: "" });
	const [loading, setLoading] = useState<boolean>(false);

	const resetStates = () => {
		setResults([]);
		setLoading(false);
		setFormData({ url: "" });
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			url: event.target.value,
		});
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		setLoading(true);

		const url = ensureValidURL(formData.url);

		fetch("https://node-scraper.charleslaot.com:3000/api/scrape", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				pagesUrls: [url],
			}),
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return res.json();
			})
			.then((data) => {
				if (data.urls.length === 0) {
					resetStates();
					alert("No URLs found on the page. Sorry!");
					return;
				}
				setResults(data.urls);
				setLoading(false);
				setFormData({ url: "" });
			})
			.catch((error) => {
				resetStates();
				console.error("Error:", error);
				alert("An error occurred. Please try again.");
			});
	};

	const ensureValidURL = (url: string) => {
		if (!url.match(/^(http:\/\/|https:\/\/)/)) {
			url = "https://" + url;
		}

		const urlPattern = /^(http:\/\/|https:\/\/)([a-zA-Z0-9.-]+)(\/|$)/;
		const match = url.match(urlPattern);

		if (!match) {
			alert("URL must have a valid domain");
			throw new Error("URL must have a valid domain");
		}

		const protocol = match[1];
		let domain = match[2];

		const restOfUrl = url.slice(protocol.length + domain.length);
		if (!domain.startsWith("www.")) {
			domain = "www." + domain;
		}

		if (!domain.match(/\.[a-zA-Z]{2,}$/)) {
			throw new Error("URL must end with a valid domain extension");
		}

		return protocol + domain + restOfUrl;
	};

	return (
		<>
			<h1>Node.js URL Scraper with Cheerio</h1>
			<form id="form" onSubmit={handleSubmit}>
				<label htmlFor="url">Enter URL: </label>
				<input type="text" id="url" value={formData.url} onChange={handleChange} required />
				<button type="submit">Submit</button>
			</form>
			<i>*Limited to 50 links</i>
			<div id="results">
				{loading ? (
					<h2>
						<span id="spinner">🌀</span> Loading...
					</h2>
				) : (
					<ul>
						{results.map((result: string, index: number) => (
							<li key={index}>
								<a href={result} target="_blank" rel="noopener noreferrer">
									{result}
								</a>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}

export default App;
