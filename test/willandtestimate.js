var WillAndTestimate = artifacts.require("./WillAndTestimate.sol");


const timeTravel = function (time) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [time], // 86400 is num seconds in day
      id: new Date().getTime()
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

const mineBlock = function () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_mine",
      id: 12345
    }, (err, result) => {
      if(err){ return reject(err) }
      return resolve(result)
    });
  })
}

contract('WillAndTestimate', function(accounts) {

    console.log(accounts);
    var owner_account = accounts[0];
    var beneficiary1 = accounts[1];
    var beneficiary2 = accounts[2];
    var outsider = accounts[3];


    it("should accept sent funds when the Will is Living", async function() {
        let myContract = await WillAndTestimate.new({from: owner_account});
        await myContract.sendTransaction({ from: owner_account, value: web3.toWei(1, "ether")});

        let firstBalance = await web3.eth.getBalance(myContract.address);
        assert.equal(firstBalance.toNumber(), web3.toWei(1, "ether"), "Owner could not send funds to contract");

        await myContract.sendTransaction({ from: outsider, value: web3.toWei(1, "ether")});
        let secondBalance = await web3.eth.getBalance(myContract.address);

        assert.equal(secondBalance.toNumber(), web3.toWei(2, "ether"), "Outsider could not send funds to contract");
    });


    it("Should prevent premature beneficiary collection", async function() {
        // setup the contract with funds and beneficiaries
        let myContract = await WillAndTestimate.new({from: owner_account});
        await myContract.sendTransaction({ from: owner_account, value: web3.toWei(1, "ether")});
        await myContract.SetBeneficiaries( [ beneficiary1, beneficiary2 ], [40, 60], {from: owner_account} );

        var reverted = false;
        try {
            await myContract.Collect({from: beneficiary1});
        } catch(e) {
            reverted = true;
        }
        if(!reverted)
            throw new Error("Beneficiary collected funds prematurely");

        let balance = await web3.eth.getBalance(myContract.address);
        assert.equal(balance.toNumber(), web3.toWei(1, "ether"), "Beneficiary collected funds while the Will was Living");
    });


    it("should allow the owner to cancel a Dissemination state change", async function() {
        // setup the contract with funds and beneficiaries
        let myContract = await WillAndTestimate.new({from: owner_account});
        await myContract.sendTransaction({ from: outsider, value: web3.toWei(1, "ether")});
        await myContract.SetBeneficiaries( [beneficiary1, beneficiary2], [40, 60], {from: owner_account} );

        // start the dissemination process with beneficiary account
        await myContract.BeginDissemination({from: beneficiary1, value: web3.toWei(.02, "ether") });

        // cancel the dissemination process from the owner account
        await myContract.CancelDissemination({from: owner_account});

        var reverted = false;
        try {
            await myContract.Collect({from: beneficiary1});
        } catch(e) {
            reverted = true;
        }
        if(!reverted)
            throw new Error("Beneficiary collected funds prematurely");

        let balance = await web3.eth.getBalance(myContract.address);
        assert.equal(balance.toNumber(), web3.toWei(1.01, "ether"), "Beneficiary collected funds while the Will was Living");
    });


    it("should disseminate funds", async function() {
        // ~1 ether. Not a round number on purpose
        var sum = 1754893023498573877;

        // setup the contract with funds and beneficiaries
        let myContract = await WillAndTestimate.new({from: owner_account});
        await myContract.sendTransaction({ from: outsider, value: sum});
        await myContract.SetBeneficiaries( [ beneficiary1, beneficiary2 ], [43, 57], {from: owner_account} );

		// begin dissemination with a higher than necessary deposit
        let preCollectBalance = await web3.eth.getBalance(beneficiary1);
        await myContract.BeginDissemination({from: beneficiary1, value: sum / 90});

        await timeTravel(86400 * 60); //60 days later
        await mineBlock(); // workaround for https://github.com/ethereumjs/testrpc/issues/336

        //console.log("" + await web3.eth.getBalance(myContract.address));

		// collect beneficiary1's inheritance
        await myContract.Collect({from: beneficiary1});
        assert.equal(await web3.eth.getBalance(myContract.address).toNumber(), sum / 100 * 57, "Beneficiary1 did not get all of it's inheritance");

        // collect beneficiary2's inheritance
        await myContract.Collect({from: beneficiary2});
        assert.equal(await web3.eth.getBalance(myContract.address).toNumber(), 0, "Beneficiary2 did not get all of it's inheritance");
    });
});
