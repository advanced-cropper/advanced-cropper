import { AbstractCropper, AbstractCropperData, AbstractCropperProps, AbstractCropperSettings } from './AbstractCropper';
import { CoreSettings, ModifierSettings } from '../types';

export interface CropperInstanceProps<Settings extends AbstractCropperSettings, Instance> {
	getProps: () => AbstractCropperProps<Settings, Instance>;
	getData?: () => AbstractCropperData;
	setData?: (data: AbstractCropperData) => void;
}

export class CropperInstance<
	Settings extends CoreSettings & ModifierSettings,
	Instance = unknown
> extends AbstractCropper<Settings, Instance> {
	data?: AbstractCropperData;

	props: CropperInstanceProps<Settings, Instance>;

	constructor(props: CropperInstanceProps<Settings, Instance>) {
		super();

		this.props = props;

		// If it's not controlled:
		if (!props.getData) {
			this.data = {
				state: null,
				transitions: false,
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

	public getProps(): AbstractCropperProps<Settings, Instance> {
		return this.props.getProps();
	}

	public getData(): AbstractCropperData {
		return (this.isControlled() ? this.props.getData?.() : this.data) as AbstractCropperData;
	}
}
