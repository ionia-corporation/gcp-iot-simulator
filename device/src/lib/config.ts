import fs from 'fs';

export type DeviceConfiguration = {
  projectId: string,
  region: string,
  registryId: string,
  deviceId: string,
  privateKey: string,
  algorithm: string,
}

// Cast object as type. Bit of a cheap hack that trusts user input.
let config = {} as DeviceConfiguration;

if(process.argv[2] && fs.existsSync(process.argv[2])){
  const configText = fs.readFileSync(process.argv[2], {encoding: 'utf8'});

  config = JSON.parse(configText);
}

export default config;
