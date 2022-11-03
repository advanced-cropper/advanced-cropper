import { AbstractCropper, AbstractCropperData, AbstractCropperProps, AbstractCropperSettings } from './AbstractCropper';
import { emptyInteractions } from '../service/interactions';

export interface CropperInstanceProps<Settings extends AbstractCropperSettings, Instance> {
	getProps: () => AbstractCropperProps<Settings, Instance>;
	getData?: () => AbstractCropperData;
	setData?: (data: AbstractCropperData) => void;
}

export class CropperInstance<Settings extends AbstractCropperSettings, Instance = unknown> extends AbstractCropper<
	Settings,
	Instance
> {
	data?: AbstractCropperData;

	props: CropperInstanceProps<Settings, Instance>;

	constructor(props: CropperInstanceProps<Settings, Instance>) {
		super();

		this.props = props;

		if (!this.isControlled()) {
			this.data = {
				state: null,
				transitions: false,
				interactions: emptyInteractions(),
			};
		}
	}

	protected isControlled() {
		return Boolean(this.props.getData);
	}

	protected setData(data: AbstractCropperData) {
		if (!this.isControlled()) {
			this.data = data;
		}
		this.props.setData?.(data);
	}

	protected getProps(): AbstractCropperProps<Settings, Instance> {
		return this.props.getProps();
	}

	protected getData(): AbstractCropperData {
		return (this.isControlled() ? this.props.getData?.() : this.data) as AbstractCropperData;
	}
}
