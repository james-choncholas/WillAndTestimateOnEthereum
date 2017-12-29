# Living Will and Testimate on the Blockchain

This contract serves as a living will. This eliminates the need
for a mechanism to share private keys with third parties with the purpose
of distributing wealth after one's death.

## Wealth Accumulation Phase
Owner deploys this contract and stores value (ether) to be passed down when they die.
The contracts owner sets a list of beneficiaries what percentage of the contracts
wealth they may collect. No funds may be withdrawn from the contract during this phase.

## Wealth Dissemination Phase 
In order for wealth to be collected, one of the beneficiaries must send a deposit equal to 1% of 
the contracts total wealth to the "BeginDissemination" function. This triggers a 
30 day waiting period during which the owner of the contract may cancel 
wealth dissemination. If the owner cancels the dissemination the deposit is added to the wealth
of the contract, not to be returned to sender. However if the waiting period is not cancelled
by the owner, beneficiaries are allowed to collect their share of the wealth.
No funds may be sent to the contract during this phase.

## Notes
The utility of this contract is dependant on the ability of ethereum to store value. If
ethereum does not appreciate over time, or is not stable enough to store value, this contract
doesn't make sense!
<br><br>
This contract uses the withdrawal design pattern to help prevent re-entrancy attacks.

