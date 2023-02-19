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

class Node {
	constructor([val, desc]) {
		this.val = val;
		this.desc = desc;
		this.chars = new Set(this.val);
		this.kana = new Set(this.val.match(re_kana));
		this.kanji = this.chars.difference(this.kana);
	}
}

class NodeGraph {
	constructor(nodes) {
		this.links = [];
		this.nodes = nodes;

		const link_thresh = 1;

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

				let d = n1.kanji.sdifference(n2.kanji);
				if (d.size <= link_thresh)
					this.pushLink(i, j);
			});
		});
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

