let dictionary = {};

// Change these values to adjust the rankings.
const TOP_N = 10;
const BOTTOM_X = 10;

const form = document.getElementById("search-form");
const input = document.getElementById("word-input");
const status = document.getElementById("status");
const results = document.getElementById("results");
const pages = ["search", "sphincter", "facts"];

function showPage(page) {
    pages.forEach(name => {
        document.getElementById(`${name}-page`).hidden = name !== page;
        const tab = document.getElementById(`${name}-tab`);
        tab.classList.toggle("active", name === page);
        tab.setAttribute("aria-selected", String(name === page));
    });
}

pages.forEach(page => {
    document.getElementById(`${page}-tab`).addEventListener("click", () => showPage(page));
});

async function loadDictionary() {
    try {
        const response = await fetch("poople_data.json");
        if (!response.ok) throw new Error("Dictionary could not be loaded");
        dictionary = await response.json();
        status.textContent = `${Object.keys(dictionary).length.toLocaleString()} words loaded`;
        renderSphincter();
        renderFunFacts();
    } catch (error) {
        status.textContent = "Error loading dictionary";
        document.getElementById("sphincter-count").textContent = "Dictionary could not be loaded.";
        document.getElementById("unreachable-count").textContent = "Dictionary could not be loaded.";
        console.error(error);
    }
}

function getOptimalPath(word) {
    const path = [];
    const seen = new Set();
    while (word !== null) {
        if (seen.has(word) || !dictionary[word]) throw new Error("Invalid path data");
        seen.add(word);
        path.push(word);
        word = dictionary[word].parent;
    }
    return path;
}

function openWord(word) {
    input.value = word.toUpperCase();
    showPage("search");
    searchWord(word);
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
    document.getElementById("result-word").textContent = word.toUpperCase();
    document.getElementById("result-summary").textContent = entry.reachable
        ? `Minimum moves to POOP: ${entry.distance}`
        : "No path to POOP exists.";

    const pathContainer = document.getElementById("path");
    pathContainer.replaceChildren();
    if (entry.reachable) {
        try {
            getOptimalPath(word).forEach(step => {
                const row = document.createElement("div");
                row.className = "path-word";
                const label = document.createElement("strong");
                label.textContent = step.toUpperCase();
                const count = document.createElement("span");
                count.textContent = `${dictionary[step].connections} connections`;
                row.append(label, count);
                pathContainer.appendChild(row);
            });
        } catch (error) {
            pathContainer.textContent = "Path data is invalid.";
            console.error(error);
        }
    } else {
        pathContainer.textContent = "Unreachable from POOP";
    }

    const connectionsContainer = document.getElementById("connections");
    connectionsContainer.replaceChildren();
    (entry.neighbours || []).forEach(neighbour => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "connection";
        button.textContent = neighbour.toUpperCase();
        button.addEventListener("click", () => openWord(neighbour));
        connectionsContainer.appendChild(button);
    });
    if (!entry.neighbours?.length) connectionsContainer.textContent = "No connections";
    results.hidden = false;
}

function makeWordRow(word) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-row";
    const label = document.createElement("strong");
    label.textContent = word.toUpperCase();
    const count = document.createElement("span");
    const connections = dictionary[word].connections;
    count.textContent = `${connections} connection${connections === 1 ? "" : "s"}`;
    button.append(label, count);
    button.addEventListener("click", () => openWord(word));
    return button;
}

function fillWordList(id, words) {
    const container = document.getElementById(id);
    container.replaceChildren();
    words.forEach(word => container.appendChild(makeWordRow(word)));
    if (!words.length) container.textContent = "None";
}

function renderSphincter() {
    // Distance 1 comes from the precomputed shortest-path data.
    const words = Object.keys(dictionary)
        .filter(word => dictionary[word].distance === 1)
        .sort((a, b) => dictionary[b].connections - dictionary[a].connections || a.localeCompare(b));
    document.getElementById("sphincter-count").textContent =
        `${words.length} word${words.length === 1 ? "" : "s"} one move away from POOP`;
    fillWordList("sphincter-words", words);
}

function renderFunFacts() {
    const words = Object.keys(dictionary);
    const byMost = [...words].sort((a, b) =>
        dictionary[b].connections - dictionary[a].connections || a.localeCompare(b));
    const byLeast = [...words].sort((a, b) =>
        dictionary[a].connections - dictionary[b].connections || a.localeCompare(b));
    const unreachable = words.filter(word => dictionary[word].reachable === false).sort();
    const reachable = words.filter(word => dictionary[word].reachable === true);
    const maxDistance = reachable.length
        ? Math.max(...reachable.map(word => dictionary[word].distance)) : null;

    document.getElementById("most-heading").textContent = `Top ${Math.min(TOP_N, words.length)} most connected words`;
    document.getElementById("least-heading").textContent = `Bottom ${Math.min(BOTTOM_X, words.length)} least connected words`;
    fillWordList("most-connected", byMost.slice(0, TOP_N));
    fillWordList("least-connected", byLeast.slice(0, BOTTOM_X));
    fillWordList("unreachable-words", unreachable);
    document.getElementById("unreachable-count").textContent =
        `${unreachable.length.toLocaleString()} unreachable word${unreachable.length === 1 ? "" : "s"}`;

    const stats = document.getElementById("facts-summary");
    stats.replaceChildren();
    [
        ["Total words", words.length],
        ["Reachable", reachable.length],
        ["Unreachable", unreachable.length],
        ["Maximum distance", maxDistance ?? "—"]
    ].forEach(([label, value]) => {
        const card = document.createElement("div");
        card.className = "stat-card";
        const number = document.createElement("strong");
        number.textContent = typeof value === "number" ? value.toLocaleString() : value;
        const caption = document.createElement("span");
        caption.textContent = label;
        card.append(number, caption);
        stats.appendChild(card);
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();
    searchWord(input.value);
});

loadDictionary();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
