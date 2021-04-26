import { Command, SovraCommand } from '@bin/commands/types';

import { command as canCommand } from './can';
import { command as gpsCommand } from './gps';
import { command as allCommand } from './all';

export const command: SovraCommand & { canCommand: Command; gpsCommand: Command; allCommand: Command } = {
    command: 'simulate',
    description: 'Simulate a canbus or a gps or both',
    canCommand,
    gpsCommand,
    allCommand
};
