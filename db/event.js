const mongoose = require("mongoose");

const eventSchema = mongoose.Schema({
    eventName: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default : Date.now()
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, 
    attendees : [
        {
            type: mongoose.Schema.Types.ObjectId , ref: "user" 
        }
    ]
})

module.exports = mongoose.model("event", eventSchema);