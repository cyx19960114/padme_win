### Eval

This folder contains the needed data/scripts for the eval setup. 
The following is contained: 

- eval.ttl -> Turtle file with the eval database schemas, relies on the workingdata.ttl file from the development folder
- docker-compose -> The compose file for the setup of the postgres DB on Klee and Bruegel
- bruegel.sql -> SQL script for initializing the real Postgres DB on Bruegel with 1000 entries per table, contains 497 patients >= 50
- klee.sql -> Same as bruegel.sql but for klee, contains 503 patients >= 50
