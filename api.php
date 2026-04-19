<?php
/**
 * Mastermind Game — Backend API
 * Handles game state via PHP sessions.
 * All responses are JSON.
 */
session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache');

$input  = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? ($_GET['action'] ?? '');

const COLORS      = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
const CODE_LENGTH = 4;
const MAX_ROUNDS  = 10;

match ($action) {
    'start'   => handleStart($input),
    'guess'   => handleGuess($input),
    'status'  => handleStatus(),
    'restart' => handleRestart(),
    default   => respond(['error' => 'Unknown action']),
};

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleStart(array $data): void
{
    $name = trim($data['name'] ?? '');
    if ($name === '') $name = 'Player';
    // Sanitise to prevent XSS being stored in session
    $name = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $_SESSION['mastermind'] = [
        'secret'      => generateSecret(),
        'player_name' => $name,
        'attempts'    => 0,
        'history'     => [],
        'game_over'   => false,
        'won'         => false,
    ];

    respond(['success' => true, 'player_name' => $name]);
}

function handleGuess(array $data): void
{
    if (!isset($_SESSION['mastermind'])) {
        respond(['error' => 'No active game. Please start a new game.']);
        return;
    }

    $game = &$_SESSION['mastermind'];

    if ($game['game_over']) {
        respond(['error' => 'The game is already over.']);
        return;
    }

    $guess = $data['guess'] ?? [];

    if (!is_array($guess) || count($guess) !== CODE_LENGTH) {
        respond(['error' => 'You must select exactly 4 colors.']);
        return;
    }

    foreach ($guess as $color) {
        if (!in_array($color, COLORS, true)) {
            respond(['error' => "Invalid color: $color"]);
            return;
        }
    }

    $feedback = calculateFeedback($game['secret'], $guess);
    $game['attempts']++;
    $game['history'][] = ['guess' => $guess, 'feedback' => $feedback];

    if ($feedback['black'] === CODE_LENGTH) {
        $game['game_over'] = true;
        $game['won']       = true;
    } elseif ($game['attempts'] >= MAX_ROUNDS) {
        $game['game_over'] = true;
        $game['won']       = false;
    }

    $response = [
        'success'   => true,
        'feedback'  => $feedback,
        'attempts'  => $game['attempts'],
        'game_over' => $game['game_over'],
        'won'       => $game['won'],
    ];

    if ($game['game_over']) {
        $response['secret'] = $game['secret'];
    }

    respond($response);
}

function handleStatus(): void
{
    if (!isset($_SESSION['mastermind'])) {
        respond(['active' => false]);
        return;
    }

    $game = $_SESSION['mastermind'];

    $response = [
        'active'       => true,
        'player_name'  => $game['player_name'],
        'attempts'     => $game['attempts'],
        'max_attempts' => MAX_ROUNDS,
        'history'      => $game['history'],
        'game_over'    => $game['game_over'],
        'won'          => $game['won'],
        'secret'       => $game['game_over'] ? $game['secret'] : null,
    ];

    respond($response);
}

function handleRestart(): void
{
    unset($_SESSION['mastermind']);
    respond(['success' => true]);
}

// ─── Game Logic ───────────────────────────────────────────────────────────────

function generateSecret(): array
{
    $secret = [];
    for ($i = 0; $i < CODE_LENGTH; $i++) {
        $secret[] = COLORS[array_rand(COLORS)];
    }
    return $secret;
}

/**
 * Standard Mastermind feedback:
 *   black = correct color AND correct position
 *   white = correct color but wrong position
 */
function calculateFeedback(array $secret, array $guess): array
{
    $black       = 0;
    $secretPool  = [];
    $guessPool   = [];

    for ($i = 0; $i < CODE_LENGTH; $i++) {
        if ($secret[$i] === $guess[$i]) {
            $black++;
        } else {
            $secretPool[] = $secret[$i];
            $guessPool[]  = $guess[$i];
        }
    }

    $white = 0;
    foreach ($guessPool as $color) {
        $pos = array_search($color, $secretPool, true);
        if ($pos !== false) {
            $white++;
            array_splice($secretPool, $pos, 1);
        }
    }

    return ['black' => $black, 'white' => $white];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function respond(array $data): void
{
    echo json_encode($data);
    exit;
}
