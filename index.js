// Tokyo Traffic (frogger)
import config from './config.json';
import {
    requestAnimationFrame,
    cancelAnimationFrame
} from './helpers/animationframe.js';
import {
    loadList,
    loadImage,
    loadSound,
    loadFont
} from './helpers/loaders.js';
import Overlay from './helpers/overlay.js';
import Player from './gamecharacters/player.js';
import Enemy from './gamecharacters/enemy.js';

class Game {
    constructor(canvas, overlay, koji) {
        this.koji = koji; // our customizations from koji

        this.canvas = canvas; // our game screen
        this.ctx = canvas.getContext("2d"); // our game screen context
        this.canvas.width = window.innerWidth; // set our game screen width
        this.canvas.height = window.innerHeight; // set our game screen height

        this.overlay = new Overlay(overlay);

        // game settings
        this.gameSize = 9;

        this.playerWidth = this.canvas.height / this.gameSize;
        this.playerHeight = this.canvas.height / this.gameSize;
        this.playerSpeed = this.koji.general.playerSpeed;

        this.enemyWidth = this.canvas.height / this.gameSize;
        this.enemyHeight = this.canvas.height / this.gameSize;
        this.enemyMinSpeed = parseInt(this.koji.general.enemyMinSpeed);
        this.enemyMaxSpeed = parseInt(this.koji.general.enemyMaxSpeed);
        this.enemySpawnRate = parseInt(this.koji.general.enemySpawnRate);

        this.score = 0;
        this.lives = this.koji.general.lives;
        this.wins = this.koji.general.wins;

        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
        };

        this.gamePaused = false; // game paused or not (true, false)
        this.gameState = {
            current: 'ready',
            prev: ''
        }; // our game state (ready, play, win, over)
        this.frame = 0; // our count of frames just like in a movie
        this.gameSounds = true;

        this.images = {}; // place to keep our images
        this.sounds = {}; // place to keep our sounds
        this.fonts = {}; // place to keep our fonts

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
        this.overlay.root.addEventListener('click', ({ target }) => this.handleOverlayClicks(target), false);
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
            loadFont('gameFont', this.koji.style.fontFamily)
        ];

        loadList(gameAssets)
            .then((assets) => {

                this.images = assets.image; // attach the loaded images
                this.sounds = assets.sound; // attach the loaded sounds
                this.fonts = assets.font; // attach the loaded fonts

                this.create();
            });
    }

    create() {
        // here we will create our game characters

        // set our overlay styles
        this.overlay.setStyles({
            textColor: this.koji.style.textColor,
            primaryColor: this.koji.style.primaryColor,
            fontFamily: this.fonts.gameFont
        })

        this.topArea = {
            top: 0,
            bottom: this.canvas.height / this.gameSize
        }

        this.middleArea = {
            top: this.canvas.height / this.gameSize,
            bottom: this.canvas.height - (this.canvas.height / this.gameSize)
        }

        this.bottomArea = {
            top: this.canvas.height - (this.canvas.height / this.gameSize),
            bottom: this.canvas.height
        }

        // todo extract all width and height
        this.player = new Player(this.ctx, this.images.characterImage, this.screen.centerX - this.playerWidth / 2, this.screen.bottom - this.playerHeight, this.playerWidth, this.playerHeight);

        const enemyId = Math.random().toString(16).slice(2);
        this.enemies[enemyId] = Enemy.spawn(this.ctx, this.images.enemyImage, this.middleArea.top, this.middleArea.bottom, this.enemyWidth, this.enemyHeight, this.enemyMaxSpeed); // spawn takes context, image, topbound, bottombound, width, height, maxSpeed


        this.play();
    }

    play() {
        // each time play() is called, we will update the positions
        // of our game character and paint a picture and then call play() again
        // this way we will create an animation just like the pages of a flip book
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clears the screen of the last picture

        // draw top, middle, and bottom areas
        this.ctx.drawImage(this.images.topImage, 0, 0, this.canvas.width, this.topArea.bottom);
        this.ctx.drawImage(this.images.middleImage, 0, this.middleArea.top, this.canvas.width, this.middleArea.bottom - this.middleArea.top);
        this.ctx.drawImage(this.images.bottomImage, 0, this.bottomArea.top, this.canvas.width, this.bottomArea.bottom - this.bottomArea.top);

        // draw current score and lives
        this.overlay.setScore(this.score);
        this.overlay.setLives(this.lives);

        // check for wins or game overs
        if (this.wins < 1) {
            this.setGameState('win');
        }

        if (this.lives < 1) {
            this.setGameState('over');
        }



        // ready to play
        if (this.gameState.current === 'ready') {
            // game is ready to play
            // show start button and wait for player

            this.overlay.showBanner(this.koji.general.name);
            this.overlay.showButton(this.koji.general.startText);
        }

        // player wins
        if (this.gameState.current === 'win') {
            // player wins!
            // show celebration, wait for awhile then
            // got to 'ready' state

            this.overlay.showBanner(this.koji.general.winText);
            if (this.gameState.prev === 'play') {
                this.sounds.winSound.play();
                this.setGameState('win');
            }
        }

        // game over
        if (this.gameState.current === 'over') {
            // player wins!
            // show game over, wait for awhile then
            // got to 'ready' state

            this.overlay.showBanner(this.koji.general.gameoverText);
            this.sounds.backgroundMusic.muted = true;

            if (this.gameState.prev === 'play') {
                this.sounds.gameoverSound.play();
                this.setGameState('over');
            }
        }

        // game play
        if (this.gameState.current === 'play') {
            // game in session

            if (this.gameState.prev === 'ready') {
                this.overlay.showStats(); // show our score and lives
                this.overlay.hideBanner(); // hide our banner

                // play background music when its available
                this.sounds.backgroundMusic.loop = true;
                this.sounds.backgroundMusic.play();
            }


            // draw enemies
            for (let enemyId in this.enemies) {
                let enemy = this.enemies[enemyId];


                // remove the enemy if offscreen
                // else update enemy position and draw enemy
                if (enemy.x > this.canvas.width) {
                    delete this.enemies[enemyId];
                } else {
                    enemy.move(this.enemyMinSpeed, 0);
                    enemy.draw();
                }


                // check for enemy collisions with the player
                if (this.player.collidesWith(enemy)) {

                    // when player collides with enemy
                    // take away one life, play die sound,  and reset player back to safety
                    this.lives -= 1; // take life
                    this.sounds.dieSound.play();

                    this.player.x = this.screen.centerX - this.playerWidth; // reset position
                    this.player.y = this.screen.bottom - this.playerHeight;
                }
            }

            // create new enemies
            // spawn a new enemy every n frames
            if (this.frame % this.enemySpawnRate === 0) {

                const id = Math.random().toString(16).slice(2);
                this.enemies[id] = Enemy.spawn(this.ctx, this.images.enemyImage, this.middleArea.top, this.middleArea.bottom, this.enemyWidth, this.enemyHeight, this.enemyMaxSpeed); // spawn takes context, image, topbound, bottombound, width, height, maxSpeed
            }


            // if player is in the middle area
            // add to the score every 30 frames
            if (this.frame % 30 === 0) {
                if (this.player.y > this.middleArea.top && this.player.y < this.middleArea.bottom) {
                    this.score += 1;
                }
            }

            // if player reaches goal: win
            // celebrate and award 100 score
            // reset position back to start
            if (this.player.y + this.player.height - 20 <= this.middleArea.top) {

                this.wins -= 1;
                this.score += 100;
                this.player.x = this.screen.centerX - this.playerWidth; // reset position
                this.player.y = this.screen.bottom - this.playerHeight;
                this.sounds.scoreSound.play();
            }

            // get input and update the player's direction
            // draw player
            let playerDirection = {
                x: (this.input.left ? -1 : 0) + (this.input.right ? 1 : 0),
                y: (this.input.up ? -1 : 0) + (this.input.down ? 1 : 0)
            };

            this.player.move(playerDirection.x * this.playerSpeed, playerDirection.y * this.playerSpeed);
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
            if (code === 'ArrowUp') {
                this.input.up = true
            }
            if (code === 'ArrowRight') {
                this.input.right = true
            }
            if (code === 'ArrowDown') {
                this.input.down = true
            }
            if (code === 'ArrowLeft') {
                this.input.left = true
            }
        }

        if (type === 'keyup') {
            if (code === 'ArrowUp') {
                this.input.up = false
            }
            if (code === 'ArrowRight') {
                this.input.right = false
            }
            if (code === 'ArrowDown') {
                this.input.down = false
            }
            if (code === 'ArrowLeft') {
                this.input.left = false
            }

            if (code === 'Space') {
                this.pause();
            } // spacebar: pause and play game
        }
    }

    handleOverlayClicks(target) {
        this.overlay.hideButton(); // hide button

        // clicks on button
        if (target.id === 'button') {
            // game state is ready
            // set game state to play
            if (this.gameState.current === 'ready') {
                this.setGameState('play');
            }
        }

        // clicks mute button
        if (target.id === 'mute') {
            this.toggleSounds();
        }


        // clicks anywhere
        // game state is over:
        // reset game and set to play
        if (this.gameState.current === 'over') {
            this.reset();
        }

        // game state is win:
        // reset game and set to play
        if (this.gameState.current === 'win') {
            this.reset();
        }

    }

    toggleSounds() {
        this.gameSounds = !this.gameSounds; // toggle gameSounds
        this.overlay.setMute(this.gameSounds); // update mute display

        // if game sounds enabled, unmute all game sounds
        // else mute all game sounds
        if (this.gameSounds) {
            // unmute all game sounds
            // and play background music
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = false;
                this.sounds.backgroundMusic.play();
            });
        } else {
            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });
        }
    }

    pause() {
        // toggle gamePaused
        this.gamePaused = !this.gamePaused;

        // paused game
        // stop animating
        // show puase button
        if (this.gamePaused) {
            cancelAnimationFrame(this.frame);
            this.overlay.showBanner('Paused');
        }

        // unpaused game
        // start animating
        // hide puase button
        if (!this.gamePaused) {
            requestAnimationFrame(() => this.play());
            this.overlay.hideBanner();
        }
    }

    setGameState(state) {
        this.gameState = {
            ...this.gameState,
            ...{
                current: state,
                prev: this.gameState.current
            }
        };
    }

    reset() {
        document.location.reload();
    }
}

const screen = document.getElementById("game");
const overlay = document.getElementById("overlay");
const frogger = new Game(screen, overlay, config); // here we create a fresh game
frogger.load(); // and tell it to start