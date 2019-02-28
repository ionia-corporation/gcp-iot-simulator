import Vorpal from 'vorpal';
import chalk from 'chalk';

import Device from '../devices/device';

export default (device: Device) => {
  return (vorpal: Vorpal) => {
    vorpal
    .command('log <level> <value>', 'Sends value to log channel')
    .autocomplete(['INFO', 'ERROR', 'WARNING', 'DEBUG'])
    .action((args) => {
      device.sendLog(args.level, args.value);
      return Promise.resolve();
    });

  };
};
