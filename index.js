const fs = require('fs');
const Workspace = require('./Workspace');
const Sync = require('./Sync');

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

            // do export to see if there are local changes
            const expFilename = await Workspace.exportProject(context, data);
            if (!expFilename) {
                return;
            }

            await Sync.sync(context, data, expFilename, true);
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

            await Sync.sync(context, data, expFilename, false);
        },
    }
];
