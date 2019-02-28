import Vorpal from 'vorpal';
import chalk from 'chalk';

import Device from '../devices/device';

export default (device: Device) => {
  return (vorpal: Vorpal) => {
    vorpal
      .command('subscribe <topic>', 'Subscribes to topic and logs any messages on that topic')
      .action((args) => {
        const onMessage = (message: Buffer) => {
          vorpal.log(chalk.green('Received message'));
          vorpal.log(message.toString('utf8'));
        };

        device.subscribe(args.topic, onMessage);

        return Promise.resolve();
      })
  };
};
