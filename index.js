let firstCard = null;
let secondCard = null;
let clicks = 0;
let pairsMatched = 0;
let totalPairs = 0;
let timer = null;
let timeLeft = 0;
let canFlip = false;

// Difficulty settings
const difficulties = {
    easy: { pairs: 4, time: 60 },
    medium: { pairs: 6, time: 75 },
    hard: { pairs: 8, time: 90 }
};

// Fetch Pokémon from API
async function fetchPokemon(count) {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1500');
    const data = await response.json();
    const pokemonList = data.results.sort(() => 0.5 - Math.random()).slice(0, count);
    
    const pokemonData = [];
    for (let pokemon of pokemonList) {
        const res = await fetch(pokemon.url);
        const data = await res.json();
        pokemonData.push({
            id: data.id,
            name: data.name,
            image: data.sprites.other['official-artwork'].front_default
        });
    }
    return pokemonData;
}

// Create a card HTML
function createCard(pokemon) {
    return `
        <div class="col">
            <div class="card game-card" data-id="${pokemon.id}">
                <img class="front_face" src="${pokemon.image}" alt="${pokemon.name}">
                <img class="back_face" src="back.webp" alt="back">
            </div>
        </div>
    `;
}

// Start the game timer
function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        $('#time').text(timeLeft);
        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

// Set up the game
function setupGame(difficulty) {
    const config = difficulties[difficulty];
    totalPairs = config.pairs;
    timeLeft = config.time;
    clicks = 0;
    pairsMatched = 0;
    firstCard = null;
    secondCard = null;
    canFlip = false;
    
    // Update status display
    $('#clicks').text(clicks);
    $('#pairs-matched').text(pairsMatched);
    $('#pairs-left').text(totalPairs);
    $('#total-pairs').text(totalPairs);
    $('#time').text(timeLeft);
    $('#message').addClass('d-none').text('');
    $('#power-up').prop('disabled', true);
    
    // Stop any existing timer
    if (timer) clearInterval(timer);
    
    // Fetch Pokémon and create cards
    fetchPokemon(config.pairs).then(pokemon => {
        const cards = [...pokemon, ...pokemon]
            .sort(() => 0.5 - Math.random())
            .map(p => createCard(p));
        
        $('#game_grid').html(cards.join(''));
        $('.game-card').on('click', handleCardClick);
    });
}

// Handle card clicks
function handleCardClick() {
    if (!canFlip || $(this).hasClass('flip') || $(this).hasClass('matched')) return;
    
    clicks++;
    $('#clicks').text(clicks);
    $(this).addClass('flip');
    
    if (!firstCard) {
        firstCard = $(this);
    } else {
        secondCard = $(this);
        
        if (firstCard.data('id') === secondCard.data('id')) {
            // Match found
            firstCard.addClass('matched').off('click');
            secondCard.addClass('matched').off('click');
            pairsMatched++;
            $('#pairs-matched').text(pairsMatched);
            $('#pairs-left').text(totalPairs - pairsMatched);
            
            if (pairsMatched >= 2) {
                $('#power-up').prop('disabled', false);
            }
            
            if (pairsMatched === totalPairs) {
                endGame(true);
            }
            
            firstCard = null;
            secondCard = null;
        } else {
            // No match
            canFlip = false;
            setTimeout(() => {
                firstCard.removeClass('flip');
                secondCard.removeClass('flip');
                firstCard = null;
                secondCard = null;
                canFlip = true;
            }, 1000);
        }
    }
}

// End the game
function endGame(won) {
    clearInterval(timer);
    $('.game-card').off('click');
    canFlip = false;
    $('#message')
        .removeClass('d-none')
        .text(won ? 'You Win!' : 'Game Over!')
        .addClass(won ? 'text-success' : 'text-danger');
}

// Power-up: show all cards briefly
function triggerPowerUp() {
    $('#power-up').prop('disabled', true);
    $('#game_grid .game-card:not(.matched)').addClass('flip');
    setTimeout(() => {
        $('#game_grid .game-card:not(.matched)').removeClass('flip');
    }, 3000);
}

// Initialize the game
$(document).ready(() => {
    // Start button
    $('#start').on('click', () => {
        setupGame($('#difficulty').val());
        canFlip = true;
        startTimer();
    });
    
    // Reset button
    $('#reset').on('click', () => {
        setupGame($('#difficulty').val());
    });
    
    // Power-up button
    $('#power-up').on('click', triggerPowerUp);
    
    // Theme toggle button
    $('#theme-toggle').on('click', () => {
        $('body').toggleClass('dark-theme');
    });
    
    // Initial game setup (no timer)
    setupGame('easy');
});