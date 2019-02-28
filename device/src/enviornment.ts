import fs from 'fs';

export type DeviceEnviornment = {
  projectId: string,
  region: string,
  registryId: string,
  deviceId: string,
  privateKey: string,
  privateKeyFile: string,
  algorithm: string,
  type: "device" | "gateway" | "gateway-client",
}


// Cast object as type. Bit of a cheap hack that trusts user input.
let config = {} as DeviceEnviornment;

if (process.argv[2] && fs.existsSync(process.argv[2])) {
  const configText = fs.readFileSync(process.argv[2], { encoding: 'utf8' });

  config = JSON.parse(configText);

  if(config.privateKeyFile){
    config.privateKey = fs.readFileSync(config.privateKeyFile, { encoding: 'utf8' });
  }
}

export default config;
