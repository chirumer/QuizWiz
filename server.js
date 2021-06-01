const server_config = require('./server-data/config.json');

const path = require('path');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/instructions');
});

const quiz_pages = [
    'instructions',
    'quiz',
    'results'
];

const pages = quiz_pages.concat(
    [ 'closed' ]
);

quiz_pages.forEach(page => {
    app.use('/'+page, (req, res, next) => {
	if (is_open(server_config.is_open_url)) {
	    next();
	    return;
	}
	res.redirect('/closed');
    });
});

pages.forEach(page => {
    app.get('/'+page, (req, res) => {
	res.sendFile(path.join(__dirname, '/'+page+'/index.html'));
    });
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

function is_open(url) {
    // perform GET at url to check if quiz open
    return true;
}
