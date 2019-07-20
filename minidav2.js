
var login = "gast-1";
var password = "MbiZw4ZKhALVPKvt94w3fEhsrLM3zXuM";

function encodePath(dir) {
	var d = dir.split("/");
	var d2 = [];
	for (x of d) {
		x = encodeURIComponent(x);
		d2.push(x);
	}
	d2 = d2.join("/")
	return d2;
}

function upperPath(dir) {
	if (dir.endsWith("/"))
		dir = dir.slice(0, -1);

	var d = dir.split("/");
	var d2 = d.slice(0, -1);
	return d2.join("/");
}

function filenameFromPath(dir) {
	if (dir.endsWith("/"))
		dir = dir.slice(0, -1);

	var d = dir.split("/");
	return d.slice(-1).pop();
}

fileList = new Vue({
	el: "#file-list",
	data: {
		currentDirectory: '/',
		items: []
	},
	methods: {
		browse(resource) {
			this.currentDirectory = resource;
			listDir(resource);
		},
		up() {
			this.browse(upperPath(this.currentDirectory));
		},
		show(resource) {
			showResource(resource);
		}
	}
});


function showResource(dir) {
	cart.currentResource = dir;
	var path = encodePath(dir);

	return fetch("https://lib.gatrobe.de/" + path, {
		method: 'GET',
		headers: new Headers({
			"Authorization": `Basic ${btoa(`${login}:${password}`)}`
		}),
	}).then(response => {
		if (!response.ok) throw new Error(response.status);

		return response.arrayBuffer();
	}).then(data => {
		var frame = document.getElementById("viewer-frame");
		frame.contentWindow.PDFViewerApplication.open(data);
	})
}

function listDir(dir) {
	var path = encodePath(dir);

	return fetch("https://lib.gatrobe.de/" + path, {
		method: 'PROPFIND',
		headers: new Headers({
			"Authorization": `Basic ${btoa(`${login}:${password}`)}`
		}),
	}).then(response => {
		if (!response.ok) throw new Error(response.status);

		return response.text();
	}).then(text => {
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

		fileList.$data.items = items;
	})
}

listDir('/');
