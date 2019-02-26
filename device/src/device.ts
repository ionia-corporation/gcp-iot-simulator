// Representation of device memory

type DeviceRepresentation = {
  state: any,
  config: {
    'firmware-update'?: any
  }
  event: any,
}

const device: DeviceRepresentation = {
  state: {},
  config: {},
  event: {},
};

export default device;
