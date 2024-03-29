import { SubstrateEvent } from "@subql/types";
import { XCMTransfer } from "../types";
import { blake2AsHex } from "@polkadot/util-crypto";
import { intructionsFromXcmU8Array } from "../common/instructions-from-xcmp-msg-u8array";
import { parceXcmpInstrustions } from "../common/parce-xcmp-instructions";
import { TextEncoder } from "@polkadot/x-textencoder";
import { getSS58AddressForChain } from "../common/get-ss58-address";
import { parceInterior, chainIdFromInterior } from "../common/parce-interior";

export async function handleUmpParaEvent(event: SubstrateEvent): Promise<void> {
  const xcmpMessageSentEvent: any[] = event.block.events.filter(
    (el) =>
      el.event.section == "xcmpQueue" && el.event.method == "XcmpMessageSent"
  );
  // Skip handling event, because it is handled in handleXcmpQueueModule
  if (!(xcmpMessageSentEvent.length > 0)) {
    const transfer = XCMTransfer.create({
      id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
      warnings: "",
      assetId: [],
      amount: [],
      toAddress: "",
      toParachainId: "",
    });
    transfer.blockNumber = event.block.block.header.number.toBigInt();
    transfer.timestamp = event.block.timestamp.toISOString();
    transfer.xcmpMessageStatus = "UMP sent";

    const umpEvent: any = event.block.events[event.idx];
    const [sender, currencyId, amount, dest] = umpEvent.event.data
      .toJSON()
      .values() as any;
    const multiAssetsTrue =
      event.block.events[event.idx].event.method == "TransferredMultiAssets";
    parcexTokenTransfer(
      sender,
      currencyId,
      amount,
      dest,
      multiAssetsTrue,
      transfer
    );

    transfer.fromParachainId = (await api.query.parachainInfo.parachainId())
      .toString()
      .replace(/,/g, "");
    transfer.toParachainId = "0"; //always kusama

    // calculate "custom" hash for UMP due to lack ot the "real" one
    transfer.xcmpMessageHash = blake2AsHex(
      new Uint8Array([
        ...new TextEncoder().encode(
          JSON.stringify(transfer.amount, undefined, 0)
        ),
        ...new TextEncoder().encode(transfer.toAddress),
      ])
    );

    // calculate SS58 addresses for given chains
    const [ansFrom, addressFrom] = getSS58AddressForChain(
      transfer.fromAddress,
      transfer.fromParachainId
    );
    if (ansFrom) transfer.fromAddressSS58 = addressFrom;

    const [ansTo, addressTo] = getSS58AddressForChain(
      transfer.toAddress,
      transfer.toParachainId
    );
    if (ansTo) transfer.toAddressSS58 = addressTo;

    await transfer.save();
  }
}

export async function handleDmpParaEvent(event: SubstrateEvent): Promise<void> {
  const transfer = XCMTransfer.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    warnings: "",
    assetId: [],
    amount: [],
    toAddress: "",
    toParachainId: "",
    amountTransferred: [],
    assetIdTransferred: [],
    xcmpTransferStatus: [],
  });
  transfer.blockNumber = event.block.block.header.number.toBigInt();
  transfer.timestamp = event.block.timestamp.toISOString();
  transfer.xcmpMessageHash =
    event.block.events[event.idx].event.data[0].toString();
  transfer.xcmpMessageStatus = "DMP received";

  // Search for the horizontal message with the given hash (transfer.xcmpMessageHash)
  // inside the assosiated extrinsic (parachainSystem.setValidationData)
  // extrinsic might not come in the same block (moonriver 2105158), if not skip for now
  try {
    const dmpParaExtrinsic: any = event.extrinsic.extrinsic;
    dmpParaExtrinsic.method.args[0].downwardMessages.forEach(
      ({ sentAt, msg }) => {
        const messageHash = blake2AsHex(Uint8Array.from(msg));
        if (messageHash == transfer.xcmpMessageHash) {
          // Get readable instructions from byte-array xcmp message
          const instructions = intructionsFromXcmU8Array(msg, api);
          if (typeof instructions == "string") {
            transfer.warnings += instructions;
          } else {
            // Parce instructions and safe relevant info
            parceXcmpInstrustions(instructions, transfer);
            // Calculate SS58 version of address
            const [ans, address] = getSS58AddressForChain(
              transfer.toAddress,
              transfer.toParachainId
            );
            if (ans) {
              transfer.toAddressSS58 = address;
            } else {
              transfer.warnings += address;
            }

            // Save all instructions as an array of JSON,
            // in case detailed information is needed (or parces failed)
            transfer.xcmpInstructions = instructions.map((instruction) =>
              JSON.stringify(instruction, undefined)
            );
          }
        }
      }
    );
  } catch {
    transfer.warnings += "no extrinsic for dmpQueue.ExecutedDownward";
  }
  // Find and parce assets.Issued event to confirm assets transder
  // and get the final amount deposited
  // const assetsIssueEvents: any[] = event.block.events.filter(
  //   (el) => el.event.section == "assets" && el.event.method == "Issued"
  // );
  // assetsIssueEvents.forEach(({ event }) => {
  //   if (event.toHuman().data.owner.toLowerCase() === transfer.toAddress) {
  //     transfer.xcmpTransferStatus.push("issued");
  //     transfer.amountTransferred.push(
  //       event.toHuman().data.totalSupply.replace(/,/g, "")
  //     );
  //     transfer.assetIdTransferred.push(event.toHuman().data.assetId);
  //   }
  // });
  await transfer.save();
}

export async function handleXcmpQueueModule(
  event: SubstrateEvent
): Promise<void> {
  let allBlockEvents = [];
  try {
    allBlockEvents = event.extrinsic.events;
  } catch {
    // not exrinsics relatade to event
    return;
  }
  const transfer = XCMTransfer.create({
    id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
    warnings: "",
    assetId: [],
    amount: [],
    toAddress: "",
    toParachainId: "",
  });
  transfer.blockNumber = event.block.block.header.number.toBigInt();
  transfer.timestamp = event.block.timestamp.toISOString();

  const signedBlock = event.block;
  const allBlockExtrinsics = signedBlock.block.extrinsics;
  // Map all xcmp related events to their extrinsics
  const xcmpExtrinsicsWithEvents = mapXcmpEventsToExtrinsics(
    allBlockExtrinsics,
    allBlockEvents
  );
  if (xcmpExtrinsicsWithEvents.length < 1) {
    transfer.warnings += " - xcmpQueue.<events> are not found";
  } else {
    for (const xcmpExtrinsicWithEvents of xcmpExtrinsicsWithEvents) {
      transfer.xcmpMessageStatus = xcmpExtrinsicWithEvents.status;
      transfer.xcmpMessageHash = xcmpExtrinsicWithEvents.hash;

      switch (xcmpExtrinsicWithEvents.status) {
        case "HRMP received":
          await decodeInboundXcmp(xcmpExtrinsicWithEvents, api, transfer);
          break;
        case "HRMP sent":
          await decodeOutboundXcmp(xcmpExtrinsicWithEvents, api, transfer);
          break;
      }
    }
    await transfer.save();
  }
}

async function decodeOutboundXcmp(xcmpExtrinsicWithEvents, apiAt, transfer) {
  transfer.fromParachainId = (await apiAt.query.parachainInfo.parachainId())
    .toString()
    .replace(/,/g, "");
  xcmpExtrinsicWithEvents.events.forEach(({ event }) => {
    if (event.section == "xTokens") {
      if (event.method == "Transferred") {
        const [sender, currencyId, amount, dest] = event.data
          .toJSON()
          .values() as any;
        parcexTokenTransfer(sender, currencyId, amount, dest, false, transfer);
      } else {
        //"TransferredMultiAssets"
        const [sender, currencyId, amount, dest] = event.data
          .toJSON()
          .values() as any;
        parcexTokenTransfer(sender, currencyId, amount, dest, true, transfer);
      }

      // calculate SS58 addresses for given chains
      const [ansFrom, addressFrom] = getSS58AddressForChain(
        transfer.fromAddress,
        transfer.fromParachainId
      );
      if (ansFrom) transfer.fromAddressSS58 = addressFrom;

      const [ansTo, addressTo] = getSS58AddressForChain(
        transfer.toAddress,
        transfer.toParachainId
      );
      if (ansTo) transfer.toAddressSS58 = addressTo;
    }
  });
}

async function decodeInboundXcmp(xcmpExtrinsicWithEvents, apiAt, transfer) {
  transfer.toParachainId = (await apiAt.query.parachainInfo.parachainId())
    .toString()
    .replace(/,/g, "");

  xcmpExtrinsicWithEvents.extrinsic.method.args[0].horizontalMessages.forEach(
    (paraMessage, paraId) => {
      if (paraMessage.length >= 1) {
        paraMessage.forEach((message) => {
          const messageHash = blake2AsHex(
            Uint8Array.from(message.data).slice(1)
          );
          if (messageHash == transfer.xcmpMessageHash) {
            transfer.fromParachainId = paraId.toString().replace(/,/g, "");
            // Get readable instructions from byte-array xcmp message
            const instructions = intructionsFromXcmU8Array(
              message.data.slice(1),
              api
            );

            if (typeof instructions == "string") {
              transfer.warnings += instructions;
            } else {
              // Parce instructions and safe relevant info
              parceXcmpInstrustions(instructions, transfer);
              // Calculate SS58 version of address
              const [ans, address] = getSS58AddressForChain(
                transfer.toAddress,
                transfer.toParachainId
              );
              if (ans) {
                transfer.toAddressSS58 = address;
              } else {
                transfer.warnings += address;
              }
              // Save all instructions as an array of JSON,
              // in case detailed information is needed (or parces failed)
              transfer.xcmpInstructions = instructions.map((instruction) =>
                JSON.stringify(instruction, undefined)
              );
            }
          }
        });
      }
    }
  );
}

function parcexTokenTransfer(
  sender,
  currencyId,
  amount,
  dest,
  multiAssetsTrue,
  transfer
) {
  transfer.fromAddress = sender;
  if (multiAssetsTrue) {
    try {
      transfer.amount.push(amount.fun.fungible.toString().replace(/,/g, ""));
    } catch {}
    try {
      transfer.assetId.push(amount.id.concrete.interior.x2[1].generalKey);
    } catch {}
  } else {
    try {
      transfer.amount.push(amount.toString().replace(/,/g, ""));
    } catch {}
    try {
      transfer.assetId.push(currencyId.otherReserve.toString());
    } catch {}
  }
  // Extract destination address from XcmpMultilocation
  if (dest.interior != null) {
    transfer.toAddress = parceInterior(dest.interior);
    transfer.toParachainId = chainIdFromInterior(dest.interior);
  } else {
    transfer.warnings += "interior is undefined";
  }
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
          xcmpStatus = "HRMP sent";
          xcmpHash = event.data[0].toString();
        } else if (event.method == "Success") {
          xcmpStatus = "HRMP received";
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
