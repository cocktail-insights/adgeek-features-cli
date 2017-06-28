#! /usr/bin/env node

/* eslint-disable */

import program from 'commander';
import Features from './features';


// main command line prompts
program
  .arguments('<option>')
  .action((option) => {
    console.log('Arguments', option);
    if (option) {
      Features[option]();
    }
  })
  .parse(process.argv);
