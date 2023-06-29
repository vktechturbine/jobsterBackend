const validator = require('validator');
const User = require('../models/user');
const Job = require('../models/jobs');
const moment = require('moment');

exports.createJob = (request, response, next) => {
    console.log(request);

    const position = request.body.position;
    const company = request.body.company;
    const jobLocation = request.body.jobLocation;
    const jobType = request.body.jobType;
    const status = request.body.status;


    if (!request.isAuth) {
        const error = new Error('Not Authenticated');
        error.code = 401;
        response.status
    }



    if (validator.isEmpty(position) && validator.isEmpty(company) && validator.isEmpty(jobLocation)) {
        const error = new Error("Pleased fill Out All Fields");
        error.code = 401;
        response.status(error.code).json({ message: error.message });
        throw error;
    }
    console.log('Hello World')

    const job = new Job({
        position: position,
        company: company,
        jobLocation: jobLocation,
        status: status,
        jobType: jobType,
        createdBy: request.userId
    })
    let current_job;
    job.save().then(result => {
        current_job = result;
        return User.findOne({ _id: request.userId });
    }).then(user => {
        user.jobs.push(job);
        user.save();
        response.status(200).json({ job: current_job });
    }).catch(error => {
        error.code = 422;
        throw error;
    })

}

exports.getAllJob = (request, response, next) => {
    const search = request.query.search;
    const status = request.query.status;
    const jobType = request.query.jobType;
    let sorrt = request.query.sort;
    const page = request.query.page || 1;



    const perPage = 10;

    let query = {};

    if (!request.isAuth) {
        const error = new Error('Not Authenticated');
        error.code = 422;
        throw error;
    }

    if (search) {
        query.position = { $regex: `^.*${search}.*$`, $options: 'i' };
    }
    if (status && status !== 'all') {
        query.status = status;
    }

    // Check if jobType is provided and not 'all'
    if (jobType && jobType !== 'all') {
        query.jobType = jobType;
    }
    if (status === 'all' && jobType === 'all') {
        delete query.status;
        delete query.jobtype;
    }
    let sortOption = {};

    if (sorrt === 'latest') {

        sortOption.createdAt = 'desc';
    }
    if (sorrt === 'oldest') {

        sortOption.createdAt = 'asc';
    }
    if (sorrt === 'a-z') {

        sortOption.position = 'asc';

    }
    if (sorrt === 'z-a') {

        sortOption.position = 'desc';
    }


    Job.find(query).sort(sortOption).skip((page - 1) * perPage).limit(perPage).then(job => {

        Job.find(query).sort(sortOption).countDocuments().then(count => {

            const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);

            return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
        })
    }).catch(error => {
        error.code = 422;
        throw error;
    });
    /* 
        Job.find({$and:[{createdBy:request.userId},{$or:[{position:{$ne : search}},{position:{$regex:`^.*${search}.*$`,$options:'i'}}]}]}).skip((page - 1) * perPage).limit(perPage).then(job => {
            
            Job.find({$and:[{createdBy:request.userId},{$or:[{position:{$ne : search}},{position:{$regex:`^.*${search}.*$`,$options:'i'}}]}]}).countDocuments().then(count => {

                const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);

                return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
            })
        }).catch(error => {
            error.code = 422;
            throw error;
        }); */

    /* 
            Job.find({ $and: [{ status: { $eq: status } }, { jobType: { $eq: jobType } }] }).where({ createdBy: request.userId }).skip((page - 1) * perPage).limit(perPage).then(job => {
    
                Job.find({ $or: [{ status: { $eq: status } }, { jobType: { $eq: jobType } }] }).where({ createdBy: request.userId }).countDocuments().then(count => {
    
                    const numOfPages = count < perPage ? 1 : Math.ceil(count / perPage);
    
                    return response.status(200).json({ jobs: job, totaljobs: count, numOfPages: numOfPages });
                })
            }).catch(error => {
                error.code = 422;
                throw error;
            }); */


}
exports.getstats = (request, response, next) => {
    Job.find({ createdBy: request.userId }).then(job => {
        let declineJobs = 0;
        let inteviewJobs = 0;
        let pendingJobs = 0;
        job.map(j => {
            if (j.status === 'declined') {
                declineJobs++;
            }
            if (j.status === 'interview') {
                inteviewJobs++;
            }
            if (j.status === 'pending') {
                pendingJobs++;
            }

        })
    })

    const startDate = moment().startOf('month');
    const endDate = moment().endOf('month');
    console.log(startDate)
    console.log(endDate)
   

    Job.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%b %Y',
                date: '$createdAt',
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            date: '$_id',
            total: 1,
            _id: 0,
          },
        },
      ])
        .then((results) => {
          response.json(results);
        })
        .catch((error) => {
            
          // Handle the error
          response.status(500).json({ error: error });
        });
    

}