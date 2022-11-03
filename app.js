//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/loginDb");

let loginSchema = new mongoose.Schema({
  username: String,
  password : String,
  orders: [{
    cust_id: String,
    item : String,
  order_id: String}
  ]
})
let productSchema = new mongoose.Schema({
  merchantId: String,
  productName: String,
  productPrice: Number,
  productStock: Number
})


let Merchant = mongoose.model("Merchant", loginSchema);
let Customer = mongoose.model("Customer", loginSchema);
let Product = mongoose.model("Product", productSchema);



let products = [];
Product.find((err,items) => {
  if(err){
    console.log(err);
  }else{
    items.forEach((item)=>{
    products.push(item);
    })
  }
})

app.get("/",(req,res) => {
  res.render("user");
})

app.post("/",(req,res) => {

  res.redirect("/login/" + req.body.button);
})

let noUser = 0;
let wrongPass = 0;
let userExist = 0;

app.get("/login/:user", (req,res) => {
 
  res.render("login",{user: req.params.user, noUser: noUser, wrongPass: wrongPass, userExist: userExist});
})

app.post("/login/:user", (req,res) => {
  if(req.params.user === "merchant"){
  Merchant.findOne({username: req.body.username},(err,user) => {
     if(err){
       console.log(err);
     }else{
       if(user === null){
         console.log("User doesnt exist sign up!");
         noUser = 1;
         res.redirect("/login/" + req.params.user);
       }else{
         if(req.body.password === user.password){
           res.redirect("/merchant-home/"+ user._id);
         }else{
           console.log(("wrong password"));
           wrongPass = 1;
           res.redirect("/login/" + req.params.user);
         }}
     }
   })}else{
     Customer.findOne({username: req.body.username},(err,user) => {
        if(err){
          console.log(err);
        }else{
          if(user === null){
            console.log("User doesnt exist sign up!");
            noUser = 1;
            res.redirect("/login/" + req.params.user);
          }else{
            if(req.body.password === user.password){
              res.redirect("/customer-home/" + user._id);
            }else{

              console.log(("wrong password"));
              wrongPass = 1;
              res.redirect("/login/"+ req.params.user );
            }}
        }
      })
   }
})

app.get("/merchant-home/:merchantId",(req,res) => {
  res.render("merchant-home", {id: req.params.merchantId});
})

app.get("/merchant-home/:merchantId/add-product",(req,res)=>{
  res.render("add-product",{id: req.params.merchantId});
})

app.post("/merchant-home/:merchantId/add-product",(req,res)=>{
  let prod = {
    merchantId: req.params.merchantId,
    productName: req.body.productName,
    productPrice: req.body.productPrice,
    productStock: req.body.productStock
  }
  Product.create(prod,(err) => {
    if(err){
      console.log(err);
    }else{
      products.push(prod);
    }
  })
  res.redirect("/merchant-home/" + req.params.merchantId);
})

app.get("/merchant-home/:merchantId/orders",(req,res) =>{

  Merchant.findOne({_id : req.params.merchantId},(err,item) => {
    if(err){
      console.log(err);
    }else{
      res.render("orders", {user: "merchant",merch_id: req.params.merchantId, orders: item.orders});
    }
  })

})

app.get("/merchant-home/:merchantId/orders/:orderId>",(req,res) => {
  Merchant.findOne({_id : req.params.merchantId},(err,item) => {
    if(err){
      console.log(err);
    }else{
      item.orders.forEach((order) => {
        if(order.order_id === req.params.orderId){
          res.render("order",{order: order});
        }
      })
    }
  })
})

app.get("/customer-home/:custumerId/orders",(req,res) =>{

  Customer.findOne({_id : req.params.custumerId},(err,item) => {
    if(err){
      console.log(err);
    }else{
      res.render("orders", {user: "customer",cust_id: req.params.custumerId, orders: item.orders});
    }
  })
})

app.get("/customer-home/:custumerId",(req,res) => {

  res.render("customer-home",{products: products, id: req.params.custumerId});
})

app.get("/customer-home/:custumerId/buy-product/:productId",(req,res) => {
  let product;
  Product.findOne({_id: req.params.productId},(err,item) => {
    if(err){
      console.log(err);
    }else{
      product = item;
      res.render("buy-product",{id: req.params.custumerId, product:item});
    }
  })
})

app.post("/customer-home/:custumerId/buy-product/:productId",(req,res) => {
  Product.findOne({_id: req.params.productId},(err,product_item) => {
    if(err){
      console.log(err);
    }else{
        let order_id = Math.floor(Math.random() * (1000000 - 1)) + 1;
        Merchant.findByIdAndUpdate(product_item.merchantId,{$push: {"orders": {cust_id: req.params.custumerId, item: product_item.productName, order_id: order_id}}},
    function(err, model) {
      if(err){
        console.log(err);}
        else{
          console.log(model);
        }
      },(err,item)=>{
          if (err) {
            console.log(err);
          }
        }
      );


      Customer.findByIdAndUpdate(req.params.custumerId,{$push: {"orders": {id: req.params.custumerId, item: product_item.productName, order_id: order_id}}},
  function(err, model) {
    if(err){
      console.log(err);}},(err,item)=>{
        if (err) {
          console.log(err);
        }
      }
      )
    }
  })
  res.redirect("/customer-home/" + req.params.custumerId);
})

app.get("/sign-up/:user", (req,res) => {
  res.render("sign-up",{user: req.params.user});
})

app.post("/sign-up/:user", (req,res) => {
  if(req.params.user === "merchant"){
  Merchant.findOne({username: req.body.username},(err,user) => {
     if(err){
       console.log(err);
     }else{
       if(user === null){
         Merchant.create({
           username: req.body.username,
           password: req.body.password
         }, (err) =>{
           if(err){
             console.log(err);
           }else{
             console.log("successfully added user");
           }
         })
       }else{
         userExist = 1;
         console.log("user exists");
       }
     }
     res.redirect("/login/" + req.params.user);
   }

 )}else{
   Customer.findOne({username: req.body.username},(err,user) => {
      if(err){
        console.log(err);
      }else{
        if(user === null){
          Customer.create({
            username: req.body.username,
            password: req.body.password
          }, (err) =>{
            if(err){
              console.log(err);
            }else{
              console.log("successfully added user");
            }
          })
        }else{
          userExist = 1;
          console.log("user exists");
        }
      }
      res.redirect("/login/" + req.params.user);
    }

  )
 }
})

app.listen("9000", () => {
  console.log("started server!");
})
