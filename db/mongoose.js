const mongoose = require("mongoose");

mongoose.connect(process.env.DB_URL).then(()=>{
    console.log("DB connected");
});

const userSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    }
})

module.exports = mongoose.model("user",userSchema);