let dictionary = {};

const form = document.getElementById("search-form");
const input = document.getElementById("word-input");
const status = document.getElementById("status");
const results = document.getElementById("results");

async function loadDictionary() {
    try {
        const response = await fetch("poople_data.json");

        if (!response.ok) {
            throw new Error("Dictionary could not be loaded");
        }

        dictionary = await response.json();

        status.textContent =
            `${Object.keys(dictionary).length.toLocaleString()} words loaded`;

    } catch (error) {
        status.textContent = "Error loading dictionary";
        console.error(error);
    }
}

function getOptimalPath(word) {
    const path = [];
    const seen = new Set();

    while (word !== null) {
        if (seen.has(word) || !dictionary[word]) {
            throw new Error("Invalid path data");
        }

        seen.add(word);
        path.push(word);

        word = dictionary[word].parent;
    }

    return path;
}

function searchWord(word) {
    word = word.toLowerCase().trim();

    results.hidden = true;

    if (!dictionary[word]) {
        status.textContent = `${word.toUpperCase()} is not in the dictionary`;
        return;
    }

    const entry = dictionary[word];

    status.textContent = "";

    document.getElementById("result-word").textContent =
        word.toUpperCase();

    document.getElementById("result-summary").textContent =
        entry.reachable
            ? `Minimum moves to POOP: ${entry.distance}`
            : "No path to POOP exists.";

    const pathContainer = document.getElementById("path");
    pathContainer.innerHTML = "";

    if (entry.reachable) {
        const path = getOptimalPath(word);

        path.forEach(step => {
            const row = document.createElement("div");
            row.className = "path-word";

            const label = document.createElement("strong");
            label.textContent = step.toUpperCase();

            const count = document.createElement("span");
            count.textContent =
                `${dictionary[step].connections} connections`;

            row.append(label, count);
            pathContainer.appendChild(row);
        });

    } else {
        pathContainer.textContent = "Unreachable from POOP";
    }

    const connectionsContainer =
        document.getElementById("connections");

    connectionsContainer.innerHTML = "";

    entry.neighbours.forEach(neighbour => {
        const button = document.createElement("button");
        button.className = "connection";
        button.textContent = neighbour.toUpperCase();

        button.addEventListener("click", () => {
            input.value = neighbour;
            searchWord(neighbour);
        });

        connectionsContainer.appendChild(button);
    });

    if (entry.neighbours.length === 0) {
        connectionsContainer.textContent = "No connections";
    }

    results.hidden = false;
}

form.addEventListener("submit", event => {
    event.preventDefault();
    searchWord(input.value);
});

loadDictionary();


// Service worker disabled during development