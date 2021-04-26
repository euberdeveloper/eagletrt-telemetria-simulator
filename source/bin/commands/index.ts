if (!process.env.IS_WEBPACK) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('module-alias/register');
}

export { command as virtualizeCommand } from './commands/virtualize';
export { command as simulateCommand } from './commands/simulate';
export { command as settingsCommand } from './commands/settings';
