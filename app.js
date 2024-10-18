const express=require("express")
const app=express();
const path=require("path")
const userModel=require('./models/user');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const fs=require("fs");
const { request } = require("http");
const multer=require("multer")
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));
const filePath = path.join(__dirname);
const results = [];
const csv = require('csv-parser')
const XLSX = require("xlsx");
const Stock = require("./models/stock");
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
       cb(null, "upload/"); 
   },
   filename: function (req, file, cb) {
       cb(null, file.originalname);
   },
});

const upload = multer({ storage: storage });



app.get('/', (req , res)=>{
   res.render("index");});

app.post("/upload", upload.single("file"), (req, res) => {
   const filePath = path.join(__dirname, req.file.path);
  

   fs.createReadStream(filePath)
       .pipe(csv())
       .on("data", (data) => {
           data.stock = Number(data.stock);
           results.push(data);
       })
       .on("end", async () => {
           try {
               await Stock.deleteMany({});
               await Stock.insertMany(results);
               res.render("genfile");
               generateXLSX();
           } catch (error) {
               res.status(500).send("Error  " + error.message);
           } finally {
               fs.unlinkSync(filePath);
           }
});});
app.get('/download', async (req, res) => {
   try {
       const stocks = await Stock.find();

       const stockMap = {};
       stocks.forEach((stock, index) => {
           const stockId = index + 1;

           if (!stockMap[stock.variant]) {
               stockMap[stock.variant] = [];
           }

           stockMap[stock.variant].push(stockId);
       });

       const xlsxData = [];
       for (const [sku, stockIds] of Object.entries(stockMap)) {
           xlsxData.push({
               sku: sku,
               stock_ids: stockIds.join("|"),
           });
       }

       const wb = XLSX.utils.book_new();
       const ws = XLSX.utils.json_to_sheet(xlsxData);
       XLSX.utils.book_append_sheet(wb, ws, "Stock Data");
       const filePath = path.join(__dirname, "generated_stock_data.xlsx");
       
       XLSX.writeFile(wb, filePath);

       res.download(filePath, (err) => {
           if (err) {
               console.error("Error downloading file:", err);
               if (!res.headersSent) {
                   res.status(500).send("Error downloading file.");
               }
           } else {
               fs.unlink(filePath, (unlinkErr) => {
                   if (unlinkErr) {
                       console.error("Error deleting temporary file:", unlinkErr);
                   }
               });
           }
       });
   } catch (error) {
       console.error("Error generating XLSX file:", error);
       if (!res.headersSent) {
           res.status(500).send("Error generating XLSX file.");
       }
   }
});

app.post('/create', (req , res)=>{
    let {username, email, password ,}=req.body;
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password,salt,async  (err,hash)=>{
            let user=await userModel.create({
                username,
                email,
                password:hash,
            });
           let token=jwt.sign({email}, "md5" );
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
         const expiresIn = req.body.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; 
         let token = jwt.sign({ email: user.email }, "md5", { expiresIn }); 

         res.cookie("token", token, {
             maxAge: req.body.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
         });
        res.render("upload")
       }
       else{
        res.send("username or password incorrect")
       }
    })
   }
 });
 app.get('/logout', (req , res)=>{
    res.cookie("token","");
    res.redirect('/login')
 });



app.listen(3000);