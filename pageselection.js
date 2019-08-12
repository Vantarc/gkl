
Vue.component('preview-page', {
	data: function () {
		const res = cart.getResource(this.resource);
		const idx = Number(this.pageIdx);

		const checked = res.removedPages.indexOf(idx) !== -1;

		return {
			checked: checked,
			cart: cart
		};
	},
	props: ['page', 'resource', 'pageIdx'],
	template: `
		<span class="preview-page">
			<canvas ref="canvas" @click="toggle"></canvas><br>
			<md-checkbox v-model="checked">Don't print this page.</md-checkbox>
		</span>
	`,
	mounted() {
		var canvas = this.$refs.canvas;
		x = this;
		var page = this.page();

		var scale = 0.3;
		var viewport = page.getViewport({scale: scale});

		// Prepare canvas using PDF page dimensions
		var context = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		// Render PDF page into canvas context
		var renderContext = {
			canvasContext: context,
			viewport: viewport
		};

		page.render(renderContext);
	},
	methods: {
		toggle() {
			this.checked = !this.checked;
		}
	},
	watch: {
		checked(val) {
			const res = this.cart.getResource(this.resource);
			const idx = Number(this.pageIdx);

			if (val) {
				console.assert(res.removedPages.indexOf(idx) === -1);
				res.removedPages.push(idx);
			} else {
				const position = res.removedPages.indexOf(idx);
				console.assert(position !== -1);
				Vue.delete(res.removedPages, position);
			}
		}
	}
});


Vue.component('preview-resource', {
	data: function () {
		return {
			pages: {},
			cart: cart
		};
	},
	props: ['resource'],
	template: `
		<div class="preview-resource">
			<preview-page v-if="page !== null" v-for="(page, idx) in pages" :page="page" :resource="resource" :page-idx="idx"></preview-page>
		</div>
	`,
	mounted: function () {
		var dir = this.resource;
		var self = this;

		this.cart.getResourceDataCached(dir).then(data => {

			var loadingTask = pdfjsLib.getDocument(data);
			loadingTask.promise.then(function(pdf) {
				for (let i = 0; i < pdf.numPages; i++) {
					Vue.set(self.pages, i, null);

					pdf.getPage(i+1).then(function(page) {
						// we save the pages as function here, because the page object
						// (from pdfJS has) cyclic references, which are not handleable
						// by Vue.js.
						Vue.set(self.pages, i, () => page);
					});
				}
			});
		});
	}
});

Vue.component('preview-cart', {
	data: function () {
		return {
			cart: cart
		};
	},
	template: `
		<div class="preview-cart">
			<div v-if="cart.isEmpty()">
				<md-empty-state
					class="md-accent"
					md-icon="warning"
					md-label="Empty Cart"
					md-description="You have no files in your cart">
				</md-empty-state>
			</div>
			<div v-for="course in cart.courses">
				<span class="md-display-1">{{ course.course }}</span>
				<div v-for="resource in course.resources">
					<h3>{{ resource.resource }}</h3>
					<preview-resource :resource="resource.resource"/>
				</div>
			</div>
		</div>
	`,
});
