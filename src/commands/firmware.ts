import Vorpal from 'vorpal';
import chalk from 'chalk';

import Device from '../devices/device';

const statuses = ['msg-received', 'downloading', 'installing', 'installed'];

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

        if(args.firmwareStatus = 'downloading'){
          // getToken()
          // .then(token => {
          //   console.log(token);
          //   return downloadFile(device.config['firmware-update']['Url'], token);
          // })
          // .then(file => {
          //   vorpal.log(file.toString('ascii'));
          //   return vorpal.log('File downloaded. File size' + file.length);
          // })
      }

        // Wait a second before prompting the user for the next step
        setTimeout(() => {
          vorpal.log(chalk.cyan(messages[statuses.indexOf(args.firmwareStatus)-1]));
        }, 1000);

        return Promise.resolve();
      });
  };
};
