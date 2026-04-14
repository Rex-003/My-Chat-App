const mongoose = require("mongoose");

const uri =
  "mongodb+srv://rajatchaharx_db_user:RO88pVCmlOtEAmpL@cluster0.vsa8ik8.mongodb.net/?appName=Cluster0";

mongoose
  .connect(uri)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log("Connection Error:", err));
