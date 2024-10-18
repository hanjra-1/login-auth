const mongoose=require("mongoose");
mongoose.connect(`mongodb://127.0.0.1:27017/authapp`),{
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const stockSchema = new mongoose.Schema({
    variant: String,
    stock: Number,
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;

