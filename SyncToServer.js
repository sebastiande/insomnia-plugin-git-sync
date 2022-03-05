const Sync = require('./Sync');

class SyncToServer {
    async push(context, data, expFilename) {
        const sGit = Sync.getSimpleGit(context, data.workspace);
        try {
            await sGit.add(expFilename);
            await sGit.commit('Commit');
            await sGit.push();
        } catch(error) {
            console.error(error);
            await this.handleError(error, sGit, context);
            return;
        }

        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
        context.app.alert('Success!', 'Pushed to server.');
    }

    async handleError(error, sGit, context) {
        if (!error.message.includes('CONFLICT')) {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            context.app.alert('Error!', 'Could not update the project, more information can be found in console!');
            return;
        }

        // TODO as soon as there is an api from insomnia for yes/now dialogs we should switch to it
        if (confirm('There are conflicts, do you want to overwrite the server version with your local one?')) {
            sGit.push(['-f'], () => {
                // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
                context.app.alert('Finished', 'Server version got overwritten with your local one.');
            });
        }
    }
}

module.exports = new SyncToServer();