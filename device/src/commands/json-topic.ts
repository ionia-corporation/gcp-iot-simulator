import Vorpal from 'vorpal';
import chalk from 'chalk';

import Device from '../devices/device';

export default (device: Device, topicName: 'state' | 'events') => {
  return (vorpal: Vorpal) => {
    vorpal
    .command(topicName + ' <key> <value>', 'Updates device ' + topicName)
    .action((args) => {
      if(topicName == 'state'){
        device.updateState(args.key, args.value);
      }

      if(topicName == 'events'){
        device.updateEvents(args.key, args.value);
      }

      return Promise.resolve();
    });

  };
};
