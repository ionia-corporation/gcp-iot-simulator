import Vorpal from 'vorpal';
import chalk from 'chalk';

import * as mqtt from '../lib/mqtt';
import device from '../device';
import { getToken, downloadFile } from '../lib/firestore-tokens';

const statuses = ['msg-received', 'downloading', 'installing', 'installed'];


export default (vorpal: Vorpal) => {
  vorpal
    .command('firmware set-status <firmwareStatus>', 'Sets firmware status to value')
    .autocomplete(statuses)
    .validate((args) => statuses.indexOf(args.firmwareStatus) >= 0)
    .action((args) => {
      device.state['fw-state'] = args.firmwareStatus;

      return mqtt.publish('state', JSON.stringify(device.state), true)
      .then(() => {
        vorpal.log(chalk.blueBright('Published new state: '))
        vorpal.log(JSON.stringify(device.state));

        switch (statuses.indexOf(args.firmwareStatus)) {
          case 0:
            vorpal.log('Would you like to download the new firmware? Run firmware set-status downloading')
            break;

          case 1:
            // getToken()
            // .then(token => {
            //   console.log(token);
            //   return downloadFile(device.config['firmware-update']['Url'], token);
            // })
            // .then(file => {
            //   vorpal.log(file.toString('ascii'));
            //   return vorpal.log('File downloaded. File size' + file.length);
            // })
            vorpal.log('Would you like to install the new firmware? Run firmware set-status installing')
            break;

          case 2:
            vorpal.log('Would you like to finalize the install the new firmware? Run firmware set-status installed');
            break;

          case 3:
            // Output stuff
            break;
        }
      })
    })
};
