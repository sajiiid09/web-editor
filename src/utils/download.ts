export const download = async (url: string, filename: string) => {
	try {
		const response = await fetch(url);
		if (!response.ok)
			throw new Error(`Download failed with status ${response.status}.`);

		const blob = await response.blob();
		const objectUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = objectUrl;
		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		link.parentNode?.removeChild(link);
		window.URL.revokeObjectURL(objectUrl);
	} catch (error) {
		console.error("Download error:", error);
	}
};
