#! /usr/bin/env node

/* eslint-disable */

import program from 'commander';
import Features from './features';


// main command line prompts
program
  .usage('<command> [codename] [toggle]')
  .arguments('<command...>')
  .action(([ set, codename, toggle ]) => {
    if (Features[set]) {
      Features[set]({ codename, toggle });
    } else {
      console.log('Error: Invalid argument');
    }
  });

program.on('--help', () => {
  console.log();
  console.log('  Commands:');
  console.log();
  console.log('    list   Show all available features');
  console.log('    new    Create a new feature');
  console.log();
  console.log('  Examples:');
  console.log();
  console.log('    $ ag-feature list');
  console.log();
});

program.parse(process.argv);
