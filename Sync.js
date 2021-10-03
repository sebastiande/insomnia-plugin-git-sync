const simpleGit = require('simple-git');

const Workspace = require('./Workspace');
const Settings = require('./Settings');

class Sync {
    async setupRepoUrl(context, data) {
        if (!data || !data.workspace || !data.workspace._id) {
            context.app.alert('Error reading workspace',
                'Could not get workspace config');
            return;
        }
        let repoUrl = false;
        try {
            repoUrl = await context.app.prompt(
                'Insert the GIT Repository URL for Workspace ' + data.workspace.name,
                {
                    defaultValue: await this.getRepoUrl(context, data.workspace._id),
                    placeholder: 'git@github.com:sebastiande/insomnia-plugin-git-sync.git',
                    submitName: 'Save',
                    cancelable: true
                }
            );
        } catch (error) {
            // ignore
            console.error(error);
        }

        if (repoUrl === false) {
            return;
        }
        Settings.set(context, data.workspace._id, 'repo', repoUrl);
        Settings.set(context, 'global', 'last_repo', repoUrl);
    }

    async getRepoUrl(context, workspaceId, fallback) {
        let repo = await Settings.get('repo', context, workspaceId) || false;
        if (repo === false && fallback === true) {
            repo = await Settings.get('last_repo', context, workspaceId) || false;
        }
        if (repo === false) {
            return '';
        }
        return repo;
    }

    async isSetup(context, data) {
        if (!context || !data || !data.workspace || !data.workspace._id) {
            return false;
        }

        const repoUrl = await this.getRepoUrl(context, data.workspace._id, false);
        if (repoUrl === '') {
            context.app.alert('Error doing action',
                'Please setup at least one GIT repository url for this or any workspace first!');
            return false;
        }

        try {
            const sGit = this.getSimpleGit(data.workspace);
            const isGit = await sGit.checkIsRepo('root');
            if (!isGit) {
                await this.initialiseRepo(sGit, context, data.workspace);
            }
        } catch(error) {
            console.error(error);
            context.app.alert('Error doing action',
                'Initializing GIT repository failed. Please delete the project folder: '
                + Workspace.getWorkingDir(data.workspace));
            return false;
        }

        return true;
    }

    async sync(context, data, expFilename, toLocal) {
        const sGit = this.getSimpleGit(data.workspace);
        let conflictError = false;
        try {
            await sGit.add(expFilename);
            await sGit.commit('Commit');
            await sGit.pull(['--no-rebase']);
        } catch(error) {
            console.error(error);

            if (error.message.includes('CONFLICT')) {
                conflictError = true;
                // TODO as soon as there is an api from insomnia for yes/now dialogs we should switch to it
                if (confirm('There are conflicts, do you want to overwrite your local changes (OK) or overwrite the server version (CANCEL)?')) {
                    const branchName = await sGit.revparse(['--abbrev-ref', 'HEAD']);
                    await sGit.reset('hard',['origin/' + branchName], () => {
                        if (Workspace.importProject(context, data)) {
                            context.app.alert('Finished', 'Project got reset to server version.');
                        }
                    });
                    return;
                }
            } else {
                context.app.alert('Error!', 'Could not push to server, more information can be found in console!');
                return;
            }
        }

        sGit.push(['-f'], (result) => {
            if (toLocal && conflictError) {
                context.app.alert('Finished', 'Server version got updated to your local one.');
                return;
            } else if (toLocal) {
                context.app.alert('Success!', 'Updated from server.');
                return;
            }
            context.app.alert('Success!', 'Pushed to server.');
        });
    }

    /* helper methods */
    getSimpleGit(scope) {
        const folder = Workspace.getWorkingDir(scope);
        if (folder === false) {
            return false;
        }
        return simpleGit(folder);
    }

    async initialiseRepo(sGit, context, workspace) {
        const workDirectory = Workspace.getWorkingDir(workspace);
        const repoUrl = await this.getRepoUrl(context, workspace._id, false);
        await sGit.clone(repoUrl, workDirectory);
    }
}

module.exports = new Sync();