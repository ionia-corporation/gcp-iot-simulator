import Vorpal from 'vorpal';
import chalk from 'chalk';
import mqtt from './commands/mqtt';
import demo from './commands/demo';
import device from './commands/device';
import firmware from './commands/firmware';

const vorpal = new Vorpal();

vorpal.use(device);
vorpal.use(mqtt);
vorpal.use(firmware);
vorpal.use(demo);

vorpal.delimiter(chalk.magenta('device-simulator$'));
vorpal.history('device-simulator');
vorpal.show();
