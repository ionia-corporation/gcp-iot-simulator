import Vorpal from 'vorpal';
import chalk from 'chalk';

import device from '../device';
import * as mqtt from '../lib/mqtt';


export default (vorpal: Vorpal) => {
  vorpal
    .command('simulate', 'Initiates device simulation')
    .action(() => {
      const onConfigUpdate = (message: Buffer) => {
        try {
          // Assume config is JSON
          device.config = JSON.parse(message.toString('utf8'));
          vorpal.log(chalk.yellow('Received new config:'));
          vorpal.log(JSON.stringify(device.config, null, 2));

          if(device.config['firmware-update']){
            vorpal.log(chalk.cyan('New config contains a firmware update. Run firmware <something> to initiate'));
          }

        } catch (e){
          vorpal.log(chalk.yellow('Received non-JSON config: '));
          vorpal.log(message.toString('base64'));
        }

      };

      return mqtt.connect()
        .then(() => mqtt.subscribe('config', onConfigUpdate, true))
        .then(() => {})
        .catch(() => {
          vorpal.log(chalk.red('Failed to initiate the simulation'));
        });

    });
};


/*

UI for this:

> simulate
received config {}
received state {}
> ...now we wait
received config {}
This config includes a firmware update. Run firmware msg-received
> firmware msg-received
published state {}
> firmware downloading
published state {}
.. gets token and downloads file
.. prints file length
>



*/
