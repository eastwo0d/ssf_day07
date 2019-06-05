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

//Promises
const getConnection = (pool) => {
    const p = new Promise((resolve, reject) =>{
        pool.getConnection((err,conn)=>{
            if (err)
                reject(err);
            else 
                resolve(conn)
        })
    })
    return (p);
}

const selCat = (params, conn) => {
    const p = new Promise ((resolve, reject) => {
        conn.query(SQL_Selected_Category,
            params,
            (err,results) => {
                if (err) 
                    reject(err);
                else 
                    resolve([results, conn]);       
            })
    })
    return(p);
}

const allCat = (params, conn) => {
    const p = new Promise((resolve, reject) => {
        conn.query(SQL_Category,
        [],
        (err, results) => {
            if (err)
                reject(err);
            else
                resolve([results, conn])
        })
    })
    return(p);
}

//Routes
app.get('/playstore', (req, res)=> {
    const params = [];
    getConnection(pool)
        .then(conn => {
            return allCat(params,conn)
        })
        .then(results => {
            const data = results[0];
            const conn = results[1];
            let newArr = [];
            for ( key in data ) {
                let c = data[key].category;
                newArr.push(c);
            }
            const clearDup = new Set(newArr);
            const catArr = [...clearDup]
            console.log(catArr)

            res.status(200);
            res.type('text/html');
            res.render('playstore', {
                layout : false,
                category : catArr
        })
        conn.release();
    })
})


app.get('/apps', (req,res) => {
    const catApp = req.query.category;
    getConnection(pool)
        .then(conn => {
            return selCat(catApp, conn)
        })
        .then(results => {
            const data = results[0];
            const conn = results[1];
            const totalNum = data.length;
            res.status(200);
            res.type('text/html');
            res.render('apps', {
                layout : false,
                apps : data,
                catApp : catApp,
                totalNum : totalNum
        })
        conn.release();
    })

})


//start the server
app.listen(PORT, ()=> {
    console.info(`Application started on ${new Date()} at port ${PORT}`)
})