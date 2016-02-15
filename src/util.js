export function radians(degrees) {
  return degrees * Math.PI / 180;
};

export function isArryEquivalent(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
  	if(typeof a[i] !== typeof b[i]) return false;

  	if(typeof a[i] === "function") continue;

  	if(typeof a[i] === "object") {
  		if(!isEquivalent(a[i], b[i])) return false;
  	} else {
    	if (a[i] !== b[i]) return false;
    }
  }

  return true;
}


export function isEquivalent(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    if (aProps.length != bProps.length) return false;

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if(typeof a[propName] !== typeof b[propName]) return false;
        if(typeof a[propName] === "function") continue;

        if(Array.isArray(a[propName])) {
        	if(!isArryEquivalent(a[propName], b[propName])) return false;
        } else if(typeof a[propName] === "object") {
        	if(!isEquivalent(a[propName], b[propName])) return false;
        } else {
        	if (a[propName] !== b[propName])  return false;
        }
    }

    return true;
}