
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
	props: ['currentResource'],
	template: `
		<span class="sub">
			<span v-if="currentResource === null">Please choose a PDF.</span>
			<a v-if="debug" @click="debugCart" href="#">Select DebugCart</a>
			<template v-if="currentResource !== null">
				<span>{{ currentResource }}</span>
				<a v-if="!currentAdded" @click="addToCart" href="#">Add to Cart</a>
				<a v-if="currentAdded" @click="removeFromCart" href="#">Remove from Cart</a>
			</template>
		</span>
	`,
	methods: {
		addToCart() { this.cart.addToCart(this.currentResource) },
		debugCart() {
			this.cart.addToCart('/3D_Audio/Kurzklausuren/SS2018_1.pdf');
			this.cart.addToCart('/Ausbreitung elektromagnetischer Wellen/Skript/2009/Wellenausbreitung_V_OK_WS09-10_Kap1.pdf');
			this.cart.addToCart('/Ausbreitung elektromagnetischer Wellen/Skript/2009/Wellenausbreitung_V_OK_WS09-10_Kap2.pdf');
		},
		removeFromCart() { this.cart.removeFromCart(this.currentResource) }
	},
	computed: {
		currentAdded() {
			for (var course of Object.values(this.cart.courses)) {
				for (var res of Object.values(course.resources)) {
					// check whether current item is in cart
					if (this.currentResource === res.resource)
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
		<span class="sub">
			<a @click="toggleCart" class="right" id="cart-btn" href="#">Cart ({{ count }})</a>
			<div id="cart" v-bind:style="{ display: cartVisible ? 'block' : 'none' }">
				<div v-for="course in cart.courses">
					<h2>{{ course.course }}</h2>
					<ul>
						<li v-for="res in course.resources">{{res.resource}}</li>
					</ul>
				</div>
			</div>
		</span>
	`,
	methods: {
		toggleCart() {
			this.cartVisible = !this.cartVisible;
		}
	},
	computed: {
		count() {
			var count = 0;
			for (var course of Object.values(this.cart.courses)) {
				for (var res of Object.values(course.resources)) {
					count += 1;
				}
			}
			return count;
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
		<iframe @load="pdf" id="viewer-final" src="../pdfjs/web/viewer.html?file=" ></iframe>
	`,
	methods: {
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
