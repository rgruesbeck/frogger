// Overlay wrapper

class Overlay {
    constructor(node) {
        this.root = node;

        this.container = node.querySelector('.container');

        this.loading = node.querySelector('#loading');
        this.banner = node.querySelector('#banner');
        this.button = node.querySelector('#button');
        this.instructions = node.querySelector('#instructions');

        this.score = node.querySelector('#score');
        this.lives = node.querySelector('#lives');
        this.mute = node.querySelector('#mute');

        this.styles = {};
    }

    setLoading() {
        this.show('loading');
    }

    hideLoading() {
        this.hide('loading');
    }

    showBanner(message) {
        this.banner.textContent = message;
        this.show('banner');
    }

    hideBanner() {
        this.hide('banner');
    }

    showButton(message) {
        this.button.style.fontFamily = this.styles.fontFamily;
        // fix for safari
        this.button.innerHTML = `<span id="buttonspan">${message}</span>`;
        this.show('button');
    }

    hideButton() {
        this.hide('button');
    }

    setInstructions({ desktop, mobile }) {
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
            // show mobile instructions

            this.instructions.textContent = mobile;
        } else {
            // show desktop instructions

            this.instructions.textContent = desktop;
        }
        this.show('instructions');
    }

    hideInstructions() {
        this.hide('instructions');
    }

    showStats() {
        this.show('score');
        this.show('lives');
    }

    setScore(score) {
        this.score.textContent = `Score: ${score}`;
    }

    setLives(lives) {
        this.lives.textContent = `Lives: ${lives}`;
    }

    setMute(muted) {
        this.mute.textContent = muted ? 'volume_off' : 'volume_up';
        this.show('mute');
    }

    show(node) {
        this[node].active = true;
        this[node].style.visibility = 'visible';
        this[node].style.opacity = 1;
    }

    hide(node) {
        this[node].active = false;
        this[node].style.opacity = 0;
        this[node].style.visibility = 'hidden';
    }

    setStyles(styles) {
        this.styles = { ...this.styles, ...styles };
        this.applyStyles();
    }

    applyStyles() {
      this.container.style.color = this.styles.textColor;
      this.container.style.fontFamily = this.styles.fontFamily;
      this.button.style.color = this.styles.textColor;
      this.button.style.backgroundColor = this.styles.primaryColor;
    }
}

export default Overlay;