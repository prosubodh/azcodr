import path from 'node:path';
import { installPack } from './pack.js';
function printInstallResult(result, parsed, io) {
    const relPath = path.relative(io.cwd, result.configPath) || result.configPath;
    if (result.alreadyInstalled) {
        io.out(`ℹ️  Capability pack '${result.packName}' is already installed in ${relPath}.`);
        return;
    }
    const prefix = parsed.dryRun ? '[dry-run] ' : '';
    io.out(`\n📦 ${prefix}Installed capability pack: ${result.packName}`);
    for (const action of result.actions) {
        io.out(`   - ${action}`);
    }
    io.out(`\nConfiguration saved to: ${relPath}\n`);
}
export function handleAddCommand(parsed, io) {
    if (!parsed.packName || parsed.packName.trim() === '') {
        io.err('❌ Error: Missing pack name.\nUsage: azcodr add <pack> [directory]\nExample: azcodr add tdd');
        return io.exit(1);
    }
    const targetDir = parsed.targetDir
        ? path.resolve(io.cwd, parsed.targetDir)
        : io.cwd;
    try {
        const result = installPack(targetDir, parsed.packName, { dryRun: parsed.dryRun });
        if (!parsed.silent) {
            printInstallResult(result, parsed, io);
        }
        return io.exit(0);
    }
    catch (err) {
        io.err(`❌ Error installing pack '${parsed.packName}': ${err.message}`);
        return io.exit(1);
    }
}
export default { handleAddCommand };
//# sourceMappingURL=cli-add.js.map