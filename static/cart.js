
var PDFDocument = PDFLib.PDFDocument;

// state pattern: https://vuejs.org/v2/guide/state-management.html#Simple-State-Management-from-Scratch
var cart = {
	courses: {},
	_numberOfPages: 0,
    pricePerPage: 0.05,
    priceDepositPerCourse: 15,
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
    numberOfCourses() {
	    return Object.values(this.courses).length;
    },
	numberOfPages() {
		return this._numberOfPages;
	},
	isEmpty() {
		return this.numberOfItems() === 0;
	},
	calculateCopyCosts() {
		return this.numberOfPages() * this.pricePerPage;
	},
    calculateDepositCosts() {
	    return this.numberOfCourses() * this.priceDepositPerCourse;
    },
    calculateCosts() {
	    return this.calculateCopyCosts() + this.calculateDepositCosts();
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

		this._numberOfPages = pdfDoc.getPageCount();

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
		<div>
			<div v-if="cart.isEmpty()">
				<md-empty-state
					class="md-accent"
					md-icon="warning"
					md-label="Empty Cart"
					md-description="You have no files in your cart">
				</md-empty-state>
			</div>
			<div v-if="!cart.isEmpty()">
				<cart-summary></cart-summary>
			</div>
		</div>

	`,
	methods: {
		toggleCart() {
			this.cartVisible = !this.cartVisible;
		}
	}
});

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

Vue.component('cart-summary', {
	data: function () {
		return {
			cart: cart,
			printDialogVisible: false,
			printingPassword: null,
			alertMessageVisible: false,
			alertMessageText: null,
		}
	},
	template: `
	<div>
		<md-list class="md-double-line" v-for="course in cart.courses" v-bind:key="course.course">
			  <md-subheader class="wrap-text">{{ course.course }}</md-subheader>
			  <md-list-item v-for="res in course.resources" v-bind:key="res.id">
				<md-icon>insert_drive_file</md-icon>

				<div class="md-list-item-text wrap-text">
				  {{res.resource}}
				</div>
			  </md-list-item>
		  </md-list>
		  <md-divider></md-divider>
		  <md-subheader class="wrap-text">
		  	<span>Copy Costs</span>
		  	<span class="fill-remaining-space"></span>
		  	<span>{{ cart.numberOfPages() }} x {{ cart.pricePerPage | toCurrency }}</span>
		  </md-subheader>
		  <md-subheader class="wrap-text">
		  	<span class="fill-remaining-space"></span>
		  	<span>= {{ cart.calculateCopyCosts() | toCurrency }} </span>
		  </md-subheader>
          <md-divider></md-divider>
		  <md-subheader class="wrap-text">
		  	<span>Deposit Costs</span>
		  	<span class="fill-remaining-space"></span>
		  	<span>{{ cart.numberOfCourses() }} x {{ cart.priceDepositPerCourse | toCurrency }}</span>
		  </md-subheader>
		  <md-subheader class="wrap-text">
		  	<span class="fill-remaining-space"></span>
		  	<span>= {{ cart.calculateDepositCosts() | toCurrency }} </span>
		  </md-subheader>
          <md-divider></md-divider>
		  <md-subheader class="wrap-text">
		  	<span>Total Price</span>
		  	<span class="fill-remaining-space"></span>
		  	<span>{{ cart.calculateCosts() | toCurrency }}</span>
		  </md-subheader>
		  <!-- <md-button class="md-dense md-raised md-primary" @click="download">Download</md-button> -->
		  <md-dialog
			:md-active.sync="printDialogVisible"
			@md-confirm="print">

			<md-dialog-title>Please ask a Gatrobe member for the printing password!</md-dialog-title>

			<md-dialog-content>
				<md-field :md-toggle-password="false">
					<label>Password</label>
					<md-input @keydown.enter.native="print" v-model="printingPassword" type="password"></md-input>
				</md-field>
			</md-dialog-content>

			<md-dialog-actions>
				<md-button class="md-primary" @click="printDialogAbort">Abort</md-button>
				<md-button class="md-primary" @click="print">Print!</md-button>
			</md-dialog-actions>

		  </md-dialog>
		  <md-dialog-alert
			:md-active.sync="alertMessageVisible"
			:md-content="alertMessageText"
			md-confirm-text="Ok" />

		  <md-button class="md-dense md-raised md-primary" @click="printDialogVisible = true">Print</md-button>
	</div>
	`,
	methods: {
		async printDialogAbort() {
			this.printingPassword = "";
			this.printDialogVisible = false;
		},
		async print() {
			var data = await cart.mergedPDF();
			let headers = new Headers();

			var form = new FormData();
			var blob = new Blob([data], {type: "application/octet-binary"});
			form.append('file', blob, (new Date()).toISOString() + '-merged.pdf');

			headers.append('Authorization', 'Basic ' + btoa('gatrobe' + ":" + this.printingPassword));
			this.printingPassword = "";

			var response = await fetch('/print', {
				headers: headers,
				method: 'POST',
				body: form
			});

			var j = await response.json();
			this.alertMessageText = j.message;
			this.alertMessageVisible = true;
			this.printDialogVisible = false;
		},
		async download() {
			/* //This seems to be broken and crashes my firefox browser...

			var data = await cart.mergedPDF();
			var blob = new Blob(data, {type: 'application/octet-binary'});
			var url = window.URL.createObjectURL(blob);
			download('merged.pdf', url);
			*/
		}
	}
});

Vue.component('cart-merged-view', {
	data: function () {
		return {
			cart: cart
		}
	},
	template: `
	<iframe @load="load" id="viewer-final" src="static/node_modules/pdfjs-dist-viewer-min/build/minified/web/viewer.html?file=" ></iframe>
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

Vue.filter('toCurrency', function (value) {
	if (typeof value !== "number") {
		return value;
	}
	const formatter = new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2
	});
	return formatter.format(value);
});
