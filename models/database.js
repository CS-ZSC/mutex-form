var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

var mongoURI = process.env.MONGO_URI;
var dataWarehouse = process.env.DWH_URI;
var collection = process.env.DB_COLLECTION;
var dwh_collection = process.env.DWH_COLLECTION;

exports.warehouse = {
  insertDoc: function(doc, callback) {
    MongoClient.connect(dataWarehouse, function(err, db) {
      if (err) {
        callback(err, db);
      } else {
        db.collection(dwh_collection).insertOne(doc, function(err, result) {
          if (err) {
            callback(err, db);
          } else {
            callback(null, db);
          }
        });
        db.close();
      }
    });
  }
};

exports.insertForm = function(user, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({email: user.email}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else if (doc) {
          callback('Already registered', db);
        } else {
          db.collection(collection).insertOne(user, function(err, result) {
            if (err) {
              callback(err, db);
            } else {
              callback(null, db, result.insertedId);
            }
          });
        }
      });
    }
  });
}

exports.getList = function(callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).find({}).toArray(function(err, docs) {
        if (err) {
          callback(err, db);
        } else {
            callback(null, db, docs);
        }
      });
    }
  });
}

exports.confirm = function(id, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else if (!doc) {
          callback("No document? and no error?", db);
        } else if (doc.confirmed == true) {
          callback('Already confirmed', db);
        } else {
          db.collection(collection).update({'_id': new ObjectId(id)}, {$set: {confirmed: true}}, function(err, count) {
            if (err) {
              callback(err, db);
            } else {
              callback(null, db);
            }
          });
        }
      });
    }
  });
}

exports.reconfirm = function(mail, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'email': mail}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else if (!doc) {
          callback('Not found', db);
        } if (doc.confirmed == true) {
          callback('Already confirmed', db);
        } else {
          callback(null, db, doc);
        }
      });
    }
  });
}

exports.getDoc = function(id, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else if (!doc) {
          callback('Not found', db);
        } else {
          callback(null, db, doc);
        }
      });
    }
  });
}

exports.updateDoc = function(id, field, value, callback) {
  MongoClient.connect(mongoURI, function(err, db) {
    if (err) {
      callback(err, db);
    } else {
      db.collection(collection).findOne({'_id': new ObjectId(id)}, function(err, doc) {
        if (err) {
          callback(err, db);
        } else {
          var update = {$set: {}};
          update['$set'][field] = value;
          db.collection(collection).update({'_id': new ObjectId(id)}, update, function(err, count) {
            if (err) {
              callback(err, db);
            } else {
              callback(null, db);
            }
          });
        }
      });
    }
  });
}
