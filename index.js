const fs = require('fs');

async function getRepositoryUrl(context, workspaceId) {
    let repo = await context.store.getItem('repository_' + workspaceId) || false;
    if (repo === false) {
        repo = await context.store.getItem('repository_global') || false;
    }
    if (repo === false) {
        return '';
    }
    return repo;
}

function setRepositoryUrl(context, workspaceId, repoUrl) {
    context.store.setItem('repository_' + workspaceId, repoUrl);
    context.store.setItem('repository_global', repoUrl);
}

async function checkForRepoUrl(context, data) {
    if (!context || !data || !data.workspace || !data.workspace._id) {
        return false;
    }

    const repoUrl = await getRepositoryUrl(context, data.workspace._id);
    if (repoUrl === '') {
        context.app.alert('Error doing action', 'Please setup at least one GIT repository url for this or any workspace first!');
        return false;
    }
    return true;
}

function getWorkingDir(workspace) {
    if (!workspace || !workspace._id) {
        return false;
    }
    let folder = __dirname + '/git';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    folder = __dirname + '/git/' + workspace._id;
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    return folder;
}

function getSimpleGit(workspace) {
    const folder = getWorkingDir(workspace);
    return require('simple-git/promise')(folder);
}

async function initialiseRepo(sGit, context, workspace) {
    const workDirectory = getWorkingDir(workspace);
    const repoUrl = await getRepositoryUrl(context, workspace._id);
    await sGit.clone(repoUrl, workDirectory);
}

function sanitizeString(str) {
    str = str.replace(/[^a-z0-9\._-]/gim, "_");
    return str.trim();
}

module.exports.workspaceActions = [
    {
        label: 'Set GIT Repository URL',
        icon: 'fa-git',
        action: async (context, data) => {
            if (!data || !data.workspace || !data.workspace._id) {
                context.app.alert('Error reading workspace', 'Could not get workspace config');
                return;
            }
            let repoUrl = false;
            try {
                repoUrl = await context.app.prompt(
                    'Insert the GIT Repository URL for Workspace ' + data.workspace.name + ':',
                    {
                        defaultValue: await getRepositoryUrl(context, data.workspace._id),
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
            setRepositoryUrl(context, data.workspace._id, repoUrl);
        },
    },
    {
        label: 'Pull from GIT Repository',
        icon: 'fa-arrow-down',
        action: async (context, data) => {
            if (await checkForRepoUrl(context, data) === false) {
                return;
            }
            const sGit = getSimpleGit(data.workspace);
            const isGit = await sGit.checkIsRepo();
            if (!isGit) {
                initialiseRepo(sGit, context, data.workspace);
            }
            ;

            await sGit.pull('origin', 'master', ['--no-rebase']);
            // TODO git pull ?!
            const impFilename = getWorkingDir(data.workspace) + '/' + sanitizeString(data.workspace.name) + '.json';
            if (!fs.existsSync(impFilename)) {
                context.app.alert('Error importing', 'Seems there is no configuration within your repository that can be read! Push first!');
                return;
            }
            fs.readFile(impFilename, "utf8", function (err, fileContent) {
                context.data.import.raw(fileContent, {
                    workspaceId: data.workspace._id,
                });
            });

            context.app.alert('Succes!', 'Updated!');
        },
    },
    {
        label: 'Push to GIT Repository',
        icon: 'fa-arrow-up',
        action: async (context, data) => {
            if (await checkForRepoUrl(context, data) === false) {
                return;
            }
            const exp = await context.data.export.insomnia({
                includePrivate: true,
                format: 'json',
                workspace: data.workspace,
            });

            if (!exp) {
                return;
            }

            const sGit = getSimpleGit(data.workspace);
            const isGit = await sGit.checkIsRepo();
            if (!isGit) {
                initialiseRepo(sGit, context, data.workspace);
            }
            ;

            const expFilename = getWorkingDir(data.workspace) + '/' + sanitizeString(data.workspace.name) + '.json';
            fs.writeFileSync(expFilename, exp);
            await sGit.add(expFilename);
            await sGit.commit('Commit');
            await sGit.push('origin/master');

            context.app.alert('Succes!', 'Pushed to server!');
        },
    }
];
