//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// item schema 
const itemSchema = new mongoose.Schema({
  name: String
});


//connecting the database and creating the database
const conn = mongoose.connect("mongodb+srv://awais_akram:a5Uy0v10XLC0bqMId@awaiscluster.hvnmkhm.mongodb.net/todolistDB");
const Item = mongoose.model("Item", itemSchema);

// default items
const item1 = new Item({
  name: "Welcome to a TODOLIST"
});
const item2 = new Item({
  name: "hit the + to add the item in the list"
});
const item3 = new Item({
  name: "<-- hit the button to delete the item"
});

const defaultItem = [item1, item2, item3];

// for custom list schema
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

// to show all the item in the list
app.get("/", function(req, res) {

  //find all the item in Item list {} this get all items
  Item.find({}, function(err, foundItem){
    if (foundItem.length === 0){
      // inserting many item in the item list
      Item.insertMany(defaultItem, function(err){
        if (err) {
          console.log(err);
        }
        else {
          console.log("defalut Item successfuly inserted into DB")
        }
      });
      //res.redirect("/");
    }
    res.render("list", {listTitle: "Today", newListItems: foundItem});
  });
});

// to add the new item in the list
app.post("/", function(req, res){

  const itemlist = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemlist
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    // match the name with existed list in DB
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
    
  }
});

// to delet the item from the list
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove({_id: checkedItemId}, function(err){
      if (!err) {
        console.log("Successfully deleted the checked item");
      }
      res.redirect("/");
    });
  }
  else {
    // finding the item and deleting it by using mangodb $pull and mangoose method
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

// creating custom dynamic page to hold multple todolist using ejs template
app.get("/:cuntomListName", function(req, res){
  const customListName = _.capitalize(req.params.cuntomListName);

  // finding if the provided name through url is exist in DB
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        // Show an exiting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

// app is working on port 3000
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
