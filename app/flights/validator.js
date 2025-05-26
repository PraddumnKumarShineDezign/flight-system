const { body, param, validationResult } = require("express-validator");
const { statusCode } = require("../../helper/statusCodes.js");
const { Sources } = require("../../constants/global.js");
const { isDate } = require("validator");

const addJob = [
    // body("jobId")
    //     .trim()
    //     .not()
    //     .isEmpty()
    //     .withMessage("Please provide Job Id")
    //     .isLength({ max: 50 })
    //     .withMessage("Job Id should be less than 50"),
    body("jobUrl")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job URL")
        .isLength({ max: 500 })
        .withMessage("Job Id should be less than 500")
        .isURL()
        .withMessage('Url seems invalid'),

    body("title")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide job title")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 200 })
        .withMessage("Job title should be less than 200"),

    body("hireRate")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide job title")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 200 })
        .withMessage("Hire Length should be less than 10"),

    body("jobType")
        .trim()
        .optional()
        .isIn(["invited", "public"])
        .withMessage("Please provide correct client status"),


    body("jobTypeId")
        .optional({ checkFalsy: true, nullable: true })
        .isArray()
        .withMessage("Please provide the job type array"),
    // .isArray({ min: 1 })
    // .withMessage("Please provide atleast one element in job type array")
    // .not()
    // .isEmpty()
    // .withMessage("Please provide the job type array"),

    body("profileId")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide profile Id")
        .optional({ checkFalsy: true, nullable: true })
        .isMongoId()
        .withMessage("Invalid profile Id"),

    body("contractType")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide Contract Type")
        .optional({ checkFalsy: true, nullable: true })
        // .isIn(["Ongoing project", "One-time project
        // .isIn(["Ongoing project", "One-time project"]
        .isIn(["Hourly", "Fixed Price"])
        .withMessage("Please provide the correct contract type"),

    body("contractLength")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide Contract Length")
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["LessThan30hours", "MoreThan30hours"])
        .withMessage("Please provide the correct contract length"),

    body("clientExpectedPayngingRate")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientExpectedPayngingRate")
        .optional({ checkFalsy: true, nullable: true })

        .isLength({ max: 50 })
        .withMessage("clientExpectedPayngingRate should be less than 50"),

    body("bidPrice")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide bidPrice")
        .optional({ checkFalsy: true, nullable: true })
        .isFloat({ min: 1, max: 1000000000000 })
        .withMessage("Invalid bidPrice"),

    body("coverLetter")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide coverLetter")
        .optional({ checkFalsy: true, nullable: true }),
    // .isLength({ max: 2000 })
    // .withMessage("coverLetter should be less than 2000"),

    body("boosted")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide boosted")
        .optional({ checkFalsy: true, nullable: true })
        .isBoolean()
        .withMessage("Invalid boosted"),

    body("totalBoostedConnectUsed")
        .if(body("boosted").equals("true"))
        .not()
        .isEmpty()
        .withMessage("Please provide total Boosted Connect")
        .isInt()
        .withMessage("Invalid total Boosted Connect"),

    body("totalConnectUsed")
        .if(body("jobType").equals("public"))
        .not()
        .isEmpty()
        .withMessage("Please provide totalConnectUsed")
        .isInt({ min: 0 })
        .withMessage("Invalid totalConnectUsed"),

    body("clientLocation")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientLocation")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 100 })
        .withMessage("clientLocation should be less than 100"),

    body("clientTotalInvest")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientTotalInvest")
        .optional({ checkFalsy: true, nullable: true }),
    // .isFloat({ min: 0 })
    // .withMessage("Invalid clientTotalInvest"),

    body("clientPaymentMethod")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientPaymentMethod")
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["Verified", "Not-Verified"])
        .withMessage("Invalid clientPaymentMethod"),

    body("clientPhoneNumber")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientPhoneNumber")
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["Verified", "Not-Verified"])
        .withMessage("Invalid clientPhoneNumber"),

    body("clientRating")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientRating")
        .optional({ checkFalsy: true, nullable: true })
        .isFloat({ min: 0, max: 5 })
        .withMessage("Invalid clientRating"),

    body("clientJobsCount")
        // .trim()
        // .not()
        // .isEmpty()
        // .withMessage("Please provide clientJobsCount")
        .optional({ checkFalsy: true, nullable: true })
        .isInt({ min: 0 })
        .withMessage("Invalid clientJobsCount"),

    body("description")
        .optional({ checkFalsy: true, nullable: true }),
    // .isLength({ max: 2000 })
    // .withMessage("Description length should not be more than 2000"),
    body("jobPostedOn")
        .optional({ checkFalsy: true, nullable: true }),
    // .isISO8601().withMessage('Job posted date must be a valid date format (e.g., YYYY-MM-DD)'),
    body("clientMemberSince")
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601().withMessage('Client member since date must be a valid date format (e.g., YYYY-MM-DD)')
];


const deleteJobDoc = [
    body("docId")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide docId")
        .isMongoId()
        .withMessage("Invalid docId"),
    body("jobId")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide jobId")
        .isMongoId()
        .withMessage("Invalid jobId"),
];

const addOutSourceJob = [
    body("projectReq")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide project requirement")
        .isLength({ max: 2000 })
        .withMessage("Project requirement should not exceed 2000 character"),
    body("budget")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide budget")
        .isFloat({ min: 1, max: 10000000 })
        .withMessage("Invalid budget value"),

    body("source")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide source")
        .isIn([Sources.Email, Sources.Other, Sources.SocialMedia, Sources.Website])
        .withMessage("Invalid Source"),

    body("sourceFrom")
        .if(body('source').equals(Sources.Other))
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide sourceFrom"),

    body("attachmentIds")
        .optional()
        .isArray()
        .withMessage("Invalid attachmentIds"),

    body("attachmentIds.*")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide attachmentIds")
        .isMongoId()
        .withMessage('Invalid attachmentid'),

    //add new validation 31-dec
    body('title')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isString()
        .withMessage('Title cannot contain only spaces'),
    body("clientLocation")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 100 })
        .withMessage("clientLocation should be less than 100"),

    body('phoneNumber')
        .optional({ checkFalsy: true, nullable: true })
        .matches(/^[0-9()+-\s]*$/)
        .withMessage(
            'Please enter a valid phone number. Only numbers, spaces, and the characters +, -, () are allowed.'
        )
        .isLength({ max: 30 })
        .withMessage('The phone number cannot exceed 30 characters.'),


    body('clientName')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isString()
        .withMessage('Invalid client name format'),
    body('clientEmail')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isEmail()
        .withMessage('Invalid client email format'),
    body('ticketId')
        .optional({ checkFalsy: true, nullable: true }),
    body('ticketUrl')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isURL()
        .withMessage('Invalid ticket URL format'),
    body("jobTypeId")
        .isArray({ min: 1 })
        .withMessage("Please provide atleast one element in job type array")
        .not()
        .isEmpty()
        .withMessage("Please provide the job type array"),
];


const updateOutsourceJob = [
    body("jobId")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job Id")
        .isMongoId()
        .withMessage("Invalid id"),
    body("projectReq")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 2000 })
        .withMessage("Project requirement should not exceed 2000 character"),
    body("budget")
        .optional({ checkFalsy: true, nullable: true })
        .isFloat({ min: 1, max: 10000000 })
        .withMessage("Invalid budget value"),
    body("sourceFrom")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 500 })
        .withMessage("sourceFrom must not exceed 500 character"),

    body("attachmentIds")
        .optional()
        .isArray()
        .withMessage("Invalid attachmentIds"),

    body("attachmentIds.*")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide attachmentIds")
        .isMongoId()
        .withMessage('Invalid attachmentid'),

    //add new validation 31-dec
    body('title')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isString()
        .withMessage('Title cannot contain only spaces'),
    body("clientLocation")
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 100 })
        .withMessage("clientLocation should be less than 100"),

    body('phoneNumber')
        .optional({ checkFalsy: true, nullable: true })
        .matches(/^[0-9()+-\s]*$/)
        .withMessage(
            'Please enter a valid phone number. Only numbers, spaces, and the characters +, -, () are allowed.'
        )
        .isLength({ max: 30 })
        .withMessage(
            'The phone number cannot exceed 30 characters.'
        ),

    body('clientName')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isString()
        .withMessage('Invalid client name format'),
    body('clientEmail')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isEmail()
        .withMessage('Invalid client email format'),
    body('ticketId')
        .optional({ checkFalsy: true, nullable: true }),
    body('ticketUrl')
        .optional({ checkFalsy: true, nullable: true })
        .trim()
        .isURL()
        .withMessage('Invalid ticket URL format'),
    body("jobTypeId")
        .isArray({ min: 1 })
        .withMessage("Please provide atleast one element in job type array")
        .not()
        .isEmpty()
        .withMessage("Please provide the job type array"),
];

const moveToActiveInactive = [
    body("id")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job Id")
        .isMongoId()
        .withMessage("Invalid id"),
    body("status")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job status")
        .isIn(["Active", "Inactive"])
        .withMessage("Invalid Job Status"),
    // body('comment')
    //     .trim()
    //     .not()
    //     .isEmpty()
    //     .withMessage("Please provide comment")
    //     .isLength({ min: 5, max: 2000 })
    //     .withMessage("Comment should be in 5 and 2000"),

    body('comment')
        .trim()
        .custom((value, { req }) => {
            if (req.body.status === 'Active') {
                if (!value || value.length < 5 || value.length > 2000) {
                    throw new Error("Comment is required and should be between 5 and 2000 characters.");
                }
            }
            return true;
        }),

    body('reason')
        .trim()
        .custom((value, { req }) => {
            if (req.body.status === 'Inactive') {
                if (!value) {
                    throw new Error("Reason is required when the job status is Inactive.");
                }
            }
            return true;
        }),
    body("fullName")
        .if(body("status").equals("Active"))
        .not()
        .isEmpty()
        .withMessage("Please provide fullName")
        .isLength({ max: 200 })
        .withMessage("Fullname should not exceed 200 characters"),
    // body("lastName")
    //     .optional({ checkFalsy: true, nullable: true })
    //     .isLength({ max: 200 })
    //     .withMessage("lastName should not exceed 200 characters"),
    body("email")
        .optional({ checkFalsy: true, nullable: true })
        .isEmail()
        .withMessage("Invalid email address!"),
    // Required URL validation
    body("url")
        .if(body("status").equals("Active"))
        .not()
        .isEmpty()
        .withMessage("Message Thread URL is required")
        .isURL()  // Check if it's a valid URL
        .withMessage("The Message Thread URL is not valid")  // Custom message for invalid URL
]

const updateJob = [
    body("id")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job Id")
        .isMongoId()
        .withMessage("Invalid id"),

    // body("jobId")
    //     .trim()
    //     .optional()
    //     .isLength({ max: 50 })
    //     .withMessage("Job Id should be less than 50"),

    body("title")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 200 })
        .withMessage("Job title should be less than 200"),

    body("jobType")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["invited", "public"])
        .withMessage("Please provide correct Job type"),

    body("jobType")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["invited", "public"])
        .withMessage("Please provide correct Job type"),

    // body("jobTypeId").trim().optional({ checkFalsy: true, nullable: true }).isMongoId().withMessage("Invalid job Id"),

    body("jobTypeId")
        .optional({ checkFalsy: true, nullable: true })
        .isArray()
        .withMessage("Please provide the job type array"),
    // .isArray({ min: 1 })
    // .withMessage("Please provide atleast one element in job type array")
    // .not()
    // .isEmpty()
    // .withMessage("Please provide the job type array"),

    body("profileId")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isMongoId()
        .withMessage("Invalid profile Id"),

    body("contractType")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        // .isIn(["Ongoing project", "One-time project"])
        .isIn(["Hourly", "Fixed Price"])
        .withMessage("Please provide the correct contract type"),

    body("contractLength")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["LessThan30hours", "MoreThan30hours"])
        .withMessage("Please provide the correct contract length"),

    body("clientExpectedPayngingRate")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 50 })
        .withMessage("clientExpectedPayngingRate should be less than 50"),

    body("bidPrice")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isFloat({ min: 1, max: 1000000000000 })
        .withMessage("Invalid bidPrice"),

    body("coverLetter")
        .trim()
        .optional({ checkFalsy: true, nullable: true }),
    // .isLength({ max: 2000 })
    // .withMessage("coverLetter should be less than 2000"),

    body("boosted").trim().optional({ checkFalsy: true, nullable: true }).isBoolean().withMessage("Invalid boosted"),

    body("totalBoostedConnectUsed")
        .if(body("boosted").equals("true"))
        .not()
        .isEmpty()
        .withMessage("Please provide total Boosted Connect")
        .isInt()
        .withMessage("Invalid total Boosted Connect"),

    body("totalConnectUsed")
        .optional({ checkFalsy: true, nullable: true })
        .if(body("jobType").equals("public"))
        .not()
        .isEmpty()
        .withMessage("Please provide totalConnectUsed")
        .isInt({ min: 0 })
        .withMessage("Invalid totalConnectUsed"),

    body("clientLocation")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isLength({ max: 100 })
        .withMessage("clientLocation should be less than 100"),

    body("clientTotalInvest")
        .trim()
        .optional({ checkFalsy: true, nullable: true }),
    // .isFloat({ min: 0 })
    // .withMessage("Invalid clientTotalInvest"),

    body("clientPaymentMethod")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["Verified", "Not-Verified"])
        .withMessage("Invalid clientPaymentMethod"),

    body("clientPhoneNumber")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isIn(["Verified", "Not-Verified"])
        .withMessage("Invalid clientPhoneNumber"),

    body("clientRating")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isFloat({ min: 0, max: 5 })
        .withMessage("Invalid clientRating"),

    body("clientJobsCount")
        .trim()
        .optional({ checkFalsy: true, nullable: true })
        .isInt({ min: 0 })
        .withMessage("Invalid clientJobsCount"),

    body("description")
        .trim()
        .optional({ checkFalsy: true, nullable: true }),
    // .isLength({ max: 2000 })
    // .withMessage("Description length should not be more than 2000"),
    body("jobPostedOn")
        .optional({ checkFalsy: true, nullable: true }),
    // .isISO8601().withMessage('Job posted date must be a valid date format (e.g., YYYY-MM-DD)'),
    body("clientMemberSince")
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601().withMessage('Client member since date must be a valid date format (e.g., YYYY-MM-DD)')
];

const updateJobStatus = [
    body("id")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Id")
        .isMongoId()
        .withMessage("Invalid id"),

    body("commentJob")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide job comment")
        .isLength({ max: 500 })
        .withMessage("Job comment should be less than 500"),

    body("jobStatus")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job status")
        .isIn(["INITIAL", "ACTIVE", "INACTIVE", "WARM", "HOT", "CLOSED"])
        .withMessage("Invalid Job Status"),
];

const deleteJob = [
    body("id")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide id")
        .isMongoId()
        .withMessage("Invalid id"),
];

const JobFiltersType = [
    body("userId")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage("Invalid userId"),
    body("jobId").trim().optional({ nullable: true, checkFalsy: true }),
    // body("jobStatus")
    //     .trim()
    //     .optional({ nullable: true, checkFalsy: true })
    //     .isIn(["Active", "Inactive", "Booked", "Submitted", 'Closed', 'Negotitation(Hot)', 'Dead'])
    //     .withMessage("Invalid jobStatus"),
    body('jobStatus')
        .optional({ nullable: true })
        .isArray()
        .withMessage('jobStatus must be an array'),

    body('jobStatus.*')
        .isIn(["Active", "Inactive", "Booked", "Submitted", 'Closed', 'Negotitation(Hot)', 'Dead'])
        .withMessage('Invalid jobStatus value'),

    body("profileId")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage("Invalid profileId"),
    body("sortBy")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isIn(["createdAt", "updatedAt", "bidTime", "jobStatus"])
        .withMessage("Please provide the correct sortBy"),
    body("sortOrder")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isIn(["ASC"])
        .withMessage("Please provide the correct sortOrder"),
    body("search")
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 200 })
        .withMessage("Length should be in 2 and 200"),
    body("limit")
        .optional({ nullable: true, checkFalsy: true })
        .isInt()
        .withMessage("Please provide integer in limit"),
    body("page")
        .optional({ nullable: true, checkFalsy: true })
        .isInt()
        .withMessage("Please provide integer in page"),
    // body("date")
    //     .trim()
    //     .optional({ nullable: true, checkFalsy: true }),
    // .isIn(["Today", "Yesterday", "LastWeek", "ThisWeek", 'Custom'])
    // .withMessage("Invalid date selection"),

    // SelectedDate field validation
    // body("selectedDate")
    //     .if(body("date").equals("Custom"))
    //     .not()
    //     .isEmpty()
    //     .withMessage("Selected Date is required when Date is Custom"),
    body("date")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (!value) return true;

            const parts = value.split(" / ");
            if (parts.length !== 2) {
                throw new Error("Date must contain a start and end time separated by ' / '");
            }

            const [start, end] = parts;
            const startDate = new Date(start);
            const endDate = new Date(end);
            // console.log("startDate", startDate);
            // console.log("endDate", endDate);

            if (!isDate(startDate) || !isDate(endDate)) {
                throw new Error("Invalid date format");
            }
            return true;
        }),

    body("location")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage("Invalid location"),
    body("jobType")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage("Invalid jobType"),
    body("paymentMethod")
        .trim()
        .optional({ nullable: true, checkFalsy: true })
        .isIn(["Verified", "Not-Verified"])
        .withMessage("Invalid paymentMethod"),
];

const viewByIdType = [
    param("id")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job id")
        .isMongoId()
        .withMessage("Invalid id"),
];

const fetchDataUpworkTypes = [
    param("id").trim().not().isEmpty().withMessage("Please provide jobId"),
];
//url validation
const upworkJobUrl = [
    body("url").trim().not().isEmpty().withMessage("Please provide job url").isURL({ protocols: ['https', 'http'] }).withMessage("Please provide valid URL"),
];

const addClientTypes = [
    body("jobId")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job id")
        .isMongoId()
        .withMessage("Invalid job id"),
    body("email")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide email address")
        .isEmail()
        .withMessage("Invalid email address!"),
    body("fullName")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide fullName")
        .isLength({ max: 40 })
        .withMessage("Fullname must not exceed than 40 characters."),
    // body("firstName")
    //     .trim()
    //     .not()
    //     .isEmpty()
    //     .withMessage("Please provide firstname")
    //     .isLength({ max: 40 })
    //     .withMessage("Firstname must not exceed than 40 characters."),
    // body("lastName")
    //     .optional({ checkFalsy: true, nullable: true })
    //     .isLength({ max: 40 })
    //     .withMessage("Lastname must not exceed than 40 characters."),
]

// URL validation middleware
// const strongUrlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,2}[a-zA-Z]{2,}(\/[^\s]*)?$/;
const urlRegex = /^(https?|ftp):\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/;

const upworkJobUrlValidation = [
    body('url')
        .trim()
        .not().isEmpty().withMessage('Please provide a job URL')
        .isURL({ protocols: ['https', 'http'] }).withMessage('Please provide a valid URL')
        .matches(urlRegex)
        .withMessage('Please provide a valid URL'),
];

const jobTypesByName = [
    body("names")
        .isArray().withMessage("Names should be an array.")
        .notEmpty().withMessage("Please provide an array of job type names.")
        .custom((value) => {
            // Check that all items in the array are strings
            value.forEach((name) => {
                if (typeof name !== 'string') {
                    throw new Error("Each job type name must be a string.");
                }
                // if (name.length < 3 || name.length > 100) {
                //     throw new Error("Each job type name must be between 3 and 100 characters.");
                // }
                if (name.length > 200) {
                    throw new Error("The job type name can have a maximum of 200 characters.");
                }
            });
            return true;
        })
];

/**
 * @description message and rooms validtion
 */
const validateMessageRoom = [
    body("name")
        .not()
        .isEmpty().withMessage("Room name is required.")
        .isString().withMessage("Room name must be a string.")
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage("Room name must be between 3 and 100 characters."),

    body("jobId")
        .not()
        .isEmpty().withMessage("jobId is required.")
        .isMongoId().withMessage("Invalid jobId format."),

    body("clientName")
        .not()
        .isEmpty().withMessage("Client name is required.")
        .isString().withMessage("Client name must be a string.")
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage("Client name must be between 3 and 100 characters."),

    body("message")
        .trim()
        .not()
        .isEmpty().withMessage("Message is required.")
        .isString().withMessage("Message must be a string.")
        .isLength({ min: 1, max: 10000 }).withMessage("Message must be between 1 and 10000 characters."),

    body("messageBy")
        .not()
        .isEmpty().withMessage("messageBy is required.")
        .isString().withMessage("Invalid messageBy format.")
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage("messageBy must be between 3 and 100 characters."),  // Fixed comma issue

    body("lastDate")
        .not()
        .isEmpty().withMessage("lastDate is required.")
        .isISO8601().withMessage("Invalid date format for lastDate. Use (YYYY-MM-DDTHH:mm:ss.sssZ)")
];

const validateRoomMessages = [
    body("jobId")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide Job id")
        .isMongoId()
        .withMessage("Invalid Job id"),

    body("name")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide room name")
        .isString().withMessage("Name must be a string.")
        .isLength({ min: 3, max: 100 }).withMessage("Name must be between 3 and 100 characters."),

    body("clientName")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please provide client name")
        .isString().withMessage("Job name must be a string.")
        .isLength({ min: 1, max: 100 }).withMessage("Job name must be between 1 and 100 characters."),

    body("lastdate")
        .isString().withMessage("Last date must be a string.")
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Last date must be in YYYY-MM-DD format."),

    body("messages")
        .isArray().withMessage("Messages must be an array.")
        .notEmpty().withMessage("Messages array cannot be empty.")
        .bail()
        .custom((messages) => {
            const validateField = (value, fieldName, conditions) => {
                if (!value || typeof value !== 'string' || value.length < conditions.min || value.length > conditions.max) {
                    throw new Error(`${fieldName} must be a string between ${conditions.min} and ${conditions.max} characters.`);
                }
            };

            messages.forEach((message, i) => {
                const { client, text, time } = message;
                if (!text) throw new Error(`Text is required at index ${i}.`);
                if (!time) throw new Error(`Time is required at index ${i}.`);
                if (!client) throw new Error(`Client is required at index ${i}.`);
                // Validate message fields
                validateField(client, `Client at index ${i}`, { min: 3, max: 100 });
                // validateField(text, `Text at index ${i}`, { min: 1, max: 10000 });
                validateField(time, `Time at index ${i}`, { min: 3, max: 20 });
            });

            return true;
        })
];





const jobByTitle = [
    body('title')
        .not()
        .isEmpty().withMessage("Title is required.")
        .isString().withMessage("Invalid title format."),
];

/**
 * @description global search validation
 */
const globalSearchValidation = [
    param("searchKeyword")
        .trim()
        .not()
        .isEmpty()
        .withMessage("Search keyword is required")
        .isString()
        .withMessage("Search keyword must be a string"),
    // .matches(/^[a-zA-Z0-9\s]+$/)
    // .withMessage("Search keyword must not contain special characters like ++, **, //, ., #, %, etc."),
    // .isLength({ min: 2 })
    // .withMessage("Search keyword must be at least 2 characters long"),
];

/**
 * @description add job summery validation
 */

const validateJobSummary = [
    body('contractType')
        .notEmpty().withMessage('Contract type is required')
        .isIn(['Fixed', 'Fixed Price', 'Hourly']).withMessage('Invalid contract type'),

    // Universal Optional Fields
    body('upAmount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Up Amount must be a number'),
    body('upStatus').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid upStatus'),
    body('upDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid date format for upDate'),

    // Fields for Fixed Contracts
    body('milestones').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('milestones.*.startDate')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601().withMessage('Invalid milestone startDate'),
    // body('milestones.*.endDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid milestone endDate'),
    body('milestones.*.endDate')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601()
        .withMessage('Invalid milestone endDate')
        .custom((endDate, { req, path }) => {
            const match = path.match(/milestones\.(\d+)\.endDate/);
            if (!match) return true;
            const index = parseInt(match[1], 10);
            const startDate = req.body.milestones?.[index]?.startDate;

            if (startDate && new Date(endDate) < new Date(startDate)) {
                throw new Error('Milestone endDate cannot be earlier than startDate');
            }
            return true;
        }),
    body('milestones.*.milestoneName').optional({ checkFalsy: true, nullable: true }).isString().withMessage('Milestone name must be a string'),
    body('milestones.*.paymentStatus').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid payment status'),
    body('milestones.*.paymentDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid milestone payment date'),
    body('milestones.*.amount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Milestone amount must be a number'),

    // CR Details
    body('crDetails').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('crDetails.*.startDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid CR startDate'),
    // body('crDetails.*.endDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid CR endDate'),
    body('crDetails.*.endDate')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601()
        .withMessage('Invalid CR endDate')
        .custom((endDate, { req, path }) => {
            const match = path.match(/crDetails\.(\d+)\.endDate/);
            if (!match) return true;

            const index = parseInt(match[1], 10);
            const startDate = req.body.crDetails?.[index]?.startDate;

            if (startDate && new Date(endDate) < new Date(startDate)) {
                throw new Error('CR endDate cannot be earlier than startDate');
            }

            return true;
        }),
    body('crDetails.*.amount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('CR amount must be a number'),
    body('crDetails.*.noOfHours').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('CR hours must be a number'),
    body('crDetails.*.status').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid CR status'),

    // Hourly Contract Fields
    body('totalCost').if(body('contractType').equals('Hourly'))
        .notEmpty().withMessage('totalCost is required')
        .isNumeric().withMessage('totalCost must be a number'),

    body('totalBilling').if(body('contractType').equals('Hourly'))
        .notEmpty().withMessage('totalBilling is required')
        .isNumeric().withMessage('totalBilling must be a number'),

    body('hourlyRate').if(body('contractType').equals('Hourly'))
        .notEmpty().withMessage('hourlyRate is required')
        .isNumeric().withMessage('hourlyRate must be a number'),

    body('weeklyBuildHours').if(body('contractType').equals('Hourly'))
        .notEmpty().withMessage('weeklyBuildHours is required')
        .isNumeric().withMessage('weeklyBuildHours must be a string'),

    // Weekly Progress
    body('weeklyProgress').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('weeklyProgress.*.hours').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Hours must be a number'),
    body('weeklyProgress.*.from').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid from date'),
    // body('weeklyProgress.*.to').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid to date'),
    body('weeklyProgress.*.to')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601()
        .withMessage('Invalid to date')
        .custom((toDate, { req, path }) => {
            const match = path.match(/weeklyProgress\.(\d+)\.to/);
            if (!match) return true;

            const index = parseInt(match[1], 10);
            const fromDate = req.body.weeklyProgress?.[index]?.from;
            console.log("fromdate", fromDate)

            if (fromDate && new Date(toDate) < new Date(fromDate)) {
                throw new Error(`'From' date (${fromDate}) must be before 'To' date (${toDate})`);
            }

            return true;
        }),
];

/**
 * @description update job summery detials 
 */
const validateUpdateJobSummary = [
    body('contractType')
        .optional({ checkFalsy: true, nullable: true })
        .isIn(['Fixed', 'Fixed Price', 'Hourly']).withMessage('Invalid contract type'),

    body('upAmount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Up Amount must be a number'),
    body('upStatus').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid upStatus'),
    body('upDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid date format for upDate'),

    // Milestones (optional but validated if present)
    body('milestones').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('milestones.*.startDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid milestone startDate'),
    body('milestones.*.endDate')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601().withMessage('Invalid milestone endDate')
        .custom((endDate, { req, path }) => {
            const match = path.match(/milestones\.(\d+)\.endDate/);
            if (!match) return true;
            const index = parseInt(match[1], 10);
            const startDate = req.body.milestones?.[index]?.startDate;

            if (startDate && new Date(endDate) < new Date(startDate)) {
                throw new Error('Milestone endDate cannot be earlier than startDate');
            }
            return true;
        }),
    body('milestones.*.milestoneName').optional({ checkFalsy: true, nullable: true }).isString().withMessage('Milestone name must be a string'),
    body('milestones.*.paymentStatus').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid payment status'),
    body('milestones.*.paymentDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid milestone payment date'),
    body('milestones.*.amount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Milestone amount must be a number'),

    // CR Details
    body('crDetails').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('crDetails.*.startDate').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid CR startDate'),
    body('crDetails.*.endDate')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601().withMessage('Invalid CR endDate')
        .custom((endDate, { req, path }) => {
            const match = path.match(/crDetails\.(\d+)\.endDate/);
            if (!match) return true;
            const index = parseInt(match[1], 10);
            const startDate = req.body.crDetails?.[index]?.startDate;

            if (startDate && new Date(endDate) < new Date(startDate)) {
                throw new Error('CR endDate cannot be earlier than startDate');
            }

            return true;
        }),
    body('crDetails.*.amount').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('CR amount must be a number'),
    body('crDetails.*.noOfHours').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('CR hours must be a number'),
    body('crDetails.*.status').optional({ checkFalsy: true, nullable: true }).isIn(['Pending', 'Paid', '']).withMessage('Invalid CR status'),

    // Hourly Contract Fields (optional)
    body('totalCost').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('totalCost must be a number'),
    body('totalBilling').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('totalBilling must be a number'),
    body('hourlyRate').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('hourlyRate must be a number'),
    body('weeklyBuildHours').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('weeklyBuildHours must be a number'),

    // Weekly Progress
    body('weeklyProgress').optional({ checkFalsy: true, nullable: true }).isArray(),
    body('weeklyProgress.*.hours').optional({ checkFalsy: true, nullable: true }).isNumeric().withMessage('Hours must be a number'),
    body('weeklyProgress.*.from').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Invalid from date'),
    body('weeklyProgress.*.to')
        .optional({ checkFalsy: true, nullable: true })
        .isISO8601()
        .withMessage('Invalid to date')
        .custom((toDate, { req, path }) => {
            const match = path.match(/weeklyProgress\.(\d+)\.to/);
            if (!match) return true;

            const index = parseInt(match[1], 10);
            const fromDate = req.body.weeklyProgress?.[index]?.from;
            console.log("fromDate updatek", fromDate)

            if (fromDate && new Date(toDate) < new Date(fromDate)) {
                throw new Error(`'From' date must be before 'To' date`);
            }

            return true;
        }),
];

/**
 * @description project closed validation
 */
const validateMarkProjectClosed = [
    body("jobId")
        .trim()
        .notEmpty()
        .withMessage("Please provide Job id")
        .isMongoId()
        .withMessage("Invalid Job id"),

    body("projectClosed")
        .notEmpty()
        .withMessage("Please provide Project Closed")
        .isBoolean()
        .withMessage("Invalid value for projectClosed, expected true or false")
        .toBoolean()
];

/**
 * @description finance summary lsit validation
 */
validateSummaryList = [
    body("limit")
        .optional({ nullable: true, checkFalsy: true })
        .isInt()
        .withMessage("Please provide integer in limit"),
    body("page")
        .optional({ nullable: true, checkFalsy: true })
        .isInt()
        .withMessage("Please provide integer in page"),
]


function validator(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(statusCode.BAD_REQUEST)
            .json({ message: errors.errors[0].msg, status: 0 });
    }
    next();
}

module.exports = {
    validateSummaryList,
    validateMarkProjectClosed,
    validateUpdateJobSummary,
    validateJobSummary,
    globalSearchValidation,
    validateRoomMessages,
    addJob,
    updateJob,
    addClientTypes,
    JobFiltersType,
    viewByIdType,
    updateJobStatus,
    deleteJob,
    fetchDataUpworkTypes,
    moveToActiveInactive,
    addOutSourceJob,
    deleteJobDoc,
    updateOutsourceJob,
    upworkJobUrl,
    upworkJobUrlValidation,
    jobTypesByName,
    validateMessageRoom,
    jobByTitle,
    validator,
};
