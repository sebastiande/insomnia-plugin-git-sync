const Workspace = require('./Workspace');
const Sync = require('./Sync');
const SyncToServer = require('./SyncToServer');
const SyncToLocal = require('./SyncToLocal');

module.exports.workspaceActions = [
    {
        label: 'Set GIT Repository URL',
        icon: 'fa-git',
        action: async (context, data) => {
            await Sync.setupRepoUrl(context, data);
        },
    },
    {
        label: 'Pull from GIT',
        icon: 'fa-arrow-down',
        action: async (context, data) => {
            if (await Sync.isSetup(context, data) === false) {
                return;
            }

            await SyncToLocal.pull(context, data);
            Workspace.importProject(context, data);
        },
    },
    {
        label: 'Push to GIT',
        icon: 'fa-arrow-up',
        action: async (context, data) => {
            if (await Sync.isSetup(context, data) === false) {
                return;
            }
            const expFilename = await Workspace.exportProject(context, data);
            if (!expFilename) {
                return;
            }

            await SyncToServer.push(context, data, expFilename);
        },
    }
];
