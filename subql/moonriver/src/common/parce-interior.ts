export function parceInterior(interior) {
  let numOfJunctions: number = -1;
  let innerLocation;
  let toAddress: string;
  [1, 2, 3, 4, 5].forEach((num) => {
    if (interior.hasOwnProperty("X" + `${num}`)) {
      numOfJunctions = num;
    }
  });
  if (numOfJunctions == -1) {
    return "not found";
  } else {
    //either relay chain or interior parachain location,
    // so if returns "0" don't overwrite toChainId
    if (numOfJunctions == 1) {
      innerLocation = interior["X" + `${numOfJunctions}`];
    } else {
      innerLocation = interior["X" + `${numOfJunctions}`][numOfJunctions - 1];
    }
    toAddress = innerLocation.AccountId32?.id ?? innerLocation.AccountKey20.key;
    return toAddress;
  }
}

export function chainIdFromInterior(interior) {
  let numOfJunctions: number = -1;
  let toChainId: string;
  [1, 2, 3, 4, 5].forEach((num) => {
    if (interior.hasOwnProperty("X" + `${num}`)) {
      numOfJunctions = num;
    }
  });
  if (numOfJunctions == -1) {
    return "not found";
  } else {
    if (numOfJunctions == 1) {
      toChainId = "0";
    } else {
      toChainId =
        interior["X" + `${numOfJunctions}`][numOfJunctions - 2].Parachain;
    }
    toChainId = toChainId.replace(/,/g, "");
    return toChainId;
  }
}

// export function parceInterior(interior) {
//   let numOfJunctions: number = -1;
//   let toChainId: string;
//   let innerLocation;
//   let toAddress: string;
//   [1, 2, 3, 4, 5].forEach((num) => {
//     if (interior.hasOwnProperty("X" + `${num}`)) {
//       numOfJunctions = num;
//     }
//   });
//   if (numOfJunctions == -1) {
//     return "unknown number of junctions";
//   } else {
//     //either relay chain or interior parachain location,
//     // so if returns "0" don't overwrite toChainId
//     if (numOfJunctions == 1) {
//       toChainId = "0";
//       innerLocation = interior["X" + `${numOfJunctions}`];
//     } else {
//       console.log(numOfJunctions);
//       toChainId =
//         interior["X" + `${numOfJunctions}`][numOfJunctions - 2].Parachain;
//       innerLocation = interior["X" + `${numOfJunctions}`][numOfJunctions - 1];
//     }
//     toChainId = toChainId.replace(/,/g, "");
//     toAddress = innerLocation.AccountId32?.id ?? innerLocation.AccountKey20.key;
//     return [toChainId, toAddress];
//   }
// }
