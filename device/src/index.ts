import Vorpal from 'vorpal';
import chalk from 'chalk';

import enviornment from './enviornment';
import Device from './devices/device';

const vorpal = new Vorpal();

switch(enviornment.type){
  case 'device':
    new Device(enviornment, vorpal);
    break;

  case 'gateway':
    break;

  case 'gateway-client':
    break;

  default:
    vorpal.log('Unknown device enviornment type');
    break;
}



vorpal.delimiter(chalk.magenta('device-simulator$'));
vorpal.history('device-simulator');
vorpal.show();
