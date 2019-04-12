// Overlay wrapper

class Overlay {
    constructor(node) {
        this.root = node;

        this.container = node.querySelector('.container');
        this.button = node.querySelector('#button');
        this.score = node.querySelector('#score');
        this.lives = node.querySelector('#lives');

        this.styles = {
            textColor: 'white',
            primaryColor: 'purple',
            fontFamily: 'Courier New'
        };
    }

    hideButton() {
        this.button.style.display = 'none';
    }

    showButton(message) {
        this.button.textContent = message;
        this.button.style.display = 'block';
    }

    setScore(score) {
        this.score.textContent = `Score: ${score}`;
    }

    setLives(lives) {
        this.lives.textContent = `Lives: ${lives}`;
    }

    setStyles(styles) {
        this.styles = { ...this.styles, ...styles };
        this.applyStyles();
    }

    applyStyles() {
        this.container.style.color = this.styles.textColor;
        this.fontFamily = this.styles.fontFamily;

        this.button.style.backgroundColor = this.styles.primaryColor;
    }
}

export default Overlay;