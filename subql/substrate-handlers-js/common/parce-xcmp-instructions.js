const { isAddress } = require("@polkadot/util-crypto");
const { parceInterior } = require("./parce-interior");
function parceXcmpInstrustions(instructions, transfer, apiAt) {
  // Check if xcmp version is 1, then parce the asset part
  // and extract effects/instructions from the object and use
  // them as V2,V3 instructions for further parcing
  console.log("instructions version " + instructions[0]);
  if (instructions[0] == "xcmp_asV1") {
    instructions.slice(1).forEach((instruction) => {
      Object.keys(instruction).forEach((key) => {
        let effects = [];
        switch (key) {
          case "ReserveAssetDeposited":
            instruction.ReserveAssetDeposited.assets.forEach(({ id, fun }) => {
              transfer.assetId.push(JSON.stringify(id.Concrete));
              transfer.amount.push(fun.Fungible.replace(/,/g, ""));
            });
            effects = [...instruction.ReserveAssetDeposited.effects];
          // fall through is intentional
          default:
            if (effects.length > 0) {
              parceV2V3Instruction(effects, transfer, apiAt);
            }
        }
      });
    });
  } else {
    parceV2V3Instruction(instructions.slice(1), transfer, apiAt); //first element is xcmp version
  }
}
function parceV2V3Instruction(instructions, transfer, apiAt) {
  // Remove ClearOrigin, its a string and does't contain
  // any info of interest (still can be seen in the list xcmpInstructions)
  const idxClearOrigin = instructions.indexOf("ClearOrigin");
  if (idxClearOrigin > -1) instructions.splice(idxClearOrigin, 1);
  instructions.forEach((instruction) => {
    console.log(instruction);
    Object.keys(instruction).forEach((key) => {
      switch (key) {
        case "WithdrawAsset":
          instruction.WithdrawAsset.forEach(({ id, fun }) => {
            transfer.assetId.push(JSON.stringify(id.Concrete));
            transfer.amount.push(
              fun.Fungible?.replace(/,/g, "") ?? JSON.stringify(fun)
            );
          });
          break;
        case "BuyExecution":
          // can get weight limit and fee asset if needed
          break;
        case "DepositAsset":
          console.log(instruction.DepositAsset.beneficiary);
          try {
            transfer.toAddress =
              instruction.DepositAsset.beneficiary.interior.X1.AccountId32
                ?.id ??
              instruction.DepositAsset.beneficiary.interior.X1.AccountKey20.key;
          } catch {}
          break;
        case "DepositReserveAsset":
          let parceRes2 = parceInterior(
            instruction.DepositReserveAsset.xcm[1].DepositAsset.beneficiary
              .interior
          );
          if (typeof parceRes2 == "string") {
            transfer.warnings += parceRes2;
          } else {
            [transfer.toParachainId, transfer.toAddress] = parceRes2;
          }
          break;

        case "Transact":
          // console.log(
          //   apiAt.tx.utility.asDerivative(
          //     1801,
          //     instruction.Transact.call.encoded
          //   )
          // );
          break;

        default:
          transfer.warnings += ` - Unknown instruction name ${key}`;
      }
    });
  });
}

module.exports = {
  parceXcmpInstrustions,
};
