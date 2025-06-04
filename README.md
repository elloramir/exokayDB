### ExokayDB

General propose/ideia:

```js
const exokdb = require("exokdb")
const database = new exokdb.Database();

const User = new exokdb.genSchema((types) => ({
	username: types.String,
	email:    types.Email,
	password: types.String,
	age:      types.Integer,
}));

database.createIndex("users", "username");
database.insert("users", User({
	username: "ellora",
	email: "ellora@gmail.com",
}));
```