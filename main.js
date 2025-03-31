const express = require("express");
const app = express();
const port = 4000;
const userModel = require("./db/mongoose");
const eventModel = require("./db/event");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const alert = require('@mui/material');
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.send("hello");
})

app.post("/createUser",async(req,res)=>{
    try {
        const { name, email , password } = req.body;
        console.log(name,email,password);

        const userExists = await userModel.findOne({ email });

        if(!userExists){

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = new userModel({
              name,
              email,
              password : hashedPassword
          })  

          await user.save();

          const token = jwt.sign({ _id: user._id , email : user.email },process.env.Secret , { expiresIn: "1d" });
          res.status(201).json({user,token});
      }
      else{
        console.log("User already exist");
      }
    } catch (error) {
        console.log(error);
    }

})

app.post("/loginUser",async(req,res)=>{
    const { email , password } = req.body;

    const user = await userModel.findOne({ email });

    if(!user){
        res.status(400).json({message : "Invalid Cridentials"});
    }

    const isPasswordMatch = await bcrypt.compare(password , user.password);

    if(!isPasswordMatch){
        // return res.status(400).json({ message : "Invalid Password"});
        return alert("Wrong Passsword");
    }

    const token = jwt.sign({ _id: user._id , email : user.email },process.env.Secret , { expiresIn: "1d" });

    console.log(token);

    res.status(201).json({ message : "user logged in" , token});

})

app.post("/createEvent", async(req,res)=>{

    const { eventName , description , date , token} = req.body;

    const decode = jwt.verify(token , process.env.Secret);
    req.user = decode;

    const event = new eventModel({
        eventName,
        description,
        date,
        createdBy: req.user._id
    })

    await event.save();

    res.json({ message : "event  created"});

})

app.get("/events",async(req,res)=>{

    const event = await eventModel.find();
    
    if(!event){
        res.json({message: "no event found"});
    }

    res.send( event );

})

app.post("/myEvents",async(req,res)=>{

    const { token } = req.body;

    const decode = jwt.verify(token , process.env.Secret);
    req.user = decode;

    const events = await eventModel.find({ createdBy : req.user._id });
    
    if(!events){
        res.json({message: "no event found"});
    }

    res.send( events );

})

app.post("/searchEvent",async(req,res)=>{

    const { query } = req.body;

    if (!query) {
        return res.status(200).json([]);
    }

    const events = await eventModel.find({
        eventName: { $regex: query, $options: 'i' }
    })

    res.send(events);
})

app.post("/verifyToken",async(req,res)=>{

    const { data } = req.body;

    const decode = jwt.verify(data, process.env.Secret);
    req.user = decode;

    res.json({ message:"token found",decode});
})

app.delete("/myEvents/:id",async(req,res)=>{

    const del = await eventModel.findByIdAndDelete(req.params.id);

    res.json({ message : "deleted event", del});

})

app.post("/dashboard/events/join/:id",async(req,res)=>{

    const { token } = req.body;

    const decode = jwt.verify(token , process.env.Secret);
    req.user = decode;

    const ev = await eventModel.find({ _id : req.params.id })

    if(!ev){
        return res.json({ message : "event doesn't exist"});
    }

    if(ev[0].attendees.includes(req.user._id)){
        console.log("user attending",ev);
        return res.json({ message : "u r already attending the event",ev});
    }
    ev[0].attendees.push(req.user._id);
    await ev[0].save();
    res.json({ message : "user pushed",ev});
})

app.post("/dashboard/events/leave/:id",async(req,res)=>{

    const { id } = req.body;

    const ev = await eventModel.find({ _id : req.params.id })

    if(!ev){
        return res.json({ message : "event doesn't exist"});
    }

    const index = ev[0].attendees.indexOf(id);

    if(index !== -1){
      ev[0].attendees.splice(index , 1);
    }

    await ev[0].save();
    res.send( ev );
})

app.listen(port,()=>{
    console.log(`server connected at ${port}`);
})