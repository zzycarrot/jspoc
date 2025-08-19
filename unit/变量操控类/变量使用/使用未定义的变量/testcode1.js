function f(a) {
	var sum = 0;
	for (i=0; i<a.length; ++i)
		sum += g(a[i]);
	return sum;
}

function g(b) {
	var prod = 1;
	for (i=0; i<b.length; ++i)
		prod *= b[i];
	return prod;
}
console.log(f([[1,2],[3,4],[5,6],[3,4,5]])); // 62
