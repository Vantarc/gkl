
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
				resources: [],
				cartList: null
			});
		}

		var resource = s.join('/');

		if (this.courses[course].resources.indexOf(resource) == -1) {
			this.courses[course].resources.push(resource);
		}
	},
	removeFromCart(resource) {
		if (resource === null)
			return;

		var s = resource.split('/');
		var course = s[0] == '' ? s[1] : s[0];
		var resource = s.join('/');

		var idx = this.courses[course].resources.indexOf(resource);
		this.courses[course].resources.splice(idx, 1);

		if (this.courses[course].resources.length < 1)
			Vue.delete(this.courses, course);
	}
};

Vue.component('cart-actions', {
	data: function () {
		return {
			cart: cart
		}
	},
	props: ['currentResource'],
	template: `
		<span class="sub">
			<span v-if="currentResource === null">Please choose a PDF.</span>
			<template v-if="currentResource !== null">
				<span>{{ currentResource }}</span>
				<a v-if="!currentAdded" @click="addToCart" href="#">Add to Cart</a>
				<a v-if="currentAdded" @click="removeFromCart" href="#">Remove from Cart</a>
			</template>
		</span>
	`,
	methods: {
		addToCart() { this.cart.addToCart(this.currentResource) },
		removeFromCart() { this.cart.removeFromCart(this.currentResource) }
	},
	computed: {
		currentAdded() {
			for (var course of Object.values(this.cart.courses)) {
				for (var res of course.resources) {
					// check whether current item is in cart
					if (this.currentResource === res)
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
						<li v-for="res in course.resources">{{res}}</li>
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
				for (var res of course.resources) {
					count += 1;
				}
			}
			return count;
		}
	}
});
