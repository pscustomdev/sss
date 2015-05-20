Setting up SSS on the host

1) Checkout code
2) npm install
3) Set DEBUG=sss in the OS environment
4) Install MongoDB
   * Put mongo bin in to the path:  C:\Program Files\MongoDB\Server\3.0\bin
   * Create c:\data\db
   * Run: mongod --nojournal
   * Run: mongo
      - use sss  (this will create the sss database)
      
5) 