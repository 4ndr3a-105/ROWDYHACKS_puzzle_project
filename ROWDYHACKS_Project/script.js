document.addEventListener("DOMContentLoaded", () => {
  // --- LIBRARY PAGE: PHOTO SELECTION ---
  const libPhotos = document.querySelectorAll(".lib-photo, .photo-card, img");
  libPhotos.forEach((photo) => {
    photo.addEventListener("click", () => {
      libPhotos.forEach((p) => p.classList.remove("selected-photo"));
      photo.classList.add("selected-photo");
      const selectedSrc = photo.getAttribute("data-src") || photo.src;
      if (selectedSrc) {
        localStorage.setItem("puzzleImage", selectedSrc);
      }
    });
  });

  // --- IMPORT PAGE: FILE UPLOAD ---
  const fileInput = document.getElementById("file-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          localStorage.setItem("puzzleImage", evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- DIFFICULTY SELECTION BUTTONS & LINKS ---
  const difficultyBtns = document.querySelectorAll(".difficulty-btn, button[data-grid], a[data-grid]");
  
  difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      let gridSize = 3; // Default Easy (3x3)
      const text = btn.textContent.toLowerCase();

      if (btn.dataset.grid) {
        gridSize = parseInt(btn.dataset.grid, 10);
      } else if (text.includes("medium") || text.includes("4")) {
        gridSize = 4;
      } else if (text.includes("hard") || text.includes("5")) {
        gridSize = 5;
      } else if (text.includes("easy") || text.includes("3")) {
        gridSize = 3;
      }

      localStorage.setItem("puzzleGridSize", gridSize);
      const targetUrl = btn.getAttribute("href") || "GamePage.html";
      window.location.href = targetUrl;
    });
  });

  // --- GAME INITIALIZATION ---
  if (document.getElementById("puzzle-board")) {
    initDragAndDropGame();
  }
});

// ==========================================
// DRAG & DROP PUZZLE ENGINE
// ==========================================

let rows = parseInt(localStorage.getItem("puzzleGridSize"), 10) || 3;
let columns = rows;
let currTile = null;
let otherTile = null;
let turns = 0;

function initDragAndDropGame() {
  const board = document.getElementById("puzzle-board");
  const piecesContainer = document.getElementById("pieces");

  if (!board || !piecesContainer) return;

  board.innerHTML = "";
  piecesContainer.innerHTML = "";

  const imageSrc = localStorage.getItem("puzzleImage") || localStorage.getItem("userPhoto") || "https://picsum.photos/600/600";

  board.style.width = `${columns * 80}px`;
  board.style.height = `${rows * 80}px`;

  // 1. Populate Board with Blank Placeholders (Assign target correct index 0 to N)
  let spotIndex = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      let tile = document.createElement("img");
      tile.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'></svg>";
      tile.dataset.isBlank = "true";
      tile.dataset.correctIndex = spotIndex; // The index that belongs here

      addDragListeners(tile);
      board.appendChild(tile);
      spotIndex++;
    }
  }

  // 2. Generate piece indices and shuffle
  let pieceIndices = [];
  for (let i = 0; i < rows * columns; i++) {
    pieceIndices.push(i);
  }

  for (let i = pieceIndices.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [pieceIndices[i], pieceIndices[j]] = [pieceIndices[j], pieceIndices[i]];
  }

  // 3. Populate Pieces container with slice styles & tracking ID
  pieceIndices.forEach((index) => {
    let origR = Math.floor(index / columns);
    let origC = index % columns;

    let tile = document.createElement("div");
    tile.style.width = "78px";
    tile.style.height = "78px";
    tile.style.backgroundImage = `url('${imageSrc}')`;
    tile.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
    
    const posX = columns > 1 ? (origC / (columns - 1)) * 100 : 0;
    const posY = rows > 1 ? (origR / (rows - 1)) * 100 : 0;
    tile.style.backgroundPosition = `${posX}% ${posY}%`;
    tile.setAttribute("draggable", "true");
    
    // Attach piece ID so we know which slice this is
    tile.dataset.pieceIndex = index;

    addDragListeners(tile);
    piecesContainer.appendChild(tile);
  });
}

function addDragListeners(tile) {
  tile.addEventListener("dragstart", dragStart);
  tile.addEventListener("dragover", dragOver);
  tile.addEventListener("dragenter", dragEnter);
  tile.addEventListener("dragleave", dragLeave);
  tile.addEventListener("drop", dragDrop);
  tile.addEventListener("dragend", dragEnd);
}

function dragStart(e) {
  currTile = this;
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
}

function dragLeave() {}

function dragDrop(e) {
  e.preventDefault();
  otherTile = this;
}

function dragEnd() {
  if (!otherTile || currTile === otherTile) return;

  // Swap background styles
  let currBg = currTile.style.backgroundImage;
  let currPos = currTile.style.backgroundPosition;
  let currSize = currTile.style.backgroundSize;
  let currPieceIndex = currTile.dataset.pieceIndex;

  let otherBg = otherTile.style.backgroundImage;
  let otherPos = otherTile.style.backgroundPosition;
  let otherSize = otherTile.style.backgroundSize;
  let otherPieceIndex = otherTile.dataset.pieceIndex;

  currTile.style.backgroundImage = otherBg;
  currTile.style.backgroundPosition = otherPos;
  currTile.style.backgroundSize = otherSize;
  if (otherPieceIndex !== undefined) {
    currTile.dataset.pieceIndex = otherPieceIndex;
  } else {
    delete currTile.dataset.pieceIndex;
  }

  otherTile.style.backgroundImage = currBg;
  otherTile.style.backgroundPosition = currPos;
  otherTile.style.backgroundSize = currSize;
  if (currPieceIndex !== undefined) {
    otherTile.dataset.pieceIndex = currPieceIndex;
  } else {
    delete otherTile.dataset.pieceIndex;
  }

  if (otherTile.dataset && otherTile.dataset.isBlank) {
    delete otherTile.dataset.isBlank;
  }

  turns += 1;
  const turnsElem = document.getElementById("turns");
  if (turnsElem) turnsElem.innerText = turns;

  checkWinCondition();
}

function checkWinCondition() {
  const boardTiles = document.querySelectorAll("#puzzle-board img");
  let solved = true;

  boardTiles.forEach((tile) => {
    // If any spot is blank or pieceIndex doesn't match correctIndex, puzzle isn't solved
    if (tile.dataset.isBlank || tile.dataset.pieceIndex !== tile.dataset.correctIndex) {
      solved = false;
    }
  });

  if (solved) {
    const winMsg = document.getElementById("win-message");
    if (winMsg) {
      winMsg.style.display = "block";
    } else {
      alert("You Solved it!");
    }
  }
}