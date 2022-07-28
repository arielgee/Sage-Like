////////////////////////////////////////////////////////////////////////////////////
function setLimitedInterval(callback, interval, repeats) {

	let intId = setInterval(() => {
		callback();
		if(--repeats === 0) {
			clearInterval(intId);
		}
	}, interval);
}
