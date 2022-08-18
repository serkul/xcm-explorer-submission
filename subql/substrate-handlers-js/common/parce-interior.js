function parceInterior(interior) {
  let numOfJunctions = -1;
  let toChainId;
  let innerLocation;
  let toAddress;
  console.log(interior);

  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((num) => {
    if (interior.hasOwnProperty("X" + `${num}`)) {
      numOfJunctions = num;
      console.log("num of junctions", numOfJunctions);
    }
  });
  if (numOfJunctions == -1) {
    return "unknown number of junctions";
  } else {
    //either relay chain or interior parachain location,
    // so if returns "0" don't overwrite toChainId
    if (numOfJunctions == 1) {
      toChainId = "0";
      innerLocation = interior["X" + `${numOfJunctions}`];
    } else {
      console.log("junctions: ", numOfJunctions);
      toChainId =
        interior["X" + `${numOfJunctions}`][numOfJunctions - 2].Parachain;
      innerLocation = interior["X" + `${numOfJunctions}`][numOfJunctions - 1];
    }
    toChainId = toChainId.replace(/,/g, "");
    toAddress = innerLocation.AccountId32?.id ?? innerLocation.AccountKey20.key;
    return [toChainId, toAddress];
  }
}
module.exports = {
  parceInterior,
};
