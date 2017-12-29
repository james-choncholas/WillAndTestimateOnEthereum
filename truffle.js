module.exports = {
  networks: {
    development: {
      host: "localhost",
        port: 8545,
        network_id: "*"
    },
    ropsten:  {
      network_id: 3,
      host: "localhost",
      port:  8545,
      gas:   2900000
    },
    staging: {
      host: "localhost",
      port: 8546,
      network_id: 1337
    },
  }
};
