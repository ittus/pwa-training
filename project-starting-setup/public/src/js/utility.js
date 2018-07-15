var dbPromise =  idb.open('posts-store', 1, function(db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
})

function writeData(st, data) {
  return dbPromise.then(db => {
    var tx = db.transaction(st, 'readwrite');
    var store = tx.objectStore(st);
    store.put(data);
    return tx.complete;
  })
}
