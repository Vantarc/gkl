
function encodePath(dir) {
	var d = dir.split("/");
	var d2 = [];
	for (x of d) {
		x = encodeURIComponent(x);
		d2.push(x);
	}
	d2 = d2.join("/");
	return d2;
}

function upperPath(dir) {
	if (dir.endsWith("/"))
		dir = dir.slice(0, -1);

	var d = dir.split("/");
	var d2 = d.slice(0, -1);
	return d2.join("/") + "/";
}

function filenameFromPath(dir) {
	if (dir.endsWith("/"))
		dir = dir.slice(0, -1);

	var d = dir.split("/");
	return d.slice(-1).pop();
}


function showResource(dir) {
	main.currentResource = dir;
	req(dir, 'GET', (x) => x.arrayBuffer()).then(data => {
		var frame = document.getElementById("viewer-frame");
		frame.contentWindow.PDFViewerApplication.open(data);
	})
}

function req(resource, method, format = (x) => x.text()) {
	var path = encodePath(resource);

	return fetch("webdavs://cloud.gatrobe.de/remote.php/dav/files/5f6b20a8-9068-11ef-89d5-bc2411f3d92c/Freigaben/GatrobeLib" + "/" + path, {
		method: method,
		headers: new Headers({
			"Authorization": `Basic ${btoa(`${login}:${password}`)}`
		}),
	}).then(response => {
		if (!response.ok) throw new Error(response.status);

		return format(response);
	});
}
