#! /usr/bin/env node

/* eslint no-useless-escape:off, func-names:off, generator-star-spacing:off */

import 'babel-polyfill';

import fs from 'fs';
import path from 'path';
// import co from 'co';
// import prompt from 'co-prompt';
import readline from 'readline';
import { MongoClient } from 'mongodb';

const METEOR_PATH = path.join(process.cwd(), '.meteor');
const DB_PORT_FILE_PATH = path.join(METEOR_PATH, 'local/db/METEOR-PORT');

if (!fs.existsSync(METEOR_PATH)) {
  console.error('Error: This is not a Meteor project directory.');
  process.exit(1);
}

if (!fs.existsSync(DB_PORT_FILE_PATH)) {
  console.log('Error: Make sure the app is running!');
}


const PORT = fs.readFileSync(DB_PORT_FILE_PATH, 'utf-8');

const DB_URL = `mongodb://localhost:${PORT}/meteor`;

const connectMongo = () => (
  new Promise((resolve, reject) => {
    MongoClient.connect(DB_URL, (error, db) => {
      if (error) {
        console.log(error);
        reject(error);
        process.exit(1);
      } else {
        resolve(db);
      }
    });
  })
);


/**
 * @function disconnectMongo
 *
 */
const disconnectMongo = (db) => {
  db.close();
};


const hyphenate = (str) => {
  const removeRegex = new RegExp(/['"\!\(\)\{\}.]+/, 'g');
  const replaceRegex = new RegExp(/[.\s,_:;!@&\(\)\+=\|/]+/, 'g');

  return str.trim()
    .replace(removeRegex, '')
    .replace(replaceRegex, '-');
};


const findOne = (collection, query) => (
  new Promise((resolve, reject) => {
    collection.findOne(query, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        console.log('Error: querying existing feature. See detais.', e);
        reject(e);
      }
    });
  })
);


const insertOne = (collection, doc) => (
  new Promise((resolve, reject) => {
    collection.insertOne(doc, (e, r) => {
      if (e) {
        reject(e);
      } else {
        resolve(r);
      }
    });
  })
);


const updateOne = (collection, query, doc) => (
  new Promise((resolve, reject) => {
    collection.updateOne(query, doc, (e, r) => {
      if (e) {
        reject(e);
      } else {
        resolve(r);
      }
    });
  })
);

const prompt = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
};

const insertUnique = async (collection, query, doc) => {
  let newDoc;
  let operationCompleted = false;
  const existingDoc = await findOne(collection, query);

  if (!existingDoc) {
    newDoc = await insertOne(collection, doc);
    operationCompleted = true;
  } else {
    /**
     * There'll be a possibility to update a feature's details.
     * Prompt user to override and based on respone, override
     * or throw operation not completed error
     */
    console.log();
    const yesOrNo = await prompt('Code name exists. Override? (Y/N): ');

    if (yesOrNo === 'Y') {
      newDoc = await updateOne(collection, query, doc);
      operationCompleted = true;
    }
  }

  return new Promise((resolve, reject) => {
    if (operationCompleted) {
      resolve(newDoc);
    } else {
      // eslint-disable-next-line no-underscore-dangle
      reject(new Error(`Feature already exists with _id: ${existingDoc._id}`));
    }
  });
  // connectMongo((db) => {
  //   const collection = db.collection('Features');

  //   findOneFeature(db, doc.codename, (r) => {
  //     if (r) {
  //       db.close();
  //       process.exit(1);
  //     } else {
  //       collection.insertOne(doc, (e, result) => {
  //         console.log(e, result);
  //         db.close();
  //       });
  //     }
  //   });
  //   collection.insertOne(doc, () => db.close());
  // });
};


export default {
  new() {
    const run = async () => {
      const featureName = await prompt('Code name: ');
      let routes = await prompt('Routes: ');
      const description = await prompt('Description: ');
      // let packages = yield prompt('package (default: all): ');

      const codeName = featureName.trim().replace(' ', '').toUpperCase();

      routes = routes.split(',').map(route => ({ path: route }));

      const doc = {
        routes,
        description,
        codename: codeName,
        scope: 'ROUTE',
        on: true,
        className: `ag-${hyphenate(featureName)}`,
      };

      console.log('New Doc', doc);


      /**
       * Initialize Mongo connection
       */
      const db = await connectMongo();
      const collection = db.collection('Features');

      try {
        const result = await insertUnique(collection, { codename: codeName }, doc);

        console.log('Result from unique insertion', result);
      } catch (err) {
        console.log('Error:', err.message);
      }

      // TODO: Add feature to specified package


      // close mongo connection
      disconnectMongo(db);
    };

    run();
  },
};

