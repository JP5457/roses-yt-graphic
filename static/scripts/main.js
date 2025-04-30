document.addEventListener("DOMContentLoaded", () => {
	// fetch /currentfixtures to update the fixtures
	fetch("/currentfixtures")
		.then((response) => response.json())
		.then((data) => {
			const fixturesList = document.getElementById("fixtures-list");
			fixturesList.innerHTML = ""; // Clear existing fixtures
			data.forEach(({title, category, end}) => {
				// format as 24 hour time
				const endString = new Date(end).toLocaleString("en-US", {hour: "2-digit", minute: "2-digit", hour12: false});
				const fixtureItem = document.createElement("div");
				fixtureItem.className = "fixture-item";
				fixtureItem.innerHTML = `
					<h3>${title}</h3>
					<p>${category}</p>
					<p>Until ${endString}</p>
				`;
				const fixtureContainer = document.createElement("div");
				fixtureContainer.className = "fixture-container";
				const fixturebullet = document.createElement("div");
				fixturebullet.className = "fixture-bullet";
				fixtureContainer.appendChild(fixturebullet);
				fixtureContainer.appendChild(fixtureItem);
				fixturesList.appendChild(fixtureContainer);
			});
		})
		.catch((error) => console.error("Error fetching fixtures:", error));
});