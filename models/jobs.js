const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const jobSchema = new Schema({
    position:{
        type:String,
        required:true
    },
    company:{
        type:String,
        required:true
    },
    jobLocation:{
        type:String,
        default:"my city"
    },
    status:{
        type:String,
        default:"pending",
        
    },
    jobType:{
        type:String,
        default:"full-time"
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model('Jobs',jobSchema);

