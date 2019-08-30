
function modifyPDFJS(iframe) {
	const toolbar = iframe.contentWindow.PDFViewerApplication.appConfig.toolbar;
	toolbar.openFile.remove();
	toolbar.print.remove();
	toolbar.download.remove();
	toolbar.viewBookmark.remove();
}
