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

	const createScoreCard = (sport, category, yorkScore, lancasterScore, parentSelector) => {
		const container = document.createElement('div');
	  
		// Determine result class
		let resultClass = 'no-win';
		if (yorkScore > lancasterScore) {
		  resultClass = 'york-win';
		} else if (lancasterScore > yorkScore) {
		  resultClass = 'lancs-win';
		}
	  
		container.className = `fix-score-cont ${resultClass}`;
	  
		const topDiv = document.createElement('div');
		topDiv.className = 'top';
	  
		const titleSpan = document.createElement('span');
		titleSpan.className = 'fix-title';
		titleSpan.textContent = String(sport) + " ";
	  
		const categorySpan = document.createElement('span');
		categorySpan.className = 'fix-category';
		categorySpan.textContent = category;
	  
		topDiv.appendChild(titleSpan);
		topDiv.appendChild(categorySpan);
	  
		const bottomDiv = document.createElement('div');
		bottomDiv.className = 'bottom';
	  
		const scoreHeading = document.createElement('h3');
		scoreHeading.className = 'team-score';
	  
		const yorkSpan = document.createElement('span');
		yorkSpan.className = 'york';
		yorkSpan.textContent = `York - ${yorkScore}`;
	  
		const lancasterSpan = document.createElement('span');
		lancasterSpan.className = 'lancaster';
		lancasterSpan.textContent = `Lancaster - ${lancasterScore}`;
	  
		scoreHeading.appendChild(yorkSpan);
		scoreHeading.append(' | ');
		scoreHeading.appendChild(lancasterSpan);
	  
		bottomDiv.appendChild(scoreHeading);
	  
		container.appendChild(topDiv);
		container.appendChild(bottomDiv);
	  
		const parent = document.querySelector(parentSelector);
		if (parent) {
		  parent.appendChild(container);
		} else {
		  console.warn('Parent element not found');
		}
	}

	const updateLatestScores = () => {
		// url is /getrecentscores
		fetch("/getrecentscores?limit=6")
			.then(response => response.json())
			.then(data => {
				const scoresList = document.getElementById("fixtures-list-scores");
				scoresList.innerHTML = ""; // Clear existing scores
				data.forEach(({title, category, york, lancaster}) => {
					createScoreCard(title, category, york, lancaster, '#fixtures-list-scores');
				});
			})
			.catch((error) => console.error("Error fetching now playing:", error));
	}


	// inital runs
	updateNowPlaying();
	updateFixturesList();
	updateLatestScores();

	setInterval(() => {
		updateNowPlaying();
		updateFixturesList();
	}, 5000); // 5 seconds

});