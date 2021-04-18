import * as path from 'path';
import * as fs from 'fs';

const SETTINGS_PATH = path.join(__dirname, '..', '..', '..', 'settings', 'settings.json');

interface Settings {
    telemetryConfigPath: string | null;
}

function getTelemetryConfigPath(): string | null {
    const settingsTxt = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const settings: Settings = JSON.parse(settingsTxt);
    return settings.telemetryConfigPath;
}

export function setTelemetryConfigPath(path: string | null): void {
    const settingsTxt = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const settings: Settings = JSON.parse(settingsTxt);
    settings.telemetryConfigPath = path;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings));
}

export function updateTelemetryGpsPort(gpsInterface: string): void {
    const telemetryConfigPath = getTelemetryConfigPath();

    if (telemetryConfigPath) {
        const config = JSON.parse(fs.readFileSync(telemetryConfigPath, 'utf-8'));
        config.gps.interface = gpsInterface;
        fs.writeFileSync(telemetryConfigPath, JSON.stringify(config, null, 2));
    }
}
