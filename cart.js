
var PDFDocument = PDFLib.PDFDocument;

// state pattern: https://vuejs.org/v2/guide/state-management.html#Simple-State-Management-from-Scratch
var cart = {
	courses: {},
	addToCart(resource) {
		if (resource === null)
			return;

		var s = resource.split('/');

		var course = s[0] == '' ? s[1] : s[0];

		if (!(course in this.courses)) {
			// Vue.set is needed here because JavaScript does not allow watching
			// this.courses[course] = { ... };
			Vue.set(this.courses, course, {
				course: course,
				resources: {},
				cartList: null
			});
		}

		var resource = s.join('/');

		if (this.courses[course].resources[resource] === undefined) {
			Vue.set(this.courses[course].resources, resource, {
				resource: resource,
				cache: null,
				removedPages: []
			});
		}
	},
	removeFromCart(resource) {
		if (resource === null)
			return;

		var s = resource.split('/');
		var course = s[0] == '' ? s[1] : s[0];
		var resource = s.join('/');

		if (this.courses[course] === undefined)
			return;

		Vue.delete(this.courses[course].resources, resource);

		if (Object.keys(this.courses[course].resources).length < 1)
			Vue.delete(this.courses, course);
	},
	numberOfItems() {
		var count = 0;
		for (var course of Object.values(this.courses)) {
			for (var res of Object.values(course.resources)) {
				count += 1;
			}
		}
		return count;
	},
	clearCart() {
		this.courses = {};
	},
	getResource(resource) {
		var s = resource.split('/');
		var course = s[0] == '' ? s[1] : s[0];
		var resource = s.join('/');

		console.assert(this.courses[course] !== undefined);
		console.assert(this.courses[course].resources[resource] !== undefined);

		return this.courses[course].resources[resource];
	},
	getResourceDataCached(resource) {
		var res = this.getResource(resource);

		if (res.cache === null) {
			return req(resource, 'GET', (x) => x.arrayBuffer()).then(data => {
				res.cache = data;
				return data;
			})
		} else {
			return Promise.resolve(res.cache);
		}
	},
	async mergedPDF() {
		const pdfDoc = await PDFDocument.create();

		for (var course of Object.values(this.courses)) {
			for (var res of Object.values(course.resources)) {
				await this._addToPDF(pdfDoc, res.resource);
			}
		}

		return await pdfDoc.save();
	},
	async _addToPDF(destDoc, resource) {
		const srcBytes = await this.getResourceDataCached(resource);
		const srcDoc = await PDFDocument.load(srcBytes);
		const srcPageCount = srcDoc.getPages().length;
		const res = this.getResource(resource);

		var pageIndices = [];
		for (var i = 0; i < srcPageCount; i++) {
			if (res.removedPages.indexOf(i) !== -1)
				continue;

			pageIndices.push(i);
		}

		const newPages = await destDoc.copyPages(srcDoc, pageIndices);

		for (const page of newPages)
			destDoc.addPage(page)
	}
};

Vue.component('cart-actions', {
	data: function () {
		return {
			cart: cart,
			debug: debug
		}
	},
	props: ['resource'],
	template: `
		<span>
			<md-button v-if="!currentAdded" class="md-icon-button md-list-action" @click="addToCart">
			  <md-icon class="md-primary">add</md-icon>
			</md-button>
			<md-button v-if="currentAdded" class="md-icon-button md-list-action" @click="removeFromCart">
			  <md-icon class="md-accent">remove</md-icon>
			</md-button>
		</span>
	`,
	methods: {
		addToCart(event) {
			this.cart.addToCart(this.resource);
			event.stopPropagation();
		},
		removeFromCart(event) {
			this.cart.removeFromCart(this.resource);
			event.stopPropagation();
		}
	},
	computed: {
		currentAdded() {
			for (var course of Object.values(this.cart.courses)) {
				for (var res of Object.values(course.resources)) {
					// check whether current item is in cart
					if (this.resource === res.resource)
						return true;
				}
			}
			return false;
		}
	}
});

Vue.component('cart-list', {
	data: function () {
		return {
			cart: cart,
			cartVisible: false,
		}
	},
	template: `
		<md-list>
			  <md-list-item>
				<md-icon>move_to_inbox</md-icon>
				<span class="md-list-item-text">Inbox{{ cart.numberOfItems()}}</span>
			  </md-list-item>
		</md-list>
		<!--<span class="sub">
			&lt;!&ndash;<a @click="toggleCart" class="right" id="cart-btn" href="#">Cart ({{ count }})</a>
			<div id="cart" v-bind:style="{ display: cartVisible ? 'block' : 'none' }">
				<div v-for="course in cart.courses">
					<h2>{{ course.course }}</h2>
					<ul>
						<li v-for="res in course.resources">{{res.resource}}</li>
					</ul>
				</div>
			</div>&ndash;&gt;
		</span>-->
	`,
	methods: {
		toggleCart() {
			this.cartVisible = !this.cartVisible;
		}
	}
});

Vue.component('cart-summary', {
	data: function () {
		return {
			cart: cart
		}
	},
	template: `
		<div class="cart-summary">
			<div>
				<div v-for="course in cart.courses">
					<h2>{{ course.course }}</h2>
					<ul>
						<li v-for="res in course.resources">{{res.resource}}</li>
					</ul>
				</div>
			</div>
		</div>
	`,
});

Vue.component('cart-merged-view', {
	data: function () {
		return {
			cart: cart
		}
	},
	template: `
	<span>
	<iframe v-if="cart.numberOfItems() > 0" @load="load" id="viewer-final" src="node_modules/pdfjs-dist-viewer-min/build/minified/web/viewer.html?file=" ></iframe>
	<md-empty-state
		v-if="cart.numberOfItems() === 0"
		class="md-accent"
		md-icon="warning"
		md-label="Empty Cart"
		md-description="You have no files in your cart">
	</md-empty-state>
	</span>
		
	`,
	methods: {
		async load() {
			modifyPDFJS(this.$el);
			await this.pdf();
		},
		async pdf() {
			var data = await cart.mergedPDF();
			var frame = this.$el;
			frame.contentWindow.PDFViewerApplication.open(data);
		}
	},
	watch: {
		cart: {
			handler() {
				this.pdf();
			},
			deep: true
		}
	}
});
