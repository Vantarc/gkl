
Vue.component('file-list', {
	data: function () {
		return {
			currentDirectory: '/',
			items: [],
			exclude_patterns: [/^\.+/, /^\+README.txt$/, /^$/]
		};
	},
	template: `
		<md-list id="file-list">
			<md-list-item @click="up()" v-if="currentDirectory !== '/'">
				<md-icon>arrow_back</md-icon>
			</md-list-item>
			<md-list-item v-for="item in items" @click="resolve(item)" v-bind:class="{ 'disabled-list-item': item.type === null }">
				<md-icon v-if="item.type === 'dir'">folder</md-icon>
				<md-icon v-if="item.type === 'pdf'">insert_drive_file</md-icon>
				<md-icon v-if="item.type === null">not_interested</md-icon>			
				<span class="md-list-item-text">{{ item.name }}</span>
				<cart-actions v-if="item.type === 'pdf'" :resource="item.resource"></cart-actions>
			</md-list-item>
		</md-list>
	`,
	methods: {
		browse(resource) {
			this.currentDirectory = resource;
			this.listDir(resource);
		},
		resolve(item) {
			item.type === 'dir' ? this.browse(item.resource) : this.show(item.resource);
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

				var resources = xmlDoc.getElementsByTagName("d:response");

				var items = [];

				for (const elem of resources) {
					const href = elem.getElementsByTagName("d:href");
					const contentType = elem.getElementsByTagName("d:getcontenttype");
					const isCollection = elem.getElementsByTagName("d:collection");


					console.assert(href.length == 1);
					const name = decodeURIComponent(href[0].childNodes[0].nodeValue);

					let type = null;

					if (isCollection.length > 0) {
						type = 'dir';
					} else if (contentType.length > 0 && contentType[0].childNodes[0].nodeValue === 'application/pdf') {
						type = 'pdf';
					}

					let valid = true;
					const pretty_name = filenameFromPath(name);
					for (const pattern of this.exclude_patterns) {
						if (pretty_name.match(pattern) !== null) {
							valid = false;
						}
					}

					if (name !== dir && valid)
						items.push({ name: pretty_name, resource: name, type: type });
				}

				this.items = items;
			})
		}
	},
	created: function () {
		this.listDir('/');
	}
});
