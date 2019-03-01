import Vorpal from 'vorpal';
import chalk from 'chalk';

import Device from '../devices/device';
import { getToken, downloadFile } from '../lib/firestore-tokens';

const statuses = ['msg-received', 'downloading', 'installing', 'installed', 'error'];

export default (device: Device) => {
  return (vorpal: Vorpal) => {
    vorpal
      .command('firmware set-status <firmwareStatus>', 'Sets firmware status to value')
      .autocomplete(statuses)
      .validate((args) => statuses.indexOf(args.firmwareStatus) >= 0)
      .action((args) => {
        device.updateState('fw-state', args.firmwareStatus)

        const messages = [
          'Would you like to download the new firmware? Run ' + chalk.bold('firmware set-status downloading'),
          'Would you like to install the new firmware? Run ' + chalk.bold('firmware set-status installing'),
          'Would you like to finalize the install the new firmware? Run ' + chalk.bold('firmware set-status installed'),
        ]

        if (args.firmwareStatus == 'downloading') {
          vorpal.log(chalk.cyan('Retreiving a Firebase token from IoT Core'));

          // getToken()
          //   .then(token => {
          //     vorpal.log(chalk.cyan('Retreived token:'));
          //     vorpal.log(token);
          //     return downloadFile(device.config['firmware-update']['Url'], token);
          //   })
          //   .then(file => {
          //     vorpal.log(chalk.cyan('File downloaded. File size: ' + file.length));
          //     vorpal.log(file.toString('ascii'));
          //     vorpal.log(chalk.cyan(messages[statuses.indexOf(args.firmwareStatus)]));
          //   })
        } else {
          setTimeout(() => {
            vorpal.log(chalk.cyan(messages[statuses.indexOf(args.firmwareStatus)]));
          }, 1000);
        }

        // Wait a second before prompting the user for the next step

        return Promise.resolve();
      });
  };
};
