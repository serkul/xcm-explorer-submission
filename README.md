# XCM - explorer 

# Intro

Cross-Chain Messaging Passing (XCMP) is one of the key features of Polkadot/Kusama ecosystem. This tool, hopefully, can make it easier to track messages across Kusama and its parachains.
 
This project uses [SubQuery]( https://subquery.network/) to index XCM-related information from chains. This allows faster and more responsive querying in contrast to using polkadot.js/api. For now, only Kusama, Moonriver, Karura and Basilisk are indexed. The handler functions, used to populate databases, are generic for parachains (worth mentioning that all three use xTokens pallet). Information about which events/extrinsic are used is in [Tool logic section](#logic) section.

# Tool Funtionality
The querying is by address. The user needs to choose the chain and enter the account ID of interest. The search supports hexadecimal addresses as well as SS58 format. By default, the latest transaction on chosen chain are shown.

# Installation
The UI is build and deployed by running 

``` shell
npm install && npm run deploy
```
from ./frontend directory.
SubQuery projects need SubQuery CLI installed
```shell
npm install -g @subql/cli
```
There are one subdirectory "./subql/common" with common utils and four subdirectories for each chain. Each project is build independently
```shell
yarn install
yarn codegen
yarn build
```
However, since parachains use exactly the same handler functions, there is
```shell
yarn devbuild
```
which replaces all dependencies in the given project with ones from "./subql/common" and, in case of parachains, copies "mappingHandlers.ts" from "./subql/moonriver". This way the code edit doesn't need to be triplicated. Not particularly elegant solution, but it gets the job done :)
To run the project locally
```shell
 yarn start:docker
```
There is also
```shell
yarn remove:.data
``` 
which removes the database folder and kills postgres daemon in docker.

### <a name="logic"></a>Tool logic
Let us look at the relay chain first. The relay chain, Kusama, has Downward Message Passing (DMP) and Upward Message Passing (UMP). To filter for DMP, the two methods are used from "xcmPallet": "limitedReserveTransferAssets" and "ReserveTransferAssets". To filter for UMP, the extrinsic "paraInherent.enter" is used. The latter is searched for all not empty "upwardMessages". UPM hash can be read on the relay chain but not on the parachain. That is why a simple combination (amount + toAddress) is hashed on relay and para chains for UMP. The hashes are not unique anyway, so some additional filtering is needed if several messages with the same hash exists in the database. We use timestamp field in our GraphGL queries for this purpose. 

For parachains, event "xcmpQueue.XcmpMessageSent" filters for outbound HRMP and "xcmpQueue.Success" filters for inbound HRMP. These two have the XCMP hash. The rest of information is taken from "xTokens.transfer" for ountbound message and from "parachainSystem.setValidationData" for inbound message.