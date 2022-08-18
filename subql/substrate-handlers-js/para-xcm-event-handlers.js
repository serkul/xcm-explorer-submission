fs = require("fs");

const { ApiPromise, WsProvider } = require("@polkadot/api");
const { blake2AsU8a, blake2AsHex } = require("@polkadot/util-crypto");
const { u8aToHex, stringToU8a, stringToHex } = require("@polkadot/util");
const { type } = require("os");
const {
  intructionsFromXcmU8Array,
} = require("./common/instructions-from-xcmp-msg-u8array");
const { parceXcmpInstrustions } = require("./common/parce-xcmp-instructions");
const { TextEncoder } = require("@polkadot/x-textencoder");
// const rpcProvider = "wss://rpc.polkadot.io";
// blockNumber = 1000;
// const rpcProvider = "wss://basilisk.api.onfinality.io/public-ws";
// const blockNumber = 1308160;
// const rpcProvider = "wss://karura.api.onfinality.io/public-ws";
// const blockNumber = 1037020;
// 1702399; //outbound
// 1702412; //inbound
// const rpcProvider = "wss://kusama-rpc.polkadot.io/";
// const blockNumber = 12034825;
const rpcProvider = "wss://moonriver.api.onfinality.io/public-ws";
// const rpcProvider = "wss://moonriver.public.blastapi.io";
const blockNumber = 2103854;
//1655240; // // (outbound)
// 1655170; //(inbound)
// 1652961;
// 1655182;
// 1655874; //dmp
// 1655886; //ump
// 1655182; //ump not AccountId32 X2
// error blocks
// 1656386; //not ump
// 1655989; //x2
// 1655525; not ump
// const rpcProvider = "wss://basilisk.api.onfinality.io/public-ws";
// const blockNumber = 1400000;

const chainIDs = {
  Karura: "2000",
  Moonriver: "2023",
};
// We must wrap everything up in an async block
async function main() {
  // Connect to a node (this is ak public one)
  const provider = new WsProvider(rpcProvider);
  const api = await ApiPromise.create({ provider });

  // Make a call to the chain and get its name.
  const chain = await api.rpc.system.chain();
  // Print out the chain to which we connected.
  console.log(`You are connected to ${chain} !`);
  //   //Store chain methadata and its version in a file
  // logChainMethadata(api);

  // Get block hash
  const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  // Get block by hash
  const signedBlock = await api.rpc.chain.getBlock(blockHash);

  // Get a decorated api instance at a specific block
  const apiAt = await api.at(signedBlock.block.header.hash);

  const allBlockEvents = await apiAt.query.system.events();
  const allBlockExtrinsics = signedBlock.block.extrinsics;

  transfer = {
    // id: ID! #id is a required field
    blockNumber: blockNumber,
    timestamp: "",
    fromAddress: "",
    fromParachainId: "",
    toAddress: "",
    toParachainId: "",
    assetParachainId: "",
    assetId: [],
    amount: [],
    xcmpMessageStatus: "", //change to union for threes statuses: sent, received, notfound
    xcmpMessageHash: "",
    warnings: "",
  };

  // const dmpQuery = await apiAt.query.dmp.downwardMessageQueues(2023);
  // await handleDmpParaEvent(
  //   apiAt,
  //   allBlockEvents,
  //   allBlockExtrinsics,
  //   chainIDs,
  //   transfer
  // );
  // await handleUmpParaEvent(
  //   apiAt,
  //   allBlockEvents,
  //   allBlockExtrinsics,
  //   chainIDs,
  //   transfer
  // );

  // console.log(transfer);

  const xcmpExtrinsicsWithEvents = mapXcmpEventsToExtrinsics(
    allBlockExtrinsics,
    allBlockEvents
  );
  if (xcmpExtrinsicsWithEvents.length < 1) {
    transfer.warnings += " - no xcmpQueue.<events> are found";
  } else if (xcmpExtrinsicsWithEvents.length > 2) {
    transfer.warnings += " - more than one xcmpQueue.<events> are found";
  } else {
    transfer.xcmpMessageStatus = xcmpExtrinsicsWithEvents[0].status;
    transfer.xcmpMessageHash = xcmpExtrinsicsWithEvents[0].hash;

    switch (xcmpExtrinsicsWithEvents[0].status) {
      case "received":
        console.log("received");
        await decodeInboundXcmp(xcmpExtrinsicsWithEvents[0], apiAt, transfer);
        break;
      case "sent":
        console.log("sent");

        await decodeOutboundXcmp(
          xcmpExtrinsicsWithEvents[0],
          apiAt,
          chainIDs,
          transfer
        );
        break;
    }
    console.log(transfer);
  }

  // console.log(await api.registry.getChainProperties());
  // console.log(api.registry.chainDecimals);
  // console.log(api.registry.chainSS58);
  // console.log(api.registry.chainTokens);
  // console.log(api.call.parachainHost.dmqContents);

  // xcmExtrinsicsWithEvents[0].events.forEach(({ event }) => {
  //   if (event.section == "xTokens" && event.method == "Transferred") {
  //     const types = event.typeDef;
  //     event.data.forEach((data, index) => {
  //       console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
  //     });
  //   }
  // });
  // const xcmpMessageSent = [];
  // xcmExtrinsicsWithEvents[0].events.forEach(({ event }) => {
  //   if (event.section == "xcmpQueue" && event.method == "XcmpMessageSent") {
  //     const types = event.typeDef;
  //     event.data.forEach((data, index) => {
  //       xcmpMessageSent.push({
  //         type: types[index].type,
  //         data: data.toString(),
  //       });
  //     });
  //   }
  // });

  // Exit the process.
}

main()
  .catch(console.error)
  .finally(() => process.exit());

function logChainMethadata(api) {
  const runtimeVersion = api.runtimeVersion;
  const runtimeMetadata = api.runtimeMetadata;
  const logFile =
    "runtime-metadata-" +
    runtimeVersion.implName.toString() +
    "-" +
    runtimeVersion.authoringVersion.toString() +
    "-" +
    runtimeVersion.specVersion.toString() +
    "-" +
    runtimeVersion.implVersion.toString() +
    ".json";
  console.log(`logging RUNTIME VERSION and RUNTIME METADATA
    to file ${logFile}`);
  fs.writeFileSync(logFile, JSON.stringify(runtimeVersion, null, 2), "utf-8");
  fs.appendFileSync(logFile, JSON.stringify(runtimeMetadata, null, 2), "utf-8");
}

function mapXcmpEventsToExtrinsics(allBlockExtrinsics, allBlockEvents) {
  // Function takes all extrinsics and events in a block
  // searches for events with "xcmpQueue" section (seems to be the most universal way to filter for xcmp events),
  // puts corresponding extrinsic and all its events in an object,
  // together with xcmp message hash and status (received, sent and unknown).
  // This object is pushed in an array.This array is returned by the function, array contains
  // as many elements as many xcmpQueue.events are found in a block

  const xcmpExtrinsicsWithEvents = [];
  let xcmpStatus = "unknown";
  let xcmpHash = "unknown";
  allBlockExtrinsics.forEach((extrinsic, index) => {
    // filter the specific events based on the phase and then the
    // index of our extrinsic in the block
    const events = allBlockEvents.filter(
      ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
    );
    events.forEach(({ event }) => {
      if (event.section == "xcmpQueue") {
        if (event.method == "XcmpMessageSent") {
          xcmpStatus = "sent";
          xcmpHash = event.data[0].toString();
        } else if (event.method == "Success") {
          xcmpStatus = "received";
          xcmpHash = event.data[0].toString();
        }
        xcmpExtrinsicsWithEvents.push({
          extrinsic: extrinsic,
          events: events,
          status: xcmpStatus,
          hash: xcmpHash,
        });
      }
    });
  });
  return xcmpExtrinsicsWithEvents;
}

async function handleDmpParaEvent(
  apiAt,
  allBlockEvents,
  allBlockExtrinsics,
  chainIDs,
  transfer
) {
  const dmpParaEvent = allBlockEvents.filter(
    ({ event }) =>
      event.section == "dmpQueue" && event.method == "ExecutedDownward"
  )[0];
  transfer.xcmpMessageHash = dmpParaEvent.event.data[0].toString(); //subql gives event directly, no phase?
  const dmpParaExtrinsic = allBlockExtrinsics.filter(
    ({ method }) =>
      method.section == "parachainSystem" &&
      method.method == "setValidationData"
  )[0];
  dmpParaExtrinsic.method.args[0].downwardMessages.forEach(
    ({ sentAt, msg }) => {
      const messageHash = blake2AsHex(Uint8Array.from(msg));
      if (messageHash == transfer.xcmpMessageHash) {
        const instructions = intructionsFromXcmU8Array(msg, apiAt);
        if (typeof instructions == "string") {
          transfer.warnings += instructions;
        } else {
          parceXcmpInstrustions(instructions, transfer);
        }
      }
    }
  );

  // get assets issue event
  const assetsIssueEvents = allBlockEvents.filter(
    (el) => el.event.section == "assets" && el.event.method == "Issued"
  );
  // assetsIssueEvents.forEach(({ event }) => {
  //   console.log(event.toHuman().data.owner);
  //   if (event.toHuman().data.owner.toLowerCase() === transfer.toAddress) {
  //     console.log(event.toHuman().data.totalSupply);
  //     console.log(event.toHuman().data.assetId);
  //   }
  // });

  // allBlockExtrinsics.forEach((el) => console.log(el.toHuman()));
}

async function handleUmpParaEvent(
  apiAt,
  allBlockEvents,
  allBlockExtrinsics,
  chainIDs,
  transfer
) {
  const umpParaEvent = allBlockEvents.filter(
    ({ event }) => event.section == "xTokens" && event.method == "Transferred"
  )[0];
  console.log(event);
  const [sender, currencyId, amount, dest] = umpParaEvent.event.data
    .toJSON()
    .values();
  // const { sender, currencyId, amount, dest } =
  //   umpParaEvent.event.data.toHuman();
  console.log(dest);
  transfer.fromAddress = sender;
  // transfer.assetId = currencyId.OtherReserve;
  // transfer.amount = amount.replace(/,/g, "");
  // [transfer.toParachainId, transfer.toAddress] = parceInterior(dest.interior);

  //  = dest.interior.X1.AccountId32.id
  // ?? dest.interior.X1?.AccountId32.id;
  transfer.xcmpStatus = "ump sent";
  // calculate "custom" hash for UMP due to lack ot the "real" one
  // as well as the byte representation of XCMP message

  transfer.xcmpMessageHash = blake2AsHex(
    new Uint8Array([
      ...new TextEncoder().encode(amount),
      ...new TextEncoder().encode(JSON.stringify(dest.interior, undefined, 0)),
    ])
  );
}

async function decodeOutboundXcmp(
  xcmpExtrinsicWithEvents,
  apiAt,
  chainIDs,
  transfer
) {
  transfer.fromParachainId = (
    await apiAt.query.parachainInfo.parachainId()
  ).toString();
  switch (transfer.fromParachainId) {
    case chainIDs.Karura:
      xcmpExtrinsicWithEvents.events.forEach(({ event }) => {
        if (
          event.section == "xTokens" &&
          event.method == "TransferredMultiAssets"
        ) {
          const [account, otherReserve, amount, extra] = event.data
            .toJSON()
            .values();
          // const { account, otherReserve, amount, extra } = event.data.toJSON();
          //ts as any
          // console.log(amount.id.concrete.interior.x2);

          transfer.amount = amount.fun.fungible.toString();
          transfer.toAddress = extra.interior.x2[1].accountKey20.key;
          transfer.fromAddress = account;
          transfer.toParachainId = extra.interior.x2[0].parachain.toString();
          transfer.assetParachainId =
            amount.id.concrete.interior.x2[0].parachain.toString();
          transfer.assetId = amount.id.concrete.interior.x2[1].generalKey;
        }
      });
      break;
    case chainIDs.Moonriver:
      xcmpExtrinsicWithEvents.events.forEach(({ event }) => {
        if (event.section == "xTokens" && event.method == "Transferred") {
          // console.log(event.data.toHuman());
          // const [account, otherReserve, amount, extra] = event.data.toHuman();
          const [sender, currencyId, amount, dest] = event.data
            .toJSON()
            .values();
          console.log(event.data.toHuman());
          console.log(sender, currencyId, amount, dest);
          console.log(dest.interior);
          // if (multiAssetsTrue) {
          //   transfer.assetId.push(
          //     JSON.stringify(currencyId[0].id.concrete.interior, undefined, 0)
          //   );
          //   transfer.amount.push(currencyId[0].fun.fungible);
          // } else {
          //   transfer.assetId.push(JSON.stringify(currencyId, undefined, 0));
          //   transfer.amount.push(amount.toString().replace(/,/g, ""));
          // }
          transfer.amount.push(amount.toString().replace(/,/g, ""));
          transfer.toAddress = dest.interior.x2[1].accountId32.id;
          transfer.fromAddress = sender;
          transfer.toParachainId = dest.interior.x2[0].parachain;
          transfer.assetParachainId = "NA";
          // console.log(otherReserve.selfReserve.toString());
          if (currencyId.otherReserve) {
            transfer.assetId = currencyId.otherReserve.toString();
          } else {
            transfer.assetId = "null";
          }
        }
      });
      break;
    default:
      transfer.warnings +=
        " - decodeOutboundXcmp format is not known for parachain: " +
        transfer.fromParachainId;
  }
}
async function decodeInboundXcmp(xcmpExtrinsicWithEvents, apiAt, transfer) {
  transfer.toParachainId = (
    await apiAt.query.parachainInfo.parachainId()
  ).toString();
  xcmpExtrinsicWithEvents.extrinsic.method.args[0].horizontalMessages.forEach(
    (paraMessage, paraId) => {
      if (paraMessage.length >= 1) {
        paraMessage.forEach((message) => {
          // const messageHash = u8aToHex(
          //   blake2AsU8a(message.data.slice(1))
          // );
          const messageHash = blake2AsHex(
            Uint8Array.from(message.data).slice(1)
          );
          if (messageHash == transfer.xcmpMessageHash) {
            transfer.fromParachainId = paraId.toString();
            // let instructions = api.createType(
            let instructions = apiAt.registry.createType(
              "XcmVersionedXcm",
              message.data.slice(1)
            ); //ts as any

            // choose appropriate xcm version
            let asVersion = "not found";
            for (const versionNum of ["0", "1", "2"]) {
              if (instructions["isV" + versionNum]) {
                asVersion = "asV" + versionNum;
              }
            }
            if (asVersion === "not found") {
              transfer.warnings += " - xcmp version not found";
            }

            instructions[asVersion].forEach((instruction) => {
              console.log(instruction.toHuman());
              switch (transfer.toParachainId) {
                case chainIDs.Moonriver:
                  if (instruction.isReserveAssetDeposited) {
                    console.log();
                    transfer.amount = instruction
                      .toHuman()
                      .ReserveAssetDeposited[0].fun.Fungible.toString();
                    transfer.assetParachainId = instruction
                      .toHuman()
                      .ReserveAssetDeposited[0].id.Concrete.interior.X2[0].Parachain.toString();
                    transfer.assetId =
                      instruction.toHuman().ReserveAssetDeposited[0].id.Concrete.interior.X2[1].GeneralKey;
                  }
                  // if (instruction.isBuyExecution) { //contains weight limit and asset ID
                  //   console.log(
                  //     instruction.toHuman().BuyExecution.fees.id.Concrete.interior.X2
                  //   );
                  // }
                  if (instruction.isDepositAsset) {
                    console.log(
                      instruction.toHuman().DepositAsset.beneficiary.interior
                    );

                    transfer.toAddress =
                      instruction.toHuman().DepositAsset.beneficiary.interior.X1.AccountKey20.key;
                  }
                  break;
                case chainIDs.Karura:
                  // console.log(instruction.toHuman());
                  if (instruction.isWithdrawAsset) {
                    transfer.amount = instruction
                      .toHuman()
                      .WithdrawAsset[0].fun.Fungible.toString();
                    transfer.assetParachainId = "NA";
                    transfer.assetId =
                      instruction.toHuman().WithdrawAsset[0].id.Concrete.interior.X1.GeneralKey;
                  }
                  // // if (instruction.isBuyExecution) { //contains weight limit and asset ID
                  // // }
                  if (instruction.isDepositAsset) {
                    transfer.toAddress =
                      instruction.toHuman().DepositAsset.beneficiary.interior.X1.AccountId32.id;
                  }

                  break;
                default:
                  transfer.warnings +=
                    " - decodeInboundXcmp format is not known for parachain: " +
                    transfer.fromParachainId;
              }
            });
          }
        });
      }
    }
  );
}

function parceInterior(interior) {
  let numOfJunctions;
  let toChainId;
  let innerLocation;
  let toAddress;
  [1, 2, 3, 4, 5].forEach((num) => {
    if (interior.hasOwnProperty("X" + `${num}`)) {
      numOfJunctions = num;
    }
  });
  if (numOfJunctions == 1) {
    toChainId = "0"; //relay chain
    innerLocation = interior["X" + `${numOfJunctions}`];
  } else {
    console.log(numOfJunctions);
    toChainId =
      interior["X" + `${numOfJunctions}`][numOfJunctions - 2].Parachain;
    innerLocation = interior["X" + `${numOfJunctions}`][numOfJunctions - 1];
  }
  toChainId = toChainId.replace(/,/g, "");
  toAddress = innerLocation.AccountId32?.id ?? innerLocation.AccountKey20.key;
  return [toChainId, toAddress];
}
