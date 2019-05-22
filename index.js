// Toad Traffic (frogger)
import Koji from 'koji-tools';
Koji.pageLoad();

const config = Koji.config;

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
    constructor(canvas, overlay, config) {
        this.config = config; // set config

        this.canvas = canvas; // game screen
        this.ctx = canvas.getContext("2d"); // game screen context
        this.canvas.width = window.innerWidth; // set  game screen width
        this.canvas.height = window.innerHeight; // set  game screen height
            

        this.overlay = new Overlay(overlay);

        // frame count and rate
        // just a place to keep track of frame rate (not set it)
        this.frame = {
            count: 0,
            rate: 60,
            time: Date.now()
        };

        // game settings
        this.state = {
            current: 'loading',
            prev: '',
            muted: localStorage.getItem('toadtraffic-muted') === 'true'
        };

        this.input = {
            active: 'keyboard',
            keyboard: { up: false, right: false, left: false, down: false },
            mouse: { x: 0, y: 0, click: false },
            touch: { x: 0, y: 0 },
        };

        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
            scale: ((this.canvas.width + this.canvas.height) / 2) * 0.003
        };

        this.images = {}; // place to keep images
        this.sounds = {}; // place to keep sounds
        this.fonts = {}; // place to keep fonts

        this.player = {};
        this.enemies = {};

        // listen for keyboard input
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code));
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code));
        
        // listen for touch input
        document.addEventListener('touchend', (e) => this.handleTouchInput(e));

        // listen for button clicks
        this.overlay.root.addEventListener('click', (e) => this.handleOverlayClicks(e));

        // listen for resize events
        window.addEventListener("resize", () => this.reset());
        window.addEventListener("orientationchange", () => this.reset());

        // handle koji config changes
        Koji.on('change', (scope, key, value) => {
            console.log('updating configs...', scope, key, value);
            this.config[scope][key] = value;
            this.cancelFrame(this.frame.count - 1);
            this.load();
        });
    }

    init() {
        // reset previous game loop
        if (this.frame.count > 0) {
            this.cancelFrame();
        }

        // initialize game settings
        this.playerWidth = Math.min(40 * this.screen.scale, 120);
        this.playerHeight = Math.min(40 * this.screen.scale, 120);
        this.playerSpeed = this.config.settings.playerSpeed;

        this.enemyWidth = Math.min(60 * this.screen.scale, 180);
        this.enemyHeight = Math.min(40 * this.screen.scale, 120);
        this.enemyMinSpeed = parseInt(this.config.settings.enemyMinSpeed);
        this.enemyMaxSpeed = parseInt(this.config.settings.enemyMaxSpeed);
        this.enemySpawnRate = parseInt(this.config.settings.enemySpawnRate);

        this.safeZoneHeight = this.playerHeight * 1.25;

        this.score = 0;
        this.lives = parseInt(this.config.settings.lives);
        this.wins = parseInt(this.config.settings.wins);


        // reset overlays
        this.overlay.banner.active = false;
        this.overlay.button.active = false;
    }

    load() {
        // here we will load all  assets
        // pictures, sounds, and fonts we need for  game
        
        this.init();

        // make a list of assets to load
        const gameAssets = [
            loadImage('topImage', this.config.images.topImage),
            loadImage('middleImage', this.config.images.middleImage),
            loadImage('bottomImage', this.config.images.bottomImage),
            loadImage('characterImage', this.config.images.characterImage),
            loadImage('enemyImage', this.config.images.enemyImage),
            loadSound('backgroundMusic', this.config.sounds.backgroundMusic),
            loadSound('winSound', this.config.sounds.winSound),
            loadSound('gameoverSound', this.config.sounds.gameoverSound),
            loadSound('scoreSound', this.config.sounds.scoreSound),
            loadSound('dieSound', this.config.sounds.dieSound),
            loadFont('gameFont', this.config.settings.fontFamily)
        ];

        loadList(gameAssets)
            .then((assets) => {

                this.images = assets.image; // attach the loaded images
                this.sounds = assets.sound; // attach the loaded sounds
                this.fonts = assets.font; // attach the loaded fonts

                this.create();

                this.overlay.hideLoading();
                this.canvas.style.opacity = 1;
            });
    }

    create() {
        // here we will create  game characters

        // set  overlay styles
        this.overlay.setStyles({
            textColor: this.config.colors.textColor,
            primaryColor: this.config.colors.primaryColor,
            fontFamily: this.fonts.gameFont
        })

        this.topArea = {
            top: 0,
            bottom: this.safeZoneHeight
        }

        this.middleArea = {
            top: this.safeZoneHeight,
            bottom: this.canvas.height - (this.safeZoneHeight)
        }

        this.bottomArea = {
            top: this.canvas.height - (this.safeZoneHeight),
            bottom: this.canvas.height
        }

        // create player
        this.player = new Player(this.ctx,
            this.images.characterImage,
            this.screen.centerX - this.playerWidth / 2,
            this.screen.bottom - (this.safeZoneHeight + this.playerHeight) / 2,
            this.playerWidth, this.playerHeight,
            this.playerSpeed);

        // set mobileInput to home
        this.input.touch = {
            x: this.player.cx,
            y: this.player.cy
        };

        // set game state ready
        this.setState({ current: 'ready' });
        this.play();
    }

    play() {
        // each time play() is called, we will update the positions
        // of game character and paint a picture and then call play() again
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
            this.setState({ current: 'win' });
        }

        if (this.lives < 1) {
            this.setState({ current: 'over' });
        }



        // ready to play
        if (this.state.current === 'ready') {
            // game is ready to play
            // show start button and wait for player

            if (!this.overlay.banner.active) {
                this.overlay.showBanner(this.config.settings.name);
            }
            if (!this.overlay.button.active) {
                this.overlay.showButton(this.config.settings.startText);
            }
            if (!this.overlay.instructions.active) {
                this.overlay.setInstructions({
                    desktop: this.config.settings.instructionsDesktop,
                    mobile: this.config.settings.instructionsMobile
                });
            }

            // show mute button
            this.overlay.setMute(this.state.muted);
        }

        // player wins
        if (this.state.current === 'win') {
            // player wins!
            // show celebration, wait for awhile then
            // got to 'ready' state

            if (!this.overlay.banner.active) {
                this.overlay.showBanner(this.config.settings.winText);
            }

            if (this.state.prev === 'play') {
                this.sounds.winSound.play();
                this.setState({ current: 'win' });
            }
        }

        // game over
        if (this.state.current === 'over') {
            // player wins!
            // show game over, wait for awhile then
            // got to 'ready' state

            this.overlay.showBanner(this.config.settings.gameoverText);

            if (this.state.prev === 'play') {
                this.sounds.gameoverSound.play();
                this.setState({ current: 'over' });
            }
        }

        // game play
        if (this.state.current === 'play') {
            // game in session


            if (this.state.prev === 'ready') {
                this.overlay.showStats(); // show  score and lives
                if (this.overlay.banner.active) {
                    this.overlay.hideBanner(); // hide banner
                }
                if (this.overlay.instructions.active) {
                    this.overlay.hideInstructions(); // hide instructions
                }

                // play background music when its available
                this.sounds.backgroundMusic.loop = true;
                if (!this.state.muted) {
                    this.sounds.backgroundMusic.play();
                }
            }

            // draw enemies
            if (Object.entries(this.enemies).length > 0) {
                for (let enemyId in this.enemies) {
                let enemy = this.enemies[enemyId];

                // remove the enemy if offscreen
                // else update enemy position and draw enemy
                if (enemy.x > this.canvas.width) {
                    delete this.enemies[enemyId]
                } else {
                    enemy.move(this.enemyMinSpeed, 0, this.frame.scale);
                    enemy.draw();
                }
            }
            }


            // create new enemies
            // spawn a new enemy every n frames
            if (this.frame.count % this.enemySpawnRate === 0 || this.frame.count === 0) {

                const id = Math.random().toString(16).slice(2);
                this.enemies[id] = Enemy.spawn(this.ctx, this.images.enemyImage, this.middleArea.top, this.middleArea.bottom, this.enemyWidth, this.enemyHeight, this.enemyMaxSpeed); // spawn takes context, image, topbound, bottombound, width, height, maxSpeed
            }


            // if player is in the middle area
            // add to the score every 30 frames
            if (this.frame.count % 30 === 0) {
                if (this.player.y > this.middleArea.top && this.player.y < this.middleArea.bottom) {
                    this.score += 1;
                }
            }

            // if player reaches goal: win
            // celebrate and award 100 score
            // reset position back to start
            if (this.player.y + this.player.height - 20 <= this.middleArea.top) {

                this.player.setX(this.screen.centerX - this.playerWidth); // reset position
                this.player.setY(this.screen.bottom - this.playerHeight);
                this.input.touch.x = this.player.cx; // reset position
                this.input.touch.y = this.player.cy;

                this.sounds.scoreSound.play();
                this.wins -= 1;
                this.score += 100;
            }

            // draw player
            let playerDirection = this.getDirection();

            this.player.move(playerDirection.x, playerDirection.y, this.frame.scale);
            this.player.draw();

            // draw gems and powerups

            // enemy hits player:
            // check for enemy collisions with the player

            if (this.player.collisionsWith(this.enemies)) {
                // when player collides with enemy
                // take away one life, play die sound,  and reset player back to safety

                this.player.setX(this.screen.centerX - this.playerWidth); // reset position
                this.player.setY(this.screen.bottom - this.playerHeight);
                this.input.touch.x = this.player.cx; // reset position
                this.input.touch.y = this.player.cy;

                this.sounds.dieSound.play();
                this.lives -= 1; // take life
            }


            // player gets powerup
        }

        // paint the next screen
        this.requestFrame();
    }

    handleKeyboardInput(type, code) {

        if (type === 'keydown') {
            this.input.active = 'keyboard';

            if (code === 'ArrowUp') {
                this.input.keyboard.up = true
            }
            if (code === 'ArrowRight') {
                this.input.keyboard.right = true
            }
            if (code === 'ArrowDown') {
                this.input.keyboard.down = true
            }
            if (code === 'ArrowLeft') {
                this.input.keyboard.left = true
            }
        }

        if (type === 'keyup') {
            if (code === 'ArrowUp') {
                this.input.keyboard.up = false
            }
            if (code === 'ArrowRight') {
                this.input.keyboard.right = false
            }
            if (code === 'ArrowDown') {
                this.input.keyboard.down = false
            }
            if (code === 'ArrowLeft') {
                this.input.keyboard.left = false
            }
        }
    }

    handleTouchInput(e) {
        // handle touches
        // update intended location

        // unless just started
        if (this.state.current === 'ready') { return; }

        // unless muting 
        if (e.target.id === 'mute') { return; }

        this.input.active = false; // set keyboard input inactive
        const { clientX, clientY } = e.changedTouches[0];

        this.input.touch = {
            x: Math.floor(clientX),
            y: Math.floor(clientY)
        };
    }

    handleOverlayClicks(e) {
        if (this.state.current === 'loading') { return; }
        let { target } = e;

        this.overlay.hideButton(); // hide button

        // clicks on button
        if (target.id === 'button') {
            // game state is ready
            // set game state to play
            if (this.state.current === 'ready') {
                this.setState({ current: 'play' });

                // double mute ios hack
                this.mute();
                this.mute();
            }
        }

        // clicks mute button
        if (target.id === 'mute') {
            this.mute();
        }


        // clicks anywhere
        // game state is over:
        // reset game and set to play
        if (this.state.current === 'over') {
            this.reset();
        }

        // game state is win:
        // reset game and set to play
        if (this.state.current === 'win') {
            this.reset();
        }

        e.stopPropagation();
    }

    mute() {
        // toggle muted
        let key = 'toadtraffic-muted';
        localStorage.setItem(
            key,
            localStorage.getItem(key) === 'true' ? 'false' : 'true'
        );
        this.state.muted = localStorage.getItem(key) === 'true';

        this.overlay.setMute(this.state.muted);


        // if muted, else mute all game sounds
        // unmute all game sounds
        if (this.state.muted) {
            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });
        } else {
            // unmute all game sounds
            // and play background music
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = false;
                this.sounds.backgroundMusic.play();
            });
        }
    }
    
    getDirection() {
        // get input and update the player's direction
        if (this.input.active === 'keyboard') {


            // walk in direction of pressed arrow keys
            return {
                x: (this.input.keyboard.left ? -1 : 0) + (this.input.keyboard.right ? 1 : 0),
                y: (this.input.keyboard.up ? -1 : 0) + (this.input.keyboard.down ? 1 : 0)
            };
        } else {
            // walk to touched point on screen
            return this.getPathToPoint();
        }
    }

    getPathToPoint() {
        // calculate the direction to the point

        let dx = this.input.touch.x - this.player.cx;
        let adx = Math.abs(dx);
        let inrangeX = adx > this.player.width/8;
        // stop if in range

        let x = inrangeX ?
            (this.input.touch.x < this.player.cx ? -1 : 0) +
            (this.input.touch.x > this.player.cx ? 1 : 0) :
            0;

        let dy = this.input.touch.y - this.player.cy;
        let ady = Math.abs(dy);
        let inrangeY = ady > this.player.height/8;
        // stop if in range

        let y = inrangeY ?
            (this.input.touch.y < this.player.cy ? -1 : 0) +
            (this.input.touch.y > this.player.cy ? 1 : 0) :
            0;

        // smooth out path to touched point
        if (adx > ady) {
            return {
                x: x,
                y: y * (ady/adx)
            }
        } else {
            return {
                x: x * (adx/ady),
                y: y 
            }
        }
    }

    // update game state
    setState(state) {
        this.state = {
            ...this.state,
            ...{ prev: this.state.current },
            ...state,
        };
    }

    reset() {
        document.location.reload();
    }

    // request new frame
    requestFrame() {
         let now = Date.now();
         this.frame = {
             count: requestAnimationFrame(() => this.play()),
             rate: now - this.frame.time,
             time: now,
             scale: this.screen.scale * this.frame.rate * 0.01
         };
     }

    // don't request new frame
    cancelFrame() {
        cancelAnimationFrame(this.frame.count);
    }
}

// set background color
document.body.style.backgroundColor = config.colors.backgroundColor;

// get the game screen and overlay elements
const screen = document.getElementById("game");
const overlay = document.getElementById("overlay");

const frogger = new Game(screen, overlay, config); // here we create a fresh game
frogger.load(); // and tell it to start
