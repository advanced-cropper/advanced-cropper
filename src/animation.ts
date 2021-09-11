interface AnimationOptions {
	timingFunction: string;
	duration: number;
	onStart?: () => void;
	onProgress?: (progress: number) => void;
	onStop?: () => void;
}

const timingFunctions = {
	linear: (t) => {
		return t;
	},
	'ease-in': (t) => {
		return Math.pow(t, 1.675);
	},
	'ease-out': (t) => {
		return 1 - Math.pow(1 - t, 1.675);
	},
	'ease-in-out': (t) => {
		return 0.5 * (Math.sin((t - 0.5) * Math.PI) + 1);
	},
};

export class Animation {
	endTime?: number;
	startTime?: number;
	timingFunction: string;
	duration: number;
	active: boolean;
	onStart?: () => void;
	onProgress?: (progress: number) => void;
	onStop?: () => void;
	id?: number;
	constructor(options: AnimationOptions) {
		this.timingFunction = options.timingFunction;
		this.duration = options.duration;
		this.onStart = options.onStart;
		this.onProgress = options.onProgress;
		this.onStop = options.onStop;
		this.active = false;
	}
	start() {
		this.startTime = performance.now();
		this.endTime = this.startTime + this.duration;
		if (this.onStart) {
			this.onStart();
		}
		this.active = true;
		this.animate();
	}
	animate() {
		let timingFunction = this.timingFunction in timingFunctions ? timingFunctions[this.timingFunction] : null;
		if (!timingFunction) {
			console.warn(
				`[Animation] The timing function '${timingFunction}' is not supported. Available timing function: 'linear', 'ease-in', 'ease-in-out', 'ease-out'. Reset to 'ease-out'.`,
			);
			timingFunction = timingFunctions['ease-out'];
		}

		const percent =  1 - (this.endTime - performance.now()) / (this.endTime - this.startTime);

		const progress = Math.min(1, timingFunction(percent));

		if (this.onProgress) {
			this.onProgress(progress);
		}
		if (percent <= 1) {
			this.id = window.requestAnimationFrame(() => this.animate());
		} else {
			this.stop();
		}
	}
	stop() {
		this.active = false;
		if (this.id) {
			window.cancelAnimationFrame(this.id);
		}
		if (this.onStop) {
			this.onStop();
		}
	}
}
