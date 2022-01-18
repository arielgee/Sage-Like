	////////////////////////////////////////////////////////////////////////////////////
	function debug_test_Promise_race() {

		const infinity = () => setInterval(() => console.log("[infinity]", Date.now()), 150);

		const limited = (reject) => {
			console.log("[limited]", Date.now());
			reject(new Error("limited-timeout"));
		}

		return Promise.race([
			new Promise(() => infinity() ),
			new Promise((_, reject) => setTimeout(() => limited(reject), 5000) ),
		]);
	}


	debug_test_Promise_race()
		.then(() => console.log("%c RACE RESOLVED!!! ", "background:green; color:white; font-size:25px"))
		.catch(() => console.log("%c RACE REJECTED!!! ", "background:red; color:yellow; font-size:25px"))
		.finally(() => console.log("%c RACE FINALLZED!!! ", "background:white; color:blue; font-size:25px"));