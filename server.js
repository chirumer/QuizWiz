(function(){

const server_config = require('./server-data/config.json');

const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.redirect('/instructions');
});

const quiz_pages = [
    'instructions',
    'registration',
    'quiz',
    'results',
];

const pages = quiz_pages.concat(
    [ 'closed' ]
);

quiz_pages.forEach(page => {
    app.use('/'+page, async (req, res, next) => {
        if (await is_open(server_config.is_open_url)) {
            next();
            return;
        }
        res.redirect('/closed');
    });
});

pages.forEach(page => {
    app.get('/'+page, (req, res) => {
        res.sendFile(path.join(__dirname, '/public/'+page+'/index.html'));
    });
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

async function is_open(url) {
    response = await fetch(url);
    const { is_open }  = await response.json();
    return is_open;
}

})();
