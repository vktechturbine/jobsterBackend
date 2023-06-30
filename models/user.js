const  mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        default:"lastname"
    },
    location:{
        type:String,
        default:"my city"
    },
    jobs:[{
        type:Schema.Types.ObjectId,
        ref:'Jobs'  
    }]
})

module.exports = mongoose.model('User',userSchema);