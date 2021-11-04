const ResetMode = require('simple-git/src/lib/tasks/reset');

const Workspace = require('./Workspace');
const Settings = require('./Settings');
const Sync = require('./Sync');

class SyncToLocal {
    async pull(context, data) {
        const sGit = Sync.getSimpleGit(data.workspace);
        if (await this.localChangesNotHandled(sGit, context, data)) {
            return;
        }

        try {
            await sGit.pull(['--no-rebase']);
        } catch(error) {
            console.error(error);
            await this.handleError(error, sGit, context, data);
            return;
        }

        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
        context.app.alert('Success!', 'Updated from server.');
        Settings.set(context, data.workspace._id, 'SyncToLocal.FirstPullDone', true);
    }

    async localChangesNotHandled(sGit, context, data) {
        if (await Settings.get('SyncToLocal.FirstPullDone', context, data.workspace._id) === false) {
            return false;
        }
        const expFilename = await Workspace.exportProject(context, data);
        if (!expFilename) {
            return true;
        }

        const status = await sGit.status();
        if (!status.modified || status.modified.length === 0) {
            return false;
        }

        if (confirm('You have local changes, do you want to overwrite your local changes with the server version?')) {
            const branchName = await sGit.revparse(['--abbrev-ref', 'HEAD']);
            // noinspection JSUnresolvedVariable
            await sGit.reset(ResetMode.HARD, ['origin/' + branchName], () => {
                Workspace.importProject(context, data);
            });
            return false;
        }

        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
        context.app.alert('Skipped!', 'Project got not updated, please push your local changes or pull and overwrite them!');
        return true;
    }

    async handleError(error, sGit, context, data) {
        if (!error.message.includes('CONFLICT')) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error!', 'Could not update the project, more information can be found in console!');
            return;
        }

        if (confirm('There are conflicts, do you want to overwrite your local changes with the server version?')) {
            const branchName = await sGit.revparse(['--abbrev-ref', 'HEAD']);
            // noinspection JSUnresolvedVariable
            await sGit.reset(ResetMode.HARD,['origin/' + branchName], () => {
                if (Workspace.importProject(context, data)) {
                    // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
                    context.app.alert('Finished', 'Project got reset to server version.');
                }
            });
        }
    }
}

module.exports = new SyncToLocal();
