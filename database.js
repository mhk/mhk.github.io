let db = new PouchDB('cardData');

function changeDbUrl(event) {
    const remoteCouch = settings.options.dbUrl.get();
    if(undefined !== dbSync) {
        dbSync.cancel();
        dbSync = undefined;
    }
    // no check needed as sync already checks
    sync();
}
function sync() {
    // TODO: use 'changes' and on('change', x => x)
    const remoteCouch = settings.options.dbUrl.get();
    if('' === remoteCouch || undefined === remoteCouch) return ;
    const remote = new PouchDB(remoteCouch);
    dbSync = db.sync(remote, {
        live: true,
        retry: true
    });
    dbSync.on('paused', msg => {
        remote.info()
          .then(info => syncWorking())
          .catch(err => syncError());
    });
}

db.info(function(err, info) {
    db.changes({since: info.update_seq, continuous: true});
});
