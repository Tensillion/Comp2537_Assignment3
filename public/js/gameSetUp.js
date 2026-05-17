const diffNumbers = {
	easy: 12,
	medium: 24,
	hard: 36,
};

const timeLimits = {
	easy: 1,
	medium: 100,
	hard: 120,
};

const params = new URLSearchParams(window.location.search);
const gameGrid = document.getElementById("game_grid");
const powerBarFill = document.querySelector(".powerbar-fill");
const powerBarText = document.querySelector(".powerBar-text");

let isLoading = false;
let moves = 0;

let missedPairs = 0;
let pairsLeft = 0;
let pairsMatched = 0;
let totalPairs = 0;

let timeLeft;
let countdown;

powerBarFill.style.width = `0%`;

function updateHeader() {
	document.getElementById("moves").textContent = `Moves: ${moves}`;
	document.getElementById("timer").textContent = `Time Remaining: ${timeLeft}s`;
	document.getElementById("pairsLeft").textContent = `Pairs Left: ${pairsLeft}`;
	document.getElementById("pairsMatched").textContent = `Pairs Matched: ${pairsMatched}`;
	document.getElementById("total").textContent = `Total Pairs: ${totalPairs}`;

	powerBarFill.style.width = `${(missedPairs / 4) * 100}%`;
	powerBarText.textContent =
		missedPairs >= 4 ? "Power-Up Ready! Activate on a missed pair" : "Power-Up Charging...";
}

async function startGame(diff) {
	const diffNum = diffNumbers[diff] || diffNumbers.easy;

	if (isLoading || !diffNum) return;

	isLoading = true;
	gameStarted = true;

	//Clear the grid for new game
	gameGrid.innerHTML = "";

	try {
		const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");

		const data = await res.json();
		const pokemons = data.results;

		function shuffle(array) {
			const a = array.slice();
			for (let i = a.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[a[i], a[j]] = [a[j], a[i]];
			}
			return a;
		}

		const count = Math.floor(Number(diffNum || 0) / 2);
		const selected = shuffle(pokemons).slice(0, count);

		const pokemonImages = await Promise.all(
			selected.map(async pokemon => {
				const res = await fetch(pokemon.url);
				const data = await res.json();
				return data.sprites.other["official-artwork"].front_default || data.sprites.front_default;
			})
		);

		const duplicated = pokemonImages.reduce((acc, img) => acc.concat([img, img]), []);
		const shuffled = shuffle(duplicated);

		//Set Up the Page
		$("#difficulty span").text(diff.charAt(0).toUpperCase() + diff.slice(1));
		gameGrid.classList.remove("easy", "medium", "hard");
		gameGrid.classList.add(diff);

		for (let i = 0; i < shuffled.length; i++) {
			gameGrid.innerHTML += `
                <div class="card">
	                <img id="img${i + 1}" class="front_face" src="${shuffled[i]}" alt="" />
	                <img class="back_face" src="public/imgs/back.webp" alt="" />
                </div>`;
		}

		manageCardFlipping();
	} catch (err) {
		console.error(err);
	} finally {
		setupGame(diff);
		isLoading = false;
	}
}

function setupGame(diff) {
	//Reset game state variables
	totalPairs = gameGrid.children.length / 2;
	pairsLeft = totalPairs;
	pairsMatched = 0;
	missedPairs = 0;
	moves = 0;

	timeLeft = timeLimits[diff] || timeLimits.easy;

	updateHeader();
	startCountdown();
}

function startCountdown() {
	countdown = setInterval(() => {
		timeLeft--;
		document.getElementById("timer").textContent = `Time Remaining: ${timeLeft}s`;

		if (timeLeft <= 0) {
			document.getElementById("timer").textContent = `Time Remaining: GAME OVER`;
			gameOver();
			customAlert("Game Over!", "warning");
		}
	}, 1000);
}

function gameOver() {
	stopGame();
	const unmatchedCards = document.querySelectorAll(".card:not(.matched)");

	unmatchedCards.forEach(card => {
		card.classList.add("flip");
		card.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
		card.style.pointerEvents = "none";
	});

	gameStarted = false;
	enableStartButton();
}

function stopGame() {
	clearInterval(countdown);
	const cards = document.querySelectorAll(".card");
	cards.forEach(card => {
		card.style.pointerEvents = "none";
	});
}

function unpauseGame() {
	startCountdown();
	const cards = document.querySelectorAll(".card");
	cards.forEach(card => {
		card.style.pointerEvents = "auto";
	});
}

function resetGame(diff) {
	stopGame();

	gameStarted = false;
	startGame(diff);
}

function manageCardFlipping() {
	let firstCard = null;
	let secondCard = null;

	let lockBoard = false; // prevents clicking while cards are being checked

	function resetSelection() {
		firstCard = null;
		secondCard = null;
		lockBoard = false;
		$("#moves span").text(moves);
	}

	// Use delegated event handler on the grid so handlers aren't doubled
	$(gameGrid)
		.off("click", ".card")
		.on("click", ".card", function () {
			if (lockBoard) return;

			const $card = $(this);

			// Ignore clicks on already matched cards
			if ($card.hasClass("matched")) return;

			// Prevent selecting the same card twice
			if (firstCard && $card.is(firstCard)) return;

			$card.addClass("flip");

			if (!firstCard) {
				firstCard = $card;

				moves++;
				updateHeader();

				return;
			}

			secondCard = $card;

			const firstImg = firstCard.find(".front_face")[0];
			const secondImg = secondCard.find(".front_face")[0];

			if (!firstImg || !secondImg) {
				// Something unexpected; reset safely
				setTimeout(resetSelection, 500);
				return;
			}

			if (firstImg.src === secondImg.src) {
				// Match
				firstCard.addClass("matched");
				secondCard.addClass("matched");

				// Remove pointer events to make them inert
				firstCard.off("click");
				secondCard.off("click");

				pairsMatched++;
				pairsLeft--;
				updateHeader();

				resetSelection();

				// Check for win condition
				if ($(".matched").length === $(".card").length) {
					setTimeout(() => {
						customAlert("Congratulations! You've matched all the cards!", "success");
						gameOver();
					}, 500);
				}
			} else {
				// No match - lock board while cards are shown
				lockBoard = true;

				moves++;
				updateHeader();

				setTimeout(() => {
					firstCard.removeClass("flip");
					secondCard.removeClass("flip");
					resetSelection();

					missedPairs++;
					if (missedPairs >= 5) {
						customAlert(
							"Power-Up Activated! All unmatched cards will be revealed for 2 seconds.",
							"success",
							activatePowerUp
						);
						missedPairs = 0;
						updateHeader();
					}

					updateHeader();
				}, 1000);
			}
		});
}

function activatePowerUp() {
	const unmatchedCards = document.querySelectorAll(".card:not(.matched)");

	unmatchedCards.forEach(card => {
		card.classList.add("flip");
		card.style.pointerEvents = "none";

		setTimeout(() => {
			card.classList.remove("flip");
			card.style.pointerEvents = "auto";
		}, 2000);
	});
}
