// Frogger
import config from './config.json';
import { requestAnimationFrame, cancelAnimationFrame } from './helpers/animationframe.js';
import { loadList, loadImage, loadSound } from './helpers/loaders.js';
import Overlay from './helpers/overlay.js';
import Player from './gamecharacters/player.js';
import Enemy from './gamecharacters/enemy.js';

// game settings
let gameSize = 9;

let playerWidth = 150;
let playerHeight = 150;
let playerSpeed = 15;

let enemyWidth = 180;
let enemyHeight = 180;
let enemyMinSpeed = 5;
let enemyMaxSpeed = 10;
let enemySpawnRate = 30;

let score = 0;
let lives = 3;
let goals = 3;

class Game {
    constructor(canvas, overlay, koji) {
        this.koji = koji; // our customizations from koji

        this.canvas = canvas; // our game screen
        this.ctx = canvas.getContext("2d"); // our game screen context
        this.canvas.width = window.innerWidth; // set our game screen width
        this.canvas.height = window.innerHeight; // set our game screen height

        this.overlay = overlay;

        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
        };

        this.gamePaused = false; // game paused or not (true, false)
        this.gameState = 'ready'; // our game state (ready, play, win, over)
        this.frame = 0; // our count of frames just like in a movie

        this.images = {}; // place to keep our images
        this.sounds = {}; // place to keep our sounds
        this.fonts = { default: 'Courier New' }; // place to keep our fonts

        this.player = null;
        this.enemies = {};

        // keyboard input
        this.input = {
            up: false,
            right: false,
            left: false,
            down: false
        };

        // listen for keyboard input
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code), false);
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code), false);

        // listen for button clicks
        this.overlay.root.addEventListener('click', () => {
            this.overlay.hideButton();
            this.gameState = 'play';
        }, false);
    }

    load() {
        // here we will load all our assets
        // pictures, sounds, and fonts we need for our game

        // make a list of assets we want to load
        const gameAssets = [
            loadImage('topImage', this.koji.images.topImage),
            loadImage('middleImage', this.koji.images.middleImage),
            loadImage('bottomImage', this.koji.images.bottomImage),
            loadImage('characterImage', this.koji.images.characterImage),
            loadImage('enemyImage', this.koji.images.enemyImage),
            loadSound('backgroundMusic', this.koji.sounds.backgroundMusic),
            loadSound('winSound', this.koji.sounds.winSound),
            loadSound('gameoverSound', this.koji.sounds.gameoverSound),
            loadSound('scoreSound', this.koji.sounds.scoreSound),
            loadSound('dieSound', this.koji.sounds.dieSound),
        ];

        loadList(gameAssets)
        .then((assets) => {

            this.images = assets.image; // attach the loaded images
            this.sounds = assets.sound; // attach the loaded sounds
            this.fonts = { ...this.fonts, ...assets.fonts } // attach the loaded fonts

            this.create();
        });
    }

    create() {
        // here we will create our game characters

        this.topArea = {
            top: 0,
            bottom: this.canvas.height / gameSize
        }

        this.middleArea = {
            top: this.canvas.height / gameSize,
            bottom: this.canvas.height - (this.canvas.height / gameSize)
        }

        this.bottomArea = {
            top: this.canvas.height - (this.canvas.height / gameSize),
            bottom: this.canvas.height
        }

        // todo extract all width and height
        this.player = new Player(this.ctx, this.images.characterImage, this.screen.centerX - playerWidth/2, this.screen.bottom - playerHeight, playerWidth, playerHeight);

        const enemyId = Math.random().toString(16).slice(2);
        this.enemies[enemyId] = Enemy.spawn(this.ctx, this.images.enemyImage, this.middleArea.top, this.middleArea.bottom, enemyWidth, enemyHeight, enemyMaxSpeed); // spawn takes context, image, topbound, bottombound, width, height, maxSpeed

        console.log(this.sounds);
        this.play();
    }

    play() {
        // each time play() is called, we will update the positions
        // of our game character and paint a picture and then call play() again
        // this way we will create an animation just like the pages of a flip book
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clears the screen for the last picture

        // draw top, middle, and bottom areas
        this.ctx.drawImage(this.images.topImage, 0, 0, this.canvas.width, this.topArea.bottom);
        this.ctx.drawImage(this.images.middleImage, 0, this.middleArea.top, this.canvas.width, this.middleArea.bottom - this.middleArea.top);
        this.ctx.drawImage(this.images.bottomImage, 0, this.bottomArea.top, this.canvas.width, this.bottomArea.bottom - this.bottomArea.top);

        // draw current score and lives
        this.overlay.setScore(score);
        this.overlay.setLives(lives);

        // start playing background music
        this.sounds.backgroundMusic.loop = true;
        this.sounds.backgroundMusic.play();


        // ready to play
        if (this.gameState === 'ready') {
            // game is ready to play
            // show start button and wait for player

            this.overlay.showButton('Start'); // todo: start text
        }

        // player wins
        if (this.gameState === 'win') {
            // player wins!
            // show celebration, wait for awhile then
            // got to 'ready' state

            this.sounds.winSound.play();
            this.overlay.showButton('You Win!'); // todo: start text
            lives = 3;
            score = 0;
            goals = 3;
        }

        // game over
        if (this.gameState === 'over') {
            // player wins!
            // show game over, wait for awhile then
            // got to 'ready' state

            this.overlay.showButton('Game Over'); // todo: start text

            lives = 3;
            score = 0;
            goals = 3;
        }

        // game play
        if (this.gameState === 'play') {
            // game in session

            // check for wins or game overs
            if (goals < 1) { this.gameState = 'win' }
            if (lives < 1) { this.gameState = 'over' }

            // draw enemies
            for (let enemyId in this.enemies) {
                let enemy = this.enemies[enemyId];


                // remove the enemy if offscreen
                // else update enemy position and draw enemy
                if (enemy.x > this.canvas.width) {
                    delete this.enemies[enemyId];
                } else {
                    enemy.move(enemyMinSpeed, 0);
                    enemy.draw();
                }

                
                // check for enemy collisions with the player
                if (this.player.collidesWith(enemy)) {

                    // when player collides with enemy
                    // take away one life, play die sound,  and reset player back to safety
                    lives -= 1; // take life
                    this.sounds.dieSound.play();

                    this.player.x = this.screen.centerX - playerWidth; // reset position
                    this.player.y = this.screen.bottom - playerHeight;

                    // if no more lives
                    if (lives < 1) {
                        this.sounds.gameoverSound.play();
                        this.gameState = 'over';
                    }
                }
            }

            // create new enemies
            // spawn a new enemy every n frames
            if (this.frame % enemySpawnRate === 0) {

                const id = Math.random().toString(16).slice(2);
                this.enemies[id] = Enemy.spawn(this.ctx, this.images.enemyImage, this.middleArea.top, this.middleArea.bottom, enemyWidth, enemyHeight, enemyMaxSpeed); // spawn takes context, image, topbound, bottombound, width, height, maxSpeed
            }


            // if player is in the middle area
            // add to the score every 30 frames
            if (this.frame % 30 === 0) {
                if (this.player.y > this.middleArea.top && this.player.y < this.middleArea.bottom) {
                    score += 1;
                }
            }

            // if player reaches goal
            // celebrate and award 100 score
            // reset position back to start
            if (this.player.y < this.middleArea.top) {
                goals -= 1;
                score += 100;
                this.player.x = this.screen.centerX - playerWidth; // reset position
                this.player.y = this.screen.bottom - playerHeight;
                this.sounds.scoreSound.play();
            }

            // get input and update the player's direction
            // draw player
            let playerDirection = {
                x: (this.input.left ? -1 : 0) + (this.input.right ? 1 : 0),
                y: (this.input.up ? -1 : 0) + (this.input.down ? 1 : 0)
            };

            this.player.move(playerDirection.x * playerSpeed, playerDirection.y * playerSpeed);
            this.player.draw();

            // draw gems and powerups

            // enemy hits player:

            // player gets powerup
        }

        // paint the next screen
        this.frame = requestAnimationFrame(() => this.play());
        this.frameTime = Date.now();
    }

    handleKeyboardInput(type, code) {

        if (type === 'keydown') {
            if (code === 'ArrowUp') { this.input.up = true }
            if (code === 'ArrowRight') { this.input.right = true }
            if (code === 'ArrowDown') { this.input.down = true }
            if (code === 'ArrowLeft') { this.input.left = true }
        }

        if (type === 'keyup') {
            if (code === 'ArrowUp') { this.input.up = false }
            if (code === 'ArrowRight') { this.input.right = false }
            if (code === 'ArrowDown') { this.input.down = false }
            if (code === 'ArrowLeft') { this.input.left = false }

            if (code === 'Space') { this.pause(); } // spacebar: pause and play game
        }
    }

    pause() {
        if (this.gamePaused) {
            this.gamePaused = false;
            requestAnimationFrame(() => this.play());
            this.overlay.hideButton();
        } else {
            this.gamePaused = true;
            cancelAnimationFrame(this.frame);
            this.overlay.showButton('Paused');
        }
    }
}

const screen = document.getElementById("game");
const overlay = new Overlay(document.getElementById("overlay"));
const frogger = new Game(screen, overlay, config); // here we create a fresh game
frogger.load(); // and tell it to start