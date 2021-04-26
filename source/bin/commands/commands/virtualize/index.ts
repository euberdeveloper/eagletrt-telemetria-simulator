import { Command, SovraCommand } from '@bin/commands/types';
import { command as canCommand } from './can';

export const command: SovraCommand & { canCommand: Command } = {
    command: 'virtualize',
    description: 'Virtualize an interface for the telemetry',
    canCommand
};
