Set.prototype.union = function(other) {
	return new Set([...this, ...other]);
};

Set.prototype.intersect = function(other) {
	return new Set([...this].filter(x => other.has(x)));
};

Set.prototype.difference = function(other) {
	return new Set([...this].filter(x => !other.has(x)));
};

Set.prototype.sdifference = function(other) {
	// A sd B => (A\B) v (B\A)
	return this.difference(other).union(other.difference(this));
};

const re_kana = /[\u3040-\u309f]|[\u30a0-\u30ff]/g;
const re_kanji = /[\u4e00-\u9faf]|[\u3400-\u4dbf]/g;

class Node {
	constructor([val, desc]) {
		this.val = val;
		this.desc = desc;
		this.chars = new Set(this.val);
		this.kanji = new Set(this.val.match(re_kanji));
	}
}

class NodeGraph {
	constructor(nodes, link_mode) {
		this.links = [];
		this.nodes = nodes;

		const link_thresh = 1;

		let link;
		if (link_mode == 'mindiff')
			link = (i,n1,j,n2) => this.linkMinDiff(i,n1,j,n2);
		else if (link_mode == 'common')
			link = (i,n1,j,n2) => this.linkCommon(i,n1,j,n2);

		// symmetric difference is, well symmetric thus we can
		// reduce the number of repeat comparisons
		nodes.forEach((n1, i) => {
			nodes.forEach((n2, j) => {
				if (n1 == n2)
					return;
				if (n1.kanji.size == 0 || n2.kanji.size == 0)
					return;
				if (this.areLinked(n1, n2))
					return;

				link(i, n1, j, n2);
			});
		});
	}

	linkMinDiff(i, n1, j, n2) {
		let d = n1.kanji.sdifference(n2.kanji);
		if (d.size <= 1)
			this.pushLink(i, j);
	}

	linkCommon(i, n1, j, n2) {
		let c = n1.kanji.intersect(n2.kanji);
		if (c.size >= 1)
			this.pushLink(i, j);
	}

	pushLink(a, b) {
		this.links.push([a, b]);
	}

	areLinked(ax, bx) {
		let l = this.links.find(([i, j]) => {
			let a = this.nodes[i], b = this.nodes[j];
			return (a == ax && b == bx) || (a == bx && b == ax);
		});
		
		return Boolean(l);
	}

	*getLinked(x) {
		for (const [i, j] of this.links) {
			let a = this.nodes[i], b = this.nodes[j];
			if (x == a)
				yield b;
			else if (x == b)
				yield a;
		}
	}
}

