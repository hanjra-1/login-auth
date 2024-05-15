const express=require("express")
const app=express();
const path=require("path")
const userModel=require('./models/user');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));


app.get('/', (req , res)=>{
   res.render("index");
});
app.post('/create', (req , res)=>{
    let {username, email, password ,age}=req.body;
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password,salt,async  (err,hash)=>{
            let user=await userModel.create({
                username,
                email,
                password:hash,
                age
            });
           let token=jwt.sign({email}, "md5");
           res.cookie("token",token);
            res.render("login")
        })
    })
   

 });
 app.get('/login', (req , res)=>{
    res.render("login");
 });
 app.post('/login', async (req , res)=>{
   let user=await userModel.findOne({email:req.body.email});
   if(!user){
    res.send("something went wrong")
   }else{
    bcrypt.compare(req.body.password,user.password,function(err,result){
       if(result){
        res.send("welcome the new era of curiosity")
       }
       else{
        res.send("your future is dark")
       }
    })
   }
 });
 app.get('/logout', (req , res)=>{
    res.cookie("token","");
    res.redirect('/')
 });



app.listen(3000);