import {
	Boundary,
	CoordinatesTransform,
	CoreSettings,
	CropperImage,
	CropperInteractions,
	CropperState,
	CropperTransitionsSettings,
	DefaultTransforms,
	ImageTransform,
	ModifierSettings,
	MoveDirections,
	Nullable,
	PartialTransforms,
	PostprocessAction,
	PostprocessFunction,
	Priority,
	ResizeDirections,
	Rotate,
	Scale,
	VisibleArea,
} from '../types';
import {
	copyState,
	createState,
	CreateStateAlgorithm,
	MoveAlgorithm,
	moveCoordinates,
	reconcileState,
	ReconcileStateAlgorithm,
	ResizeAlgorithm,
	resizeCoordinates,
	setBoundary,
	SetBoundaryAlgorithm,
	setCoordinates,
	SetCoordinatesAlgorithm,
	SetCoordinatesMode,
	setVisibleArea,
	SetVisibleAreaAlgorithm,
	transformImage,
	TransformImageAlgorithm,
} from '../state';
import { debounce, deepClone, deepCompare, getOptions, isArray, isFunction } from '../utils';
import {
	fillMoveDirections,
	fillResizeDirections,
	getRoundedCoordinates,
	getStencilCoordinates,
	isConsistentState,
	isEqualState,
	normalizeImageTransform,
	normalizeMoveDirections,
	normalizeResizeDirections,
} from '../service';
import { hasInteractions } from '../service/interactions';

export interface TransitionOptions {
	transitions?: boolean;
}

export interface ImmediatelyOptions {
	immediately?: boolean;
}

export interface NormalizeOptions {
	normalize?: boolean;
}

export type AbstractCropperPostprocess =
	| 'interactionEnd'
	| 'createState'
	| 'reconcileState'
	| 'transformImage'
	| 'transformImageEnd'
	| 'setCoordinates'
	| 'setVisibleArea'
	| 'setBoundary'
	| 'moveCoordinates'
	| 'moveCoordinatesEnd'
	| 'resizeCoordinates'
	| 'resizeCoordinatesEnd';

export interface AbstractCropperData {
	state: CropperState | null;
	transitions: boolean;
	interactions: CropperInteractions;
}

export interface AbstractCropperMethodOptions {
	transitions?: boolean;
}

type StateModifier = (state: CropperState | null, settings: CoreSettings) => CropperState | null;

export type AbstractCropperSettings = CoreSettings & ModifierSettings;

export type AbstractCropperProps<Settings extends AbstractCropperSettings, Instance> = AbstractCropperParameters<
	Settings
> &
	AbstractCropperCallbacks<Instance> & {
		settings: Settings;
	};

export type AbstractCropperCallback<Instance> = (instance: NonNullable<Instance>) => void;

export interface AbstractCropperCallbacks<Instance = unknown> {
	getInstance?: () => Nullable<Instance>;
	onTransitionsStart?: AbstractCropperCallback<Instance>;
	onTransitionsEnd?: AbstractCropperCallback<Instance>;
	onChange?: AbstractCropperCallback<Instance>;
	onResizeEnd?: AbstractCropperCallback<Instance>;
	onMoveEnd?: AbstractCropperCallback<Instance>;
	onMove?: AbstractCropperCallback<Instance>;
	onResize?: AbstractCropperCallback<Instance>;
	onTransformImage?: AbstractCropperCallback<Instance>;
	onTransformImageEnd?: AbstractCropperCallback<Instance>;
	onInteractionStart?: AbstractCropperCallback<Instance>;
	onInteractionEnd?: AbstractCropperCallback<Instance>;
}

export interface AbstractCropperParameters<Settings extends CoreSettings> {
	transitions?: CropperTransitionsSettings | boolean;
	postProcess?: PostprocessFunction<Settings> | PostprocessFunction<Settings>[];
	setCoordinatesAlgorithm?: SetCoordinatesAlgorithm<Settings>;
	setVisibleAreaAlgorithm?: SetVisibleAreaAlgorithm<Settings>;
	setBoundaryAlgorithm?: SetBoundaryAlgorithm<Settings>;
	transformImageAlgorithm?: TransformImageAlgorithm<Settings>;
	moveCoordinatesAlgorithm?: MoveAlgorithm<Settings>;
	resizeCoordinatesAlgorithm?: ResizeAlgorithm<Settings>;
	createStateAlgorithm?: CreateStateAlgorithm<Settings>;
	reconcileStateAlgorithm?: ReconcileStateAlgorithm<Settings>;
	defaultTransforms?: DefaultTransforms;
	priority?: Priority;
}

function runCallback<Instance>(callback?: AbstractCropperCallback<Instance>, getInstance?: () => Nullable<Instance>) {
	if (callback && getInstance) {
		const instance = getInstance();
		if (instance) {
			callback(instance as NonNullable<Instance>);
		}
	}
}

function createCallback<Instance>(
	callback?: AbstractCropperCallback<Instance>,
	getInstance?: () => Nullable<Instance>,
) {
	return () => {
		runCallback(callback, getInstance);
	};
}

function runCallbacks<Instance>(callbacks: Function[]) {
	callbacks.forEach((callback) => {
		callback();
	});
}

export abstract class AbstractCropper<Settings extends AbstractCropperSettings, Instance = unknown> {
	protected abstract setData(data: AbstractCropperData): void;

	protected abstract getData(): AbstractCropperData;

	protected abstract getProps(): AbstractCropperProps<Settings, Instance>;

	public getTransitions = () => {
		const data = this.getData();
		const { transitions } = this.getProps();
		return {
			...getOptions(transitions, {
				timingFunction: 'ease-in-out',
				duration: 350,
			}),
			active: data.transitions,
		};
	};

	public getInteractions = () => {
		const { interactions } = this.getData();
		return deepClone(interactions);
	};

	public hasInteractions = () => {
		const { interactions } = this.getData();
		return hasInteractions(interactions);
	};

	protected disableTransitions = debounce(
		() => {
			const { onTransitionsEnd, getInstance } = this.getProps();
			this.setData({ ...this.getData(), transitions: false });
			runCallback(onTransitionsEnd, getInstance);
		},
		() => {
			return this.getTransitions().duration;
		},
	);

	protected applyPostProcess = (action: PostprocessAction, state: CropperState) => {
		const { settings, postProcess } = this.getProps();
		if (isArray(postProcess)) {
			return postProcess.reduce((processedState, p) => p(processedState, settings, action), state);
		} else if (isFunction(postProcess)) {
			return postProcess(state, settings, action);
		} else {
			return state;
		}
	};

	protected updateState = (
		modifier: StateModifier | CropperState | null,
		options: AbstractCropperMethodOptions = {},
		callbacks: (AbstractCropperCallback<Instance> | undefined)[] = [],
	) => {
		const { transitions = false } = options;

		const { onTransitionsStart, getInstance, onChange, settings } = this.getProps();
		const previousData = this.getData();

		const state = isFunction(modifier) ? modifier(previousData.state, settings) : modifier;
		const changed = !isEqualState(previousData.state, state);

		let currentData = previousData;
		if (changed) {
			if (transitions && changed) {
				this.disableTransitions();
			}

			currentData = {
				...currentData,
				state: copyState(state),
				transitions: transitions && changed,
			};
		}
		this.setData(currentData);

		if (currentData.transitions && !previousData.transitions) {
			runCallback(onTransitionsStart, getInstance);
		}
		runCallbacks([
			createCallback(onChange, getInstance),
			...callbacks.map((callback) => createCallback(callback, getInstance)),
		]);
	};

	protected setInteractions = (interactions: Partial<CropperInteractions>) => {
		const { onInteractionStart, onInteractionEnd, getInstance } = this.getProps();
		const previousInteractions = this.getInteractions();
		const currentInteractions = {
			...previousInteractions,
			...interactions,
		};

		if (!deepCompare(previousInteractions, currentInteractions)) {
			this.setData({
				...this.getData(),
				interactions: currentInteractions,
			});
		}

		if (hasInteractions(previousInteractions) !== hasInteractions(currentInteractions)) {
			if (!hasInteractions(previousInteractions)) {
				runCallback(onInteractionStart, getInstance);
			} else {
				const { state } = this.getData();
				this.updateState(
					() =>
						state &&
						this.applyPostProcess(
							{
								name: 'interactionEnd',
								immediately: true,
								transitions: true,
							},
							state,
						),
					{
						transitions: true,
					},
					[onInteractionEnd],
				);
			}
		}
	};

	public resetState = (boundary: Boundary, image: CropperImage) => {
		this.updateState(this.getDefaultState(boundary, image));
	};

	public clear = () => {
		this.updateState(null);
	};

	public reconcileState = (options: TransitionOptions = {}) => {
		const { reconcileStateAlgorithm, settings } = this.getProps();
		const { state } = this.getData();
		const { transitions = false } = options;

		if (state && !isConsistentState(state, settings)) {
			let reconciledState = (reconcileStateAlgorithm || reconcileState)(state, settings);

			if (isConsistentState(reconciledState, settings)) {
				reconciledState = this.applyPostProcess(
					{
						name: 'reconcileState',
						immediately: true,
						transitions,
					},
					reconciledState,
				);
				if (isConsistentState(reconciledState, settings)) {
					this.updateState(reconciledState, {
						transitions,
					});
				} else {
					if (process.env.NODE_ENV !== 'production') {
						console.error(
							"Reconcile error: can't reconcile state. The postprocess function breaks some restrictions that was satisfied before by `reconcileStateAlgorithm`",
						);
					}
				}
			} else {
				if (process.env.NODE_ENV !== 'production') {
					console.error(
						"Reconcile error: can't reconcile state. Perhaps, the restrictions are contradictory.",
					);
				}
			}
		}
	};

	public transformImage = (
		transform: ImageTransform,
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const { transitions = true, immediately = false, normalize = true } = options;
		const { transformImageAlgorithm, onTransformImage, onTransformImageEnd, settings } = this.getProps();
		const { state } = this.getData();
		const callbacks = [];

		if (state) {
			if (normalize) {
				transform = normalizeImageTransform(state, transform);
			}

			let result = this.applyPostProcess(
				{
					name: 'transformImage',
					transitions,
					immediately,
				},
				(transformImageAlgorithm || transformImage)(state, settings, transform),
			);
			callbacks.push(onTransformImage);

			if (immediately) {
				result = this.applyPostProcess(
					{
						name: 'transformImageEnd',
						transitions,
						immediately,
					},
					result,
				);
				callbacks.push(onTransformImageEnd);
			} else {
				this.setInteractions({
					transformImage: {
						rotate: Boolean(transform.rotate),
						flip: Boolean(transform.flip),
						scale: Boolean(transform.scale),
						move: Boolean(transform.move),
					},
				});
			}

			this.updateState(
				result,
				{
					transitions: immediately && transitions,
				},
				callbacks,
			);
		}
	};

	public transformImageEnd = (options: ImmediatelyOptions & TransitionOptions = {}) => {
		const { immediately = false, transitions = true } = options;
		const { state } = this.getData();
		const { onTransformImageEnd } = this.getProps();
		this.updateState(
			() => state && this.applyPostProcess({ name: 'transformImageEnd', immediately, transitions }, state),
			{
				transitions,
			},
			[onTransformImageEnd],
		);
		this.setInteractions({
			transformImage: {
				rotate: false,
				flip: false,
				scale: false,
				move: false,
			},
		});
	};
	zoomImage = (scale: Scale | number, options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {}) => {
		const { immediately = true, transitions = true, normalize = false } = options;

		this.transformImage(
			{
				scale,
			},
			{ immediately, transitions, normalize },
		);
	};

	public moveImage = (
		left: number,
		top?: number,
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const { immediately = true, transitions = true, normalize = false } = options;

		this.transformImage(
			{
				move: {
					left,
					top,
				},
			},
			{ immediately, transitions, normalize },
		);
	};

	public flipImage = (
		horizontal?: boolean,
		vertical?: boolean,
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const { immediately = true, transitions = true } = options;

		this.transformImage(
			{
				flip: {
					horizontal,
					vertical,
				},
			},
			{ immediately, transitions },
		);
	};

	public rotateImage = (
		rotate: number | Rotate,
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const { immediately = true, transitions = true, normalize = false } = options;
		this.transformImage(
			{
				rotate,
			},
			{ immediately, transitions, normalize },
		);
	};

	public reset = (boundary: Boundary, image: CropperImage) => {
		this.resetState(boundary, image);
	};

	public setState = (newState: Partial<CropperState> | null, options: TransitionOptions = {}) => {
		const { state } = this.getData();
		const { transitions = true } = options;
		this.updateState(() => state && { ...state, ...newState }, {
			transitions,
		});
	};

	public setCoordinates = (
		transforms: CoordinatesTransform | CoordinatesTransform[],
		options: ImmediatelyOptions & TransitionOptions = {},
	) => {
		const { state } = this.getData();
		const { setCoordinatesAlgorithm, settings } = this.getProps();
		const { transitions = true, immediately = true } = options;
		this.updateState(
			() =>
				state &&
				this.applyPostProcess(
					{
						name: 'setCoordinates',
						immediately,
						transitions,
					},
					(setCoordinatesAlgorithm || setCoordinates)(state, settings, transforms, SetCoordinatesMode.zoom),
				),
			{
				transitions,
			},
		);
	};

	public setVisibleArea = (visibleArea: VisibleArea, options: ImmediatelyOptions & TransitionOptions = {}) => {
		const { transitions = true, immediately = true } = options;
		const { state } = this.getData();
		const { setVisibleAreaAlgorithm, settings } = this.getProps();
		this.updateState(
			() =>
				state &&
				this.applyPostProcess(
					{ name: 'setVisibleArea', immediately, transitions },
					(setVisibleAreaAlgorithm || setVisibleArea)(state, settings, visibleArea),
				),
			{
				transitions,
			},
		);
	};

	public setBoundary = (boundary: Boundary, options: ImmediatelyOptions & TransitionOptions = {}) => {
		const { state } = this.getData();
		const { setBoundaryAlgorithm, settings } = this.getProps();
		const { transitions = false, immediately = true } = options;
		if (boundary) {
			this.updateState(
				() =>
					state &&
					this.applyPostProcess(
						{ name: 'setBoundary', immediately, transitions },
						(setBoundaryAlgorithm || setBoundary)(state, settings, boundary),
					),
			);
		} else {
			this.updateState(null);
		}
	};

	public moveCoordinates = (
		directions: Partial<MoveDirections>,
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const data = this.getData();
		const { moveCoordinatesAlgorithm, onMove, onMoveEnd, settings } = this.getProps();

		const { transitions = false, immediately = false, normalize = true } = options;

		const callbacks = [];

		if (!data.transitions && data.state) {
			const normalizedDirections = normalize
				? normalizeMoveDirections(data.state, directions)
				: fillMoveDirections(directions);

			let result = this.applyPostProcess(
				{ name: 'moveCoordinates', immediately, transitions },
				(moveCoordinatesAlgorithm || moveCoordinates)(data.state, settings, normalizedDirections),
			);
			callbacks.push(onMove);

			if (immediately) {
				result = this.applyPostProcess({ name: 'moveCoordinatesEnd', immediately, transitions }, result);
				callbacks.push(onMoveEnd);
			} else {
				this.setInteractions({
					moveCoordinates: true,
				});
			}

			this.updateState(
				result,
				{
					transitions: immediately && transitions,
				},
				callbacks,
			);
		}
	};

	public moveCoordinatesEnd = (options: ImmediatelyOptions & TransitionOptions = {}) => {
		const { state } = this.getData();
		const { onMoveEnd } = this.getProps();
		const { transitions = true, immediately = false } = options;
		this.updateState(
			() => state && this.applyPostProcess({ name: 'moveCoordinatesEnd', transitions, immediately }, state),
			{
				transitions,
			},
			[onMoveEnd],
		);
		this.setInteractions({
			moveCoordinates: false,
		});
	};

	public resizeCoordinates = (
		directions: Partial<ResizeDirections>,
		parameters: Record<string, unknown> = {},
		options: ImmediatelyOptions & NormalizeOptions & TransitionOptions = {},
	) => {
		const { state } = this.getData();
		const { resizeCoordinatesAlgorithm, onResize, onResizeEnd, settings } = this.getProps();
		const { transitions = false, immediately = false, normalize = true } = options;
		const transitionsOptions = this.getTransitions();

		if (!transitionsOptions.active && state) {
			const callbacks = [];

			const normalizedDirections = normalize
				? normalizeResizeDirections(state, directions)
				: fillResizeDirections(directions);

			let result = this.applyPostProcess(
				{ name: 'resizeCoordinates', immediately, transitions },
				(resizeCoordinatesAlgorithm || resizeCoordinates)(state, settings, normalizedDirections, parameters),
			);
			callbacks.push(onResize);

			if (immediately) {
				result = this.applyPostProcess({ name: 'resizeCoordinatesEnd', immediately, transitions }, result);
				callbacks.push(onResizeEnd);
			} else {
				this.setInteractions({
					resizeCoordinates: true,
				});
			}

			this.updateState(
				result,
				{
					transitions: immediately && transitions,
				},
				callbacks,
			);
		}
	};

	public resizeCoordinatesEnd = (options: ImmediatelyOptions & TransitionOptions = {}) => {
		const { onResizeEnd } = this.getProps();
		const { state } = this.getData();
		const { transitions = true, immediately = false } = options;
		this.updateState(
			() => state && this.applyPostProcess({ name: 'resizeCoordinatesEnd', transitions, immediately }, state),
			{
				transitions,
			},
			[onResizeEnd],
		);
		this.setInteractions({
			resizeCoordinates: false,
		});
	};

	public getStencilCoordinates = () => {
		const { state } = this.getData();
		return getStencilCoordinates(state);
	};

	public getCoordinates = (options: { round?: boolean } = {}) => {
		const { state } = this.getData();
		const { settings } = this.getProps();
		if (state && state.coordinates) {
			const { round = true } = options;
			if (round) {
				return getRoundedCoordinates(state, settings);
			} else {
				return { ...state.coordinates };
			}
		} else {
			return null;
		}
	};

	public getVisibleArea = () => {
		const { state } = this.getData();
		if (state) {
			return { ...state.visibleArea };
		} else {
			return null;
		}
	};

	public getSettings = () => {
		const { settings } = this.getProps();
		return { ...settings };
	};

	public getState = () => {
		const { state } = this.getData();
		return copyState(state);
	};

	public getTransforms = () => {
		const { state } = this.getData();

		return state
			? deepClone(state.transforms)
			: {
					rotate: 0,
					flip: {
						horizontal: false,
						vertical: false,
					},
			  };
	};

	public getDefaultState = (boundary: Boundary, image: CropperImage) => {
		const { defaultTransforms, createStateAlgorithm, priority, settings } = this.getProps();

		let transforms: PartialTransforms = image.transforms;
		if (defaultTransforms) {
			transforms = isFunction(defaultTransforms) ? defaultTransforms(image) : defaultTransforms;
		}

		return this.applyPostProcess(
			{
				name: 'createState',
				immediately: true,
				transitions: false,
			},
			(createStateAlgorithm || createState)(
				{
					boundary,
					imageSize: { width: image.width, height: image.height },
					transforms,
					priority,
				},
				settings,
			),
		);
	};

	public isConsistent = () => {
		const { state } = this.getData();
		const { settings } = this.getProps();

		return state ? isConsistentState(state, settings) : true;
	};
}
