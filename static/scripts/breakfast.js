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
		fetch("/todayfixtures")
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

	const rotatefixtures = () => {
		let shown = 10;
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
		subfix.forEach(({ title, category, end, start }) => {
			const fixtureItem = document.createElement("div");
			const endString = new Date(end).toLocaleString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
			const startString = new Date(start).toLocaleString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
			fixtureItem.className = "fixture-item";
			fixtureItem.innerHTML = `
                <h3>${title}</h3>-
                <p>${category}</p>
                <br>
                <p><em>${startString} - ${endString}</em></p>
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
