
export default {
  up: (db) => {
    console.log('up users 1.2');

    db.collection('users')
      .updateMany(
        {},
        {
          $rename: { firstName: 'name' },
        }, { multi: true }
      );
  },
  down: (db) => {
    console.log('down users 1.2');

    db.collection('users')
      .updateMany(
        {},
        {
          $rename: { name: 'firstName' },
        }, { multi: true }
      );
  }
};
