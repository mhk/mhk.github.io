(function(database, undefined) {
    database.db = new PouchDB('cardData');
    let dbSync = undefined;

    /********************************************
     *               Public Methods             *
     ********************************************/

    database.changeDbUrl = (event = undefined) => {
        const remoteCouch = settings.options.dbUrl.get();
        if(undefined !== dbSync) {
            dbSync.cancel();
            dbSync = undefined;
        }
        // no check needed as sync already checks
        sync();
    }

    /********************************************
     *              Private Methods             *
     ********************************************/

    function sync() {
        // TODO: use 'changes' and on('change', x => x)
        const remoteCouch = settings.options.dbUrl.get();
        if('' === remoteCouch || undefined === remoteCouch) return ;
        const remote = new PouchDB(remoteCouch);
        dbSync = database.db.sync(remote, {
            live: true,
            retry: true
        });
        dbSync.on('paused', msg => {
            remote.info()
                .then(info => syncWorking())
                .catch(err => syncError());
        });
    }

    database.db.info(function(err, info) {
        database.db.changes({since: info.update_seq, continuous: true});
    });
}(window.database = window.database || {}));
