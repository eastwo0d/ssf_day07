//load lib
const express = require('express');
const request = require('request');
const hbs = require('express-handlebars');
const mysql = require('mysql');

//tunables
const PORT = parseInt(process.argv[2] || process.env.APP_PORT || 3000);

//sql query statements
const SQL_Category = 'select category from apps'
const SQL_Selected_Category = 'select * from apps where category like ?'

//create connection pool
const pool = mysql.createPool(require('./config.json'));

//create an instance of the application
const app = express();

//configure handlebars
app.engine('hbs', hbs());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get(/.*/, express.static(__dirname + '/public'))

app.get('/playstore', (req, res)=> {
    pool.getConnection((err,conn) => {
        if (err) {
            res.status(500);
            res.type('text/plain');
            res.send(err);
            return;
        }
        conn.query(SQL_Category,
            [],
            (err, catTotal) => {
                conn.release();
                if (err) {
                    res.status(500);
                    res.type('text/plain');
                    res.send(err);
                    return;
                }

                let newArr = [];
                for ( key in catTotal ) {
                    let c = catTotal[key].category;
                    newArr.push(c);
                }
                //console.log(newArr)

                const clearDup = new Set(newArr);
                const catArr = [...clearDup]
                console.log(catArr)

                res.status(200);
                res.type('text/html');
                res.render('playstore', {
                    layout : false,
                    category : catArr
                })

            })

    })
})

app.get('/apps', (req,res) => {
    pool.getConnection((err,conn) => {
        const catApp = req.query.category;
        console.log(catApp)
        if (err) {
            res.status(500);
            res.type('text/plain');
            res.send(err);
            return;
        }
        conn.query(SQL_Selected_Category,
            [catApp],
            (err, results) => {
                if (err) {
                    res.status(500);
                    res.type('text/plain');
                    res.send(err);
                    return;                
                }
                const totalNum = results.length;

                res.status(200);
                res.type('text/html');
                res.render('apps', {
                    layout : false,
                    apps : results,
                    catApp : catApp,
                    totalNum : totalNum
                })

        })
    })    
})


//start the server
app.listen(PORT, ()=> {
    console.info(`Application started on ${new Date()} at port ${PORT}`)
})