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

        this.bounds = {
            top: 0,
            right: this.ctx.canvas.width - this.width,
            bottom: this.ctx.canvas.height - this.height,
            left: 0
        };
    }

    move(x, y) {
        let dx = this.x + x;
        let dy = this.y + y;

        // update x and cx if within bounds
        if (dx > this.bounds.left && dx < this.bounds.right) {
            this.x = dx;
            this.cx = this.x + (this.width/2);
        }

        // update y and cy if within bounds
        if (dy > this.bounds.top && dy < this.bounds.bottom) {
            this.y = dy;
            this.cy = this.y + (this.height/2);
        }
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