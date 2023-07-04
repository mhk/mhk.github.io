(function(database, undefined) {
    database.db = new PouchDB('cardData');
    let dbSync = undefined;

    /********************************************
     *               Public Methods             *
     ********************************************/

    database.changeDbUrl = (syncWorking, syncError) => {
        const remoteCouch = settings.options.dbUrl.get();
        if(undefined !== dbSync) {
            dbSync.cancel();
            dbSync = undefined;
        }
        // no check needed as sync already checks
        sync(syncWorking, syncError);
    }
    database.resolveConflicts = () => {
        return database.db.allDocs({include_docs: true, conflicts: true})
            .then(response => Promise.all(response.rows
                .filter(r => r.doc._conflicts !== undefined)
                .map(r => database.db.resolveConflicts(r.doc, resolveCardConflict)))
            ).then(conflicts => {
                if(conflicts.length > 0) {
                    console.log('Resolved conflicts for:');
                    console.log(conflicts);
                } else {
                    console.log('No conflicts');
                }
            });
    }

    /********************************************
     *              Private Methods             *
     ********************************************/

    function sync(syncWorking, syncError) {
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

    function resolveCardConflict(a, b) {
        // take version that was more recently viewed
        if(a.fsrsCard.last_review > b.fsrsCard.last_review) return a
        if(a.fsrsCard.last_review < b.fsrsCard.last_review) return b
        // take version with high difficulty
        if(a.fsrsCard.difficulty > b.fsrsCard.difficulty) return a
        if(a.fsrsCard.difficulty < b.fsrsCard.difficulty) return b
        // take version with lower stability
        if(a.fsrsCard.stability < b.fsrsCard.stability) return a
        if(a.fsrsCard.stability > b.fsrsCard.stability) return b
        return a;
    }


    database.db.info(function(err, info) {
        database.db.changes({since: info.update_seq, continuous: true});
    });
}(window.database = window.database || {}));
