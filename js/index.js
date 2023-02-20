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

const width = 1000, height = 800;
const ox = 0, oy = 0;
const radius = 16;

let canvas;

function setup_canvas() {
	canvas = new InteractiveCanvas(width*2, height*2);
	canvas.attach('.container', width, height);

	let randpos = () => (Math.random() - 0.5) * canvas.w;

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

	let ctx = canvas.ctx;

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

	let hover = null;

	canvas.onMove = function(e) {
		let mini = -1;
		let minv = 9999999;
		let [cx,cy] = canvas.mouseToPanned(e.offsetX, e.offsetY);
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
	canvas.onDrag = function(e) {
		this.ox += e.movementX;
		this.oy += e.movementY;
	}

	canvas.draw(({w, h}, ctx) => {
		ctx.scale(2, 2);
		ctx.clearRect(0, 0, w, h);
		canvas.panned(() => {
			// draw links
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
			
			// draw nodes
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
			}

			// draw suptext
			asSupText(() => {
				for (const node of nodes) {
					let x = node.x, y = node.y;
					let n = graph.nodes[node.id];
					ctx.fillText(n.val, x, y-radius);
				}
			});

			// draw subtext
			asSubText(() => {
				for (const node of nodes) {
					let x = node.x, y = node.y;
					let n = graph.nodes[node.id];
					ctx.fillText(n.desc, x, y+radius);
				}
			});
		});
	});
}

