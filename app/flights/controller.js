const { JobModel } = require("../../models/job.js");
const { LeadStatusModel } = require("../../models/leadStatus.js");
const { JobTypeModel } = require("../../models/jobTypes.js");
const { User } = require("../../models/users.js");
const Helper = require("../../helper/common.js");
const { messages } = require("../../helper/messages.js");
const { statusCode } = require("../../helper/statusCodes.js");
const { Roles } = require("../../helper/roleEnum.js");
const { ObjectId } = require("mongodb");
const { stages, Sources } = require("../../constants/global.js");
const { LeadManagerModel } = require("../../models/leadManagers.js");
const { RoomModel } = require("../../models/room.js");
const { MessageModel } = require("../../models/message.js");
const { LeadEvaluationModel } = require("../../models/leadEvaluation.js");
const { JobSummaryModel } = require("../../models/jobSummery.js");

//requrie get job url data 
const axios = require("axios");
const cheerio = require("cheerio");
// const fs = require('fs/promises');

const {
  isMyLeadClosed,
  isCurrentStatusSame,
  checkStatusUpdateOrder,
  isRequestStatusINACTIVE,
  isCurrentStatusINACTIVE,
  isRequestStatusACTIVE,
} = require("./jobStatusManagement.js");
const toDoModel = require("../../models/to-doModel.js");
let helper = new Helper();
const { schedueAJob } = require("../../agenda");
const { agendaNames } = require("../../agenda/agendaNames.js");
const { createLeadActivity } = require("../../services/createLeadActivity.js");
const { default: mongoose } = require("mongoose");
const { ContactModel } = require("../../models/clientDetails.js");
const { FileModel } = require("../../models/files.js");
const fs = require("fs");
const { EmailTemplateModel } = require("../../models/emailTemplates.js");
const { emailTempleteSlug } = require("../../helper/templates.data.js");
const { config } = require("../../config.js");
const { RoleModel } = require("../../models/role.js");
const {
  replaceVariablesInTemplate,
  sendMail,
} = require("../../services/sendMail.js");
const { LeadReasonsModel } = require("../../models/leadReasons.js");
const { LeadScoresModel } = require("../../models/leadScores.js");
const { DealClosedStatModel } = require("../../models/closedDealStats.js")

// const config = {
//     clientId: "dd7d7f71811f3c58e33fd18074c7bf50",
//     clientSecret: "Oefaef3c2ea3e841",
//     redirectUri: "https://upworkapi.shinedezign.pro",
//     debug: true,
// };

// const UpworkApi = require("@upwork/node-upwork-oauth2"),
//     Auth = require("@upwork/node-upwork-oauth2/lib/routers/auth").Auth;
// rl = require("readline");

// const jobs = require("upwork-api/lib/routers/hr/jobs.js").Jobs;

/**
 * @description create a lead scores docs every section like budgests and reviews average Job spent etc.
 */
const createLeadScore = async (parameterId, jobId, score) => {
  try {
    // console.log("createLeadScore-------------", "socere", score, "jobId", jobId, "parameterId", parameterId)
    // const find = await LeadScoresModel.find({ jobId: ObjectId(jobId), parameterId: ObjectId(parameterId) });
    // console.log("find", find);

    await LeadScoresModel.deleteMany({ jobId: ObjectId(jobId) }); //, parameterId: ObjectId(parameterId) 

    if (score <= 0) return;

    const leadScore = await LeadScoresModel.findOneAndUpdate(
      { jobId: ObjectId(jobId), parameterId: ObjectId(parameterId) },
      { score },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Successfully created lead score documents"); //leadScore
    return;
  } catch (error) {
    console.log("Error Name:", error?.name);
    console.log("Error Message:", error?.message);
    console.log("Stack Trace:", error?.stack);
    // console.error("Error creating lead score documents:", error);
    return;
  }
};



/**
 * @description check lead evaluation scores
 */
const checkLeadScore = async (reqBody, jobId = '') => {
  try {
    const {
      hireRate = 0,
      clientHourlyBudget = 0,
      clientRating = 0,
      budget = 0,
      clientTotalInvest = 0,
      clientJobsCount = 0,
      clientPaymentMethod,
      clientPhoneNumber,
      clientLocation // Added clientLocation for country score calculation
    } = reqBody;

    // Calculate average job spent
    const averageJobSpent = clientJobsCount > 0 ? clientTotalInvest / clientJobsCount : 0;

    const leadEvaluations = await LeadEvaluationModel.find(
      { status: 'Active' },
      { budgets: 1, type: 1, status: 1 }
    );

    const getScore = (type, value) => {
      const evaluation = leadEvaluations.find(e => e.type === type);
      if (!evaluation) return 0;

      for (const range of evaluation.budgets) {
        if (value >= range.min && value <= range.max) {
          return range.score;
        } else if (value > range?.max) {
          return range.score;
        }
      }
      return 0;
    };

    const getPaymentMethodScore = (type, value) => {
      const evaluation = leadEvaluations.find(e => e.type === type);
      if (!evaluation) return 0;

      const budget = evaluation.budgets.find(b => b.budget === value);
      return budget ? budget.score : 0;
    };

    const getCountryScore = () => {
      const countryEvaluation = leadEvaluations.find(e => e.type === 'country');
      if (!countryEvaluation) return 0;

      for (const budget of countryEvaluation.budgets) {
        if (budget.counties.includes(clientLocation)) {
          return budget.score;
        }
      }
      return 0;
    };

    const criteria = [
      { type: 'hireRate', value: Math.ceil(hireRate) },
      { type: 'hourlyRateRanges', value: Math.ceil(clientHourlyBudget) },
      { type: 'reviews', value: Math.ceil(clientRating) },
      { type: 'budgetRange', value: Math.ceil(budget) },
      { type: 'averageJobSpent', value: Math.ceil(averageJobSpent) },
      { type: 'paymentMethod', value: clientPaymentMethod },
      { type: 'phoneNumber', value: clientPhoneNumber }
    ];

    let totalScore = criteria.reduce((sum, criterion) => {
      let score = 0;

      if (criterion.type === 'paymentMethod' || criterion.type === 'phoneNumber') {
        score = getPaymentMethodScore(criterion.type, criterion.value);
      } else {
        score = getScore(criterion.type, criterion.value);
      }

      if (score >= 0) {
        const leadEvaluation = leadEvaluations.find(e => e.type === criterion.type);
        if (leadEvaluation) {
          const matchingBudget = leadEvaluation.budgets.find(budget => score === budget.score);
          if (matchingBudget) {
            createLeadScore(leadEvaluation._id, jobId, score)
              .then(() => console.log('Lead score created successfully'))
              .catch(() => console.log('Error occurred while creating lead score'));
          }
        }
      }

      return sum + score;
    }, 0);

    // Add country score to total score
    const countryScore = getCountryScore();
    if (countryScore > 0) {
      const countryEvaluation = leadEvaluations.find(e => e.type === 'country');
      if (countryEvaluation) {
        createLeadScore(countryEvaluation._id, jobId, countryScore)
          .then(() => console.log('Country score created successfully'))
          .catch(() => console.log('Error occurred while creating country score'));
      }
    }

    totalScore += countryScore;

    return totalScore;
  } catch (error) {
    console.log('Error Name:', error?.name);
    console.log('Error Message:', error?.message);
    console.log('Stack Trace:', error?.stack);
    return 0;
  }
};



// const checkLeadScore = async (reqBody, jobId = '') => {
//   try {

//     const {
//       hireRate = 0,
//       clientHourlyBudget = 0,
//       clientRating = 0,
//       budget = 0,
//       clientTotalInvest = 0,
//       clientJobsCount = 0,
//       clientPaymentMethod,
//       clientPhoneNumber,
//       clientLocation
//     } = reqBody;

//     // Calculate average job spent
//     const averageJobSpent = clientJobsCount > 0 ? clientTotalInvest / clientJobsCount : 0;
//     // console.log("averageJobSpent", averageJobSpent)

//     const leadEvaluations = await LeadEvaluationModel.find({ status: 'Active' }, { budgets: 1, type: 1, status: 1 });
//     // console.log("leadEvaluations", leadEvaluations)

//     const getScore = (type, value) => {
//       const evaluation = leadEvaluations.find(e => e.type === type);
//       // console.log("evaluation", evaluation, "joId", jobId)
//       if (!evaluation) return 0;

//       for (const range of evaluation.budgets) {
//         if (value >= range.min && value <= range.max) {
//           // createLeadScore(evaluation?._id, jobId, range.score).then(console.log("create score lead")).catch(console.log("error occure lead score create"))
//           return range.score;
//         } else if (value > range?.max) {
//           // createLeadScore(evaluation?._id, jobId, range.score).then(console.log("create score lead")).catch(console.log("error occure lead score create"))
//           return range.score;
//         }
//       }
//       return 0;
//     };

//     const getPaymentMethodScore = (type, value) => {
//       const evaluation = leadEvaluations.find(e => e.type === type);
//       // console.log("html 22", evaluation)
//       if (!evaluation) return 0;

//       const budget = evaluation.budgets.find(b => b.budget === value);
//       return budget ? budget.score : 0;
//     };

//     // const criteria = [
//     //   { type: "hireRate", value: hireRate },
//     //   { type: "hourlyRateRanges", value: clientHourlyBudget },
//     //   { type: "reviews", value: clientRating },
//     //   { type: "budgetRange", value: budget },
//     //   { type: "averageJobSpent", value: averageJobSpent },
//     //   { type: "paymentMethod", value: clientPaymentMethod },
//     //   { type: "phoneNumber", value: clientPhoneNumber },
//     // ];
//     const criteria = [
//       { type: "hireRate", value: Math.ceil(hireRate) },
//       { type: "hourlyRateRanges", value: Math.ceil(clientHourlyBudget) },
//       { type: "reviews", value: Math.ceil(clientRating) },
//       { type: "budgetRange", value: Math.ceil(budget) },
//       { type: "averageJobSpent", value: Math.ceil(averageJobSpent) },
//       { type: "paymentMethod", value: clientPaymentMethod },
//       { type: "phoneNumber", value: clientPhoneNumber },
//     ];

//     const totalScore = criteria.reduce((sum, criterion) => {
//       let score = 0;
//       if (criterion.type === "paymentMethod" || criterion.type === "phoneNumber") {
//         score = getPaymentMethodScore(criterion.type, criterion.value);
//         // console.log(`Type Paymnet Phone: ${criterion.type}, Value: ${criterion.value}, Score: ${score}`);
//       } else {
//         score = getScore(criterion.type, criterion.value);
//         // console.log(`Type: ${criterion.type}, Value: ${criterion.value}, Score: ${score}`);
//       }

//       // If a matching score is found, create a lead score document
//       if (score >= 0) { //score > 0
//         const leadEvaluation = leadEvaluations.find(e => e.type === criterion.type);
//         // console.log("leadEvaluation score", leadEvaluation)
//         if (leadEvaluation) {
//           const matchingBudget = leadEvaluation.budgets.find(budget => score === budget.score);
//           // console.log("matchi Score", matchingBudget)
//           if (matchingBudget) {
//             createLeadScore(leadEvaluation._id, jobId, score).then(console.log("create score lead")).catch(console.log("error occure lead score create"));
//           }
//         }
//       }

//       return sum + score;
//     }, 0);

//     // console.log("totalScore", totalScore)
//     return totalScore;
//   } catch (error) {
//     console.log("Error Name:", error?.name);
//     console.log("Error Message:", error?.message);
//     console.log("Stack Trace:", error?.stack);
//     // console.error("Error in checkLeadScore:", error);
//     return 0;
//   }
// }

/**
 * @description bookk a upwork job
 * @param {*} req
 * @param {*} res
 * @returns
 */
// async function bookJob(req, res) {
//   try {
//     const { jobUrl, coverLetter, jobTypeId, profileId, userId } = req.body;
//     // const id = await validateJobURL(jobUrl);
//     // const id = await jobUrl;
//     let query = { jobId: jobUrl };
//     if (userId) {
//       query.userId = userId;
//     }
//     // const jobExists = await JobModel.findOne({ jobId: jobUrl, userId: userId });
//     const jobExists = await JobModel.findOne(query);

//     if (jobExists) {
//       return helper.responseObj(
//         res,
//         statusCode.BAD_REQUEST,
//         {},
//         messages.JOBEXISTS
//       );
//     }

//     let createdJob = await JobModel.create({
//       ...req.body,
//       userId: req.userId,
//       jobId: jobUrl,
//       jobTypeId: jobTypeId ? jobTypeId : null,
//       profileId: profileId ? profileId : null,
//       bidTime: new Date(),
//       jobStatus:
//         coverLetter && coverLetter.trim() ? stages.Submitted : stages.Booked,
//       source: Sources.Upwork,
//       browserInfo: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });

//     schedueAJob("in 180 minutes", agendaNames.Update_Booked_Job, {
//       jobId: createdJob._id,
//     });

//     createLeadActivity({
//       title: `${coverLetter && coverLetter.trim() ? "Submitted" : "Booked"
//         } the Job`,
//       userId: req.userId,
//       jobId: createdJob._id,
//       browserInfo: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });
//     return helper.responseObj(res, statusCode.OK, {}, messages.JOBCREATED);
//   } catch (error) {
//     return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
//   }
// }

async function bookJob(req, res) {
  try {
    const { jobUrl, coverLetter, jobTypeId, profileId } = req.body;
    const id = jobUrl;
    // const leadScore = await checkLeadScore(req.body);
    // console.log("leadScore", leadScore)
    const jobData = {
      ...req?.body,
      userId: req?.userId,
      jobId: id,
      jobTypeId: jobTypeId || null,
      profileId: profileId || null,
      jobStatus: coverLetter && coverLetter.trim() ? stages.Submitted : stages.Booked,
      source: Sources.Upwork,
      // score: leadScore,
      browserInfo: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    };

    // check if the job exists with the given jobId
    const jobExists = await JobModel.findOne({ jobId: id }).populate({
      path: "userId", select: "firstName lastName"
    });;

    // If the job exists, update it
    if (jobExists) {
      const updatedJob = await JobModel.findOneAndUpdate(
        { jobId: id, userId: req?.userId },
        jobData,
        { new: true }
      );

      if (updatedJob) {
        return helper.responseObj(res, statusCode.OK, {}, 'Job Updated');
      } else {
        return helper.responseObj(res, statusCode.BAD_REQUEST, {}, `Job already created by the ${jobExists?.userId?.firstName} ${jobExists?.userId?.lastName || ''}`);
      }
    } else {

      // If the job does not exist, create a new job
      const createdJob = await JobModel.create({
        ...jobData,
        bidTime: new Date(),
      });

      //create lead scores 
      const leadScore = await checkLeadScore(req.body, createdJob?._id);
      await JobModel.findOneAndUpdate({ _id: createdJob?._id }, { $set: { score: leadScore } });

      // createLeadScore(createdJob?._id).then(console.log("lead score created successfully")).catch(console.log("lead score create error"));

      // Schedule a job to update the job status after 180 minutes
      schedueAJob("in 180 minutes", agendaNames.Update_Booked_Job, { jobId: createdJob._id });

      // Log activity for lead creation
      createLeadActivity({
        title: `${coverLetter && coverLetter.trim() ? "Submitted" : "Booked"} the Job`,
        userId: req.userId,
        jobId: createdJob._id,
        browserInfo: {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
      });

      return helper.responseObj(res, statusCode.OK, {}, messages.JOBCREATED);
    }
  } catch (error) {
    console.error(error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message || "Something went wrong");
  }
}



/** 
 * @description check job url exists or not
 */
async function jobDetailsExists(req, res) {
  try {
    const { url } = req.body;
    // const id = await validateJobURL(jobUrl);
    const id = await url;
    const jobExists = await JobModel.findOne({ jobId: id });
    const jobExistsorNot = jobExists ? true : false;
    if (jobExists) {
      return helper.responseObj(
        res,
        statusCode.BAD_REQUEST,
        {},
        messages.JOBEXISTS
      );
    }
    return helper.responseObj(
      res,
      statusCode.OK,
      { jobExistsorNot });
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
  }
}


/**
 * @description create Lead Active
 * @param {*} req
 * @param {*} res
 * @returns
 */
async function createActiveLead(req, res) {
  try {
    const { projectReq, attachmentIds, budget, source, sourceFrom, title, clientLocation, phoneNumber, jobTypeId,
      clientName, clientEmail, ticketId, ticketUrl } = req.body;
    // const leadScore = await checkLeadScore(req.body);
    // console.log("leadScore", leadScore)

    let j = await JobModel.create({
      projectReq: projectReq,
      attachmentIds: attachmentIds,
      budget: budget,
      source: source,
      otherSource: sourceFrom,
      jobStatus: stages.Active,
      browserInfo: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      userId: req.userId,
      title: title,
      clientLocation: clientLocation,
      phoneNumber: phoneNumber,
      jobTypeId: jobTypeId ? jobTypeId : null,
      clientName: clientName,
      clientEmail: clientEmail,
      ticketId: ticketId,
      ticketUrl: ticketUrl,
      // score: leadScore,
    });
    const leadScore = await checkLeadScore(req.body, j?._id);
    await JobModel.findOneAndUpdate({ _id: j?._id }, { $set: { score: leadScore } });

    createLeadActivity({
      title: `Lead created. Source - ${source}`,
      userId: req.userId,
      jobId: j._id,
      browserInfo: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
    return helper.responseObj(res, statusCode.OK, {}, messages.JOBCREATED);
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
  }
}

/**
 * @description Update other source job
 * @param {*} req
 * @param {*} res
 * @returns
 */
async function editOtherSourceLead(req, res) {
  try {
    const { jobId, projectReq, budget, attachmentIds, sourceFrom, source, title, clientLocation, phoneNumber, jobTypeId,
      clientName, clientEmail, ticketId, ticketUrl } = req.body;
    // console.log(jobId, projectReq, budget, attachmentIds, sourceFrom, source);
    let jobExists = await JobModel.findOne({ _id: jobId });
    const leadScore = await checkLeadScore(req.body, jobExists?._id);


    if (!jobExists) {
      return res.status(404).send({ message: "Job not found" });
    }

    if (jobExists) {
      if (projectReq) {
        jobExists.projectReq = projectReq;
      }
      if (budget) {
        jobExists.budget = budget;
      }
      if (attachmentIds) {
        jobExists.attachmentIds = attachmentIds;
      }
      if (sourceFrom) {
        jobExists.sourceFrom = sourceFrom;
      }
      if (source) {
        jobExists.source = source;
      }
      //add new fields
      if (title) {
        jobExists.title = title;
      }
      if (clientLocation) {
        jobExists.clientLocation = clientLocation;
      }
      if (phoneNumber) {
        jobExists.phoneNumber = phoneNumber;
      }
      if (jobTypeId) {
        jobExists.jobTypeId = jobTypeId;
      }
      if (clientName) {
        jobExists.clientName = clientName;
      }
      if (clientEmail) {
        jobExists.clientEmail = clientEmail;
      }
      if (ticketId) {
        jobExists.ticketId = ticketId;
      }
      if (ticketUrl) {
        jobExists.ticketUrl = ticketUrl;
      }
      // const leadScore = await checkLeadScore(req.body);
      // console.log("leadScore", leadScore)
      if (leadScore >= 0) jobExists.score = leadScore;

      await jobExists.save();
      return res.status(200).send({ message: "Update successfully" });
    }
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
  }
}

/**
 * @description delete job document
 * @param {*} req
 * @param {*} res
 * @returns
 */
async function deleteJobDoc(req, res) {
  try {
    let { docId, jobId } = req.body;
    let jobExists = await JobModel.findOne(
      {
        _id: new mongoose.Types.ObjectId(jobId),
        source: { $ne: Sources.Upwork },
      },
      {
        source: 1,
        attachmentIds: 1,
      }
    );
    if (jobExists) {
      let attachmentIds = jobExists.attachmentIds.map((e) => e.toString());
      if (attachmentIds.includes(docId)) {
        let file = await FileModel.findOne({
          _id: new mongoose.Types.ObjectId(docId),
        });
        if (file) {
          fs.unlink(file.path, (err) => {
            console.log("File deleted");
          });
          await FileModel.deleteOne({
            _id: new mongoose.Types.ObjectId(docId),
          });
          attachmentIds = attachmentIds.filter((e) => e != docId);
          jobExists.attachmentIds = attachmentIds;
          await jobExists.save();
          return res.status(200).send({ message: "Document removed." });
        } else {
          return res.status(400).send({ message: "Doument not found" });
        }
      } else {
        return res.status(400).send({ message: "Doument not found" });
      }
    } else {
      return res.status(400).send({ message: messages.JOBIDNF });
    }
  } catch (error) { }
}

async function validateJobURL(url) {
  try {
    let spllited = url.split("/");
    if (spllited && spllited.length === 5) {
      let id = spllited[4];
      if (id.startsWith("~")) {
        return id;
      } else {
        return Promise.reject(new Error("Invalid job URL"));
      }
    } else {
      return Promise.reject(new Error("Invalid job URL"));
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

async function addClientDetails(req, res) {
  try {
    const { jobId, email, firstName, lastName, fullName } = req.body;
    let jobExists = await JobModel.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
    });
    if (jobExists) {
      if (!jobExists.contactId) {
        let c = await ContactModel.findOne({ email: email });
        if (c) {
          // c.firstName = firstName;
          // c.lastName = lastName;
          c.fullName = fullName,
            await c.save();
          jobExists.contactId = c._id;
          await jobExists.save();
        } else {
          let c = await ContactModel.create({
            email: email,
            // firstName: firstName,
            // lastName: lastName,
            fullName: fullName
          });
          jobExists.contactId = c._id;
          await jobExists.save();
        }
        createLeadActivity({
          title: `Client details updated.`,
          userId: req.userId,
          jobId: jobExists._id,
          description: `Client - ${fullName}`,
          browserInfo: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });
        return helper.responseObj(
          res,
          statusCode.OK,
          {},
          "Client details added."
        );
      } else {
        return helper.responseObj(
          res,
          statusCode.BAD_REQUEST,
          {},
          messages.CONTACTEXISTS
        );
      }
    } else {
      return helper.responseObj(
        res,
        statusCode.BAD_REQUEST,
        {},
        messages.JOBIDNF
      );
    }
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
  }
}

// async function addJob(req, res) {
//     try {
//         const { jobId } = req.body;
//         const jobExists = await JobModel.findOne({ jobId: jobId });
//         if (jobExists) {
//             return helper.responseObj(
//                 res,
//                 statusCode.BAD_REQUEST,
//                 {},
//                 messages.JOBEXISTS
//             );
//         }

//         const statusId = await LeadStatusModel.findOne({}, "_id");
//         if (statusId && statusId?._id) {
//             await JobModel.create({
//                 ...req.body,
//                 userId: req.userId,
//                 bidTime: new Date(),
//                 statusId: statusId?._id,
//                 browserInfo: {
//                     ip: req.ip,
//                     userAgent: req.headers["user-agent"],
//                 },
//             });
//             return helper.responseObj(res, statusCode.OK, {}, messages.JOBCREATED);
//         } else {
//             return helper.responseObj(
//                 res,
//                 statusCode.NO_CONTENT,
//                 {},
//                 messages.STATUS_NOT_ADDED_BY_ADMIN
//             );
//         }
//     } catch (error) {
//         console.log("err->", error);
//         return helper.responseObj(
//             res,
//             statusCode.INTERNAL_SERVER_ERROR,
//             {},
//             error.message
//         );
//     }
// }
// function getAccessTokenSecretPair(api, callback) {
//   // get authorization url
//   api.getAuthorizationUrl(
//     "http://localhost/complete",
//     function (error, url, requestToken, requestTokenSecret) {
//       if (error)
//         throw new Error("can not get authorization url, error: " + error);
//       debug(requestToken, "got a request token");
//       debug(requestTokenSecret, "got a request token secret");

//       // authorize application
//       var i = rl.createInterface(process.stdin, process.stdout);
//       i.question(
//         "Please, visit an url " + url + " and enter a verifier: ",
//         function (verifier) {
//           i.close();
//           process.stdin.destroy();
//           debug(verifier, "entered verifier is");

//           // get access token/secret pair
//           api.getAccessToken(
//             requestToken,
//             requestTokenSecret,
//             verifier,
//             function (error, accessToken, accessTokenSecret) {
//               if (error) throw new Error(error);

//               debug(accessToken, "got an access token");
//               debug(accessTokenSecret, "got an access token secret");

//               callback(accessToken, accessTokenSecret);
//             }
//           );
//         }
//       );
//     }
//   );
// }
// (function main() {
//     // uncomment only if you want to use your own client
//     // make sure you know what you're doing
//     // var client = new MyClient(config);
//     // var api = new UpworkApi(null, client);

//     // use a predefined client for OAuth routine
//     var api = new UpworkApi(config);

//     if (!config.accessToken || !config.accessSecret) {
//         // run authorization in case we haven't done it yet
//         // and do not have an access token-secret pair
//         getAccessTokenSecretPair(api, function (accessToken, accessTokenSecret) {
//             debug(accessToken, 'current token is');
//             // store access token data in safe place!

//             // get my auth data
//             getUserData(api, function (error, data) {
//                 debug(data, 'response');
//                 console.log('Hello: ' + data.auth_user.first_name);
//             });
//         });
//     } else {
//         // setup access token/secret pair in case it is already known
//         api.setAccessToken(config.accessToken, config.accessSecret, function () {
//             // get my auth data
//             getUserData(api, function (error, data) {
//                 debug(data, 'response');
//                 // server_time
//                 console.log('Hello: ' + data.auth_user.first_name);
//             });
//         });
//     }
// })();

async function JobsList(req, res) {
  try {
    let {
      page,
      search,
      limit,
      sortBy,
      sortOrder,
      jobId,
      profileId,
      userId,
      jobStatus,
      source,
      date,
      // selectedDate,
      location,
      jobType,
      paymentMethod,
      startUTCHours,
      endUTCHours,
      reasonId,
      managerId,
      scoreRange,
    } = req.body;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (
      sortBy === "createdAt" ||
      sortBy === "updatedAt" ||
      sortBy === "bidTime" ||
      sortBy === "jobStatus"
    ) {
      if (sortOrder === "ASC") {
        sortOrder = 1;
      } else {
        sortOrder = -1;
      }
    } else {
      sortBy = "createdAt";
      sortOrder = -1;
    }
    let query = { isDeleted: { $ne: true } };
    if (jobId) {
      query.jobId = jobId;
    }
    if (profileId) {
      query.profileId = ObjectId(profileId);
    }
    if (userId) {
      query.userId = ObjectId(userId);
    }
    if (jobStatus) {
      // console.log("jobStatus", jobStatus);
      if (Array.isArray(jobStatus) && jobStatus.length > 0) {
        query.jobStatus = { $in: jobStatus };
      }
    }

    if (source) {
      query.source = source;
    }
    if (location) {
      query.clientLocation = location;
    }
    if (jobType) {
      query.jobTypeId = { $in: [jobType] };
    }
    if (paymentMethod) {
      query.clientPaymentMethod = paymentMethod;
    }
    if (reasonId) {
      query.reasonId = ObjectId(reasonId);
    }

    // Score range filter
    if (scoreRange) {
      const [minScore, maxScore] = scoreRange.split('/').map(Number);
      if (!isNaN(minScore) && !isNaN(maxScore)) {
        query["score"] = { $gte: minScore, $lte: maxScore };
      }
    }

    //start filter date code
    // Date filtering logic based on the selected date
    // if (date) {
    //   const today = new Date();
    //   let startDate, endDate;

    //   switch (date) {
    //     case "Today":
    //       startDate = new Date(today); //.setHours(0, 0, 0, 0)
    //       endDate = new Date(today);  //.setHours(23, 59, 59, 999)
    //       break;
    //     case "Yesterday":
    //       today.setDate(today.getDate() - 1);
    //       startDate = new Date(today); //.setHours(0, 0, 0, 0)
    //       endDate = new Date(today);  //.setHours(23, 59, 59, 999)
    //       break;
    //     case "LastWeek":
    //       // Get start and end of last week
    //       const lastWeekStart = new Date();
    //       lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
    //       const lastWeekEnd = new Date(lastWeekStart);
    //       lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    //       startDate = lastWeekStart;
    //       endDate = lastWeekEnd;
    //       break;
    //     case "ThisWeek":
    //       // Get start and end of this week
    //       const thisWeekStart = new Date();
    //       thisWeekStart.setDate(today.getDate() - today.getDay());
    //       const thisWeekEnd = new Date(thisWeekStart);
    //       thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    //       startDate = thisWeekStart;
    //       endDate = thisWeekEnd;
    //       break;
    //     case "Custom":
    //       if (selectedDate) {
    //         const [start, end] = selectedDate.split(" / ");
    //         startDate = new Date(start);
    //         endDate = new Date(end);
    //       }
    //       break;
    //     default:
    //       break;
    //   }

    //   // if (startDate && endDate) {
    //   if (startDate && endDate) {
    //     startDate.setUTCHours(0, 0, 0, 0);
    //     endDate.setUTCHours(23, 59, 59, 999);
    //     console.log("startDate", startDate, "endDate", endDate)
    //     query["$and"] = [
    //       { createdAt: { $gte: startDate } },
    //       { createdAt: { $lte: endDate } },
    //     ];
    //   }
    //   // }
    // }
    //close fitler date code


    //filter by date range 
    if (date) {
      const [start, end] = date.split(' / ');
      // console.log("start", start, "end", end)
      startDate = new Date(start);
      endDate = new Date(end);
      // console.log("startDate", startDate, "endDate", endDate)
      query["$and"] = [
        { createdAt: { $gte: startDate } },
        { createdAt: { $lte: endDate } },
      ];
    }

    if (req.roleName === Roles.Employee) {
      // query.userId = ObjectId(req.userId);
      const todoList = await toDoModel.find(
        { assignUserId: ObjectId(req.userId) },
        "job_id"
      );
      let arr = [];
      arr = todoList.map((e) => e.job_id);
      query["$or"] = [{ userId: ObjectId(req.userId) }, { _id: { $in: arr } }];
    }
    if (managerId) {
      const managerJobs = await LeadManagerModel.find(
        { managerId: ObjectId(managerId) },
        "jobId"
      );
      // console.log("managerJobs", managerJobs)
      let arr = [];
      arr = managerJobs.map((e) => e.jobId);
      query["$or"] = [{ _id: { $in: arr } }]; //{ userId: ObjectId(req.userId) }, 
    }

    //Search by Job Title and JobId
    if (search && search.trim()) {
      // console.log("Searchffffffffff", search)
      query["$or"] = [
        { title: { $regex: search.trim(), $options: "i" } },
        { jobId: { $regex: search.trim(), $options: "i" } },
        { projectReq: { $regex: search.trim(), $options: "i" } }
      ];
      const { title } = query["$or"][0];
      // console.log(`Title: ${JSON.stringify(title)}`);
    }

    // if (startUTCHours && endUTCHours) {
    //   if (startUTCHours < endUTCHours) {
    //     query["$expr"] = {
    //       $and: [
    //         {
    //           $gte: [{ $hour: "$createdAt" }, startUTCHours]
    //         },
    //         {
    //           $lte: [{ $hour: "$createdAt" }, endUTCHours]
    //         }
    //       ]
    //     }
    //   } else {
    //     query["$expr"] = {
    //       $or: [
    //         {
    //           $gte: [{ $hour: "$createdAt" }, startUTCHours]
    //         },
    //         {
    //           $lte: [{ $hour: "$createdAt" }, endUTCHours]
    //         }
    //       ]
    //     }
    //   }
    // }





    // console.log("dddddddddddddddddd", query)
    // console.log("pageTYpe", typeof (page));

    if (startUTCHours && endUTCHours) {
      if (startUTCHours < endUTCHours) {
        query["$expr"] = {
          $and: [
            {
              $gte: ["$jobUTCHour", startUTCHours]
            },
            {
              $lte: ["$jobUTCHour", endUTCHours]
            }
          ]
        }
      } else {
        query["$expr"] = {
          $or: [
            {
              $gte: ["$jobUTCHour", startUTCHours]
            },
            {
              $lte: ["$jobUTCHour", endUTCHours]
            }
          ]
        }
      }
    }

    let jobs = await JobModel.aggregate([
      // Add the hour field first, before $facet
      {
        $addFields: {
          jobUTCHour: { $dateToString: { format: "%H:%M", date: "$createdAt" } }
          // hour: { $hour: "$createdAt" },
          // minute: { $minute: "$createdAt" }
        },
      },
      {
        $facet: {
          count: [
            { $match: query },
            {
              $count: "count",
            },
          ],
          records: [
            { $match: query },
            { $sort: { [sortBy]: sortOrder } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "users",
              },
            },
            {
              $unwind: {
                path: "$users",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "jobtypes",
                localField: "jobTypeId",
                foreignField: "_id",
                as: "jobtype",
              },
            },
            {
              $unwind: {
                path: "$jobtype",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "profiles",
                let: { profileId: "$profileId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$profileId"],
                      },
                    },
                  },
                  {
                    $project: {
                      userName: 1,
                    },
                  },
                ],

                as: "profile",
              },
            },
            //add new code 
            {
              $lookup: {
                from: "contacts",
                let: { "contactId": "$contactId" },
                as: "contactId",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$_id', '$$contactId'
                        ]
                      }
                    }
                  },
                  {
                    $project: {
                      firstName: 1,
                      lastName: 1,
                      email: 1,
                      fullName: 1,
                      url: 1,
                    }
                  }
                ]
              }
            },
            {
              $unwind: {
                path: "$contactId",
                preserveNullAndEmptyArrays: true
              }
            },
            //close
            {
              $unwind: {
                path: "$profile",
                preserveNullAndEmptyArrays: true,
              },
            },

            // New lookup: Fetch scores from `leadscores`
            {
              $lookup: {
                from: "leadscores",
                let: { jobId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$jobId", "$$jobId"] }
                    }
                  },
                  {
                    $lookup: {
                      from: "leadevaluations",
                      localField: "parameterId",
                      foreignField: "_id",
                      as: "evaluation"
                    }
                  },
                  {
                    $unwind: {
                      path: "$evaluation",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                  {
                    $group: {
                      _id: "$jobId",
                      budgetScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "budgetRange"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      hourlyRateScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "hourlyRateRanges"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      hireRateScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "hireRate"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      reviewsScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "reviews"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      averageJobSpentScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "averageJobSpent"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      paymentMethodScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "paymentMethod"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      phoneNumberScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "phoneNumber"] },
                            "$score",
                            0
                          ]
                        }
                      },
                      countryScore: {
                        $sum: {
                          $cond: [
                            { $eq: ["$evaluation.type", "country"] },
                            "$score",
                            0
                          ]
                        }
                      }
                    }
                  }
                ],
                as: "scores"
              }
            },
            { $unwind: { path: "$scores", preserveNullAndEmptyArrays: true } },

            // Final projection
            {
              $project: {
                hireRate: 1,
                clientHourlyBudget: 1,
                scores: 1,
                score: 1,
                jobtype: 1,
                profile: 1,
                jobId: 1,
                jobUrl: 1,
                title: 1,
                clientEmail: 1,
                phoneNumber: 1,
                ticketId: 1,
                ticketUrl: 1,
                source: 1,
                otherSource: 1,
                projectReq: 1,
                budget: 1,
                jobType: 1,
                jobTypeId: 1,
                profileId: 1,
                contractType: 1,
                contractLength: 1,
                clientExpectedPayngingRate: 1,
                bidPrice: 1,
                coverLetter: 1,
                boosted: 1,
                bidTime: 1,
                totalConnectUsed: 1,
                clientLocation: 1,
                clientTotalInvest: 1,
                clientPaymentMethod: 1,
                clientPhoneNumber: 1,
                clientRating: 1,
                clientJobsCount: 1,
                description: 1,
                statusId: 1,
                totalBoostedConnectUsed: 1,
                userName: {
                  $concat: ["$users.firstName", " ", "$users.lastName"],
                }, //"$users.userName",
                jobStatus: 1,
                updatedAt: 1,
                createdAt: 1,
                clientName: 1,
                contactId: 1,
                hour: 1,
                minute: 1,
              },
            },
          ],
        },
      },
    ]);
    // console.log("Jobss......", jobs);
    if (jobs && jobs.length) {
      let dataa = jobs[0];
      let total = 0;
      if (dataa.count && dataa.count.length) {
        total = dataa.count[0].count;
      }
      // Log the hour of each job
      // dataa.records.forEach(job => {
      //   console.log(`Created At Hour: ${job.hour} minutes ${job.minute}`);
      // });
      return helper.responseObj(
        res,
        statusCode.OK,
        {
          jobs: dataa.records,
          total: total,
        },
        ""
      );
    }
    return helper.responseObj(
      res,
      statusCode.OK,
      {
        jobs: [],
        total: 0,
      },
      ""
    );
  } catch (error) {
    console.log("Errr=>", error);
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

async function deleteJob(req, res) {
  try {
    const { id } = req.body;
    let job = await JobModel.findOne({
      _id: ObjectId(id),
    });

    let jobStatus = job.jobStatus;
    if (jobStatus !== "Booked") {
      return helper.errorObj(
        res,
        statusCode.BAD_REQUEST,
        messages.JobDeleteStatusErr
      );
    }
    if (job) {
      if (job.isDeleted) {
        return helper.errorObj(
          res,
          statusCode.BAD_REQUEST,
          messages.JOBALREADYDELETED
        );
      }
      if (req.roleName === Roles.Manager) {
        if (!job.userId.equals(req.userId)) {
          let mUser = await User.findOne({
            _id: job.userId,
            sid: ObjectId(req.userId),
          });
          if (!mUser) {
            //can't edit job
            return helper.errorObj(
              res,
              statusCode.BAD_REQUEST,
              messages.JOBIDNF
            );
          }
        }
      } else if (req.roleName === Roles.Employee) {
        if (!job.userId.equals(req.userId)) {
          //can't edit
          return helper.errorObj(
            res,
            statusCode.BAD_REQUEST,
            messages.JOB_UNAUTH
          );
        }
      }


      // let deleteResponse = await JobModel.updateOne({ _id: ObjectId(id) },{ isDeleted: true });
      let deleteResponse = await JobModel.deleteOne({ _id: ObjectId(id) });


      if (deleteResponse.acknowledged) {
        return helper.responseObj(
          res,
          statusCode.OK,
          {},
          messages.JOBDELETEDBYID
        );
      } else {
        return helper.errorObj(
          res,
          statusCode.BAD_REQUEST,
          messages.SOMETHING_WENT_WRONG
        );
      }
    } else {
      // not found
      return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
    }
  } catch (error) {
    // console.log("Catch Block Delete Jobs....");
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

async function updateJob(req, res) {
  try {
    const {
      id,
      title,
      jobType,
      jobTypeId,
      profileId,
      contractType,
      contractLength,
      clientExpectedPayngingRate,
      bidPrice,
      coverLetter,
      boosted,
      totalConnectUsed,
      clientLocation,
      clientTotalInvest,
      clientPaymentMethod,
      clientPhoneNumber,
      clientRating,
      clientJobsCount,
      description,
      totalBoostedConnectUsed,
      hireRate,
      clientHourlyBudget,
      clientMemberSince,
      jobPostedOn,
      budget
    } = req.body;

    let job = await JobModel.findOne({ _id: ObjectId(id) });
    const leadScore = await checkLeadScore(req.body, job?._id);
    // console.log(" score update lleads ===", leadScore)

    // createLeadScore(job?._id).then(console.log("lead score created successfully")).catch(console.log("lead score create error"));

    if (job) {
      if (req.roleName === Roles.Employee) {
        if (!job.userId.equals(req.userId)) {
          //can't edit
          return helper.errorObj(
            res,
            statusCode.BAD_REQUEST,
            messages.JOB_UNAUTH
          );
        }
      }
      //update here

      let updateObj = {};

      if (title) updateObj.title = title;
      if (jobType) updateObj.jobType = jobType;
      if (jobTypeId) updateObj.jobTypeId = jobTypeId;
      if (profileId) updateObj.profileId = profileId;
      if (contractType) updateObj.contractType = contractType;
      if (contractLength) updateObj.contractLength = contractLength;
      if (clientExpectedPayngingRate)
        updateObj.clientExpectedPayngingRate = clientExpectedPayngingRate;
      if (bidPrice) updateObj.bidPrice = bidPrice;
      if (coverLetter) updateObj.coverLetter = coverLetter;
      if (boosted) updateObj.boosted = boosted;
      if (hireRate) updateObj.hireRate = hireRate;

      //if (clientHourlyBudget) 
      updateObj.clientHourlyBudget = clientHourlyBudget;

      if (totalConnectUsed) updateObj.totalConnectUsed = totalConnectUsed;
      if (clientLocation) updateObj.clientLocation = clientLocation;
      if (clientTotalInvest) updateObj.clientTotalInvest = clientTotalInvest;
      if (clientPaymentMethod)
        updateObj.clientPaymentMethod = clientPaymentMethod;
      if (clientPhoneNumber) updateObj.clientPhoneNumber = clientPhoneNumber;
      if (clientRating) updateObj.clientRating = clientRating;
      if (clientJobsCount) updateObj.clientJobsCount = clientJobsCount;
      if (description) updateObj.description = description;
      if (totalBoostedConnectUsed) {
        updateObj.totalBoostedConnectUsed = totalBoostedConnectUsed;
      }

      // add new fields 
      if (clientMemberSince) updateObj.clientMemberSince = clientMemberSince;
      if (jobPostedOn) updateObj.jobPostedOn = jobPostedOn;
      if (leadScore >= 0) updateObj.score = leadScore;
      // if (budget)
      updateObj.budget = budget;


      if (
        job.jobStatus === stages.Booked &&
        coverLetter &&
        coverLetter.trim()
      ) {
        updateObj.jobStatus = stages.Submitted;
        createLeadActivity({
          title: "Added cover letter",
          userId: req.userId,
          jobId: job._id,
          browserInfo: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });
      }

      let updateJobResponse = await JobModel.updateOne(
        { _id: ObjectId(id) },
        updateObj
      );

      if (updateJobResponse.acknowledged) {
        return helper.responseObj(
          res,
          statusCode.OK,
          {},
          messages.JOBUPDATEDSUCCESS
        );
      }
    } else {
      // not found
      return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
    }
  } catch (error) {
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

async function updateJobStatus(req, res) {
  try {
    const { id, jobStatus, commentJob } = req.body;

    // jobStatusOrder

    const job = await JobModel.findOne({ _id: ObjectId(id) });

    if (job) {
      //check if this belongs to him if employee
      if (req.roleName === Roles.Employee) {
        if (!job.userId.equals(req.userId)) {
          //can't edit
          return helper.errorObj(
            res,
            statusCode.BAD_REQUEST,
            messages.JOB_UNAUTH
          );
        }
      }
      // My lead closed
      if (isMyLeadClosed(job.jobStatus)) {
        return helper.errorObj(
          res,
          statusCode.BAD_REQUEST,
          messages.JOBALREADYCLOSED
        );
      }
      // CURRENT STATUS SAME ?
      else if (isCurrentStatusSame(job.jobStatus, jobStatus)) {
        return helper.errorObj(
          res,
          statusCode.BAD_REQUEST,
          messages.JOBSTATUSALREADYSAME
        );
      }
      // REQUESTED STATUS INACTIVE ?
      else if (isRequestStatusINACTIVE(jobStatus)) {
        let updateResponse = await JobModel.updateOne(
          { _id: ObjectId(id) },
          { jobStatus: jobStatus }
        );
        if (updateResponse.acknowledged) {
          return helper.responseObj(
            res,
            statusCode.OK,
            {},
            messages.JOBSTATUSCHANGE
          );
        }
      }
      // CURRENT STATUS INACTIVE
      else if (isCurrentStatusINACTIVE(job.jobStatus)) {
        if (isRequestStatusACTIVE(jobStatus)) {
          let updateResponse = await JobModel.updateOne(
            { _id: ObjectId(id) },
            { jobStatus: jobStatus }
          );
          if (updateResponse.acknowledged) {
            return helper.responseObj(
              res,
              statusCode.OK,
              {},
              messages.JOBSTATUSCHANGE
            );
          }
        } else {
          return helper.errorObj(
            res,
            statusCode.BAD_REQUEST,
            messages.JOBSTATUSORDERERR
          );
        }
      }
      // CHECK ORDER
      else {
        // check update status order
        checkStatusUpdateOrder(
          job.jobStatus,
          jobStatus,
          async (err, success) => {
            if (err) {
              return helper.errorObj(
                res,
                statusCode.BAD_REQUEST,
                messages.JOBSTATUSORDERERR
              );
            } else {
              let updateResponse = await JobModel.updateOne(
                { _id: ObjectId(id) },
                { jobStatus: jobStatus, commentJob: commentJob }
              );
              if (updateResponse.acknowledged) {
                return helper.responseObj(
                  res,
                  statusCode.OK,
                  {},
                  messages.JOBSTATUSCHANGE
                );
              }
            }
          }
        );
      }
    } else {
      return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
    }
  } catch (error) {
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

async function viewByIdJob(req, res) {
  try {
    const { id } = req.params;

    let job = await JobModel.aggregate([
      {
        $match: { _id: ObjectId(id), isDeleted: { $ne: true } },
      },
      // JobTypes
      {
        $lookup: {
          from: "jobtypes",
          let: { myjobId: "$jobTypeId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$myjobId"],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: "jobTypeDetail",
        },
      },
      {
        $unwind: {
          path: "$jobTypeDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      //Job Status
      {
        $lookup: {
          from: "jobstatuses",
          let: { mystatusId: "$statusId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$mystatusId"],
                },
              },
            },
            {
              $project: {
                name: 1,
                order: 1,
              },
            },
          ],
          as: "jobStatusObj",
        },
      },
      {
        $unwind: {
          path: "$jobStatusObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      // profile
      {
        $lookup: {
          from: "profiles",
          let: { myProfileId: "$profileId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$myProfileId"],
                },
              },
            },
            {
              $project: {
                userName: 1,
              },
            },
          ],
          as: "profileDetail",
        },
      },
      {
        $unwind: {
          path: "$profileDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      // users
      {
        $lookup: {
          from: "users",
          let: { myUserId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$myUserId"],
                },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      //contact
      {
        $lookup: {
          from: "Contact",
          localField: "contactId",
          foreignField: "_id",
          as: "contactDetails",
        },
      },
      {
        $unwind: {
          path: "$contactDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (job && job.length) {
      if (req.roleName === Roles.Employee) {
      }
      if (job[0].source != Sources.Upwork) {
        if (job[0].attachmentIds && job[0].attachmentIds.length) {
          let attachments = await FileModel.find(
            { _id: { $in: job[0].attachmentIds } },
            { name: 1, path: 1, createdAt: 1 }
          );
          job[0].attachments = attachments;
        }
      }
      return helper.responseObj(
        res,
        statusCode.OK,
        job[0],
        messages.DATA_FETCHED
      );
    } else {
      //not found
      return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
    }
  } catch (error) {
    console.log("Err=>", error);
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

function getAccessTokenPair(api, callback) {
  // start Code Authorization Grant
  debug("getting access/refresh token pair");
  // get authorization url
  var url = api.getAuthorizationUrl(config.redirectUri);
  debug(url, "got authorization url");

  // authorize application
  var i = rl.createInterface(process.stdin, process.stdout);
  i.question(
    "Please, visit an url " + url + " and enter a verifier: ",
    function (authzCode) {
      i.close();
      process.stdin.destroy();
      debug(authzCode, "entered verifier is");

      // console.log("authzCode=>", authzCode);

      // get access token/secret pair
      api.getToken(authzCode, function (error, accessToken) {
        if (error) console.log("error->", error);
        console.log("error->", error);
        console.log("accessToken=>", accessToken);
        debug(accessToken, "got an access token");
        callback(accessToken);
      });
    }
  );
  // end Code Authorization Grant

  // start Client Credentials Grant
  // debug('getting access token pair');
  // api.getToken("", function(error, accessToken) {
  // if (error) throw new Error(error);

  // debug(accessToken, 'got an access token');
  // callback(accessToken);
  // });
  // end Client Credentials Grant
}
async function fetchDataFromUpworkByJobId(req, res) {
  try {
    const { id } = req.params;

    let api = new UpworkApi(config);
    if (!config.accessToken || !config.refreshToken) {
      // run authorization in case we haven't done it yet
      // and do not have an access/refresh token pair
      getAccessTokenPair(api, function (tokenPair) {
        debug(tokenPair.access_token, "current access token is");
        // store access/refresh token data in the safe place!

        api.setNewAccessTokenPair(tokenPair, function (tokenPair) {
          // get my auth data
          getUserData(api, (data) => {
            debug(data, "response");
            console.log("Hello: " + data.auth_user.first_name);
          });
        });
      });
    } else {
      // setup access/refresh token pair in case it is already known
      api.setAccessToken(function (tokenPair) {
        // get my auth data
        debug(tokenPair.access_token, "current access token is");
        // WARNING: the access token will be refreshed automatically for you
        // in case it's expired, i.e. expires_at < time(). Make sure you replace the
        // old token accordingly in your security storage. Simply, compare the old
        // access token with the new one returned in tokenPair to sync-up the data
        getUserData(api, (data) => {
          // first_name
          console.log("Hello: " + data.auth_user.first_name);
        });
        sendMessageToRoom(api, (data) => {
          // do smth here with the data
          console.log(data);
        });
        sendGraphqlQuery(api, (data) => {
          // do smth here with the data
          console.log(data);
        });
      });
    }
  } catch (error) {
    console.log("err=>", error);
    return helper.responseObj(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      {},
      error.message
    );
  }
}

/**
 * @description Move job to Active or Inactive
 * @param {*} req
 * @param {*} res
 * @returns
 */
async function moveToActiveInactive(req, res) {
  try {
    const { id, status, comment, email, fullName, url, reason } = req.body; //firstName, lastName,
    const jobExists = await JobModel.findOne(
      { _id: ObjectId(id) },
      { jobStatus: 1, _id: 1, userId: 1 }
    );
    if (jobExists) {
      if (req.roleName === Roles.Employee || req.roleName === Roles.BA) {
        if (!jobExists.userId.equals(req.userId)) {
          //can't edit
          return helper.errorObj(
            res,
            statusCode.BAD_REQUEST,
            messages.JOB_UNAUTH
          );
        }
      }
      let jobCurrentStatus = jobExists.jobStatus;
      if (jobCurrentStatus === stages.Booked) {
        return res
          .status(400)
          .send({
            message:
              "Job cannot be moved to Active. Please add the cover letter first",
          });
      }
      let statusIn = [stages.Submitted, stages.Active, stages.Inactive];
      if (statusIn.includes(jobCurrentStatus)) {
        jobExists.jobStatus = status;
        jobExists.clientName = `${fullName}`; //  ${firstName} ${lastName ? lastName : ""}
        jobExists.reasonId = reason || null,
          jobExists.statusChangeDate = new Date();
        if (email) {
          let c = await ContactModel.findOne({ email: email });
          if (c) {
            // c.firstName = firstName;
            // c.lastName = lastName;
            c.fullName = fullName;
            c.url = url;
            await c.save();
            jobExists.contactId = c._id;
          } else {
            let c = await ContactModel.create({
              email: email,
              // firstName: firstName,
              // lastName: lastName,
              fullName: fullName,
              url: url
            });
            jobExists.contactId = c._id;
          }
        }
        await jobExists.save();
        createLeadActivity({
          title: `Updated the status from <b>${jobCurrentStatus}</b> to <b>${status}</b>`,
          userId: req.userId,
          jobId: jobExists._id,
          description: comment,
          browserInfo: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });
        if (status == stages.Active) {
          //send mail to manager
          sendMailToManagers(jobExists._id);
        }
        return res.status(200).send({ message: messages.JOBSTATUSCHANGE });
      } else {
        return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
      }
    } else {
      return helper.errorObj(res, statusCode.BAD_REQUEST, messages.JOBIDNF);
    }
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);
  }
}

async function sendMailToManagers(leadId) {
  try {
    RoleModel.findOne({ name: Roles.Manager }).then((role) => {
      User.find({ roleId: role._id }, { firstName: 1, email: 1 })
        .then((managers) => {
          EmailTemplateModel.findOne({ slug: emailTempleteSlug.LEAD_ACTIVE })
            .then((template) => {
              managers.forEach((manager) => {
                const variables = {
                  "{{subject}}": template.subject,
                  "{{logo}}": config.env.frontendURL + config.env.logoPath,
                  "{{project}}": config.env.projectName,
                  "{{name}}": manager.firstName,
                  "{{token}}":
                    config.env.frontendURL + `${Roles.Manager}/lead/${leadId}`,
                  "{{YEAR}}": `${new Date().getFullYear()}`,
                };
                let newTemplate = replaceVariablesInTemplate(
                  template.html,
                  variables
                );
                let subject = replaceVariablesInTemplate(
                  template.subject,
                  variables
                );
                sendMail(
                  manager.email.toLowerCase(),
                  newTemplate,
                  subject,
                  []
                ).catch((e) => {
                  console.log(e);
                });
              });
            })
            .catch((e) => {
              console.log("Error while finding template", e);
            });
        })
        .catch((er) => { });
    });
  } catch (error) { }
}

/**
 * @description Create a function to get all details about the job url
 * @param {*} req   
 * @returns as the string contenet to get job url
 */

/////////////////////=============================
async function fetchJobFromUpwork(req, res) {
  try {
    let { url } = req.body;
    const { scraperController, browserInstance } = require("../../services/fetchFromUpwork"); //../../services/fetchFromUpwork.js

    let details = await scraperController(browserInstance, url);
    // Close the browser instance by resolving the Promise    
    // await browserInstance.then(browser => browser.close());
    // await browserInstance.close();
    // await browserInstance.browser.close();
    // res.status(200).json({Data:details})
    // await scraperController(browserInstance.close());
    // await browserInstance.disconnect();
    return res.status(200).send({ data: details, response: "Job details successfully filled" });
  } catch (error) {
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error.message);

  }
}

/**
 * @description get job type by names or not exits then create 
 */
// const getJobTypeByName = async (req, res) => {
//   try {
//     const { name } = req.body;

//     let jobType = await JobTypeModel.findOne({ name: name }, { _id: 1, name: 1 });

//     if (!jobType) {
//       jobType = await JobTypeModel.create({ name: name, status: 'Active' })

//       jobType = { _id: jobType?._id, name: jobType?.name };

//       // console.log("New job type created:", jobType);
//     }

//     res.status(200).send({ data: jobType });

//   } catch (error) {
//     console.error('Error fetching or saving job type:', error);
//     res.status(500).send({ message: 'Internal server error' });
//   }
// };
const getJobTypesByName = async (req, res) => {
  try {
    const { names } = req.body;

    const existingJobTypes = await JobTypeModel.find({ name: { $in: names } })
      .select('_id name');

    const existingJobTypeMap = existingJobTypes.reduce((acc, jobType) => {
      acc[jobType.name] = jobType;
      return acc;
    }, {});

    const jobTypesToCreate = names.filter((name) => !existingJobTypeMap[name]);

    // Create new job types for names that don't exist
    const createdJobTypes = await JobTypeModel.insertMany(
      jobTypesToCreate.map((name) => ({ name }))
    );

    const result = [
      ...existingJobTypes,
      ...createdJobTypes.map((jobType) => ({ _id: jobType._id, name: jobType.name }))
    ];

    return helper.responseObj(res, statusCode.OK, result, 'Job types fetched successfully');

  } catch (error) {
    console.error('Error fetching or saving job types:', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
};

/**
 * @description get all reasons list
 */
const getReasonsLlist = async (req, res) => {
  try {
    const reasonsList = await LeadReasonsModel.find({}, { reason: 1 });
    // if (!reasonsList.length) {
    //   res.status(statusCode.BAD_REQUEST).send({ message: 'No reasons found ' });
    // }
    return helper.responseObj(res, statusCode.OK, reasonsList, 'Reasons fetched successfully');
  } catch (error) {
    console.error('Error fetching the reasons', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
}

/**
 * @description create a messages and rooms
 */
const manageRoomAndMessage = async (req, res) => {
  try {
    const { name, jobId, message, messageBy, lastDate, clientName } = req.body;

    let lDate = new Date(lastDate);

    let room = await RoomModel.findOne({ jobId }); //clientName

    if (!room) {
      room = await RoomModel.create({ name: name, jobId, clientName });
    }

    await MessageModel.deleteMany({ lastDate: lDate });

    const newMessage = await MessageModel.create({ jobId, message, messageBy, lastDate: lDate });

    // let data = [room, newMessage]

    return helper.responseObj(res, statusCode.OK, newMessage, `Message for room '${room.name}' created successfully.`);
  } catch (error) {
    console.error('Error fetching the reasons', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
}

/**
 * @description save rooms with multiple messages
 */
const manageRoomAndMessages = async (req, res) => {
  try {
    const { messages, jobId, lastdate, name, clientName } = req.body;

    const jobExists = await JobModel.exists({ _id: jobId });

    if (!jobExists) {
      return res.status(statusCode.BAD_REQUEST).send({ message: 'Job does not exist. Please create it first.' });
    }

    const lastDateObj = new Date(lastdate);

    // await MessageModel.deleteMany({ lastDate: lastDateObj });
    // Fetch existing messages for the specific date
    let existingMessages = await MessageModel.find({ jobId: jobExists?._id, lastDate: lastDateObj });
    // console.log("exitstngMessages", existingMessages)
    // Extract existing message texts to avoid duplicates
    let existingTexts = new Set(existingMessages.map(msg => msg.message));

    let room = await RoomModel.findOneAndUpdate(
      { jobId },
      { $setOnInsert: { name, jobId, clientName: clientName } },
      { new: true, upsert: true }
    );

    const messageDocs = messages
      .filter(({ text }) => !existingTexts.has(text))
      .map(({ client, text, time }) => ({
        jobId,
        message: text,
        messageBy: client,
        lastDate: lastDateObj,
        time,
        lastMessageSyncedBy: req?.userName,
      }));

    if (messageDocs.length) {
      await MessageModel.insertMany(messageDocs);
    }

    createLeadActivity({
      title: `New message sync from <b>${req?.userName}</b>`,
      userId: req?.userId,
      jobId: jobExists?._id,
      description: `${req?.userName} has sent a new message regarding the job.`,
      browserInfo: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    return helper.responseObj(res, statusCode.OK, {}, `Messages for room ${room?.name} created successfully.`);
  } catch (error) {
    console.error('Error processing messages', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
};

/**
 * @description get jobs by titile
 */
const getJobByTitle = async (req, res) => {
  try {
    const { title } = req.body;
    const job = await JobModel.findOne({ title: title }, { _id: 1 });

    if (!job) {
      return helper.responseObj(res, statusCode.BAD_REQUEST, {}, 'Job not found.');
    }
    let msgLastDate = await MessageModel.findOne({ jobId: job?._id }).sort({ createdAt: -1 }).select('lastDate jobId -_id')

    if (!msgLastDate) {
      msgLastDate = { jobId: job?._id, lastDate: "" };
      // return helper.responseObj(res, statusCode.BAD_REQUEST, {}, 'Message not found.');
    }

    return helper.responseObj(res, statusCode.OK, msgLastDate);
  } catch (error) {
    console.error('Error fetching the reasons', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
}

/**
 * @description get job chat by id
 */
const getJobChat = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await RoomModel.aggregate([
      {
        $match: { jobId: new ObjectId(id) }
      },
      {
        $lookup: {
          from: "messages",
          localField: "jobId",
          foreignField: "jobId",
          as: "messages"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          clientName: 1,
          messages: {
            message: 1,
            messageBy: 1,
            lastDate: 1,
            createdAt: 1,
            time: 1,
            lastMessageSyncedBy: 1
          }
        }
      },
      {
        $unwind: {
          path: "$messages",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { "messages.lastDate": 1 }
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          clientName: { $first: "$clientName" },
          messages: { $push: "$messages" }
        }
      },
    ]);

    // if (!result.length) {
    //   return helper.responseObj(res, statusCode.BAD_REQUEST, {}, 'Room or messages not found.');
    // }

    return helper.responseObj(res, statusCode.OK, result, "Fetched all messages successfully");
  } catch (error) {
    console.error('Error fetching the reasons', error);
    return helper.responseObj(res, statusCode.BAD_REQUEST, {}, error?.message);
  }
}

/**
 * @description global serach 
 */
async function globalSearch(req, res) {
  try {
    let { searchKeyword } = req.params;

    const regexPattern = new RegExp(searchKeyword.trim(), "i");

    const roleQueryMatch = {};
    if (req.roleName === Roles.Employee) {
      roleQueryMatch.userId = ObjectId(req.userId);
    }

    const searchResults = await JobModel.aggregate([
      {
        $match: roleQueryMatch
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $lookup: {
          from: "contacts",
          localField: "contactId",
          foreignField: "_id",
          as: "contactData"
        }
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$contactData", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          fullName: { $concat: ["$userData.firstName", " ", "$userData.lastName"] },
          contactFullName: { $ifNull: ["$contactData.fullName", ""] },
        }
      },
      {
        $match: {
          $or: [
            { title: { $regex: regexPattern } },
            { "userData.firstName": { $regex: regexPattern } },
            { "userData.lastName": { $regex: regexPattern } },
            { clientName: { $regex: regexPattern } },
            { fullName: { $regex: regexPattern } },
            { "contactData.firstName": { $regex: regexPattern } },
            { "contactData.lastName": { $regex: regexPattern } },
            { contactFullName: { $regex: regexPattern } }
          ]
        }
      },
      {
        $project: {
          _id: 0,
          jobId: "$_id",
          jobTitle: "$title",
          clientName: "$clientName",
          userFullName: {
            $concat: ["$userData.firstName", " ", "$userData.lastName"]
          },
          // clientFullName: "$contactFullName"
          clientFullName: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$contactFullName", null] },
                  { $eq: ["$contactFullName", ""] }
                ]
              },
              then: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$contactData.firstName", ""] },
                      " ",
                      { $ifNull: ["$contactData.lastName", ""] }
                    ]
                  }
                }
              },
              else: "$contactFullName"
            }
          }
        }
      }
    ]);

    return helper.responseObj(res, statusCode.OK, searchResults, "Global search results fetched successfully.");
  } catch (err) {
    console.error("Global Search Error =>", err);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, "Something went wrong.");
  }
}

/**
 * @description get lead id by grpah data
 */
const getLeadGraphData = async (req, res) => {
  try {
    const { id } = req.params;

    const leadScores = await LeadScoresModel.aggregate([
      {
        $match: { jobId: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "leadevaluations",
          localField: "parameterId",
          foreignField: "_id",
          as: "parameter"
        }
      },
      {
        $unwind: "$parameter"
      },
      {
        $project: {
          _id: 0,
          type: "$parameter.type",
          score: 1
        }
      },
      {
        $group: {
          _id: "$type",
          totalScore: { $sum: "$score" }
        }
      },
      {
        $sort: { totalScore: -1 }
      }
    ]);

    if (!leadScores.length) {
      console.log("No lead scores found for the given job ID.");
      return helper.responseObj(res, statusCode.OK, []);
    }

    // Format response for bar chart
    const formattedData = {
      labels: leadScores.map(item => item._id),
      datasets: [
        {
          label: "Lead Scores",
          data: leadScores.map(item => item.totalScore)
        }
      ]
    };

    return helper.responseObj(res, statusCode.OK, formattedData);
  } catch (error) {
    console.error("Error fetching lead graph data:", error);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, "Something went wrong.");
  }
};


/**
 * @description global serach 
 */
async function recalculateLeadScores(req, res) {
  try {
    const leads = await JobModel.find({}, {
      hireRate: 1,
      clientHourlyBudget: 1,
      clientRating: 1,
      budget: 1,
      clientTotalInvest: 1,
      clientJobsCount: 1,
      clientPaymentMethod: 1,
      clientPhoneNumber: 1,
      clientLocation: 1
    });

    // console.log("leads count", leads.count());
    if (!leads || leads.length === 0) {
      return helper.responseObj(res, statusCode.OK, {}, "No leads found for recalculating scores.");
    }

    // Process each lead and recalculate the score
    // await Promise.all(
    //   leads.map(async (lead) => {
    //     let leadScores = await checkLeadScore(lead.toObject(), lead._id);
    //     await JobModel.findOneAndUpdate({ _id: lead?._id }, { $set: { score: leadScores } })
    //   })
    // );

    //Each lead updates
    const bulkUpdates = await Promise.all(
      leads.map(async (lead) => {
        const leadScores = await checkLeadScore(lead.toObject({ getters: true }), lead._id);
        return {
          updateOne: {
            filter: { _id: lead._id },
            update: { $set: { score: leadScores } },
          },
        };
      })
    );

    // Execute updates
    if (bulkUpdates.length > 0) {
      await JobModel.bulkWrite(bulkUpdates);
    }

    return helper.responseObj(res, statusCode.OK, {}, "All Leads Score Re-Calculated successfully.");
  } catch (err) {
    console.error("Error in reCalculateLeadsScore:", err);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, "Something went wrong.");
  }
}

/**
 * @description add job sumery detials
 */
function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}
function formatDateOnly(date) {
  return new Date(date).toISOString().split('T')[0];
}
const addJobSummary = async (req, res) => {
  try {
    const {
      jobId,
      contractType,
      milestones = [],
      crDetails = [],
      // hourlyDetails = [],
      weeklyProgress = [],
      upAmount,
      upStatus,
      upDate,
      totalBilling,
      hourlyRate,
      weeklyBuildHours,
      upTransactionId,
      // lastWeekBilling,
      totalCost,
      upPaymentSource,
      upPaymentMode,
      upCompanyName
      //for hourly schema fields
    } = req.body;

    // Fetch existing job summary (if any)
    const existingSummary = await JobSummaryModel.findOne({ jobId });

    if (existingSummary) {
      return helper.responseObj(
        res,
        statusCode.BAD_REQUEST,
        {},
        `Finance summary already exists for jobId: ${jobId}.`
      );
    }

    const jobSummaryData = {
      jobId,
      contractType,
      upAmount,
      upStatus,
      upDate,
      totalBilling,
      hourlyRate,
      weeklyBuildHours,
      upTransactionId,
      upPaymentSource,
      upPaymentMode,
      upCompanyName,
      // lastWeekBilling,
      totalCost,
      milestones, //: [],
      crDetails, //: [],
      weeklyProgress: [],
    };

    if (contractType === 'Hourly') {
      const seenWeeks = new Set();

      // const validWeeklyProgress = weeklyProgress.filter(
      //   (entry) =>
      //     entry &&
      //     entry.hours !== null &&
      //     entry.hours !== '' &&
      //     entry.from &&
      //     entry.to
      // );
      const validWeeklyProgress = weeklyProgress.filter((entry) => {
        return (
          entry &&
          typeof entry.hours === 'number' &&
          !isNaN(entry.hours) &&
          entry.from &&
          entry.to &&
          !isNaN(new Date(entry.from).getTime()) &&
          !isNaN(new Date(entry.to).getTime())
        );
      });
      // console.log("validWeeklyProgress", validWeeklyProgress)



      for (const entry of weeklyProgress) {
        const fromDate = new Date(entry.from);
        const toDate = new Date(entry.to);

        if (fromDate > toDate) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `'From' date (${formatDateOnly(entry.from)}) must be before 'To' date (${formatDateOnly(entry.to)})`
          );
        }

        const diffInDays = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        // console.log("diffInDays", diffInDays)
        if (diffInDays > 7) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `Weekly progress range must be within 7 days. Got ${diffInDays} days from ${formatDateOnly(entry.from)} to ${formatDateOnly(entry.to)}`
          );
        }

        const weekKey = getWeekKey(fromDate);
        if (seenWeeks.has(weekKey)) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `Weekly progress already exists for the week of ${entry.from}`
          );
        }

        seenWeeks.add(weekKey);
      }
      jobSummaryData.weeklyProgress = validWeeklyProgress;
    }

    // if (contractType === 'Fixed' || contractType === 'Fixed Price') {
    //   // const milestoneRanges = [];
    //   for (let i = 0; i < milestones.length; i++) {
    //     const milestone = milestones[i];
    //     const start = new Date(milestone.startDate);
    //     // const end = new Date(milestone.endDate);
    //     const end = milestone.endDate ? new Date(milestone.endDate) : null;
    //     // console.log("endDate", i + 1, end);
    //     const paymentDate = milestone?.paymentDate ? new Date(milestone.paymentDate) : null;

    //     // if (end && start >= end) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `Milestone '${milestone.milestoneName || `#${i + 1}`}' start date (${formatDateOnly(milestone.startDate)}) must be before end date (${formatDateOnly(milestone.endDate)}).`
    //     //   );
    //     // }

    //     // Validate paymentDate >= startDate
    //     // if (paymentDate && paymentDate < start) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `Milestone '${milestone.milestoneName || `#${i + 1}`}' payment date (${formatDateOnly(milestone.paymentDate)}) cannot be before start date (${formatDateOnly(milestone.startDate)}).`
    //     //   );
    //     // }

    //     // for (const [existingStart, existingEnd] of milestoneRanges) {
    //     //   // const isOverlap = start <= existingEnd && end >= existingStart;
    //     //   const isOverlap = end
    //     //     ? start <= existingEnd && end >= existingStart
    //     //     : start <= existingEnd && start >= existingStart;
    //     //   if (isOverlap) {
    //     //     return helper.responseObj(
    //     //       res,
    //     //       statusCode.BAD_REQUEST,
    //     //       {},
    //     //       `Milestone '${milestone.milestoneName || `#${i + 1}`}' has a start or end date that already exists in another milestone (from ${existingStart.toDateString()} to ${existingEnd.toDateString()}).`
    //     //     );
    //     //   }
    //     // }

    //     // milestoneRanges.push([start, end ?? start]);
    //   }

    //   // const seenCRDateRanges = new Set();
    //   for (let i = 0; i < crDetails.length; i++) {
    //     const cr = crDetails[i];
    //     const crStart = new Date(cr.startDate);
    //     // const crEnd = new Date(cr.endDate);
    //     const crEnd = cr.endDate ? new Date(cr.endDate) : null;
    //     const paymentDate = cr?.paymentDate ? new Date(cr.paymentDate) : null;



    //     // if (crEnd && crStart >= crEnd) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `CR detail '${cr?.name || `#${i + 1}`}' start date (${formatDateOnly(cr.startDate)}) must be before end date (${formatDateOnly(cr.endDate)}).`
    //     //   );
    //     // }

    //     // Validate paymentDate >= startDate
    //     // if (paymentDate && paymentDate < crStart) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `Change Request '${cr?.name || `#${i + 1}`}' payment date (${formatDateOnly(cr?.paymentDate)}) cannot be before start date (${formatDateOnly(cr?.startDate)}).`
    //     //   );
    //     // }

    //     // const rangeKey = crEnd ? `${crStart.toISOString()}_${crEnd.toISOString()}` : `${crStart.toISOString()}}`;
    //     // if (seenCRDateRanges.has(rangeKey)) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `Duplicate CR request found with the same date range (${cr.startDate} to ${cr.endDate}). Please remove or update one of them.`
    //     //   );
    //     // }
    //     // seenCRDateRanges.add(rangeKey);
    //   }

    //   jobSummaryData.milestones = milestones;
    //   jobSummaryData.crDetails = crDetails;
    // }


    // if (contractType === 'Hourly') {
    //   jobSummaryData.weeklyProgress = weeklyProgress; //;
    // }

    await JobSummaryModel.create(jobSummaryData);

    return helper.responseObj(res, statusCode.OK, {}, 'Finance summary added successfully.');
  } catch (error) {
    console.error('Add Job Summary Error:', error);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, 'Something went wrong.');
  }
};

const getPreviousWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = (day + 6) % 7;

  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - diffToMonday - 1);

  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);

  return {
    start: new Date(lastMonday.setHours(0, 0, 0, 0)),
    end: new Date(lastSunday.setHours(23, 59, 59, 999))
  };
};

const getJobSummary = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("jobId", id);

    const jobSummary = await JobSummaryModel.find({ jobId: ObjectId(id) });


    const pWeek = getPreviousWeek();
    // console.log("pWeek", pWeek)

    const allWeeklyProgress = jobSummary.flatMap(summary => summary.weeklyProgress || []);
    // console.log("allWeeklyProgress", allWeeklyProgress)

    const lastWeekBilling = allWeeklyProgress.find(item => {
      const from = new Date(item.from);
      const to = new Date(item.to);

      return (
        (from >= pWeek.start && from <= pWeek.end) ||
        (to >= pWeek.start && to <= pWeek.end)
      );
    });
    // console.log("matchwiil", latWeekBilling)
    if (jobSummary?.length > 0) {
      jobSummary[0] = {
        ...jobSummary[0]?._doc,
        lastWeekBilling: lastWeekBilling?.hours || 0
      };
    }
    // console.log("jobSummary", jobSummary)

    return helper.responseObj(res, statusCode.OK, jobSummary, 'Finance Summary fetched successfully.');
  } catch (error) {
    console.error('Add Job Summary Error:', error?.message);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, 'Something went wrong.');
  }
}
/**
 * @description update job summery detials
 */

const updateJobSummary = async (req, res) => {
  try {
    const {
      jobId,
      contractType,
      milestones,
      crDetails,
      weeklyProgress,
      upAmount,
      upStatus,
      upDate,
      upTransactionId,
      totalBilling,
      // lastWeekBilling,
      hourlyRate,
      weeklyBuildHours,
      totalCost,
      upPaymentSource,
      upPaymentMode,
      upCompanyName,
    } = req.body;

    // Fetch existing job summary
    const existingSummary = await JobSummaryModel.findOne({ jobId });

    if (!existingSummary) {
      return helper.responseObj(res, statusCode.NOT_FOUND, {}, 'Finance summary not found.');
    }

    // Validate and prepare new weeklyProgress data if contract is Hourly
    let updatedWeeklyProgress = existingSummary.weeklyProgress;

    if (contractType === 'Hourly' && Array.isArray(weeklyProgress)) {
      const seenWeeks = new Set();

      const validProgress = weeklyProgress.filter(
        (entry) =>
          entry &&
          entry.hours !== null &&
          entry.hours !== '' &&
          entry.from &&
          entry.to
      );

      for (const entry of validProgress) {
        const fromDate = new Date(entry.from);
        const toDate = new Date(entry.to);

        if (fromDate > toDate) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `'From' date (${formatDateOnly(entry?.from)}) must be before 'To' date (${formatDateOnly(entry?.to)})`
          );
        }

        //date range does not exceed 7 days (including from & to)
        const diffInDays = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        console.log("diffInDays", diffInDays)
        if (diffInDays > 7) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `Weekly progress range must be within 7 days. Got ${diffInDays} days from ${formatDateOnly(entry?.from)} to ${formatDateOnly(entry?.to)}`
          );
        }

        const weekKey = getWeekKey(fromDate);
        if (seenWeeks.has(weekKey)) {
          return helper.responseObj(
            res,
            statusCode.BAD_REQUEST,
            {},
            `Weekly progress already exists for the week of ${formatDateOnly(entry?.from)}`
          );
        }

        seenWeeks.add(weekKey);
      }

      updatedWeeklyProgress = validProgress;
    }

    //for fixed valditon 
    // if (contractType === 'Fixed' || contractType === 'Fixed Price') {
    //   // const milestoneRanges = [];
    //   for (let i = 0; i < milestones.length; i++) {
    //     const milestone = milestones[i];
    //     const start = new Date(milestone.startDate);
    //     // const end = new Date(milestone.endDate);
    //     const end = milestone.endDate ? new Date(milestone.endDate) : null;
    //     const paymentDate = milestone?.paymentDate ? new Date(milestone.paymentDate) : null;

    //     if (end && start >= end) {
    //       return helper.responseObj(
    //         res,
    //         statusCode.BAD_REQUEST,
    //         {},
    //         `Milestone '${milestone.milestoneName || `#${i + 1}`}' start date (${formatDateOnly(milestone.startDate)}) must be before end date (${formatDateOnly(milestone.endDate)}).`
    //       );
    //     }

    //     if (paymentDate && (paymentDate < start)) {
    //       return helper.responseObj(
    //         res,
    //         statusCode.BAD_REQUEST,
    //         {},
    //         // `Milestone '${milestone.milestoneName || `#${i + 1}`}' payment date (${milestone.paymentDate}) must be within the milestone start (${milestone.startDate}) and end (${milestone.endDate}) dates.`
    //         `Milestone '${milestone.milestoneName || `#${i + 1}`}' payment date (${formatDateOnly(milestone.paymentDate)}) cannot be before start date (${formatDateOnly(milestone.startDate)}).`
    //       );
    //     }

    //     // for (const [existingStart, existingEnd] of milestoneRanges) {
    //     //   // const isOverlap = start <= existingEnd && end >= existingStart;
    //     //   const isOverlap = end
    //     //     ? start <= existingEnd && end >= existingStart
    //     //     : start <= existingEnd && start >= existingStart;
    //     //   if (isOverlap) {
    //     //     return helper.responseObj(
    //     //       res,
    //     //       statusCode.BAD_REQUEST,
    //     //       {},
    //     //       `Milestone '${milestone.milestoneName || `#${i + 1}`}' has a date range already exists in another milestone (from ${existingStart.toDateString()} to ${existingEnd.toDateString()}).`
    //     //     );
    //     //   }
    //     // }

    //     // milestoneRanges.push([start, end]);
    //   }

    //   // const seenCRDateRanges = new Set();
    //   for (let i = 0; i < crDetails.length; i++) {
    //     const cr = crDetails[i];
    //     const crStart = new Date(cr.startDate);
    //     // const crEnd = new Date(cr.endDate);
    //     const crEnd = cr.endDate ? new Date(cr.endDate) : null;
    //     const paymentDate = cr?.paymentDate ? new Date(cr.paymentDate) : null;

    //     if (crEnd && crStart >= crEnd) {
    //       return helper.responseObj(
    //         res,
    //         statusCode.BAD_REQUEST,
    //         {},
    //         `CR detail '${cr.title || `#${i + 1}`}' start date (${formatDateOnly(cr.startDate)}) must be before end date (${formatDateOnly(cr.endDate)}).`
    //       );
    //     }

    //     // Validate paymentDate >= startDate
    //     if (paymentDate && paymentDate < crStart) {
    //       return helper.responseObj(
    //         res,
    //         statusCode.BAD_REQUEST,
    //         {},
    //         `Change Request '${cr?.name || `#${i + 1}`}' payment date (${formatDateOnly(cr?.paymentDate)}) cannot be before start date (${formatDateOnly(cr?.startDate)}).`
    //       );
    //     }

    //     // const rangeKey = `${crStart.toISOString()}_${crEnd.toISOString()}`;
    //     // const rangeKey = crEnd ? `${crStart.toISOString()}_${crEnd.toISOString()}` : `${crStart.toISOString()}}`;
    //     // if (seenCRDateRanges.has(rangeKey)) {
    //     //   return helper.responseObj(
    //     //     res,
    //     //     statusCode.BAD_REQUEST,
    //     //     {},
    //     //     `Duplicate CR request found with the same date range (${cr.startDate} to ${cr.endDate}). Please remove or update one of them.`
    //     //   );
    //     // }

    //     // seenCRDateRanges.add(rangeKey);
    //   }
    // }


    // Prepare updated fields
    const updateData = {
      contractType: contractType || existingSummary.contractType,
      upAmount: upAmount ?? existingSummary.upAmount,
      upStatus: upStatus ?? existingSummary.upStatus,
      upDate: upDate ?? existingSummary.upDate,
      upTransactionId: upTransactionId ?? existingSummary?.upTransactionId,
      upPaymentSource: upPaymentSource ?? existingSummary?.upPaymentSource,
      upPaymentMode: upPaymentMode ?? existingSummary?.upPaymentMode,
      upCompanyName: upCompanyName ?? existingSummary?.upCompanyName,
      totalBilling: totalBilling ?? existingSummary.totalBilling,
      // lastWeekBilling: lastWeekBilling ?? existingSummary?.lastWeekBilling,
      hourlyRate: hourlyRate ?? existingSummary.hourlyRate,
      weeklyBuildHours: weeklyBuildHours ?? existingSummary.weeklyBuildHours,
      totalCost: totalCost ?? existingSummary.totalCost,
      milestones:
        contractType === 'Fixed' || contractType === 'Fixed Price' ? milestones ?? existingSummary.milestones : [],
      crDetails:
        contractType === 'Fixed' || contractType === 'Fixed Price' ? crDetails ?? existingSummary.crDetails : [],
      weeklyProgress:
        contractType === 'Hourly' ? updatedWeeklyProgress : [],
    };

    // Update the job summary
    await JobSummaryModel.updateOne({ jobId }, { $set: updateData });

    // if project closed then user update finanace summary project open agian
    const job = await JobModel.findById(jobId);
    if (job) {
      if (job?.projectClosed === true) {
        job.projectClosed = false;
        await job.save();
        console.log(`ProjectClosed updated to false for JobID: ${jobId}`);
      }
    }

    return helper.responseObj(res, statusCode.OK, {}, 'Finance summary updated successfully.');
  } catch (error) {
    console.error('Update Job Summary Error:', error);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, 'Something went wrong.');
  }
};


/**
 * @description mark as project closed
 */
closeProjectByJobId = async (req, res) => {
  try {
    const { jobId, projectClosed } = req.body;

    const isAlreadyClosed = await JobModel.findOne({ _id: ObjectId(jobId), projectClosed: true });

    if (isAlreadyClosed) {
      return helper.errorObj(res, statusCode.NOT_FOUND, "This project has already been marked as closed.");
    }

    const job = await JobModel.findOneAndUpdate(
      { _id: ObjectId(jobId) },
      { projectClosed },
      { new: true }
    );

    if (!job) {
      return helper.errorObj(res, statusCode.NOT_FOUND, "Job not found.");
    }

    return helper.responseObj(res, statusCode.OK, job, "Project has been successfully marked as closed.");
  } catch (error) {
    console.error("Close Project Error:", error.message);
    return helper.errorObj(res, statusCode.INTERNAL_SERVER_ERROR, "Something went wrong.");
  }
};

/**
 * @description get finance summary list
 */
const financeSummaryList = async (req, res) => {
  try {
    let { page, limit, type, projectStatus } = req.body;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const matchStage = {};

    // Filter by contract type
    if (type === 'Hourly' || type === 'Fixed') {
      matchStage.contractType = type;
    }

    const aggregationPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job'
        }
      },
      { $unwind: '$job' }
    ];

    // Filter by projectStatus (based on JobModel.projectClosed)
    if (projectStatus === 'Ongoing') {
      aggregationPipeline.push({
        $match: {
          $or: [
            { 'job.projectClosed': { $ne: true } },
            { 'job.projectClosed': { $exists: false } }
          ]
        }
      });
    } else if (projectStatus === 'MarkAsClosed') {
      aggregationPipeline.push({
        $match: { 'job.projectClosed': true }
      });
    }

    // Pagination
    aggregationPipeline.push(
      { $sort: { _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Projection
    aggregationPipeline.push({
      $project: {
        _id: 1,
        contractType: 1,
        totalCost: 1,
        jobId: 1,
        jobTitle: '$job.title',
        clientName: '$job.clientName',
        description: '$job.description',
        preReq: '$job.preReq',
        clientContactId: '$job.clientContactId',
        projectClosed: '$job.projectClosed',
      }
    });

    const deals = await DealClosedStatModel.aggregate(aggregationPipeline);

    const countPipeline = [...aggregationPipeline];
    countPipeline.splice(-3); // remove pagination stages
    countPipeline.push({ $count: 'total' });

    const countResult = await DealClosedStatModel.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    const results = [];

    for (const deal of deals) {
      // console.log("deal", deal)
      // Fetch job summaries for calculating paid/pending amounts
      const summaries = await JobSummaryModel.find({ jobId: deal.jobId }).lean();

      let totalPaid = 0;
      let totalPending = 0;

      summaries.forEach(summary => {
        if (summary.upStatus === 'Paid') {
          totalPaid += summary.upAmount || 0;
        } else if (summary.upStatus === 'Pending') {
          totalPending += summary.upAmount || 0;
        }

        (summary.milestones || []).forEach(ms => {
          if (ms.paymentStatus === 'Paid') {
            totalPaid += ms.amount || 0;
          } else if (ms.paymentStatus === 'Pending') {
            totalPending += ms.amount || 0;
          }
        });

        (summary.crDetails || []).forEach(cr => {
          if (cr.status === 'Paid') {
            totalPaid += cr.amount || 0;
          } else if (cr.status === 'Pending') {
            totalPending += cr.amount || 0;
          }
        });
      });

      // Fetch client contact name
      let contactName = '';
      if (deal.clientContactId) {
        const contact = await ContactModel.findById(deal.clientContactId).lean();
        if (contact) {
          contactName = contact.firstName && contact.lastName
            ? `${contact.firstName} ${contact.lastName}`
            : contact.fullName || '';
        }
      }

      results.push({
        _id: deal?.jobId,
        title: deal?.jobTitle,
        description: deal?.description,
        preReq: deal?.projectReq,
        clientName: contactName,
        jobClientName: deal?.clientName,
        totalPaid,
        totalPending,
        totalCost: deal?.totalCost,
        projectClosed: deal?.projectClosed,
        contractType: deal?.contractType
      });
    }

    return helper.responseObj(
      res,
      statusCode.OK,
      {
        total: totalCount,
        page,
        limit,
        data: results
      },
      'Finance summary fetched successfully.'
    );
  } catch (error) {
    console.error('Finance Summary Error:', error);
    return helper.responseObj(res, statusCode.INTERNAL_SERVER_ERROR, null, 'Error fetching job summaries.');
  }
};

module.exports = {
  financeSummaryList,
  closeProjectByJobId,
  updateJobSummary,
  getJobSummary,
  addJobSummary,
  recalculateLeadScores,
  // addJob,
  getLeadGraphData,
  globalSearch,
  manageRoomAndMessages,
  getJobChat,
  bookJob,
  updateJob,
  fetchDataFromUpworkByJobId,
  JobsList,
  viewByIdJob,
  deleteJob,
  updateJobStatus,
  moveToActiveInactive,
  addClientDetails,
  createActiveLead,
  deleteJobDoc,
  editOtherSourceLead,
  fetchJobFromUpwork,
  jobDetailsExists,
  getJobTypesByName,
  getReasonsLlist,
  manageRoomAndMessage,
  getJobByTitle

};
