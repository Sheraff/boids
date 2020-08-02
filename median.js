/**
 * 
 * Implementation of median angle function
 * A More Efficient Way Of Obtaining A Unique Median Estimate For Circular Data
 * 2003 / B. Sango Otieno & Christine M. Anderson-Cook
 * from the annexes in https://digitalcommons.wayne.edu/cgi/viewcontent.cgi?referer=&httpsredir=1&article=1738&context=jmasm
 * 
 */

function circularMedian(x) {
	const sx = [...x].sort()
	const difsin = []
	const numties = []

	// Checks if sample size is odd or even
	const posmed = x.length / 2 === Math.round(x.length / 2)
		? checkeven(x)
		: checkodd(x)

	for(let i = 0; i < posmed.length; i++) {
		const newx = sx.map(x => x - posmed[i])
		difsin[i] = newx.filter(x => Math.sin(x) > 0).length - newx.filter(x => Math.sin(x) < 0).length
		numties[i] = newx.filter(x => Math.sin(x) === 0).length
	}

	// Checks for ties
	const cm = posmed.filter((x, i) => difsin[i] === 0 || Math.abs(difsin[i]) > numties[i])
	return averageAngle(cm)
}

function averageAngle(array) {
	const y = array.reduce((sum, current) => sum + Math.sin(current), 0)
	const x = array.reduce((sum, current) => sum + Math.cos(current), 0)
	return x === 0 && y === 0
		? Infinity
		: Math.atan2(y, x)
	// If both x and y are zero, then no circular mean exists, so assign it a large number
}

function checkeven(x) {
	const sx = [...x].sort()
	const check = []
	// Computes possible medians
	const posmed = posmedf(x)
	for (let i = 0; i < posmed.length; i++) {
		// Takes posmed[i] as the center, i.e. draws diameter at posmed[i] and counts observations on either side of the diameter
		const newx = sx.map(x => x - posmed[i])
		check[i] = newx.filter(x => Math.cos(x) > 0).length < x.length / 2
			? Infinity
			: posmed[i]
	}
	
	return check.filter(x => x !== Infinity)
}

function checkodd(x) {
	const sx = [...x].sort()
	const check = []
	// Each observation is a possible median
	const posmed = sx
	for (let i = 0; i < posmed.length; i++) {
		// Takes posmed[i] as the center, i.e. draws diameter at posmed[i] and counts observations on either side of the diameter
		const newx = sx.map(x => x - posmed[i])
		check[i] = newx.filter(x => Math.cos(x) > 0).length > (x.length - 1) / 2
			? Infinity
			: posmed[i]
	}
	
	return check.filter(x => x !== Infinity)
}

function posmedf(x) {
	const sx = [...x].sort()
	const sx2 = [...sx]
	sx2.push(sx2.shift())
	// Determines closest neighbors of a fixed observation
	const posmed = []
	for (let i = 0; i < x.length; i++) {
		posmed[i] = averageAngle([sx[i], sx2[i]])
	}
	// Computes circular mean of two adjacent observations
	return posmed.filter(x => x !== Infinity)
}