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
    let declineJobs = 0;
    let inteviewJobs = 0;
    let pendingJobs = 0;
    Job.find({ createdBy: request.userId }).then(job => {
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
        Job.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    total: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: '$_id.month',
                    year: ('$_id.year').toString(),
                    total: 1,
                    _id: 0,
                },


            },
            {
                $addFields: {
                    month: {
                        $let: {
                            vars: {
                                monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'july', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                            },
                            in: {
                                $arrayElemAt: ['$$monthsInString', '$month']
                            }
                        }
                    }
                }
            }

        ])
            .then((result) => {
                response.json({
                    defaultStats: { pending: pendingJobs, interview: inteviewJobs, declined: declineJobs }, monthlyApplications: result.map(r => {
                        return { date: r.month + " " + r.year, count: r.total };
                    })
                });
            })
            .catch((error) => {

                // Handle the error
                response.status(500).json({ error: error });
            });
    })
}


exports.updateJob = (request, response, next) => {
    console.log(request.params.jobId);

    console.log(request.userId);

    const position = request.body.position;
    const company = request.body.company;
    const jobLocation = request.body.jobLocation;
    const jobType = request.body.jobType;
    const status = request.body.status;

    console.log(request.body);
    if (!request.isAuth) {
        const error = new Error('Your Dont have permission to delete this job');
        error.code = 422;
        throw error;

    }
    User.findOne({ _id: request.userId }).then(user => {

        if (!user) {
            const error = new Error("user not found");
            error.code = 401;
            throw error;
        }
        const job = user.jobs.map(job => {
            if (job.toString() === request.params.jobId.toString()) {
                return job;
            }
        })

        Job.findOne({ _id: job }).then(post => {

            post.position = position;
            post.company = company;
            post.jobLocation = jobLocation;
            post.jobType = jobType;
            post.status = status;

            post.save();

            return response.status(200).json({ updatedJob: post });

        })
    })
}

exports.deleteJob = (request, response, next) => {
    let loadUser;
    if (!request.isAuth) {
        const error = new Error('You dont have permission to delete');
        error.code = 422;
        throw error;
    }

    User.findOne({ _id: request.userId }).then(user => {
        if (!user) {
            const error = new Error('You dont have permission to delete');
            error.code = 422;
            throw error;
        }
  
        user.jobs.pull(request.params.jobId);

        user.save();

  
         Job.deleteOne({_id:request.params.jobId}).then(result => {
            response.status(200).json({"msg":"Success! Job removed"});
        }).catch(error => {
            console.log(error);
        })
    })

   


}