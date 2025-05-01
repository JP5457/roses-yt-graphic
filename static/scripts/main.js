let shownscores = 1;
let latestscore = "";

let shownfixtures = 1;
let currentfix = [];
let currentfixindex = 0;

let showncatchup = 1;
let currentcatchup = [];
let currentcatchupindex = 0;

function swaponeandtwo(num) {
	if (num == 1) {
		return 2;
	} else {
		return 1;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	// fetch /currentfixtures to update the fixtures
	const updateFixturesList = () => {
		fetch("/currentfixtures")
			.then((response) => response.json())
			.then((data) => {
				currentfix = data;
			})
			.catch((error) => console.error("Error fetching fixtures:", error));
	};

	const updateCatchupList = () => {
		fetch("/catchup")
			.then((response) => response.json())
			.then((data) => {
				currentcatchup = data;
			})
			.catch((error) => console.error("Error fetching fixtures:", error));
	};

	const updateNowPlaying = () => {
		const nowPlaying = document.getElementById("nowPlaying");
		// url is /active
		fetch("/active")
			.then((response) => response.json())
			.then(({ title, category }) => {
				if (title) {
					nowPlaying.innerText = `${title} - ${category}`;
				}
			})
			.catch((error) =>
				console.error("Error fetching now playing:", error)
			);
	};

	const createScoreCard = (
		sport,
		category,
		yorkScore,
		lancasterScore,
		parentSelector
	) => {
		const container = document.createElement("div");

		// Determine result class
		let resultClass = "no-win";
		if (yorkScore > lancasterScore) {
			resultClass = "york-win";
		} else if (lancasterScore > yorkScore) {
			resultClass = "lancs-win";
		}

		container.className = `fix-score-cont ${resultClass}`;

		const topDiv = document.createElement("div");
		topDiv.className = "top";

		const titleSpan = document.createElement("span");
		titleSpan.className = "fix-title";
		titleSpan.textContent = String(sport) + " ";

		const categorySpan = document.createElement("span");
		categorySpan.className = "fix-category";
		categorySpan.textContent = category;

		topDiv.appendChild(titleSpan);
		topDiv.appendChild(categorySpan);

		const bottomDiv = document.createElement("div");
		bottomDiv.className = "bottom";

		const scoreHeading = document.createElement("h3");
		scoreHeading.className = "team-score";

		const yorkSpan = document.createElement("span");
		yorkSpan.className = "york";
		yorkSpan.textContent = `York - ${yorkScore}`;

		const lancasterSpan = document.createElement("span");
		lancasterSpan.className = "lancaster";
		lancasterSpan.textContent = `Lancaster - ${lancasterScore}`;

		scoreHeading.appendChild(yorkSpan);
		scoreHeading.append(" | ");
		scoreHeading.appendChild(lancasterSpan);

		bottomDiv.appendChild(scoreHeading);

		container.appendChild(topDiv);
		container.appendChild(bottomDiv);

		const parent = document.querySelector(parentSelector);
		if (parent) {
			parent.appendChild(container);
		} else {
			console.warn("Parent element not found");
		}
	};

	const updateLatestScores = () => {
		// url is /getrecentscores
		fetch("/getrecentscores?limit=6")
			.then((response) => response.json())
			.then((data) => {
				let recentname = data[0]["title"] + data[0]["category"];
				if (recentname != latestscore) {
					let toswap = swaponeandtwo(shownscores);
					const scoresList = document.getElementById(
						"fixtures-list-scores-" + toswap
					);
					scoresList.innerHTML = ""; // Clear existing scores
					data.forEach(({ title, category, york, lancaster }) => {
						createScoreCard(
							title,
							category,
							york,
							lancaster,
							"#fixtures-list-scores-" + toswap
						);
					});
					document.getElementById("scores-" + shownscores).style =
						"opacity: 0";
					document.getElementById("scores-" + toswap).style =
						"opacity: 1";
					shownscores = toswap;
					latestscore = recentname;
				}
			})
			.catch((error) =>
				console.error("Error fetching now playing:", error)
			);
	};

	function setBarSizes(value1, value2, value3) {
		const total = value1 + value2 + value3;
		const s1 = document.getElementById("section1");
		const s2 = document.getElementById("section2");
		const s3 = document.getElementById("section3");
		console.log(value3);
		s1.style.width = (value1 / total) * 100 + "%";
		s2.style.width = (value2 / total) * 100 + "%";
		s3.style.width = (value3 / total) * 100 + "%";
	}

	const updateLiveScores = () => {
		fetch("/getscores")
			.then((response) => response.json())
			.then(({ york, lancaster, remaining }) => {
				console.log(remaining);
				const lancsScore = document.querySelector("#lancs-score-val");
				const yorksScore = document.querySelector("#york-score-val");
				lancsScore.innerText = lancaster;
				yorksScore.innerText = york;
				setBarSizes(york, remaining, lancaster);
			});
	};

	const rotatefixtures = () => {
		let shown = 6;
		if (currentfix.length <= currentfixindex) {
			currentfixindex = 0;
		}
		let lastindex = currentfixindex + shown;
		if (currentfix.length <= lastindex) {
			lastindex = currentfix.length;
		}
		let subfix = currentfix.slice(currentfixindex, lastindex);
		let toswap = swaponeandtwo(shownfixtures);
		const fixturesList = document.getElementById("fixlist-" + toswap);
		fixturesList.innerHTML = ""; // Clear existing fixtures
		subfix.forEach(({ title, category }) => {
			const fixtureItem = document.createElement("div");
			fixtureItem.className = "fixture-item";
			fixtureItem.innerHTML = `
                <h3>${title}</h3>-
                <p>${category}</p>
            `;
			const fixtureContainer = document.createElement("div");
			fixtureContainer.className = "fixture-container";
			const fixturebullet = document.createElement("div");
			fixturebullet.className = "fixture-bullet";
			fixtureContainer.appendChild(fixturebullet);
			fixtureContainer.appendChild(fixtureItem);
			fixturesList.appendChild(fixtureContainer);
		});
		document.getElementById("fixtures-list-" + shownfixtures).style =
			"opacity: 0";
		document.getElementById("fixtures-list-" + toswap).style = "opacity: 1";
		shownfixtures = toswap;
		currentfixindex = currentfixindex + shown;
	};

	const rotatecatchup = () => {
		let shown = 6;
		if (currentcatchup.length <= currentcatchupindex) {
			currentcatchupindex = 0;
		}
		let lastindex = currentcatchupindex + shown;
		if (currentcatchup.length <= lastindex) {
			lastindex = currentcatchup.length;
		}
		let subfix = currentcatchup.slice(currentcatchupindex, lastindex);
		let toswap = swaponeandtwo(showncatchup);
		const catchupList = document.getElementById("catchlist-" + toswap);
		catchupList.innerHTML = ""; // Clear existing fixtures
		subfix.forEach(({ title, category }) => {
			const catchupItem = document.createElement("div");
			catchupItem.className = "fixture-item";
			catchupItem.innerHTML = `
                <h3>${title}</h3>-
                <p>${category}</p>
            `;
			const catchupContainer = document.createElement("div");
			catchupContainer.className = "fixture-container";
			const catchupbullet = document.createElement("div");
			catchupbullet.className = "fixture-bullet";
			catchupContainer.appendChild(catchupbullet);
			catchupContainer.appendChild(catchupItem);
			catchupList.appendChild(catchupContainer);
		});
		document.getElementById("catchup-list-" + shownfixtures).style =
			"opacity: 0";
		document.getElementById("catchup-list-" + toswap).style = "opacity: 1";
		showncatchup = toswap;
		currentcatchupindex = currentcatchupindex + shown;
	};

	// Run these on load
	updateNowPlaying();
	updateFixturesList();
	updateLatestScores();
	updateLiveScores();
	updateCatchupList();
	rotatecatchup();
	rotatefixtures();

	setInterval(() => {
		updateNowPlaying();
		updateFixturesList();
		updateCatchupList();
		updateLatestScores();
		updateLiveScores();
		rotatefixtures();
		rotatecatchup();
	}, 20000); // 20 seconds
});
