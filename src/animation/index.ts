const timingFunctions = {
	linear: (t: number) => {
		return t;
	},
	'ease-in': (t: number) => {
		return Math.pow(t, 1.675);
	},
	'ease-out': (t: number) => {
		return 1 - Math.pow(1 - t, 1.675);
	},
	'ease-in-out': (t: number) => {
		return 0.5 * (Math.sin((t - 0.5) * Math.PI) + 1);
	},
};

interface AnimationOptions {
	timingFunction: string;
	duration: number;
	onStart?: () => void;
	onProgress?: (progress: number) => void;
	onStop?: () => void;
}

export class Animation {
	endTime?: number;
	startTime?: number;
	active: boolean;
	id?: number;

	onStart?: () => void;
	onProgress?: (progress: number) => void;
	onStop?: () => void;
	timingFunction?: string;

	constructor() {
		this.active = false;
	}
	start(animation: AnimationOptions) {
		this.onStart = animation.onStart;
		this.onProgress = animation.onProgress;
		this.onStop = animation.onStop;

		if (!this.active) {
			this.onStart?.();
		}
		if (this.id) {
			window.cancelAnimationFrame(this.id);
		}
		this.startTime = performance.now();
		this.timingFunction = animation.timingFunction;
		this.endTime = this.startTime + animation.duration;
		this.active = true;
		this.animate();
	}
	animate() {
		if (this.startTime && this.endTime) {
			let timingFunction = timingFunctions[this.timingFunction as keyof typeof timingFunctions];
			if (!timingFunction) {
				if (process.env.NODE_ENV !== 'production') {
					console.warn(
						`[Animation] The timing function '${timingFunction}' is not supported. Available timing function: 'linear', 'ease-in', 'ease-in-out', 'ease-out'. Reset to 'ease-out'.`,
					);
				}
				timingFunction = timingFunctions['ease-out'];
			}

			const percent = 1 - (this.endTime - performance.now()) / (this.endTime - this.startTime);

			const progress = Math.min(1, timingFunction(percent));

			if (this.onProgress) {
				this.onProgress(progress);
			}
			if (percent < 1) {
				this.id = window.requestAnimationFrame(() => this.animate());
			} else {
				this.stop();
			}
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
