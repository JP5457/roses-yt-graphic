document.addEventListener("DOMContentLoaded", () => {
	// fetch /currentfixtures to update the fixtures
	const updateFixturesList = () => {
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
	}

	const updateNowPlaying = () => {
		const nowPlaying = document.querySelector(".now-playing h3");;
		// url is /active
		fetch("/active")
			.then((response) => response.json())
			.then(({title, category}) => {
				if (title) {
					nowPlaying.innerText = `${title}: ${category}`;
				}
			})
			.catch((error) => console.error("Error fetching now playing:", error));
	}


	// inital runs
	updateNowPlaying();
	updateFixturesList();

	setInterval(() => {
		updateNowPlaying();
		updateFixturesList();
	}, 5000); // 5 seconds

});