// Player character

class Player {
    constructor(ctx, image, x, y, w, h) {
        this.ctx = ctx;
        this.image = image;

        this.x = x;
        this.y = y;

        this.cx = x + (w/2);
        this.cy = y + (h/2);

        this.width = w;
        this.height = h;

        this.radius = (w + h) / 4;
    }

    move(x, y) {
        this.x += x;
        this.y += y;

        this.cx = this.x + (this.width/2);
        this.cy = this.y + (this.height/2);
    }

    draw() {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    collidesWith(entity) {
        let vx = entity.cx - this.cx;
        let vy = entity.cy - this.cy;
        let distance = Math.sqrt(vx * vx + vy * vy);
        return distance < (entity.radius + this.radius);
    }
}

export default Player;