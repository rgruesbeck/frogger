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

        this.direction = 'right';

        this.bounds = {
            top: 0,
            right: this.ctx.canvas.width - this.width,
            bottom: this.ctx.canvas.height - this.height,
            left: 0
        };
    }

    move(x, y) {
        let dx = this.x + x; // get new xposition
        let dy = this.y + y; // get new yposition
        if (x > 0) { this.direction = 'right'; }
        if (x < 0) { this.direction = 'left'; }

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
        this.ctx.save();

        let scaleX = this.direction === 'left' ? -1 : 1;
        let posX = this.direction === 'left' ? -1 * this.x : this.x;
        let trX = this.direction === 'left' ? this.width : 0;

        this.ctx.translate(trX, 0);
        this.ctx.scale(scaleX, 1);

        this.ctx.drawImage(this.image, posX, this.y, this.width, this.height);

        this.ctx.restore();
    }

    collidesWith(entity) {
        let vx = entity.cx - this.cx;
        let vy = entity.cy - this.cy;
        let distance = Math.sqrt(vx * vx + vy * vy);
        return distance < (entity.radius + this.radius);
    }
}

export default Player;