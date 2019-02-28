import Vorpal from 'vorpal';
import mqtt, { MqttClient } from 'mqtt';
import chalk from 'chalk';

import { DeviceEnviornment } from '../enviornment';

import Device from './device';

export default class GatewayClient extends Device {
  constructor(env: DeviceEnviornment, vorpal: Vorpal) {
    super(env, vorpal);
  }

  // Broker bits
  protected connect() {
    // Assume local gateway broker
    this.log('Attempting connect to localhost gateway');

    let connectionArgs = {
      host: 'localhost',
      port: 1883,
      protocol: 'mqtt',
    };

    const client = mqtt.connect(connectionArgs);

    client.on('connect', () => {
      this.log(chalk.green('Connected to Gateway'));
      this.subscribe('config', (message) => this.onConfig(message));
    });

    client.on('error', (e) => {
      this.log(chalk.red('Error in MQTT subscription:'));
      this.log(e.message);
    })

    return client;
  }
}
