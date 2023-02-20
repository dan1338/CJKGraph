class Canvas {
	constructor(w, h) {
		this.element = document.createElement('canvas');
		this.ctx = this.element.getContext('2d');

		this.element.width = w;
		this.element.height = h;

		this.w = w;
		this.h = h;
		this.ox = 0;
		this.oy = 0;
	}

	attach(query, w=0, h=0) {
		const res = document.querySelector(query);

		if (res) {
			if (w == 0)
				w = this.w;
			if (h == 0)
				h = this.h;
			this.element.style.width = w+'px';
			this.element.style.height = h+'px';
			res.appendChild(this.element);
		}
	}

	_newFrame(f) {
		this.ctx.reset();
		f();
	}

	drawOnce(f) {
		this._newFrame(() => {
			f(this, this.ctx);
		});
	}

	_drawLoop() {
		this.drawOnce(this.draw_func);
		requestAnimationFrame(() => this._drawLoop());
	}

	draw(f) {
		this.draw_func = f;
		requestAnimationFrame(() => this._drawLoop());
	}

	centered(f) {
		this.ctx.translate(this.w/2, this.h/2);
		f();
		this.ctx.translate(-this.w/2, -this.h/2);
	}

	panned(f) {
		this.ctx.translate(this.w/2, this.h/2);
		this.ctx.translate(this.ox, this.oy);
		f();
		this.ctx.translate(-this.ox, -this.oy);
		this.ctx.translate(-this.w/2, -this.h/2);
	}

	mouseToPanned(x, y) {
		x -= this.w/2;
		y -= this.h/2;
		x -= this.ox;
		y -= this.oy;
		return [x, y];
	}
}

class InteractiveCanvas extends Canvas {
	constructor(w, h) {
		super(w, h);
		this.element.onmousedown = (e) => this._mouseDown(e);
		this.element.onmouseup = (e) => this._mouseUp(e);
		this.element.onmousemove = (e) => this._mouseMove(e);
		this.element.onmouseleave = (e) => this._mouseLeave(e);

		this.downX = null;
		this.downY = null;
		this.dragging = false;

		this.onDrag = null;
		this.onMove = null;
		this.onClick = null;
	}

	_mouseDown(e) {
		this.downX = e.offsetX;
		this.downY = e.offsetY;
		this.dragging = true;
	}

	_mouseUp(e) {
		if (this.onClick)
			this.onClick(e);
		this.dragging = false;
	}

	_mouseMove(e) {
		if (this.dragging) {
			this.onDrag(e);
		}

		if (this.onMove)
			this.onMove(e);
	}
	
	_mouseLeave(e) {
		this.dragging = false;
	}
}

