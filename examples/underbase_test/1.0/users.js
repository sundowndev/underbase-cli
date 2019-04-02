
export default {
  up: (db) => {
    db.collection('users')
      .updateMany(
        {},
        {
          $unset: { isAdmin: 1 },
        }, { multi: true }
      );
  },
  down: (db) => {
    db.collection('users')
      .updateMany(
        {},
        {
          $set: { isAdmin: false },
        }, { multi: true }
      );
  }
};
