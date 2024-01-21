//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const _ = require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB")
const itemsSchema = 
  {
    name: String
  }
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "DP"
})

const item2 = new Item({
  name: "Web dev"
})

const item3 = new Item({
  name: "Back"
})

const defaultItems = [item1,item2,item3];

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      // Fetch the items again after inserting if needed
      const updatedItems = await Item.find({});
      res.render("list", { listTitle: "Today", newListItems: updatedItems });
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

const listSchema = 
  {
    name: String,
    items: [itemsSchema]
  }

const List = mongoose.model("List",listSchema);

app.get("/:customListName", async function(req, res) 
{
  const customListName = _.capitalize(req.params.customListName);
      const foundList = await List.findOne({name: customListName});
      if(foundList)res.render("list", { listTitle: foundList.name, newListItems:  foundList.items});     
      else
      {
        const list = new List(
          {
            name: customListName,
            items: defaultItems
          }
        )
        await list.save();
        res.render("list", { listTitle: customListName, newListItems:  defaultItems}); 
      } 

      
});

app.post("/delete", async function(req,res){
    const delItem = req.body.checkbox;
    const listTitle = req.body.listName;

    if(listTitle === "Today"){
      const operation1 = await Item.deleteOne({_id : delItem});
      res.redirect("/");
    }
      
    else{
      List.findOneAndUpdate({name: listTitle},{$pull : {Items: {_id: delItem}}});
      res.redirect("/"+listTitle);
    }
    
})

app.post("/", async function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

    if(listName === "Today")
    {
      await item.save();
      res.redirect("/");
    }

    else
    {
      const findList = await List.findOne({name: listName});
      findList.items.push(item);
      findList.save();
      res.redirect("/"+listName);
    }
  
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});