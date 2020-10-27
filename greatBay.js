// Dependencies
const mysql = require("mysql");
const inquirer = require("inquirer");

// Create Connection
const connection = mysql.createConnection({
  host: "localhost",

  port: 3306,

  user: "root",

  password: "",
  database: "great_bayDB",
});

connection.connect(function (error) {
  if (error) throw error;
  console.log("connected as id " + connection.threadId + "\n");
  init();
});

// Inquirer Questions
let initQues = [
  {
    type: "list",
    choices: ["POST", "BID", "EXIT"],
    name: "initial",
    message: "Welcome to Great Bay! What would you like to do today?",
  },
];

let postQues = [
  {
    type: "input",
    message: "What item are you selling?",
    name: "item",
  },
  {
    type: "input",
    message: "What category does the item fall under?",
    name: "category",
  },
  {
    type: "input",
    message: "What is the starting bid?",
    name: "bid",
  },
];

// Functions

// createPost function to be called if user selects POST option for initial question. The postQues array is then prompted. User inputs are then inserted into the auctions table as a new row. The user is alerted if the item was successfully posted and is brought back to the intiial inquirer prompt.

function createPost() {
  inquirer.prompt(postQues).then((userRes) => {
    var query = connection.query(
      "INSERT INTO auctions SET ?",
      {
        item_name: userRes.item,
        category: userRes.category,
        starting_bid: userRes.bid,
        highest_bid: userRes.bid,
      },
      function (err, res) {
        if (err) throw err;
        console.log(
          res.affectedRows + " item posted!\n",
          "Item: " + userRes.item + "\n",
          "Starting Bid: $" + userRes.bid
        );
        init();
      }
    );
  });
}

// displayItems function to be called when the user selects BID option for intiial question. Item name and highest bid are selected from the auctions array. Both fields are pushed into the items array and the names of each item are pushed to to the itemNames array for use in the bidQues inquirer prompt which asks the user which of the items they'd like to bid on and their bid amount. These questions and the items array are then passed through the updateBid function.

function displayItems() {
  var query = connection.query(
    "SELECT item_name, highest_bid FROM auctions",
    function (err, res) {
      if (err) throw err;
      let items = [];
      let itemNames = [];
      for (let index = 0; index < res.length; index++) {
        items.push(res[index]);
        itemNames.push(res[index].item_name);
      }

      let bidQues = [
        {
          type: "list",
          message: "What item would you like to bid on?",
          choices: itemNames,
          name: "thisItem",
        },
        {
          type: "input",
          message: "What is your bid?",
          name: "itemBid",
        },
      ];

      updateBid(bidQues, items);
    }
  );
}

// updateBid function called in the prior displayItems function. This function takes the bidQues variable and items array as arguments. Inquirer first prompts the bidQues questions and the response is logged to the user. A for loop is then ran on the items array to look for the item with an equivalent name to the user input. When the item is found, the loop then checks if the user passed bid amount is greater than the current highest bid. If it is a SQL query is sent to update the highest bid amount for that item in the auctions table. If it is not, the user bid is rejected and they are returned to the intial question.

function updateBid(bidQues, items) {
  inquirer.prompt(bidQues).then((response) => {
    const { thisItem } = response;
    const { itemBid } = response;
    console.log("Item: " + thisItem + "\n", "New Bid: $" + itemBid);

    for (let index = 0; index < items.length; index++) {
      if (
        thisItem === items[index].item_name &&
        itemBid > items[index].highest_bid
      ) {
        var query = connection.query(
          `UPDATE auctions SET highest_bid = ${itemBid} WHERE item_name = "${thisItem}"`,
          function (err, res) {
            if (err) throw err;
            console.log("Bid accepted..." + "\n" + res.affectedRows + " item(s) updated.\n");
            init();
          }
        );
      } else if (
        thisItem === items[index].item_name &&
        itemBid <= items[index].highest_bid
      ) {
        console.log("Bid rejected... Please try again.");
        init();
      }
    }
  });
}

// init function that is called upon the intial connection to the server. Prompts the user for what action they'd like to take and calls the prior declared functions accordingly for either POST or BID. If EXIT is selected, the connection is ended.

function init() {
  inquirer.prompt(initQues).then((userResponse) => {
    if (userResponse.initial === "POST") {
      createPost();
    } else if (userResponse.initial === "BID") {
      displayItems();
    } else {
      connection.end();
    }
  });
}
