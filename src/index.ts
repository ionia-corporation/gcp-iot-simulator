import Vorpal from 'vorpal';
import chalk from 'chalk';

import enviornment from './enviornment';
import Device from './devices/device';
import GatewayClient from './devices/gateway-client';
import Gateway from './devices/gateway';

const vorpal = new Vorpal();

switch(enviornment.type){
  case 'device':
    new Device(enviornment, vorpal);
    break;

  case 'gateway':
    new Gateway(enviornment, vorpal);
    break;

  case 'gateway-client':
    new GatewayClient(enviornment, vorpal);
    break;

  default:
    vorpal.log('Unknown device enviornment type');
    break;
}


vorpal.delimiter('device-simulator$');
vorpal.history('device-simulator');
vorpal.show();
