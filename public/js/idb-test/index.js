import idb from 'idb';

var dbPromise = idb.open('test-db', 5, function(upgradeDb) {
  switch(upgradeDb.oldVersion) {
    case 0:
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put("world", "hello");
    case 1:
      upgradeDb.createObjectStore('people', { keyPath: 'name' });

    case 3:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('animal', 'favoriteAnimal');

    case 4:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('age', 'age');
  }
  
});

// read "hello" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');
  return keyValStore.get('hello');
}).then(function(val) {
  console.log('The value of "hello" is:', val);
});

// set "foo" to be "bar" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('bar', 'foo');
  return tx.complete;
}).then(function() {
  console.log('Added foo:bar to keyval');
});

dbPromise.then(function(db) {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('Dog', 'favoriteAnimal');
  return tx.complete;
}).then(() => {
  console.log('favorite animal added');
});


dbPromise.then(function(db) {
  var tx = db.transaction('people', 'readwrite');
  let peopleStore = tx.objectStore('people');
  peopleStore.put({
    name: "Jackson",
    age: 12,
    favoriteAnimal: 'Horse'
  });

  peopleStore.put({
    name: "MaryAnn",
    age: 18,
    favoriteAnimal: 'Cat'
  });

  peopleStore.put({
    name: "Ogogoh",
    age: 23,
    favoriteAnimal: 'Rabbit'
  });

  peopleStore.put({
    name: "Femi",
    age: 23,
    favoriteAnimal: 'Rabbit'
  });

  return tx.complete;
}).then(() => {
  console.log('People have been written to the store');
});


dbPromise.then((db) => {
  let tx = db.transaction('people');
  let peopleStore = tx.objectStore('people');
  let animalIndex = peopleStore.index('animal')
  let ageIndex = peopleStore.index('age')

  return ageIndex.getAll();
}).then((data) => {
  console.log('People sorted by age: ', data);
});  


//make use of cursor

dbPromise.then((db) => {
  let tx = db.transaction('people');
  let peopleStore = tx.objectStore('people');
  let ageIndex = peopleStore.index('age')

  return ageIndex.openCursor();
})
.then((cursor) => {
  if(!cursor) return;
  return cursor.advance(2)
})
.then(function logPerson(cursor) {
  if(!cursor) return;
  console.log('Cursor at: ', cursor.value.name);
  return cursor.continue().then(logPerson);
}).then(() => {
  console.log('cursor iteration completed');
});