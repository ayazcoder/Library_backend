const mongoose = require("mongoose");

const BooksSchema = mongoose.Schema({
    name:{
        type: String,
    },
    title:{
        type: String,

    },
    description:{
        type: String
    },
    image:{
        type: String
    },

})


const Books = mongoose.model('Books', BooksSchema)
module.exports = Books