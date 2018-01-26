var agent = navigator.userAgent;
var ios =  agent.match(/.*; CPU (?:iPhone )?OS ([0-9_]*) like Mac OS X[;)]/);
ios = ios == null ? '6.0' : ios[1].replace(/_/g,'.');
if (ios.match(/^[78910]($|\.)/) != null) {
  document.write('<link rel="stylesheet" type="text/css" href="../repo/css/iPhone.css"');
} else {
  document.write('<link rel="stylesheet" type="text/css" href="../repo/css/legacy.css"');
}
