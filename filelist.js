
Vue.component('file-list', {
	data: function () {
		return {
			currentDirectory: '/',
			items: []
		};
	},
	template: `
		<ul id="file-list">
			<li><a @click="up()">..</a></li>
			<li v-for="item in items">
				<a v-if="item.type == 'dir'" @click="browse(item.resource)">{{ item.name }}</a>
				<a v-if="item.type == 'file'" @click="show(item.resource)">{{ item.name }}</a>
			</li>
		</ul>
	`,
	methods: {
		browse(resource) {
			this.currentDirectory = resource;
			this.listDir(resource);
		},
		up() {
			this.browse(upperPath(this.currentDirectory));
		},
		show(resource) {
			this.$emit('show', resource);
		},
		listDir(dir) {
			req(dir, 'PROPFIND').then(text => {
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(text,"text/xml");

				var hrefs = xmlDoc.getElementsByTagName("d:href");

				var items = [];

				for (elem of hrefs) {
					var name = decodeURIComponent(elem.childNodes[0].nodeValue);
					var type = name.endsWith("/") ? 'dir' : 'file';

					if (name !== dir)
						items.push({ name: filenameFromPath(name), resource: name, type: type });
				}

				this.items = items;
			})
		}
	},
	created: function () {
		this.listDir('/');
	}
});
