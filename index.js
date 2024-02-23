import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
const userFilePath = path.join(__dirname + "/public" + "/users.json");
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
let user_name;
let pass_word;
//---------------------home page-------------------------------------------------------
app.get("/", (req, res) => {
  res.render("index.ejs");
});
//----------------authentication page-------------------------------------------------------
app.post("/auth", (req, res) => {
  switch (req.body.choice) {
    case "login":
      res.render("login.ejs");
      break;
    case "register":
      res.render("register.ejs");
      break;
    default:
      res.render("error_auth.ejs");
      break;
  }
  res.render("index.ejs");
});

//--------------client page----------------------------------------------
app.get("/client/:clientId", (req, res) => {
  let clientId = req.params.clientId;
  const uploadDir = path.join(__dirname, "public", `user-${clientId}`);
  fs.readdir(uploadDir, (err, files) => {
    const filenames = files.map((file) => {
      return file;
    });
    res.render("client.ejs", {
      username: user_name,
      id: clientId,
      files: filenames,
    });
  });
});

app.post("/addFile/:clientId", (req, res) => {
  const id = req.params.clientId;
  const directoryPath = path.join(__dirname + "/public" + `/user-${id}`);
  //   fs.stat(directoryPath, (err, stats) => {
  //     if (err) {
  //       fs.mkdir(directoryPath, { recursive: true }, (err) => {
  //         if (err) {
  //           console.error("Error creating directory:", err);
  //           return;
  //         }
  //         console.log("Directory created successfully");
  //       });
  //     }
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, directoryPath);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });
  const upload = multer({
    storage: storage,
  }).single("file");
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).send("Multer error: " + err.message);
    } else if (err) {
      return res.status(500).send("Unknown error: " + err.message);
    }
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    res.redirect(`/client/${id}`);
  });
});
// });

// -----------------------login---------------------------------------
app.post("/login", (req, res) => {
  console.log("I am in login");
  const user_name = req.body.username;
  const pass_word = req.body.password;
  fs.readFile(userFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal server error");
    }
    let users = [];
    try {
      users = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(500).send("Internal server error");
    }
    let foundUser = false;
    for (let i = 0; i < users.length; i++) {
      const user_data = JSON.parse(users[i]);
      if (user_data.user === user_name) {
        foundUser = true;
        if (user_data.pass === pass_word) {
          return res.redirect(`/client/${user_data.id}`);
        } else {
          return res.render("login.ejs", { error: "Wrong password" });
        }
      }
    }
    if (!foundUser) {
      return res.render("register.ejs", { error: "New user, please sign up" });
    }
  });
});

//---------------------register page----------------------------------------
app.post("/register", (req, res) => {
  console.log("I am in auth");
  user_name = req.body.username;
  pass_word = req.body.password;
  let id;
  fs.readFile(userFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }
    let users = [];
    try {
      users = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return;
    }
    let userdata = {
      id: users.length + 1,
      user: user_name,
      pass: pass_word,
    };
    id = userdata.id;
    // Append the new user data to the array
    let serialisedUserData = JSON.stringify(userdata);
    users.push(serialisedUserData);

    // Convert the updated array back to JSON
    const updatedJsonData = JSON.stringify(users);
    fs.writeFile(userFilePath, updatedJsonData, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("Data has been written to users.json");
      }
    });
    const directoryPath = path.join(__dirname + "/public" + `/user-${id}`);
    fs.mkdir(directoryPath, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating directory:", err);
        return;
      }
      console.log("Directory created successfully");
    });
    console.log(id);
    res.redirect(`/client/${id}`);
  });
});
//--------------------server running----------------------------------------------
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
