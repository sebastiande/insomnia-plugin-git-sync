const fs = require('fs');

class Workspace {
    importProject(context, data) {
        const impFilename = this.getWorkspaceFile(data);
        if (!fs.existsSync(impFilename)) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error importing',
                'Seems there is no configuration within your repository that can be read! Push first!');
            return false;
        }

        fs.readFile(impFilename, "utf8", function (err, fileContent) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.data.import.raw(fileContent, {
                workspaceId: data.workspace._id,
            });
        });

        return true;
    }

    async exportProject(context, data) {
        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures,JSUnresolvedFunction
        let exp = await context.data.export.insomnia({
            includePrivate: false,
            format: 'json',
            workspace: data.workspace,
        });

        // modify data to not have that much conflicts and fix environment imports
        exp = exp.replaceAll(data.workspace._id, '__WORKSPACE_ID__');
        const expObj = JSON.parse(exp);
        expObj.__export_date = '2021-10-03T17:27:43.046Z';
        expObj.__export_source = 'insomnia.desktop.app:v2021.6.0';
        for (let i = 0; i < expObj.resources.length; i++) {
            expObj.resources[i].modified = '1637671845661';
            if (expObj.resources[i]._type !== 'environment') {
                continue;
            }
            if (expObj.resources[i].parentId === '__WORKSPACE_ID__') {
                expObj.resources[i]._id = '__BASE_ENVIRONMENT_ID__';
                continue;
            }
            if (expObj.resources[i].parentId.startsWith('env_')) {
                expObj.resources[i].parentId = '__BASE_ENVIRONMENT_ID__';
            }
        }

        const expFilename = this.getWorkspaceFile(data);
        fs.writeFileSync(expFilename, JSON.stringify(expObj));
        return expFilename;
    }

    getWorkingDir(workspace) {
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

    /* helper methods */
    sanitizeString(str) {
        str = str.replace(/[^a-z0-9\._-]/gim, "_");
        return str.trim();
    }

    getWorkspaceFile(data) {
        return this.getWorkingDir(data.workspace) + '/workspace.json';
    }
}

module.exports = new Workspace();