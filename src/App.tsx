import "./App.css";
import { useState } from "react";

interface FormData {
	url: string;
}

function App() {
	const [results, setResults] = useState<string>("");
	const [formData, setFormData] = useState<FormData>({ url: "" });

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			url: event.target.value,
		});
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		fetch("http://localhost:3000/scrape", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				pagesUrls: [formData.url],
			}),
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}
				return res.json();
			})
			.then((data) => {
				console.log("Data Received:", data);
				setResults(JSON.stringify(data, null, 2));
			})
			.catch((error) => {
				console.error("Error:", error);
				setResults(`Error occurred: ${error.message}. Please check the console.`);
			});
	};

	return (
		<>
			<h1>Node.js Scraper with Cheerio</h1>
			<form id="form" onSubmit={handleSubmit}>
				<label htmlFor="url">Url: </label>
				<input type="url" id="url" value={formData.url} onChange={handleChange} required />
				<button type="submit">Submit</button>
			</form>
			<div id="results">
				{results && (
					<>
						<h2>Results</h2>
						<div>{results}</div>
					</>
				)}
			</div>
		</>
	);
}

export default App;
