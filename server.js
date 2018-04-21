var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.Promise = Promise;

var dbUrl = 'mongodb://localhost/chatapp';
var Message = mongoose.model('Message', {
    name: String,
    message: String
});
var messages = [];

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    });
});

app.post('/messages', async (req, res) => {
    try {
        var message = new Message(req.body);
        var savedMessage = await message.save();
        console.log('Saved');
        var censored = await Message.findOne({message: 'badword'});
        if(censored) {
            console.log('Censored word found', censored);
            await Message.remove({_id: censored.id});
        } else {
            messages.push(req.body);
            io.emit('message', req.body);
        }
        res.sendStatus(200);   
    } catch (error) {
        res.sendStatus(500);
        console.error(error);
    } finally {
        console.log('message post called');
    }
});

io.on('connection', (Socket) => {
    console.log('A user is connected.');
});

mongoose.connect(dbUrl, (err) => {
    console.log('Db is connected', err);
});

var server = http.listen(PORT, () => {
    console.log('Server is listening on port', server.address().port);
});
