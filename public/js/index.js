let gameStarted = false;

const startButton = document.getElementById("start_button");
const restartButton = document.getElementById("restart_button");

restartButton.style.opacity = "0.5";
restartButton.style.pointerEvents = "none";

function getSelectedDifficulty() {
	return document.querySelector("input[name='difficulty']:checked").value;
}

startButton.addEventListener("click", () => {
	if (gameStarted) return;

	gameStarted = true;
	enableRestartButton();

	startGame(getSelectedDifficulty());
});

restartButton.addEventListener("click", () => {
	if (!gameStarted) return;

	resetGame(getSelectedDifficulty());
});
