class Settings {
    async get(key, context, scope) {
        return await context.store.getItem(key + '_' + scope) || false;
    }

    set(context, scope, key, value) {
        context.store.setItem(key + '_' + scope, value);
    }
}

module.exports = new Settings();