import { Command, SovraCommand } from '@bin/commands/types';
import { command as canCommand } from './can';

export const command: SovraCommand & { canCommand: Command } = {
    command: 'can',
    description: 'Virtualize a canbus interface',
    canCommand
};
