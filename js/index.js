async function get_raw_data() {
	let resp = await fetch('res/n5.json');
	return await resp.json();
}

let raw_data;
let graph;

window.onload = async function() {
	raw_data = await get_raw_data();
	let nodes = raw_data.map(x => new Node(x));
	graph = new NodeGraph(nodes, 'common')

	setup_canvas();
}

const width = 900, height = 600;
const ox = 0, oy = 0;
const radius = 16;

let canvas, ctx;

function setup_canvas() {
	const cont = document.getElementsByClassName('container')[0];
	canvas = document.createElement('canvas');
	canvas.style.width = width;
	canvas.style.height = height;
	let w = width * 2, h = height * 2;
	canvas.width = w;
	canvas.height = h;

	cont.appendChild(canvas);
	ctx = canvas.getContext('2d');

	let randpos = () => (Math.random() - 0.5) * w;

	let nodes = graph.nodes.map((n, i) => ({
		id: i, x: randpos(), y: randpos(), vx: 0, vy: 0
	}));

	let links = graph.links.map(([i,j]) => ({
		source: i, target: j
	}));

	if (true) {
		d3.forceSimulation()
			.nodes(nodes)
			.force('center', d3.forceCenter())
			.force('link', d3.forceLink(links))
			.force('mb', d3.forceManyBody())
			.force('collide', d3.forceCollide(radius*4))
			.stop()
			.tick(100)
			.on('tick', function(){
				console.log('tick');
			})
			.restart();
	}

	function asSupText(f) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillStyle = '#aaa';
		ctx.font = '16pt Noto Sans JP';
		f();
	}

	function asSubText(f) {
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillStyle = '#bbb';
		ctx.font = '14pt Noto Sans JP';
		f();
	}

	let ox = 0, oy = 0;
	let scale = 1;
	let dragging = false;
	let hover = null;

	function mouseToCanvas(x,y) {
		// norm
		x /= width;
		y /= height;
		// center
		x -= 0.5;
		y -= 0.5;
		// rescale
		x *= w / scale;
		y *= h / scale;
		// offset
		x -= ox;
		y -= oy;
		return [x, y];
	}

	canvas.onmousemove = function(e) {
		if (dragging) {
			ox += 2 * e.movementX / scale
			oy += 2 * e.movementY / scale
		}
		// find node closest to cursor
		let mini = -1;
		let minv = 9999999;
		let [cx,cy] = mouseToCanvas(e.offsetX, e.offsetY);
		for (let i = 0; i < nodes.length; i++) {
			let n = nodes[i];
			let dx = n.x-cx, dy = n.y-cy;
			let d = Math.sqrt(dx*dx + dy*dy);
			if (d < minv) {
				minv = d;
				mini = i;
			}
		}
		if (mini != -1) {
			if (minv < 125)
				hover = mini;
			else
				hover = null;
		}
	}
	canvas.onmousewheel = function(e) {
		if (e.deltaY > 0)
			scale *= 0.8;
		else
			scale *= 1.2;
	}
	canvas.onmouseleave = function(e) {
		dragging = false;
	}
	canvas.onmouseup = function(e) {
		dragging = false;
	}
	canvas.onmousedown = function(e) {
		dragging = true;
	}

	function draw() {
		ctx.clearRect(0, 0, w, h);

		ctx.reset();
		ctx.translate(w / 2, h / 2);
		ctx.scale(scale, scale);
		ctx.translate(ox, oy);
		ctx.fillStyle = '#aaa';
		ctx.strokeStyle = '#ddd';

		let linked = [];

		for (const [i,j] of graph.links) {
			let n1 = nodes[i], n2 = nodes[j];
			if (i == hover) {
				ctx.strokeStyle = '#99f';
				linked.push(j);
			} else if (j == hover) {
				ctx.strokeStyle = '#99f';
				linked.push(i);
			} else
				ctx.strokeStyle = '#ddd';
			ctx.beginPath();
			ctx.moveTo(n1.x, n1.y);
			ctx.lineTo(n2.x, n2.y);
			ctx.stroke();
			ctx.closePath();
		}

		for (const node of nodes) {
			let x = node.x, y = node.y;

			if (node.id == hover)
				ctx.fillStyle = '#669';
			else if (linked.find(l => l == node.id))
				ctx.fillStyle = '#aae';
			else
				ctx.fillStyle = '#ddd';

			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			let n = graph.nodes[node.id];
			asSupText(() => ctx.fillText(n.val, x, y-radius));
			asSubText(() => ctx.fillText(n.desc, x, y+radius));
		}

		requestAnimationFrame(draw);
	}

	requestAnimationFrame(draw);
}

