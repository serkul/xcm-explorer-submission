import { parceInterior } from "./parce-interior";

interface Transfer {
  warnings: string;
  assetId: string[];
  amount: string[];
  toAddress: string;
  // toParachainId: string;
}
export function parceXcmpInstrustions(instructions, transfer: Transfer) {
  // Check if xcmp version is 1, then parce the asset part
  // and extract effects/instructions from the object and use
  // them as V2,V3 instructions for further parcing
  if (instructions[0] == "xcmp_asV1") {
    instructions.slice(1).forEach((instruction) => {
      Object.keys(instruction).forEach((key) => {
        let effects: any[] = [];
        switch (key) {
          case "ReserveAssetDeposited":
            instruction.ReserveAssetDeposited.assets.forEach(({ id, fun }) => {
              try {
                transfer.assetId.push(JSON.stringify(id.Concrete));
              } catch {}
              try {
                transfer.amount.push(fun.Fungible.replace(/,/g, ""));
              } catch {}
            });
            try {
              effects = [...instruction.ReserveAssetDeposited.effects];
            } catch {}
          // fall through is intentional
          default:
            if (effects.length > 0) {
              parceV2V3Instruction(effects, transfer);
            }
        }
      });
    });
  } else {
    parceV2V3Instruction(instructions.slice(1), transfer); //first element is xcmp version
  }
}
function parceV2V3Instruction(instructions, transfer: Transfer) {
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
            try {
              transfer.assetId.push(JSON.stringify(id.Concrete));
            } catch {}
            try {
              transfer.amount.push(
                fun.Fungible?.replace(/,/g, "") ?? JSON.stringify(fun)
              );
            } catch {}
          });
          break;
        case "BuyExecution":
          // can get weight limit and fee asset if needed
          break;
        case "Transact":
          //info not used
          break;
        case "DepositAsset":
          try {
            transfer.toAddress = parceInterior(
              instruction.DepositAsset.beneficiary.interior
            );
          } catch {}
          break;
        case "DepositReserveAsset":
          try {
            transfer.toAddress = parceInterior(
              instruction.DepositReserveAsset.xcm[1].DepositAsset.beneficiary
                .interior
            );
          } catch {}
          break;
        default:
          transfer.warnings += ` - Unknown instruction name ${key}`;
      }
    });
  });
}
