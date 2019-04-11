// Frogger
import config from './config.json';
import { requestAnimationFrame, cancelAnimationFrame } from './helpers/animationframe.js';
import { loadList, loadImage, loadSound } from './helpers/loaders.js';
import Player from './gamecharacters/player.js';
import Enemy from './gamecharacters/enemy.js';

// todo
// extract all hard coded dimentions
// wrap overlay
// display score
// display lives
// display 


// game settings
let portions = 9;
let playerSpeed = 15;
let enemyTopSpeed = 15; // todo
let lives = 3;

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
        this.overlay.addEventListener('click', () => {
            this.overlay.setAttribute('style', 'display: none;'); // hide overlay
            this.gameState = 'play';
            this.pause();
        }, false);
    }

    load() {
        console.log('load');
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
        console.log('create', this.images, this.sounds, this.fonts);
        // here we will create our game characters

        this.topArea = {
            top: 0,
            bottom: this.canvas.height / portions
        }

        this.middleArea = {
            top: this.canvas.height / portions,
            bottom: this.canvas.height - (this.canvas.height / portions)
        }

        this.bottomArea = {
            top: this.canvas.height - (this.canvas.height / portions),
            bottom: this.canvas.height
        }


        // todo extract all width and height
        let playerWidth = this.canvas.width / portions;
        let playerHeight = this.canvas.height / portions;
        console.log(playerWidth, playerHeight);
        this.player = new Player(this.ctx, this.images.characterImage, this.screen.centerX - playerWidth/2, this.screen.bottom - playerHeight, playerWidth, playerHeight);

        const enemyId = Math.random().toString(16).slice(2);
        this.enemies[enemyId] = Enemy.spawn(this.ctx, this.images.enemyImage, 210, 210, this.middleArea.top, this.middleArea.bottom);

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

        // ready to play
        if (this.gameState === 'ready') {
            // game is ready to play
            // show start button and wait for player

            this.overlay.setAttribute('style', ''); // show overlay
        }

        // player wins
        if (this.gameState === 'win') {
            // player wins!
            // show celebration, wait for awhile then
            // got to 'ready' state

            this.overlay.setAttribute('style', ''); // show overlay
            console.log('play-win', this.frame);
        }

        // game over
        if (this.gameState === 'over') {
            // player wins!
            // show game over, wait for awhile then
            // got to 'ready' state

            this.overlay.setAttribute('style', ''); // show overlay

            lives = 3;
            console.log('play-over', this.frame);
        }

        // game play
        if (this.gameState === 'play') {
            // game in session

            // draw enemies
            for (let enemyId in this.enemies) {
                let enemy = this.enemies[enemyId];


                // remove the enemy if offscreen
                // else update enemy position and draw enemy
                if (enemy.x > this.canvas.width) {
                    delete this.enemies[enemyId];
                } else {
                    enemy.move(5, 0);
                    enemy.draw();
                }

                
                if (this.player.collidesWith(enemy)) {

                    // when player collides with enemy
                    // take away one life, and reset player back to safety
                    lives -= 1; // take life

                    this.player.x = this.screen.centerX - 90; // reset position
                    this.player.y = this.screen.bottom - 180;

                    // if no more lives
                    if (lives < 1) {
                        this.gameState = 'over';
                    }
                }
            }

            // create new enemies
            // spawn a new enemy every 60 frames
            if (this.frame % 60 === 0) {

                const id = Math.random().toString(16).slice(2);
                this.enemies[id] = Enemy.spawn(this.ctx, this.images.enemyImage, 210, 210, this.middleArea.top, this.middleArea.bottom);
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
            this.overlay.setAttribute('style', 'display: none;'); // hide overlay
        } else {
            this.gamePaused = true;
            cancelAnimationFrame(this.frame);
            this.overlay.setAttribute('style', ''); // show overlay
        }
    }
}

const screen = document.getElementById("game");
const overlay = document.getElementById("overlay");
const frogger = new Game(screen, overlay, config); // here we create a fresh game
frogger.load(); // and tell it to start