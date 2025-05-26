const jobStatusOrder = [
  "INACTIVE",
  "INITIAL",
  "ACTIVE",
  "WARM",
  "HOT",
  "CLOSED",
];
const jobStatusObj = {
  INACTIVELEAD: "INACTIVE",
  INITIALLEAD: "INITIAL",
  ACTIVELEAD: "ACTIVE",
  WARMLEAD: "WARM",
  HOTLEAD: "HOT",
  CLOSEDLEAD: "CLOSED",
};

function isMyLeadClosed(currentJobStatus) {
  return currentJobStatus === jobStatusObj.CLOSEDLEAD;
}

function isCurrentStatusSame(currentJobStatus, reqJobStatus) {
  return currentJobStatus === reqJobStatus;
}

function isRequestStatusINACTIVE(reqJobStatus) {
  return reqJobStatus === jobStatusObj.INACTIVELEAD;
}

function isCurrentStatusINACTIVE(currentJobStatus) {
  return currentJobStatus === jobStatusObj.INACTIVELEAD;
}
function isRequestStatusACTIVE(reqJobStatus) {
  return reqJobStatus === jobStatusObj.ACTIVELEAD;
}

function checkStatusUpdateOrder(currentJobStatus, reqJobStatus, callback) {
  for (let i = 0; i < jobStatusOrder.length; i++) {
    if (jobStatusOrder[i] === currentJobStatus) {
      console.log("matched");
      if (jobStatusOrder[i + 1]) {
        if (jobStatusOrder[i + 1] === reqJobStatus) {
          callback(null, true);
        } else {
          console.log("no");
          callback(true);
        }
      } else {
        console.log("this is last");
        callback(true);
      }
      break;
    }
  }
}

module.exports = {
  jobStatusOrder,
  isMyLeadClosed,
  isCurrentStatusSame,
  checkStatusUpdateOrder,
  isRequestStatusINACTIVE,
  isCurrentStatusINACTIVE,
  isRequestStatusACTIVE,
};
