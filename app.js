const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist!"
})

const item2 = new Item ({
    name: "Hit + button to add a new item."
})

const item3 = new Item ({
    name: "<-- Hit this to delete an item."
})

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", function(req,  res){
    Item.find().then(function(foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItem).then(function(){
                console.log("Successfully saved default items to DB")
            }).catch(function(err){
                console.log(err);
            })
            res.redirect("/")
        }else{
            res.render("list", {ListTitle: "Today", newListItems: foundItems});
        }   
    }).catch(function(){
        console.log("Error in finding items")
    })
    
})

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}).then(function(foundList){
        if(!foundList){
            //create new list
            const list = new List({
                name: customListName,
                items: defaultItem
            })
        
            list.save();
            res.redirect("/"+ customListName);
        }
        else{
            //show an existing list
            res.render("list", {ListTitle: foundList.name, newListItems: foundList.items})
        }
    }).catch(function(){
        console.log("error")
    })
})

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item ({
        name: itemName
    })
    if(listName === "Today"){
        item.save();
    res.redirect("/") 
    }else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
     
})

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Successfully deleted checked item")
        }).catch(function(err){
            console.log
        })
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList){
            res.redirect("/" + listName)
        })
    }
    
})

app.listen(3000, function(){
    console.log("Server is running on port 3000");
})

