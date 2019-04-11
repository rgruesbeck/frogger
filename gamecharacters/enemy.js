// Enemy character

class Enemy {
    constructor(ctx, image, x, y, w, h, s) {
        this.ctx = ctx;
        this.image = image;

        this.x = x;
        this.y = y;

        this.cx = x + (w/2);
        this.cy = y + (h/2);

        this.width = w;
        this.height = h;

        this.radius = (w + h) / 4;

        this.speed = s;
    }

    move(x, y) {
        this.x += x + this.speed;
        this.y += y;

        this.cx = this.x + (this.width/2);
        this.cy = this.y + (this.height/2);
    }

    draw() {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    static spawn(ctx, image, w, h, topBound, bottomBound) {

        let top = topBound;
        let bottom = bottomBound - 2 * h;
        let randomY = Math.floor(Math.random() * bottom) + top;

        let randomSpeed = Math.floor(Math.random() * 9);

        return new Enemy(ctx, image, (-1 * w), randomY, w, h, randomSpeed);
    }
}

export default Enemy;