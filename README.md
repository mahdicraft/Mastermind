# Mastermind Game

A modern, browser-based version of the classic **Mastermind** game with a sleek UI, smooth animations, and real-time feedback.

---

## Live Demo

👉 https://mastermind-ry8a.onrender.com/

---

## How to Play

Mastermind is a code-breaking game where your goal is to guess a hidden color sequence.

### Objective

Guess the correct sequence of **4 colors** within **10 attempts**.

### Rules

* The system generates a secret combination of 4 colors.
* Colors are selected from a set of 6 possible options.
* Colors **can repeat** in the sequence.

### Making a Guess

* Select 4 colors to form your guess.
* Submit your guess to receive feedback.

### Feedback System

After each guess, you will receive hints:

* ⚫ **Black Peg**

  * Correct color **and** correct position

* ⚪ **White Peg**

  * Correct color but **wrong position**

* No peg means the color is not in the sequence.

### Winning the Game

* You win if you get **4 black pegs** within 10 rounds.
* If you fail after 10 attempts, the correct sequence will be revealed.

---

## Technologies Used

### Backend

* **PHP**

  * Handles game logic and validation
  * Uses sessions to store game state
  * Implements the Mastermind feedback algorithm (accurate handling of duplicates)

### 🎨 Frontend

* **HTML5**

  * Structured layout and components

* **CSS3**

  * Modern dark theme
  * Responsive design
  * Animations and transitions (e.g. feedback reveal, button effects)

* **Vanilla JavaScript**

  * Handles user interactions
  * Communicates with backend using Fetch API (AJAX)
  * Updates UI dynamically without page reloads

---

## 📄 License

MIT License
