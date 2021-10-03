const fs = require('fs');

class Workspace {
    importProject(context, data) {
        const impFilename = this.getWorkspaceFile(data);
        if (!fs.existsSync(impFilename)) {
            context.app.alert('Error importing',
                'Seems there is no configuration within your repository that can be read! Push first!');
            return false;
        }

        fs.readFile(impFilename, "utf8", function (err, fileContent) {
            context.data.import.raw(fileContent, {
                workspaceId: data.workspace._id,
            });
        });

        return true;
    }

    async exportProject(context, data) {
        const exp = await context.data.export.insomnia({
            includePrivate: false,
            format: 'json',
            workspace: data.workspace,
        });

        // modify data to not have that much conflicts
        const expObj = JSON.parse(exp);
        expObj.__export_date = '2021-10-03T17:27:43.046Z';

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
        return this.getWorkingDir(data.workspace) + '/' + this.sanitizeString(data.workspace.name) + '.json';
    }
}

module.exports = new Workspace();