// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
// Create a route for root
// Create a route for root - /
app.get("/", function(req, res) {
    res.render("index", {'title':'My index page', 'heading':'My heading'});
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
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
// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});
// Create a route for /roehampton gor question number 2
// Responds to a 'GET' request
app.get("/roehampton", function(req, res) {
    console.log(req.url);
    let path = req.url;
    res.send(path.substring(0,4));
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});
// dynamic routing 
app.get("/student/:name/:id",function(req, res){
    let name = req.params.name;
    let id = req.params.id;
    // sending HTml as a string
    res.send(`
        <table border="1" >
            <tr><th>Name </th><th>Id</th></tr>
            <tr><td>${name}</td><td>${id}</td></tr>
        </table>
        `);

});

app.get("/db_test/:id", function(req,res) {
    // capture the id from the url
    const requestedId = req.params.id;
    // prepare the SqL query
    // we select 'name from  test_table where id matches
    const sql = "SELECT name FROM test_table WHERE id = ?";
    // execute using the db object from the scaffolding file
    db.query(sql, [requestedId],(err,result) =>{
        if (err){
            console.error(err);
            return res.status(500).send("Database error");

        }
        // logic did we find  arow
        if(result.length>0) {
            // result is  an array like[{name: lisa}]
            const userName = result[0].name;
            // send formated html responses
            res.send(`
                <div style="font-family:Arial; border:2px solid #333;padding:20px; border-radius: 10px; width:300px;">
                    <h2 style="color: #007bf;">User found!</h2>
                    <p><strong>ID:</strong> ${requestedId}</p>
                    <p><strong>Name:</strong> ${userName}</p>
                </div>
            `);
        }else{
            // if the user enters an id tha doestnot exist 
            res.send(`<h1> NO USer founf with Id: ${requestedId}</h1>`);
        }
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000`);
});