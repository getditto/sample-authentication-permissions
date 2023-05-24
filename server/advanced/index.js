// Ditto Permissions Example Authentication Server

let express = require("express");
let cors = require("cors");
let body = require("body-parser");
let app = express();

app.use(cors());
app.use(body.json());

// List of user IDs.
//// Note: This is just an example. You should consider using Auth tools such as Auth0 to authenticate
const users = {
  customer: { id: "customer01" },
  manager: { id: "manager01" },
  employee: { id: "employee01" },
};

app.post("/auth", async (req, res) => {
  const token = req.body.token;

  const customerID = users.customer.id;
  const managerID = users.manager.id;
  const employeeID = users.employee.id;

  if (token !== customerID && token !== managerID && token !== employeeID) {
    res.statusCode = 401;
    return res.json({
      authenticate: false,
      userInfo: `Incorrect token`,
    });
  }


  let payload = {
    authenticate: true,
    expirationSeconds: 610000,
    userID: customerID,
  };

  if (token === customerID) {
    /** Customers can only see / edit their own docs **/
    payload.permissions = {
      read: {
        everything: false,
        queriesByCollection: {
          docs: [`_id.userID == \'${customerID}\'`],
        },
      },
      write: {
        everything: false,
        queriesByCollection: {
          docs: [`_id.userID == \'${customerID}\'`],
        },
      },
    };
    payload.role = "customer";

  } else if (token === managerID) {
    /** Managers can see / edit all docs **/
    payload.permissions = {
      read: {
        everything: true,
        queriesByCollection: {},
      },
      write: {
        everything: true,
        queriesByCollection: {},
      },
    };
    payload.role = "manager";

  } else if (token === employeeID) {
    /** Employee can see all docs but can only edit orders collection **/
    payload.permissions = {
      read: {
        everything: true,
        queriesByCollection: {},
      },
      write: {
        everything: false,
        queriesByCollection: {
          orders: ["true"]
        },
      },
    };
    payload.role = "employee";

  }

  try {
    res.json(payload);
    console.log(payload);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.json({
      authenticate: false,
      userInfo: err.message,
    });
  }
});

app.get("/", async (req, res) => {
  console.log("Hello World!");
});


app.listen(() => {
  console.log("listening on http://localhost:" + 3000);
});

module.exports = app;
