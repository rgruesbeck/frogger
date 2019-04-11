// Overlay wrapper

class Overlay {
    constructor(node) {
        this.root = node;
        this.button = node.querySelector('#button');
        this.score = node.querySelector('#score');
        this.lives = node.querySelector('#lives');
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

}

export default Overlay;