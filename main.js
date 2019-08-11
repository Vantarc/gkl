Vue.use(VueMaterial.default);

const debug = true;

const main = new Vue({
    el: "#main",
    data: {
        step: 1,
        currentResource: null,
        showCart: false,
        cart
    },
    methods: {

    	showResource(dir) {
    		return showResource(dir);
		},
        home() {
            if (Object.keys(cart.courses).length > 0) {
                if (!confirm('Are you sure, that you want to clear your cart?')) {
                    return 0;
                }
            }

            cart.clearCart();
            this.currentResource = null;
            if (this.step !== 1) {
                this.step = 1;
            } else {
                this.$refs.fileList.listDir('/');
            }
        }
    }
});
