const express = require("express");
const router = express.Router();
const controller = require("./controller.js");
const Validator = require("./validator.js");
// const browserObj = require('./job-helper/browser')
// const scrapperObj = require('./job-helper/pageController')
// Start the browser and create a browser instance
// let browserInstance = browserObject.startBrowser();
// Add job
router.post("/add", Validator.addJob, Validator.validator, controller.bookJob);
router.post("/jobExists", Validator.upworkJobUrlValidation, Validator.validator, controller.jobDetailsExists)

/**
 * @description add job that is from other source than upwork
 */
router.post('/add/outsource', Validator.addOutSourceJob, Validator.validator, controller.createActiveLead);

/**
 * @description 
 */
router.post('/status/moveToActiveInactive', Validator.moveToActiveInactive, Validator.validator, controller.moveToActiveInactive);

/**
 * @description delete job doc
 */
router.post('/delete/jobDoc', Validator.deleteJobDoc, Validator.validator, controller.deleteJobDoc);

/**
 * @description update outsource job
 */
router.post('/update/outsource', Validator.updateOutsourceJob, Validator.validator, controller.editOtherSourceLead);

// update job
router.put(
  "/update",
  Validator.updateJob,
  Validator.validator,
  controller.updateJob
);

//delete job
router.delete(
  "/delete",
  Validator.deleteJob,
  Validator.validator,
  controller.deleteJob
);

//status update
router.put(
  "/updateJobStatus",
  Validator.updateJobStatus,
  Validator.validator,
  controller.updateJobStatus
);

// List view
router.post(
  "/listView",
  Validator.JobFiltersType,
  Validator.validator,
  controller.JobsList
);

//view by Id
router.get(
  "/viewJobById/:id",
  Validator.viewByIdType,
  Validator.validator,
  controller.viewByIdJob
);

router.get(
  "/fetchDataUpwork/:id",
  Validator.fetchDataUpworkTypes,
  Validator.validator,
  controller.fetchDataFromUpworkByJobId
);

//add client details
router.post(
  "/addClientDetails",
  Validator.addClientTypes,
  Validator.validator,
  controller.addClientDetails
);

// router.get("/jobUrlData", controller.getJobUrlData)
router.post("/fetchFromUpwork", Validator.upworkJobUrlValidation, Validator.validator, controller.fetchJobFromUpwork);
// router.post("/getProfileByJobTypeId", controller.getProfileByJobTYpeID)

// get job type by name getJobTypeByName
router.post("/jobTypesByName", Validator.jobTypesByName, Validator.validator, controller.getJobTypesByName);

/**
 * @description get all reasons list
 */
router.get("/reasonsList", controller.getReasonsLlist);

/**
 * @description get all reasons list
 */
router.post("/room-message/handle", Validator.validateMessageRoom, Validator.validator, controller.manageRoomAndMessage);

/**
 * @description get all reasons list
 */
router.post("/room-messages", Validator.validateRoomMessages, Validator.validator, controller.manageRoomAndMessages);

/**
 * @description get job by title 
 */
router.post("/jobSearchByTitle", Validator.jobByTitle, Validator.validator, controller.getJobByTitle);

/**
 * @description get job by title 
 */
router.get("/job-chat/:id", Validator.viewByIdType, Validator.validator, controller.getJobChat);

router.get(
  "/globalSearch/:searchKeyword",
  Validator.globalSearchValidation,
  Validator.validator,
  controller.globalSearch
);

/**
 * @description get lead graph data
 */
router.get("/leadGraphData/:id", Validator.viewByIdType, Validator.validator, controller.getLeadGraphData);


/**
 * @description get lead graph data
 */
router.get("/leads/recalculate-scores", controller.recalculateLeadScores);

/**
 * @description add job summery detials 
 */
router.post("/addJobSummary", Validator.validateJobSummary, Validator.validator, controller.addJobSummary);

/**
 * @description get job summery detials 
 */
router.get("/jobSummary/:id", Validator.viewByIdType, Validator.validator, controller.getJobSummary);

/**
 * @description Update Job summery detials Validator.validateJobSummary,
 */
router.post("/updateJobSummery/", Validator.validateUpdateJobSummary, Validator.validator, controller.updateJobSummary);

/**
 * @description mark as job closed 
 */
router.post("/close-project", Validator.validateMarkProjectClosed, Validator.validator, controller.closeProjectByJobId)

/**
 * @description get Job summary list
 */
router.post("/finance-summary-list", Validator.validateSummaryList, Validator.validator, controller.financeSummaryList)

const Job = router;
module.exports = Job;
// export default Job;
