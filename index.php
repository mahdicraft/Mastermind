<?php
/**
 * Mastermind — Main Page
 * Session start here only; all game logic is in api.php.
 */
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Mastermind — Crack the Color Code">
  <title>Mastermind</title>

  <!-- Inter font (loaded from Google Fonts) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════
     START SCREEN
══════════════════════════════════════════════════════════════════ -->
<div id="start-screen">
  <div class="start-card">

    <div class="logo">
      <div class="logo-pegs">
        <div class="logo-peg" style="color:var(--c-red);    background:var(--c-red)"></div>
        <div class="logo-peg" style="color:var(--c-blue);   background:var(--c-blue)"></div>
        <div class="logo-peg" style="color:var(--c-green);  background:var(--c-green)"></div>
        <div class="logo-peg" style="color:var(--c-purple); background:var(--c-purple)"></div>
      </div>
      <span class="logo-title">Mastermind</span>
    </div>

    <p class="start-subtitle">Can you crack the hidden color code?</p>

    <label class="name-label" for="name-input">Your Name</label>
    <input
      id="name-input"
      class="name-input"
      type="text"
      placeholder="Enter your name…"
      maxlength="30"
      autocomplete="off"
      spellcheck="false"
    >

    <button id="btn-start" class="btn-start">Start Game</button>

    <!-- How to play accordion -->
    <details class="how-to-play">
      <summary>How to Play</summary>
      <ul>
        <li>The game hides a secret sequence of <strong>4 colors</strong> (repeats allowed).</li>
        <li>You have <strong>10 rounds</strong> to guess the sequence.</li>
        <li>
          After each guess you receive feedback:
          <span class="peg-legend">
            <span class="legend-peg" style="background:#111827;border:1px solid #444"></span>
            <strong>Black</strong> = right color, right position
          </span>
          <span class="peg-legend">
            <span class="legend-peg" style="background:#f0f6fc;border:1px solid #ccc"></span>
            <strong>White</strong> = right color, wrong position
          </span>
        </li>
        <li>Get <strong>4 black pegs</strong> to win!</li>
        <li><em>Tip: Use keys 1–6 to pick colors, Enter to submit, ← → to move.</em></li>
      </ul>
    </details>

  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     GAME SCREEN
══════════════════════════════════════════════════════════════════ -->
<div id="game-screen">

  <!-- Header -->
  <header class="game-header">
    <div class="header-logo">Mastermind</div>
    <div class="header-info">
      <div class="header-player" id="header-player"></div>
      <div class="header-rounds">
        Round <span id="header-round">1</span> / 10 &nbsp;·&nbsp;
        <span id="header-left">10</span> left
      </div>
    </div>
  </header>

  <!-- Board -->
  <div class="game-board">
    <div id="game-board-rows"></div>
  </div>

  <!-- Controls -->
  <div class="controls-area">

    <!-- Color palette -->
    <div class="color-picker" role="group" aria-label="Color picker">
      <button class="color-btn" data-color="red"    title="Red (1)"    aria-label="Red"></button>
      <button class="color-btn" data-color="blue"   title="Blue (2)"   aria-label="Blue"></button>
      <button class="color-btn" data-color="green"  title="Green (3)"  aria-label="Green"></button>
      <button class="color-btn" data-color="yellow" title="Yellow (4)" aria-label="Yellow"></button>
      <button class="color-btn" data-color="orange" title="Orange (5)" aria-label="Orange"></button>
      <button class="color-btn" data-color="purple" title="Purple (6)" aria-label="Purple"></button>
    </div>

    <!-- Submit / Clear -->
    <div class="action-buttons">
      <button id="btn-submit" class="btn btn-submit" disabled>Submit Guess</button>
      <button id="btn-clear"  class="btn btn-clear">Clear</button>
    </div>

    <!-- Restart (subtle) -->
    <button id="btn-restart-sm" class="btn-restart-sm">↺ Restart Game</button>

  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════════
     RESULT OVERLAY
══════════════════════════════════════════════════════════════════ -->
<div id="result-overlay" role="dialog" aria-modal="true" aria-label="Game Result">
  <div class="result-card">

    <div id="result-icon" class="result-icon">🎉</div>
    <h2 id="result-title" class="result-title win">You cracked it!</h2>
    <p  id="result-subtitle" class="result-subtitle"></p>

    <p class="result-secret-label">The secret code was</p>
    <div id="result-secret" class="result-secret"></div>

    <button id="btn-play-again" class="btn-play-again">Play Again</button>
    <button id="btn-new-player" class="btn-new-player">Change Player</button>

  </div>
</div>

<!-- Toast notification -->
<div id="toast" class="toast" role="status" aria-live="polite"></div>

<script src="game.js"></script>
</body>
</html>
