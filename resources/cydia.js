const VERSION_CHECK_SUPPORTED = "Compatible with your device. &#x1f60b;";
const VERSION_CHECK_NEEDS_UPGRADE = "Only Compatible with iOS %s &#x1f610;";
const VERSION_CHECK_UNCONFIRMED = "UnKnown Compatibility Support For iOS %s &#x1F62d;";
const VERSION_CHECK_UNSUPPORTED = "Only Compatible with iOS %s - %s &#x1f622;";

(function(document) {
	"use strict";

	function toNum(bits) {
		return (10000 * parseInt(bits[0])) + parseInt((100 * (bits[1] ? bits[1] : 0))) + parseInt(bits[2] ? bits[2] : 0);
	}

	function parseVersionString(version) {
		var bits = version.split(".");
		return toNum(bits);
	}

	function compareVersions(one, two) {
		var two_ = toNum(two);
		return one != two_ ? (one > two_ ? 1 : -1) : 0;
	}

	var prerequisite = document.querySelector(".prerequisite"),
		version = navigator.appVersion.match(/CPU( iPhone)? OS (\d+)_(\d+)(_(\d+))? like/i);

	if (!prerequisite || !version) {
		return;
	}

	var osVersion = [ version[2], version[3], version[4] ? version[5] : 0 ],

		osString = osVersion[0] + "." + osVersion[1] + (osVersion[2] && osVersion[2] != 0 ? "." + osVersion[2] : ""),

		minString = prerequisite.dataset.minIos,
		maxString = prerequisite.dataset.maxIos,

		minVersion = parseVersionString(minString),
		maxVersion = maxString ? parseVersionString(maxString) : null,

		message = VERSION_CHECK_SUPPORTED,
		isBad = false;

	if (compareVersions(minVersion, osVersion) == 1) {
		message = VERSION_CHECK_NEEDS_UPGRADE.replace("%s", minString);
		isBad = true;
	} else if (maxVersion && compareVersions(maxVersion, osVersion) == -1) {
		if ("unsupported" in prerequisite.dataset) {
			message = VERSION_CHECK_UNSUPPORTED.replace("%s", minString).replace("%s", maxString);
		} else {
			message = VERSION_CHECK_UNCONFIRMED.replace("%s", osString);
		}

		isBad = true;
	}

    prerequisite.querySelector("p").innerHTML = message;

	if (isBad) {
		prerequisite.classList.add("info");
	}
})(document);
