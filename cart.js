

cart = new Vue({
	el: "#cart-header",
	data: {
		currentResource: null,
		cart: {},
		count: 0,
		cartVisible: false,
		currentAdded: false
	},
	methods: {
		addToCart() {
			if (this.currentResource === null)
				return;

			var s = this.currentResource.split('/');

			var course = s[0] == '' ? s[1] : s[0];

			if (!(course in this.cart)) {
				// Vue.set is needed here because JavaScript does not allow watching
				// this.cart[course] = { ... };
				Vue.set(this.cart, course, {
					course: course,
					resources: [],
					cartList: null
				});
			}

			var resource = s.join('/');

			if (this.cart[course].resources.indexOf(resource) == -1) {
				this.cart[course].resources.push(resource);
			}
		},
		removeFromCart() {
			if (this.currentResource === null)
				return;

			var s = this.currentResource.split('/');
			var course = s[0] == '' ? s[1] : s[0];
			var resource = s.join('/');

			var idx = this.cart[course].resources.indexOf(resource);
			this.cart[course].resources.splice(idx, 1);

			if (this.cart[course].resources.length < 1)
				Vue.delete(this.cart, course);
		},
		toggleCart() {
			this.cartVisible = !this.cartVisible;
		}
	},
	watch: {
		'cart': {
			handler: updateCart,
			deep: true
		},
		'currentResource': updateCart
	}
});

function updateCart(val) {
	cart.count = 0;
	cart.currentAdded = false;
	for (var course of Object.values(cart.cart)) {
		for (var res of course.resources) {
			// count cart items
			cart.count += 1;
			// check whether current item is in cart
			if (cart.currentResource === res)
				cart.currentAdded = true;
		}
	}
}
