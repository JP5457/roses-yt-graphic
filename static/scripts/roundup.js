//Just a warning. More so than anything else this file was written/cobbled together VERY last minute. Proceed with caution.

let shownfixtures = 1;
let currentfix = [];
let currentfixindex = 0;

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
		fetch("/gettodayscores")
			.then((response) => response.json())
			.then((data) => {
				currentfix = data;
			})
			.catch((error) => console.error("Error fetching fixtures:", error));
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
		const fixturesList = document.getElementById(
			"fixtures-list-scores-" + toswap
		);
		fixturesList.innerHTML = ""; // Clear existing fixtures
		subfix.forEach(({ title, category, york, lancaster }) => {
			createScoreCard(
				title,
				category,
				york,
				lancaster,
				"#fixtures-list-scores-" + toswap
			);
		});
		document.getElementById("scores-" + shownfixtures).style = "opacity: 0";
		document.getElementById("scores-" + toswap).style = "opacity: 1";
		shownfixtures = toswap;
		currentfixindex = currentfixindex + shown;
	};

	// Run these on load

	updateFixturesList();
	updateLiveScores();
	rotatefixtures();

	setInterval(() => {
		updateFixturesList();
		updateLiveScores();
		rotatefixtures();
	}, 20000); // 20 seconds
});
