// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// ✅ Add body parsing so POST requests work
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Get the functions in the db.js file to use
const db = require('./services/db');

// ✅ Login routes
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt:", email, password);

    // Example login logic — replace with real authentication
    if (email === "test@example.com" && password === "1234") {
        res.send("Login successful!");
    } else {
        res.render("login", { error: "Invalid email or password" });
    }
});

// Root route redirects to login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Your other routes remain exactly the same
app.get("/db_test", function(req, res) {
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

app.get("/programmes", function(req, res) {
    var sql = 'select * from Programme';
    var output ='table border="1px"';
    db.query(sql).then(results => {
        for(var row of results) {
            output+='<tr>';
            output+='<td>'+row.programme_id+'</td>';
            output+="<td>" + "<a href='/programmes/"+row.programme_id+"'>"+row.programme_name+"</a>"+"</td>";
            output+='</tr>';
        }
        output+='</table>';
        res.send(output);
    });
});

app.get("/allstudents", function(req, res){
    sql ='select *from students';
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    })
});

app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

app.get("/roehampton", function(req, res) {
    console.log(req.url);
    let path = req.url;
    res.send(path.substring(0,4));
});

app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

app.get("/student/:name/:id",function(req, res){
    let name = req.params.name;
    let id = req.params.id;
    res.send(`
        <table border="1" >
            <tr><th>Name </th><th>Id</th></tr>
            <tr><td>${name}</td><td>${id}</td></tr>
        </table>
    `);
});

app.get("/db_test/:id", function(req,res) {
    const requestedId = req.params.id;
    const sql = "SELECT name FROM test_table WHERE id = ?";
    db.query(sql, [requestedId],(err,result) =>{
        if (err){
            console.error(err);
            return res.status(500).send("Database error");
        }
        if(result.length>0) {
            const userName = result[0].name;
            res.send(`
                <div style="font-family:Arial; border:2px solid #333;padding:20px; border-radius: 10px; width:300px;">
                    <h2 style="color: #007bff;">User found!</h2>
                    <p><strong>ID:</strong> ${requestedId}</p>
                    <p><strong>Name:</strong> ${userName}</p>
                </div>
            `);
        }else{
            res.send(`<h1> User not found with Id: ${requestedId}</h1>`);
        }
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000`);
});