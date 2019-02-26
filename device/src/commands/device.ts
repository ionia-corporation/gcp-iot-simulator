import Vorpal from 'vorpal';
import chalk from 'chalk';

import * as mqtt from '../lib/mqtt';
import device from '../device';

export default (vorpal: Vorpal) => {
  vorpal
    .command('state <key> <value>', 'Updates device state')
    .action((args) => {
      device.state[args.key] = args.value;
      const state = JSON.stringify(device.state);
      return mqtt.publish('state', state, true)
        .then(() => {
          vorpal.log(chalk.blueBright('Published new state: '))
          vorpal.log(JSON.stringify(device.state));
        })
    });

    vorpal
    .command('event <key> <value>', 'Updates device telemetry')
    .action((args) => {
      device.event[args.key] = args.value;
      const event = JSON.stringify(device.event);
      return mqtt.publish('events', event, true)
        .then(() => {
          vorpal.log(chalk.blueBright('Published new event: '))
          vorpal.log(JSON.stringify(device.event));
        })
    });
};
