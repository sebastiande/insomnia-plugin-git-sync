const simpleGit = require('simple-git');
const commandExistsSync = require('command-exists').sync;

const Workspace = require('./Workspace');
const Settings = require('./Settings');

class Sync {
    async setupRepoUrl(context, data) {
        if (!data || !data.workspace || !data.workspace._id) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error reading workspace',
                'Could not get workspace config');
            return;
        }
        let repoUrl = false;
        try {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
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
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error doing action',
                'Please setup at least one GIT repository url for this or any workspace first!');
            return false;
        }

        try {
            const sGit = this.getSimpleGit(context, data.workspace);
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            const isGit = await sGit.checkIsRepo('root'); // using the enum does not work on linux
            if (!isGit) {
                await this.initialiseRepo(sGit, context, data.workspace);
            }
        } catch(error) {
            console.error(error);
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error doing action',
                'Initializing GIT repository failed. Please delete the project folder: '
                + Workspace.getWorkingDir(data.workspace));
            return false;
        }

        return true;
    }

    /* helper methods */
    getSimpleGit(context, scope) {
        const folder = Workspace.getWorkingDir(scope);
        if (folder === false) {
            return false;
        }
        if (!commandExistsSync('git')) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error doing action',
                'Seems git is not installed. ' +
                'Git needs to be installed and reachable via command git on the console!');
            return false;
        }
        // noinspection JSCheckFunctionSignatures
        return simpleGit(folder);
    }

    async initialiseRepo(sGit, context, workspace) {
        const workDirectory = Workspace.getWorkingDir(workspace);
        const repoUrl = await this.getRepoUrl(context, workspace._id, false);
        await sGit.clone(repoUrl, workDirectory);
    }
}

module.exports = new Sync();