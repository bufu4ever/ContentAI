const express = require('express'); 
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express();
app.use(express.json());

// יצירת חיבור
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'shawn',
    password: 'Shawn89!',
    database: 'contentaitable'
});

// התחבר למסד הנתונים
connection.connect(function(err){
    if(err) {
        console.log('Error '+err.message);
    } else {
        console.log('Connected to the database');
    }
});

app.post('/content/generate', (req, res) => {
    // חלץ את הערכים מגוף הבקשה
    const { PublishId, ContentToken, ArticleTitle, NoOfWords } = req.body;

    // יצירת תוכן HTML
    let content = `<h1>${ArticleTitle}</h1><p>This is an example content</p>`;

    // יצירת שם קובץ
    let fileName = Math.random().toString(36).substring(2, 15) + '.html';
    let filePath = path.join(__dirname, '/public/articles/', fileName);

    // כתיבת תוכן לקובץ HTML
    fs.writeFile(filePath, content, err => {
        if (err) {
            res.status(500).send({error: 'An error occurred while writing the file.'});
        } else {
             // הכנסת תוכן חדש למסד הנתונים
            let sql = 'INSERT INTO t_content (PublishId, ContentToken, ArticleTitle, NoOfWords, FileName) VALUES (?, ?, ?, ?, ?)';
            connection.query(sql, [PublishId, ContentToken, ArticleTitle, NoOfWords, fileName], (err, result) => {
                if (err) {
                    res.status(500).send({error: 'An error occurred while inserting data into the database.'});
                } else {
                    res.status(200).send({message: 'File successfully written and data inserted into the database!', fileName: fileName});
                }
            });
        }
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
