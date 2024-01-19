const mongoose = require('mongoose')
const {dbUrl} = require('./config')
mongoose.connect(dbUrl,
).then(()=>console.log("Connected to DB")).catch((e)=>console.log("not connected Error"))