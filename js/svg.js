const sx = d3.scaleLinear().domain([-1, 1]).range([0, width]);
const sy = d3.scaleLinear().domain([-1, 1]).range([0, height]);

let svg;

function translate(x, y, rx=0, ry=0) {
	x = sx(x) + rx;
	y = sy(y) + ry;
	return 'translate('+x+','+y+')';
}

function add_text(x, y, rx, ry, s) {
	return svg.select('g')
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('x', sx(x) + rx)
		.attr('y', sy(y) + ry)
		.text(s);
}

function add_subtext(x, y, s) {
	add_text(x, y, 0, +radius, s)
		.attr('dominant-baseline', 'text-before-edge')
		.attr('class', 'subtext');
}

function add_suptext(x, y, s) {
	add_text(x, y, 0, -radius, s)
		.attr('dominant-baseline', 'text-after-edge')
		.attr('class', 'suptext');
}

function add_descrip(x, y, sup, sub) {
	add_suptext(x, y, sup);
	add_subtext(x, y, sub);
}

function setup_svg() {
	svg = d3.select('.container').append('svg')
		.attr('viewBox', [0, 0, width, height]);

	let g = svg.append('g');

	let zoom = d3.zoom().on('zoom', ({transform}) => {
		g.attr('transform', transform);
	});

	function clicked(e, {x, y}) {
		let I = d3.zoomIdentity;
		e.stopPropagation();
		svg.transition()
			.duration(350)
			.call(
				zoom.transform,
				I.translate(width/2,height/2).translate(-sx(x), -sy(y)),
				d3.pointer(e)
			);
	}

	let data = [];
	let x = 0, y = 0;
	for (const i in graph.nodes) {
		const node = graph.nodes[i];
		data.push({x:x, y:y, sup:node.val, sub:node.desc});
		x += 0.15;
		if (x > 2) {
			x = 0;
			y += 0.3;
		}
	}

	// simulation
	if (true) {
		let rand = () => (Math.random() - 0.5) * 2 * 3
		let nodes = graph.nodes.map((n, i) => ({id:i, x:rand(), y:rand(), vx: 0, vy: 0}));
		let links = graph.links.map(([i,j]) => ({source: i, target: j}));

		let forceLink = d3.forceLink(links);

		let node = g.append('g')
			.attr('fill', '#966')
			.attr('stroke', '#faa')
			.selectAll('circle')
			.data(nodes)
			.join('circle')
			.attr('r', radius)
			.attr('cx', d => sx(d.x))
			.attr('cy', d => sy(d.y))
			.each(d => add_descrip(d.x, d.y, graph.nodes[d.id].val, graph.nodes[d.id].desc))

		console.log('presim', nodes[0], nodes[1]);
		const sim = d3.forceSimulation()
			.nodes(nodes)
			.force('link', forceLink)
			.tick(200)
			.on('tick', function() {
				console.log('tick', nodes[0], nodes[1]);
				node
					.attr('cx', d => sx(d.x))
					.attr('cy', d => sy(d.y));
			});
	} else {
		g.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.attr('cx', d => sx(d.x))
			.attr('cy', d => sy(d.y))
			.attr('r', d => radius)
			.on('click', clicked)
			.each(d => add_descrip(d.x, d.y, d.sup, d.sub));
	}

	svg.call(zoom);
}

