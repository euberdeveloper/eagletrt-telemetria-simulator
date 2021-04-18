if (!process.env.IS_WEBPACK) {
    // eslint-disable-next-line
    require('module-alias/register')
}

export * from './modules/virtualizeCan';
export * from './modules/simulateCan';
export * from './modules/simulateGps';
