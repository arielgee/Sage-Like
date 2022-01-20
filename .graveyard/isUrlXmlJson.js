const DEFAULT_FETCH_OPTIONS = {
	method: "GET",
	headers: Global.HEADER_AUTHORIZATION_BASIC_NULL,
	cache: "default",
};


////////////////////////////////////////////////////////////////////////////////////
async function isUrlXmlJson(url) {

	if(/^(about|chrome|resource):/i.test(url)) return false;

	url = url.replace(/^view-source:/i, "");	// Try to test view-source's url. Ignore Global.EXTRA_URL_PARAM_NO_REDIRECT if any

	const timeout = /rss|feed|atom|syndicat|\.xml|\.json/i.test(url) ? 7000 : 5000;		// minimal timeout: 7-5 sec

	try {
		return /^application\/(feed+)?(xml|json)$/i.test((await (await slUtil.fetchWithTimeout(url, DEFAULT_FETCH_OPTIONS, timeout)).blob()).type);
	} catch (error) {
		if(error.message !== "timeout") console.log("[Sage-Like]", `Fail to test if URL is XML/JSON for '${url}'`, error);
		return false;
	}
}


