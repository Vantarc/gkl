
Vue.component('preview-page', {
	props: ['page'],
	template: `
		<canvas></canvas>
	`,
	mounted: function () {
		var canvas = this.$el;
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
	}
});


Vue.component('preview-resource', {
	data: function () {
		return {
			pages: {}
		};
	},
	props: ['resource'],
	template: `
		<template>
		 	<div>
				<preview-page v-if="page !== null" v-for="(page, idx) in pages" :page="page"></preview-page>
			</dif>
		</template>
	`,
	mounted: function () {
		var dir = this.resource;
		var self = this;

		req(dir, 'GET', (x) => x.arrayBuffer()).then(data => {

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
		<template>
			<div>
				<div v-if="Object.keys(cart.courses).length < 1">
					<h2>ERROR: Cart is empty</h2>
				</div>
				<div v-for="course in cart.courses">
					<h2>{{ course.course }}</h2>
					<div v-for="resource of course.resources">
						<h3>{{ resource }}</h3>
						<preview-resource :resource="resource"/>
					</div>
				</div>
			</dif>
		</template>
	`,
});
