document.body.setAttribute("data-theme", "dark");

const content = document.getElementById("drop-down-menu").querySelector(".content");
content.style.display = "none";

function toggleTheme() {
	console.log("Toggling theme...");

	if (document.body.getAttribute("data-theme") === "dark") {
		document.body.setAttribute("data-theme", "light");
	} else {
		document.body.setAttribute("data-theme", "dark");
	}
}

function toggleVisibility() {
	console.log("Toggling menu...");
	if (content.style.display === "flex") {
		content.style.display = "none";
	} else {
		content.style.display = "flex";
	}
}

function enableStartButton() {
	startButton.style.opacity = "1";
	startButton.style.pointerEvents = "auto";
	restartButton.style.opacity = "0.5";
	restartButton.style.pointerEvents = "none";
}

function enableRestartButton() {
	restartButton.style.opacity = "1";
	restartButton.style.pointerEvents = "auto";
	startButton.style.opacity = "0.5";
	startButton.style.pointerEvents = "none";
}

document.getElementById("theme_toggle").addEventListener("click", toggleTheme);
document.getElementById("drop-down-button").addEventListener("click", toggleVisibility);
