const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors');
const app = express();

const userRoute = require('./routes/auth');
const jobsRoute = require('./routes/job');


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())


/* const corsOptions ={
    origin:'http://localhost:5173', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
} */
app.use(cors());

/* app.use((request, response, next) => {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');
    if (request.method === 'OPTIONS') {
        return response.sendStatus(200);
    }
    next();

}) */

app.use('/user',userRoute);
app.use('/job',jobsRoute);

app.use((error, request, response, next) => {

    const status = error.statusCode;
    const message = error.message;
    
    response.status(status).json({ message: message});
    next();
})
mongoose.connect('mongodb+srv://Vishalrk:tech1mini@cluster0.y1iwedf.mongodb.net/jobster').then(result => {
    console.log("Connected");
    app.listen(3001);
}).catch(error => {
    console.log("Not Connected");
})

